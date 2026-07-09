"""
database.py
Handles SQLite setup, schema creation, and seed data for the
Central Care Hospital Management app.
"""

import sqlite3
import os
from datetime import time
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(__file__), "hospital.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(reset=False):
    """Create tables. If reset=True, drops existing tables first."""
    conn = get_connection()
    cur = conn.cursor()

    if reset:
        cur.executescript("""
            DROP TABLE IF EXISTS appointments;
            DROP TABLE IF EXISTS doctors;
            DROP TABLE IF EXISTS admins;
        """)

    cur.executescript("""
        CREATE TABLE IF NOT EXISTS doctors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            specialization TEXT NOT NULL,
            experience_years INTEGER NOT NULL,
            rating REAL NOT NULL DEFAULT 4.8,
            image TEXT,
            slot_start TEXT NOT NULL DEFAULT '09:00',
            slot_end TEXT NOT NULL DEFAULT '17:00',
            slot_length_minutes INTEGER NOT NULL DEFAULT 30
        );

        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            doctor_id INTEGER NOT NULL,
            appointment_date TEXT NOT NULL,
            appointment_time TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (doctor_id) REFERENCES doctors (id),
            UNIQUE (doctor_id, appointment_date, appointment_time)
        );

        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        );
    """)

    conn.commit()

    # Seed doctors only if table is empty
    cur.execute("SELECT COUNT(*) as c FROM doctors")
    if cur.fetchone()["c"] == 0:
        doctors = [
            ("Dr. AnuPriya Garg", "Cardiologist", 12, 4.9, "d1.jpg", "09:00", "15:00", 30),
            ("Dr. Priya Verma", "Neurologist", 10, 4.8, "d2.jpg", "10:00", "16:00", 30),
            ("Dr. Aman Singh", "Orthopedic Surgeon", 15, 5.0, "d3.webp", "09:00", "13:00", 20),
            ("Dr. Siddhant Pandey", "Pediatrician", 8, 4.9, "d4.webp", "11:00", "17:00", 20),
        ]
        cur.executemany(
            """INSERT INTO doctors
               (name, specialization, experience_years, rating, image, slot_start, slot_end, slot_length_minutes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            doctors,
        )

    # Seed a default admin account only if none exists
    cur.execute("SELECT COUNT(*) as c FROM admins")
    if cur.fetchone()["c"] == 0:
        cur.execute(
            "INSERT INTO admins (username, password_hash) VALUES (?, ?)",
            ("admin", generate_password_hash("admin123")),
        )

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db(reset=True)
    print("Database initialized at", DB_PATH)
    print("Default admin login -> username: admin | password: admin123")
