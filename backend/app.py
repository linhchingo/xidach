from flask import Flask
from flask_cors import CORS
from models import init_db
from routes.games import games_bp
from routes.players import players_bp
from routes.rounds import rounds_bp

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(games_bp)
app.register_blueprint(players_bp)
app.register_blueprint(rounds_bp)

# Initialize database
init_db()


@app.route('/api/health', methods=['GET'])
def health_check():
    return {'status': 'ok', 'message': 'Xì Dách API is running'}, 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)
