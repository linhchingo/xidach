"""
Redis cache operations cho game state.
Dùng Redis Hash để lưu trạng thái game tức thời, phục vụ reconnect nhanh.
"""
import json
import os
import redis

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6380')

_redis_client = None


def get_redis():
    """Singleton Redis client."""
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
    return _redis_client


def cache_game_state(game_id, state):
    """Ghi toàn bộ game state vào Redis Hash. TTL 24h."""
    r = get_redis()
    key = f'game_state:{game_id}'
    mapping = {field: json.dumps(value, default=str) for field, value in state.items()}
    r.hset(key, mapping=mapping)
    r.expire(key, 86400)


def get_cached_game_state(game_id):
    """Đọc game state từ Redis. Trả về dict hoặc None nếu cache miss."""
    r = get_redis()
    key = f'game_state:{game_id}'
    data = r.hgetall(key)
    if not data:
        return None
    return {k: json.loads(v) for k, v in data.items()}


def invalidate_game_cache(game_id):
    """Xóa cache khi game kết thúc hoặc bị xóa."""
    r = get_redis()
    r.delete(f'game_state:{game_id}')


def refresh_game_cache(game_id):
    """Rebuild cache từ DB. Gọi sau mỗi mutation."""
    from socket_events import build_game_state
    state = build_game_state(game_id)
    if state:
        cache_game_state(game_id, state)
    return state
