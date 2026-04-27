"""
Socket.IO event handlers.
Quản lý kết nối, room, và state sync cho real-time game updates.
"""
from flask import request
from flask_socketio import join_room, leave_room, emit
from models import get_db, dict_from_row, dicts_from_rows
from redis_cache import get_cached_game_state, cache_game_state, get_redis


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
                r = get_redis()
                redis_results = r.hgetall(f"round:{rnd['id']}:results")
                results = []
                for pid_str, res in redis_results.items():
                    pid = int(pid_str)
                    results.append({
                        'player_id': pid,
                        'result': res,
                        'player_name': players_dict.get(pid, 'Unknown'),
                        'round_id': rnd['id'],
                        'points_change': 0
                    })
                rnd['results'] = results
            else:
                rnd['results'] = results_by_round.get(rnd['id'], [])

            rnd['host_name'] = players_dict.get(rnd['host_player_id'], 'Unknown')

            if rnd['status'] == 'active':
                active_round = rnd
            else:
                round_history.append(rnd)

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

    @socketio.on('request_state')
    def handle_request_state(data):
        """Client yêu cầu full state (reconnect)."""
        game_id = data.get('game_id')
        if not game_id:
            return

        state = get_cached_game_state(game_id)
        if not state:
            state = build_game_state(game_id)
            if state:
                cache_game_state(game_id, state)

        if state:
            emit('game_state_sync', state)
