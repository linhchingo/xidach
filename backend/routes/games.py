from flask import Blueprint, request, jsonify
from models import get_db, dict_from_row, dicts_from_rows

games_bp = Blueprint('games', __name__)


@games_bp.route('/api/games', methods=['POST'])
def create_game():
    """Create a new game session."""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    name = data.get('name', '').strip()
    game_date = data.get('game_date', '').strip()
    money_per_point = data.get('money_per_point')

    if not name:
        return jsonify({'error': 'Tên cuộc chơi không được để trống'}), 400
    if not game_date:
        return jsonify({'error': 'Ngày chơi không được để trống'}), 400
    if not money_per_point or int(money_per_point) <= 0:
        return jsonify({'error': 'Số tiền mỗi điểm phải lớn hơn 0'}), 400

    db = get_db()
    try:
        cursor = db.execute(
            'INSERT INTO games (name, game_date, money_per_point) VALUES (?, ?, ?)',
            (name, game_date, int(money_per_point))
        )
        db.commit()
        game = dict_from_row(db.execute('SELECT * FROM games WHERE id = ?', (cursor.lastrowid,)).fetchone())
        return jsonify(game), 201
    except Exception as e:
        if 'UNIQUE constraint' in str(e):
            return jsonify({'error': f'Cuộc chơi "{name}" đã tồn tại vào ngày {game_date}'}), 409
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@games_bp.route('/api/games', methods=['GET'])
def get_games():
    """Get all games, optionally filtered by status."""
    status = request.args.get('status')
    db = get_db()
    try:
        if status:
            games = dicts_from_rows(
                db.execute('SELECT * FROM games WHERE status = ? ORDER BY created_at DESC', (status,)).fetchall()
            )
        else:
            games = dicts_from_rows(
                db.execute('SELECT * FROM games ORDER BY created_at DESC').fetchall()
            )

        # Attach player count and round count for each game
        for game in games:
            player_count = db.execute(
                'SELECT COUNT(*) as count FROM players WHERE game_id = ?', (game['id'],)
            ).fetchone()['count']
            round_count = db.execute(
                'SELECT COUNT(*) as count FROM rounds WHERE game_id = ?', (game['id'],)
            ).fetchone()['count']
            game['player_count'] = player_count
            game['round_count'] = round_count

        return jsonify(games), 200
    finally:
        db.close()


@games_bp.route('/api/games/<int:game_id>', methods=['GET'])
def get_game(game_id):
    """Get detailed game information including players and rounds."""
    db = get_db()
    try:
        game = dict_from_row(db.execute('SELECT * FROM games WHERE id = ?', (game_id,)).fetchone())
        if not game:
            return jsonify({'error': 'Cuộc chơi không tồn tại'}), 404

        # Get players
        players = dicts_from_rows(
            db.execute('SELECT * FROM players WHERE game_id = ? ORDER BY joined_at', (game_id,)).fetchall()
        )

        # Get rounds with results
        rounds = dicts_from_rows(
            db.execute('SELECT * FROM rounds WHERE game_id = ? ORDER BY round_number', (game_id,)).fetchall()
        )

        for rnd in rounds:
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

            # Get host name
            host = dict_from_row(
                db.execute('SELECT name FROM players WHERE id = ?', (rnd['host_player_id'],)).fetchone()
            )
            rnd['host_name'] = host['name'] if host else 'Unknown'

        game['players'] = players
        game['rounds'] = rounds

        return jsonify(game), 200
    finally:
        db.close()


@games_bp.route('/api/games/<int:game_id>/end', methods=['PUT'])
def end_game(game_id):
    """End a game and return final statistics or delete if empty."""
    db = get_db()
    try:
        game = dict_from_row(db.execute('SELECT * FROM games WHERE id = ?', (game_id,)).fetchone())
        if not game:
            return jsonify({'error': 'Cuộc chơi không tồn tại'}), 404
        if game['status'] == 'completed':
            return jsonify({'error': 'Cuộc chơi đã kết thúc'}), 400

        # Check if there's an active round
        active_round = db.execute(
            'SELECT id FROM rounds WHERE game_id = ? AND status = ?', (game_id, 'active')
        ).fetchone()
        if active_round:
            return jsonify({'error': 'Vui lòng kết thúc hoặc huỷ ván đang chơi trước'}), 400

        # Check round count (excluding cancelled ones)
        round_count = db.execute(
            'SELECT COUNT(*) as count FROM rounds WHERE game_id = ? AND status = ?', (game_id, 'completed')
        ).fetchone()['count']

        if round_count == 0:
            # Delete game and all related data (cascading will handle players/rounds/etc)
            db.execute('DELETE FROM games WHERE id = ?', (game_id,))
            db.commit()
            return jsonify({'message': 'Cuộc chơi chưa có ván nào nên đã được xoá', 'deleted': True}), 200

        db.execute('UPDATE games SET status = ? WHERE id = ?', ('completed', game_id))
        db.commit()

        return get_game_statistics(game_id, db)
    finally:
        db.close()


@games_bp.route('/api/games/<int:game_id>/statistics', methods=['GET'])
def get_statistics(game_id):
    """Get game statistics."""
    db = get_db()
    try:
        return get_game_statistics(game_id, db)
    finally:
        db.close()


@games_bp.route('/api/games/<int:game_id>', methods=['DELETE'])
def delete_game(game_id):
    """Delete a completed game and all its data."""
    db = get_db()
    try:
        game = dict_from_row(db.execute('SELECT * FROM games WHERE id = ?', (game_id,)).fetchone())
        if not game:
            return jsonify({'error': 'Cuộc chơi không tồn tại'}), 404
        
        # Only allow deleting completed games
        if game['status'] != 'completed':
            return jsonify({'error': 'Chỉ có thể xoá cuộc chơi đã kết thúc'}), 400
            
        # Delete from database (cascading handles players, rounds, results)
        db.execute('DELETE FROM games WHERE id = ?', (game_id,))
        db.commit()
        
        return jsonify({'message': 'Đã xoá cuộc chơi thành công', 'game_id': game_id}), 200
    finally:
        db.close()


def get_game_statistics(game_id, db):
    """Helper to compute game statistics."""
    game = dict_from_row(db.execute('SELECT * FROM games WHERE id = ?', (game_id,)).fetchone())
    if not game:
        return jsonify({'error': 'Cuộc chơi không tồn tại'}), 404

    players = dicts_from_rows(
        db.execute('SELECT * FROM players WHERE game_id = ? ORDER BY total_points DESC', (game_id,)).fetchall()
    )

    money_per_point = game['money_per_point']
    statistics = []
    for player in players:
        points = player['total_points']
        money = abs(points) * money_per_point
        if points > 0:
            result_text = f'Thắng +{money:,}'
        elif points < 0:
            result_text = f'Thua -{money:,}'
        else:
            result_text = 'Hoà'

        statistics.append({
            'player_id': player['id'],
            'player_name': player['name'],
            'total_points': points,
            'money': money,
            'result_text': result_text
        })

    # Round stats
    total_rounds = db.execute(
        'SELECT COUNT(*) as count FROM rounds WHERE game_id = ? AND status != ?', (game_id, 'cancelled')
    ).fetchone()['count']
    cancelled_rounds = db.execute(
        'SELECT COUNT(*) as count FROM rounds WHERE game_id = ? AND status = ?', (game_id, 'cancelled')
    ).fetchone()['count']

    return jsonify({
        'game': game,
        'statistics': statistics,
        'total_rounds': total_rounds,
        'cancelled_rounds': cancelled_rounds
    }), 200
