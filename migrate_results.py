import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend', 'xidach.db')

def migrate():
    if not os.path.exists(DB_PATH):
        print("Database not found, nothing to migrate.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("Starting migration of round_results table...")
        
        # 1. Create a temporary table with the new constraint
        cursor.execute('''
            CREATE TABLE round_results_new (
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

        # 2. Copy data from old table to new table
        cursor.execute('''
            INSERT INTO round_results_new (id, round_id, player_id, result, points_change)
            SELECT id, round_id, player_id, result, points_change FROM round_results;
        ''')

        # 3. Drop old table
        cursor.execute('DROP TABLE round_results;')

        # 4. Rename new table to original name
        cursor.execute('ALTER TABLE round_results_new RENAME TO round_results;')

        conn.commit()
        print("Migration successful! Added 'win_big' and 'lose_big' to round_results constraints.")
    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
