import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

FLASK_ENV = os.environ.get('FLASK_ENV', 'development')

if FLASK_ENV == 'production':
    DB_PATH = os.path.join(DATA_DIR, 'xidach_prod.db')
else:
    DB_PATH = os.path.join(BASE_DIR, 'xidach_dev.db')


def get_db():
    """Get a database connection with row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """Initialize the database with all required tables."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript('''
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            game_date TEXT NOT NULL,
            money_per_point INTEGER NOT NULL DEFAULT 1000,
            manager_pin TEXT,
            status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(name, game_date)
        );

        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            total_points INTEGER NOT NULL DEFAULT 0,
            is_active INTEGER NOT NULL DEFAULT 1,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
            UNIQUE(game_id, name)
        );

        CREATE TABLE IF NOT EXISTS rounds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id INTEGER NOT NULL,
            round_number INTEGER NOT NULL,
            host_player_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
            FOREIGN KEY (host_player_id) REFERENCES players(id)
        );

        CREATE TABLE IF NOT EXISTS round_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            round_id INTEGER NOT NULL,
            player_id INTEGER NOT NULL,
            result TEXT NOT NULL CHECK(result IN ('win', 'draw', 'lose', 'pay', 'host', 'win_big', 'lose_big')),
            points_change INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
            FOREIGN KEY (player_id) REFERENCES players(id),
            UNIQUE(round_id, player_id)
        );
    ''')

    conn.commit()

    # Migration: add manager_pin column to existing databases
    try:
        conn.execute('ALTER TABLE games ADD COLUMN manager_pin TEXT')
        conn.commit()
    except sqlite3.OperationalError:
        pass  # Column already exists

    conn.close()


def dict_from_row(row):
    """Convert a sqlite3.Row to a dictionary."""
    if row is None:
        return None
    return dict(row)


def dicts_from_rows(rows):
    """Convert a list of sqlite3.Row to a list of dictionaries."""
    return [dict(row) for row in rows]


def calculate_player_streaks(db, game_id):
    """Tính toán chuỗi thắng/thua (Streak) cho toàn bộ người chơi trong game."""
    streak_data = db.execute('''
        WITH player_rounds AS (
            SELECT 
                rr.player_id,
                rr.points_change,
                ROW_NUMBER() OVER (PARTITION BY rr.player_id ORDER BY r.round_number DESC) as rn
            FROM round_results rr
            JOIN rounds r ON rr.round_id = r.id
            WHERE r.game_id = ? AND r.status = 'completed'
        ),
        stats AS (
            SELECT 
                player_id,
                SUM(CASE WHEN points_change > 0 THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN points_change < 0 THEN 1 ELSE 0 END) as losses
            FROM player_rounds
            WHERE rn <= 10
            GROUP BY player_id
        )
        SELECT player_id, wins, losses FROM stats
    ''', (game_id,)).fetchall()
    
    streaks = {}
    for s in streak_data:
        streaks[s['player_id']] = {
            'is_winning_lot': s['wins'] >= 7,
            'is_losing_lot': s['losses'] >= 7
        }
    return streaks
