"""
Shared extensions — tạo SocketIO instance ở đây để tránh circular imports.
Routes và socket_events đều import từ file này.
"""
import os
from flask_socketio import SocketIO

# Redis URL cho message queue (đồng bộ giữa workers) và session storage
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6380')

socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode='gevent',
    message_queue=REDIS_URL,
    logger=False,
    engineio_logger=False,
    ping_timeout=10,
    ping_interval=5,
)
