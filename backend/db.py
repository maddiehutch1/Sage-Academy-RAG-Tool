"""
Thin database connection helper.

Call get_conn() to get a psycopg2 connection from DATABASE_URL.
The caller is responsible for closing the connection.
"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()


def get_conn():
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not set in the environment.")
    return psycopg2.connect(url)
