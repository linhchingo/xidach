from flask import Blueprint, request, jsonify
from models import get_db, dict_from_row, dicts_from_rows
from extensions import socketio
from redis_cache import refresh_game_cache, get_redis, get_cached_game_state, cache_game_state
from socket_events import build_game_state

rounds_bp = Blueprint('rounds', __name__)


@rounds_bp.route('/api/games/<int:game_id>/rounds', methods=['POST'])
def start_round(game_id):
    """Start a new round in a game."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    host_player_id = data.get('host_player_id')
    if not host_player_id:
        return jsonify({'error': 'Phải chọn host cho ván chơi'}), 400

    db = get_db()
    try:
        # Check game exists and is active
        game = dict_from_row(db.execute('SELECT * FROM games WHERE id = ?', (game_id,)).fetchone())
        if not game:
            return jsonify({'error': 'Cuộc chơi không tồn tại'}), 404
        if game['status'] == 'completed':
            return jsonify({'error': 'Cuộc chơi đã kết thúc'}), 400

        # Check minimum 2 active players
        player_count = db.execute(
            'SELECT COUNT(*) as count FROM players WHERE game_id = ? AND is_active = 1', (game_id,)
        ).fetchone()['count']
        if player_count < 2:
            return jsonify({'error': 'Cần tối thiểu 2 người chơi đang tham gia để bắt đầu ván'}), 400

        # Check host is a valid active player in this game
        host = dict_from_row(
            db.execute('SELECT * FROM players WHERE id = ? AND game_id = ? AND is_active = 1', (host_player_id, game_id)).fetchone()
        )
        if not host:
            return jsonify({'error': 'Host phải là người chơi đang hoạt động trong cuộc chơi'}), 400

        # Check no active round
        active_round = db.execute(
            'SELECT id FROM rounds WHERE game_id = ? AND status = ?', (game_id, 'active')
        ).fetchone()
        if active_round:
            return jsonify({'error': 'Đang có ván chơi chưa kết thúc'}), 400

        # Get next round number
        max_round = db.execute(
            'SELECT COALESCE(MAX(round_number), 0) as max_num FROM rounds WHERE game_id = ?', (game_id,)
        ).fetchone()['max_num']

        cursor = db.execute(
            'INSERT INTO rounds (game_id, round_number, host_player_id) VALUES (?, ?, ?)',
            (game_id, max_round + 1, host_player_id)
        )
        db.commit()

        rnd = dict_from_row(db.execute('SELECT * FROM rounds WHERE id = ?', (cursor.lastrowid,)).fetchone())
        rnd['host_name'] = host['name']
        rnd['results'] = []

        refresh_game_cache(game_id)
        
        # Cache round_id -> game_id mapping for fast lookups in submit_result
        r = get_redis()
        r.hset('active_rounds_map', rnd['id'], game_id)
        
        socketio.emit('round_started', rnd, room=f'game:{game_id}')

        return jsonify(rnd), 201
    finally:
        db.close()



@rounds_bp.route('/api/rounds/<int:round_id>/end', methods=['PUT'])
def end_round(round_id):
    """End a round and apply points.
    
    Optional body: { "default_losers": [player_id, ...] }
    If provided, players in this list who haven't submitted a result will
    automatically be assigned 'lose' before points are calculated.
    """
    data = request.get_json(silent=True) or {}
    default_losers = data.get('default_losers', [])
    db = get_db()
    try:
        rnd = dict_from_row(db.execute('SELECT * FROM rounds WHERE id = ?', (round_id,)).fetchone())
        if not rnd:
            return jsonify({'error': 'Ván chơi không tồn tại'}), 404
        if rnd['status'] != 'active':
            return jsonify({'error': 'Ván chơi đã kết thúc hoặc bị huỷ'}), 400

        game_id = rnd['game_id']
        host_player_id = rnd['host_player_id']

        # Get ALL ACTIVE players in this game to ensure points are correctly distributed
        # If a player was deactivated during the round, they are excluded from this calculation
        all_players = dicts_from_rows(
            db.execute('SELECT * FROM players WHERE game_id = ? AND is_active = 1', (game_id,)).fetchall()
        )
        non_host_players = [p for p in all_players if p['id'] != host_player_id]

        r = get_redis()
        redis_key = f'round:{round_id}:results'
        redis_data = r.hgetall(redis_key)
        
        # Convert redis data to the format the logic expects
        results = []
        for pid_str, res in redis_data.items():
            results.append({'player_id': int(pid_str), 'result': res})
            
        submitted_player_ids = {r['player_id'] for r in results}
        # If someone chose 'pay', round can end immediately (pay takes priority)
        has_pay = any(r['result'] == 'pay' for r in results)
        if not has_pay:
            missing_ids = [p['id'] for p in non_host_players if p['id'] not in submitted_player_ids]
            if missing_ids:
                if not default_losers:
                    # No defaults provided — reject as before
                    missing_names = [p['name'] for p in non_host_players if p['id'] in missing_ids]
                    return jsonify({
                        'error': f'Các người chơi chưa chọn kết quả: {", ".join(missing_names)}'
                    }), 400
                # Auto-assign 'lose' for missing players
                for pid in default_losers:
                    if pid in missing_ids:
                        results.append({'player_id': pid, 'result': 'lose'})
                submitted_player_ids = {r['player_id'] for r in results}

        # Build a points_change map for ALL players (including host)
        total_player_count = len(all_players)
        points_map = {p['id']: 0 for p in all_players}

        # PAY has absolute priority — check first
        pay_result = next((r for r in results if r['result'] == 'pay'), None)

        if pay_result:
            # Only process the first pay result, ignore everything else
            payer_id = pay_result['player_id']
            payer_change = -(total_player_count - 1)
            points_map[payer_id] = payer_change
            for p in all_players:
                if p['id'] != payer_id:
                    points_map[p['id']] = 1
        else:
            # Normal calculation — process all results
            for result in results:
                player_id = result['player_id']
                res = result['result']

                if res == 'win':
                    points_map[player_id] += 1
                    points_map[host_player_id] -= 1
                elif res == 'lose':
                    points_map[player_id] -= 1
                    points_map[host_player_id] += 1
                elif res == 'win_big':
                    points_map[player_id] += 2
                    points_map[host_player_id] -= 2
                elif res == 'lose_big':
                    points_map[player_id] -= 2
                    points_map[host_player_id] += 2
                elif res == 'draw':
                    pass  # No change
                # pay is already handled above, lose_big from host selection also handled

        # Apply point changes to ALL active players
        for p in all_players:
            pid = p['id']
            p_change = points_map[pid]
            
            # Update player's total points
            db.execute(
                'UPDATE players SET total_points = total_points + ? WHERE id = ?',
                (p_change, pid)
            )
            
            # Record result in round_results for history
            if pid == host_player_id:
                # Host always recorded as 'host'
                db.execute(
                    '''INSERT OR REPLACE INTO round_results (round_id, player_id, result, points_change) 
                       VALUES (?, ?, ?, ?)''',
                    (round_id, pid, 'host', p_change)
                )
            else:
                # For non-host players, find if they had a result, otherwise default to 'win' if someone paid, or 'draw'
                res_obj = next((r for r in results if r['player_id'] == pid), None)
                final_res = res_obj['result'] if res_obj else ('win' if has_pay else 'draw')
                
                db.execute(
                    '''INSERT OR REPLACE INTO round_results (round_id, player_id, result, points_change) 
                       VALUES (?, ?, ?, ?)''',
                    (round_id, pid, final_res, p_change)
                )

        # Mark round as completed
        db.execute('UPDATE rounds SET status = ? WHERE id = ?', ('completed', round_id))
        
        # Clear redis results and mapping
        r.delete(redis_key)
        r.hdel('active_rounds_map', round_id)
        
        db.commit()

        # Return updated game state
        updated_players = dicts_from_rows(
            db.execute('SELECT * FROM players WHERE game_id = ? ORDER BY joined_at', (game_id,)).fetchall()
        )
        updated_results = dicts_from_rows(
            db.execute(
                '''SELECT rr.*, p.name as player_name 
                   FROM round_results rr 
                   JOIN players p ON rr.player_id = p.id 
                   WHERE rr.round_id = ?''',
                (round_id,)
            ).fetchall()
        )

        updated_round_data = {**rnd, 'status': 'completed', 'results': updated_results}
        
        refresh_game_cache(game_id)
        socketio.emit('round_ended', {'round': updated_round_data, 'players': updated_players}, room=f'game:{game_id}')

        return jsonify({
            'round': updated_round_data,
            'players': updated_players
        }), 200
    finally:
        db.close()


@rounds_bp.route('/api/rounds/<int:round_id>/cancel', methods=['PUT'])
def cancel_round(round_id):
    """Cancel a round without applying any points."""
    db = get_db()
    try:
        rnd = dict_from_row(db.execute('SELECT * FROM rounds WHERE id = ?', (round_id,)).fetchone())
        if not rnd:
            return jsonify({'error': 'Ván chơi không tồn tại'}), 404
        if rnd['status'] != 'active':
            return jsonify({'error': 'Ván chơi đã kết thúc hoặc bị huỷ'}), 400

        # Mark round as cancelled - keep results for history but don't apply points
        db.execute('UPDATE rounds SET status = ? WHERE id = ?', ('cancelled', round_id))
        
        # Clear redis results and mapping
        r = get_redis()
        r.delete(f'round:{round_id}:results')
        r.hdel('active_rounds_map', round_id)
        
        db.commit()

        refresh_game_cache(rnd['game_id'])
        socketio.emit('round_cancelled', {'round_id': round_id}, room=f'game:{rnd["game_id"]}')

        return jsonify({'message': 'Ván chơi đã bị huỷ', 'round_id': round_id}), 200
    finally:
        db.close()


@rounds_bp.route('/api/rounds/<int:round_id>/change-host', methods=['PUT'])
def change_host(round_id):
    """Change the host of an active round and reset all player results."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    new_host_id = data.get('new_host_id')
    if not new_host_id:
        return jsonify({'error': 'new_host_id is required'}), 400

    db = get_db()
    try:
        rnd = dict_from_row(db.execute('SELECT * FROM rounds WHERE id = ?', (round_id,)).fetchone())
        if not rnd:
            return jsonify({'error': 'Ván chơi không tồn tại'}), 404
        if rnd['status'] != 'active':
            return jsonify({'error': 'Chỉ có thể đổi host khi ván đang diễn ra'}), 400
        if new_host_id == rnd['host_player_id']:
            return jsonify({'error': 'Người chơi này đã là host hiện tại'}), 400

        # Validate new host is an active player in this game
        new_host = dict_from_row(
            db.execute(
                'SELECT * FROM players WHERE id = ? AND game_id = ? AND is_active = 1',
                (new_host_id, rnd['game_id'])
            ).fetchone()
        )
        if not new_host:
            return jsonify({'error': 'Host mới phải là người chơi đang hoạt động trong cuộc chơi'}), 400

        # Reset all results for this round
        db.execute('DELETE FROM round_results WHERE round_id = ?', (round_id,))
        # Update host
        db.execute('UPDATE rounds SET host_player_id = ? WHERE id = ?', (new_host_id, round_id))
        
        # Clear redis results
        r = get_redis()
        r.delete(f'round:{round_id}:results')
        
        db.commit()

        # Return updated round object
        updated_rnd = dict_from_row(db.execute('SELECT * FROM rounds WHERE id = ?', (round_id,)).fetchone())
        updated_rnd['host_name'] = new_host['name']
        updated_rnd['results'] = []

        refresh_game_cache(rnd['game_id'])
        socketio.emit('host_changed', updated_rnd, room=f'game:{rnd["game_id"]}')

        return jsonify(updated_rnd), 200
    finally:
        db.close()


@rounds_bp.route('/api/games/<int:game_id>/rounds', methods=['GET'])
def get_rounds(game_id):
    """Get all rounds in a game."""
    db = get_db()
    try:
        rounds = dicts_from_rows(
            db.execute('SELECT * FROM rounds WHERE game_id = ? ORDER BY round_number', (game_id,)).fetchall()
        )

        for rnd in rounds:
            if rnd['status'] == 'active':
                r = get_redis()
                redis_results = r.hgetall(f'round:{rnd["id"]}:results')
                results = []
                for pid_str, res in redis_results.items():
                    pid = int(pid_str)
                    p_name = db.execute('SELECT name FROM players WHERE id = ?', (pid,)).fetchone()
                    results.append({
                        'round_id': rnd['id'],
                        'player_id': pid,
                        'result': res,
                        'player_name': p_name['name'] if p_name else 'Unknown',
                        'points_change': 0
                    })
            else:
                results = dicts_from_rows(
                    db.execute(
                        '''SELECT rr.*, p.name as player_name 
                           FROM round_results rr 
                           JOIN players p ON rr.player_id = p.id 
                           WHERE rr.round_id = ?''',
                        (rnd['id'],)
                    ).fetchall()
                )
            rnd['results'] = results

            host = dict_from_row(
                db.execute('SELECT name FROM players WHERE id = ?', (rnd['host_player_id'],)).fetchone()
            )
            rnd['host_name'] = host['name'] if host else 'Unknown'

        return jsonify(rounds), 200
    finally:
        db.close()
