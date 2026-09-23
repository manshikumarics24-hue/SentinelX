import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:secret@localhost:5432/soc_db")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

config = Config()
