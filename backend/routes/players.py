from flask import Blueprint, request, jsonify
from models import get_db, dict_from_row, dicts_from_rows

players_bp = Blueprint('players', __name__)


@players_bp.route('/api/games/<int:game_id>/players', methods=['POST'])
def add_player(game_id):
    """Add a player to a game."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Tên người chơi không được để trống'}), 400

    db = get_db()
    try:
        # Check game exists and is active
        game = dict_from_row(db.execute('SELECT * FROM games WHERE id = ?', (game_id,)).fetchone())
        if not game:
            return jsonify({'error': 'Cuộc chơi không tồn tại'}), 404
        if game['status'] == 'completed':
            return jsonify({'error': 'Cuộc chơi đã kết thúc, không thể thêm người chơi'}), 400

        # Check if player already exists (active or inactive)
        existing_player = dict_from_row(
            db.execute('SELECT * FROM players WHERE game_id = ? AND name = ?', (game_id, name)).fetchone()
        )
        
        if existing_player:
            if existing_player['is_active'] == 0:
                # Reactivate the player
                db.execute('UPDATE players SET is_active = 1 WHERE id = ?', (existing_player['id'],))
                db.commit()
                player = dict_from_row(
                    db.execute('SELECT * FROM players WHERE id = ?', (existing_player['id'],)).fetchone()
                )
                return jsonify(player), 200
            else:
                return jsonify({'error': f'Người chơi "{name}" đang có trong cuộc chơi'}), 409

        cursor = db.execute(
            'INSERT INTO players (game_id, name) VALUES (?, ?)',
            (game_id, name)
        )
        db.commit()

        player = dict_from_row(
            db.execute('SELECT * FROM players WHERE id = ?', (cursor.lastrowid,)).fetchone()
        )
        return jsonify(player), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@players_bp.route('/api/games/<int:game_id>/players', methods=['GET'])
def get_players(game_id):
    """Get all players in a game."""
    db = get_db()
    try:
        players = dicts_from_rows(
            db.execute('SELECT * FROM players WHERE game_id = ? ORDER BY joined_at', (game_id,)).fetchall()
        )
        return jsonify(players), 200
    finally:
        db.close()


@players_bp.route('/api/games/<int:game_id>/players/<int:player_id>', methods=['DELETE'])
def remove_player(game_id, player_id):
    """Remove a player from a game (only if they haven't played any rounds)."""
    db = get_db()
    try:
        player = dict_from_row(
            db.execute('SELECT * FROM players WHERE id = ? AND game_id = ?', (player_id, game_id)).fetchone()
        )
        if not player:
            return jsonify({'error': 'Người chơi không tồn tại'}), 404

        # Check if player has any round results
        has_results = db.execute(
            'SELECT COUNT(*) as count FROM round_results WHERE player_id = ?', (player_id,)
        ).fetchone()['count']

        # Check if player is host of any round
        is_host = db.execute(
            'SELECT COUNT(*) as count FROM rounds WHERE host_player_id = ?', (player_id,)
        ).fetchone()['count']

        # Determine if we should delete or deactivate
        if has_results > 0 or is_host > 0:
            db.execute('UPDATE players SET is_active = 0 WHERE id = ?', (player_id,))
            db.commit()
            return jsonify({'message': f'Người chơi "{player["name"]}" đã bị loại khỏi cuộc chơi', 'deactivated': True}), 200
        else:
            db.execute('DELETE FROM players WHERE id = ?', (player_id,))
            db.commit()
            return jsonify({'message': f'Đã xóa người chơi "{player["name"]}"', 'deleted': True}), 200
    finally:
        db.close()
