from app.config import config
from sqlalchemy import create_engine, text

def migrate():
    engine = create_engine(config.DATABASE_URL)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'incidents'"))
        existing_cols = [r[0] for r in res]
        print("Existing columns:", existing_cols)

        columns_to_add = [
            ("source_count", "INTEGER DEFAULT 0"),
            ("top_source_rps", "INTEGER DEFAULT 0"),
            ("top_source_concentration", "INTEGER DEFAULT 0"),
            ("legitimate_rps", "INTEGER DEFAULT 0"),
            ("faulty_rps", "INTEGER DEFAULT 0"),
            ("detection_reason", "TEXT"),
            ("resolved", "BOOLEAN DEFAULT FALSE"),
        ]

        for col, col_type in columns_to_add:
            if col not in existing_cols:
                print(f"Adding missing column: {col}")
                conn.execute(text(f"ALTER TABLE incidents ADD COLUMN {col} {col_type};"))
        
        conn.commit()
        print("Database migration successfully completed!")

if __name__ == "__main__":
    migrate()
