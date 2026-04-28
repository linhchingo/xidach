"""
Socket.IO event handlers.
Quản lý kết nối, room, và state sync cho real-time game updates.
"""
from flask import request
from flask_socketio import join_room, leave_room, emit
from models import get_db, dict_from_row, dicts_from_rows, calculate_player_streaks
from redis_cache import get_cached_game_state, cache_game_state, get_redis, get_active_round_results


def build_game_state(game_id):
    """Build full game state từ database. Dùng cho cache miss và initial sync."""
    db = get_db()
    try:
        game = dict_from_row(db.execute('SELECT * FROM games WHERE id = ?', (game_id,)).fetchone())
        if not game:
            return None

        # Don't expose PIN
        game.pop('manager_pin', None)
        game['has_pin'] = True

        players = dicts_from_rows(
            db.execute('SELECT * FROM players WHERE game_id = ? ORDER BY joined_at', (game_id,)).fetchall()
        )

        rounds = dicts_from_rows(
            db.execute('SELECT * FROM rounds WHERE game_id = ? ORDER BY round_number', (game_id,)).fetchall()
        )

        active_round = None
        round_history = []

        # Tối ưu N+1 Query: Lấy tất cả kết quả của các ván trước trong 1 câu query
        all_results = dicts_from_rows(
            db.execute(
                '''SELECT rr.*, p.name as player_name
                   FROM round_results rr
                   JOIN players p ON rr.player_id = p.id
                   JOIN rounds r ON rr.round_id = r.id
                   WHERE r.game_id = ?''',
                (game_id,)
            ).fetchall()
        )
        results_by_round = {}
        for res in all_results:
            results_by_round.setdefault(res['round_id'], []).append(res)

        players_dict = {p['id']: p['name'] for p in players}

        for rnd in rounds:
            if rnd['status'] == 'active':
                rnd['results'] = get_active_round_results(rnd['id'], players_dict)
            else:
                rnd['results'] = results_by_round.get(rnd['id'], [])

            rnd['host_name'] = players_dict.get(rnd['host_player_id'], 'Unknown')

            if rnd['status'] == 'active':
                active_round = rnd
            else:
                round_history.append(rnd)

        # Tính toán chuỗi thắng/thua (Streak) - sử dụng duy nhất 1 query
        streaks = calculate_player_streaks(db, game_id)

        # Gắn dữ liệu streak vào danh sách players
        for p in players:
            player_streak = streaks.get(p['id'], {'is_winning_lot': False, 'is_losing_lot': False})
            p['is_winning_lot'] = player_streak['is_winning_lot']
            p['is_losing_lot'] = player_streak['is_losing_lot']

        return {
            'game': game,
            'players': players,
            'active_round': active_round,
            'round_history': round_history,
        }
    finally:
        db.close()


def register_events(socketio):
    """Đăng ký tất cả Socket.IO event handlers."""

    @socketio.on('connect')
    def handle_connect(auth=None):
        print(f'[Socket.IO] Client connected: {request.sid}')

    @socketio.on('disconnect')
    def handle_disconnect():
        print(f'[Socket.IO] Client disconnected: {request.sid}')

    @socketio.on('join_game')
    def handle_join_game(data):
        """Client join vào room của game. Trả về full state."""
        game_id = data.get('game_id')
        if not game_id:
            return

        room = f'game:{game_id}'
        join_room(room)
        print(f'[Socket.IO] {request.sid} joined room {room}')

        # Thử đọc từ Redis cache trước
        state = get_cached_game_state(game_id)
        if not state:
            # Cache miss — build từ DB và cache lại
            state = build_game_state(game_id)
            if state:
                cache_game_state(game_id, state)

        if state:
            emit('game_state_sync', state)

    @socketio.on('leave_game')
    def handle_leave_game(data):
        """Client rời room."""
        game_id = data.get('game_id')
        if game_id:
            leave_room(f'game:{game_id}')
            print(f'[Socket.IO] {request.sid} left room game:{game_id}')

    @socketio.on('submit_result')
    def handle_submit_result(data):
        """Submit a player's result for a round via Socket.IO."""
        if not data:
            return {'error': 'Dữ liệu không hợp lệ'}

        round_id = data.get('round_id')
        player_id_data = data.get('player_id')
        result = data.get('result')

        if not round_id or not player_id_data:
            return {'error': 'Thiếu round_id hoặc player_id'}
        if result and result not in ('win', 'draw', 'lose', 'pay', 'win_big', 'lose_big'):
            return {'error': 'Kết quả không hợp lệ'}

        player_ids = player_id_data if isinstance(player_id_data, list) else [player_id_data]

        r = get_redis()
        game_id = r.hget('active_rounds_map', round_id)
        rnd = None

        if game_id:
            game_id = int(game_id)
            state = get_cached_game_state(game_id)
            if state and state.get('active_round') and state['active_round']['id'] == round_id:
                rnd = state['active_round']
                
                valid_players = []
                for pid in player_ids:
                    p = next((p for p in state['players'] if p['id'] == pid and p['is_active']), None)
                    if p:
                        if pid == rnd['host_player_id']:
                            return {'error': 'Host không cần chọn kết quả'}
                        valid_players.append(p)
                
                if len(valid_players) != len(player_ids):
                    rnd = None

        db = None
        if not rnd:
            db = get_db()
            try:
                rnd = dict_from_row(db.execute('SELECT * FROM rounds WHERE id = ?', (round_id,)).fetchone())
                if not rnd:
                    return {'error': 'Ván chơi không tồn tại'}
                if rnd['status'] != 'active':
                    return {'error': 'Ván chơi đã kết thúc hoặc bị huỷ'}
                game_id = rnd['game_id']
                r.hset('active_rounds_map', rnd['id'], game_id)

                for pid in player_ids:
                    p = dict_from_row(
                        db.execute('SELECT * FROM players WHERE id = ? AND game_id = ? AND is_active = 1', (pid, game_id)).fetchone()
                    )
                    if not p:
                        return {'error': 'Người chơi không tồn tại hoặc đã bị loại'}
                    if pid == rnd['host_player_id']:
                        return {'error': 'Host không cần chọn kết quả'}
            finally:
                if db: db.close()

        try:
            redis_key = f'round:{round_id}:results'
            for pid in player_ids:
                if not result:
                    r.hdel(redis_key, pid)
                else:
                    r.hset(redis_key, pid, result)

            redis_results = r.hgetall(redis_key)
            state = get_cached_game_state(rnd['game_id'])
            
            if not state:
                state = build_game_state(rnd['game_id'])
                if state:
                    cache_game_state(rnd['game_id'], state)

            players_map = {p['id']: p['name'] for p in state['players']} if state else {}
            results = []
            for pid_str, res in redis_results.items():
                pid = int(pid_str)
                results.append({
                    'player_id': pid,
                    'result': res,
                    'player_name': players_map.get(pid, 'Unknown'),
                    'round_id': round_id,
                    'points_change': 0
                })

            if state and state.get('active_round') and state['active_round']['id'] == round_id:
                state['active_round']['results'] = results
                cache_game_state(rnd['game_id'], state)

            emit('result_submitted', {'results': results, 'player_id': player_id_data}, room=f'game:{rnd["game_id"]}')
            return {'success': True, 'results': results}
        finally:
            if db:
                db.close()
