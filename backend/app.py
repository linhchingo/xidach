# Patch standard library for gevent (Bắt buộc phải nằm trên cùng trước các imports khác)
import gevent.monkey
gevent.monkey.patch_all()

from flask import Flask
from flask_cors import CORS
from models import init_db
from routes.games import games_bp
from routes.players import players_bp
from routes.rounds import rounds_bp
from extensions import socketio
from socket_events import register_events

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(games_bp)
app.register_blueprint(players_bp)
app.register_blueprint(rounds_bp)

# Initialize database
init_db()

# Initialize SocketIO
socketio.init_app(app)
register_events(socketio)


@app.route('/api/health', methods=['GET'])
def health_check():
    return {'status': 'ok', 'message': 'Xì Dách API is running'}, 200


if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000, host='0.0.0.0')
