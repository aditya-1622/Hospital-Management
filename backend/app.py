"""
app.py
Central Care Hospital Management - Flask backend.

Serves the frontend (static files) AND a small JSON API for:
 - listing doctors
 - checking available appointment slots
 - booking an appointment
 - admin login / logout
 - admin: viewing, updating, cancelling appointments
 - admin: adding a doctor

Run with:  python app.py
Then open: http://127.0.0.1:5000
"""

import os
import re
from datetime import datetime, timedelta

from flask import Flask, jsonify, request, session, send_from_directory
from werkzeug.security import check_password_hash

from database import get_connection, init_db, DB_PATH

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-me")

PHONE_RE = re.compile(r"^[0-9+\-\s]{7,15}$")


# ---------------------------------------------------------------------------
# Static frontend routes
# ---------------------------------------------------------------------------

@app.route("/")
def serve_index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/admin.html")
def serve_admin():
    return send_from_directory(FRONTEND_DIR, "admin.html")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def require_admin():
    return session.get("is_admin") is True


def generate_slots(slot_start, slot_end, slot_length_minutes):
    """Generate list of HH:MM strings between start and end at given interval."""
    fmt = "%H:%M"
    start = datetime.strptime(slot_start, fmt)
    end = datetime.strptime(slot_end, fmt)
    slots = []
    current = start
    while current < end:
        slots.append(current.strftime(fmt))
        current += timedelta(minutes=slot_length_minutes)
    return slots


# ---------------------------------------------------------------------------
# Public API - doctors & slots
# ---------------------------------------------------------------------------

@app.route("/api/doctors", methods=["GET"])
def list_doctors():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM doctors ORDER BY id").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/slots", methods=["GET"])
def get_available_slots():
    doctor_id = request.args.get("doctor_id", type=int)
    date_str = request.args.get("date")

    if not doctor_id or not date_str:
        return jsonify({"error": "doctor_id and date are required"}), 400

    try:
        requested_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "date must be in YYYY-MM-DD format"}), 400

    if requested_date < datetime.now().date():
        return jsonify({"error": "date cannot be in the past"}), 400

    conn = get_connection()
    doctor = conn.execute("SELECT * FROM doctors WHERE id = ?", (doctor_id,)).fetchone()
    if not doctor:
        conn.close()
        return jsonify({"error": "doctor not found"}), 404

    all_slots = generate_slots(doctor["slot_start"], doctor["slot_end"], doctor["slot_length_minutes"])

    taken_rows = conn.execute(
        """SELECT appointment_time FROM appointments
           WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelled'""",
        (doctor_id, date_str),
    ).fetchall()
    conn.close()

    taken = {r["appointment_time"] for r in taken_rows}
    available = [s for s in all_slots if s not in taken]

    return jsonify({"doctor": doctor["name"], "date": date_str, "available_slots": available})


# ---------------------------------------------------------------------------
# Public API - booking
# ---------------------------------------------------------------------------

@app.route("/api/appointments", methods=["POST"])
def book_appointment():
    data = request.get_json(silent=True) or {}

    name = (data.get("patient_name") or "").strip()
    phone = (data.get("phone") or "").strip()
    doctor_id = data.get("doctor_id")
    date_str = data.get("appointment_date")
    time_str = data.get("appointment_time")
    notes = (data.get("notes") or "").strip()

    # --- validation ---
    errors = {}
    if len(name) < 2:
        errors["patient_name"] = "Please enter your full name."
    if not PHONE_RE.match(phone):
        errors["phone"] = "Please enter a valid phone number."
    if not doctor_id:
        errors["doctor_id"] = "Please select a doctor."
    try:
        parsed_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        if parsed_date < datetime.now().date():
            errors["appointment_date"] = "Date cannot be in the past."
    except (TypeError, ValueError):
        errors["appointment_date"] = "Please choose a valid date."
    try:
        datetime.strptime(time_str, "%H:%M")
    except (TypeError, ValueError):
        errors["appointment_time"] = "Please choose a valid time slot."

    if errors:
        return jsonify({"errors": errors}), 400

    conn = get_connection()
    doctor = conn.execute("SELECT * FROM doctors WHERE id = ?", (doctor_id,)).fetchone()
    if not doctor:
        conn.close()
        return jsonify({"errors": {"doctor_id": "Doctor not found."}}), 404

    # Re-check slot is still free (avoid double booking race)
    clash = conn.execute(
        """SELECT id FROM appointments
           WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'cancelled'""",
        (doctor_id, date_str, time_str),
    ).fetchone()
    if clash:
        conn.close()
        return jsonify({"errors": {"appointment_time": "That slot was just booked. Please pick another."}}), 409

    conn.execute(
        """INSERT INTO appointments (patient_name, phone, doctor_id, appointment_date, appointment_time, notes)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (name, phone, doctor_id, date_str, time_str, notes),
    )
    conn.commit()
    new_id = conn.execute("SELECT last_insert_rowid() as id").fetchone()["id"]
    conn.close()

    return jsonify({
        "message": "Appointment booked successfully.",
        "appointment": {
            "id": new_id,
            "patient_name": name,
            "doctor": doctor["name"],
            "date": date_str,
            "time": time_str,
            "status": "pending",
        },
    }), 201


# ---------------------------------------------------------------------------
# Admin API
# ---------------------------------------------------------------------------

@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    conn = get_connection()
    admin = conn.execute("SELECT * FROM admins WHERE username = ?", (username,)).fetchone()
    conn.close()

    if not admin or not check_password_hash(admin["password_hash"], password):
        return jsonify({"error": "Invalid username or password."}), 401

    session["is_admin"] = True
    session["admin_username"] = username
    return jsonify({"message": "Logged in.", "username": username})


@app.route("/api/admin/logout", methods=["POST"])
def admin_logout():
    session.clear()
    return jsonify({"message": "Logged out."})


@app.route("/api/admin/session", methods=["GET"])
def admin_session_status():
    return jsonify({"logged_in": require_admin()})


@app.route("/api/admin/appointments", methods=["GET"])
def admin_list_appointments():
    if not require_admin():
        return jsonify({"error": "Unauthorized"}), 401

    status_filter = request.args.get("status")
    date_filter = request.args.get("date")

    query = """
        SELECT a.*, d.name as doctor_name, d.specialization
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        WHERE 1=1
    """
    params = []
    if status_filter:
        query += " AND a.status = ?"
        params.append(status_filter)
    if date_filter:
        query += " AND a.appointment_date = ?"
        params.append(date_filter)
    query += " ORDER BY a.appointment_date, a.appointment_time"

    conn = get_connection()
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/admin/appointments/<int:appointment_id>", methods=["PATCH"])
def admin_update_appointment(appointment_id):
    if not require_admin():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in ("pending", "confirmed", "cancelled", "completed"):
        return jsonify({"error": "Invalid status."}), 400

    conn = get_connection()
    conn.execute("UPDATE appointments SET status = ? WHERE id = ?", (status, appointment_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Appointment updated."})


@app.route("/api/admin/doctors", methods=["POST"])
def admin_add_doctor():
    if not require_admin():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    specialization = (data.get("specialization") or "").strip()
    experience_years = data.get("experience_years", 0)
    image = (data.get("image") or "doctors.jpg").strip()

    if not name or not specialization:
        return jsonify({"error": "name and specialization are required."}), 400

    conn = get_connection()
    conn.execute(
        """INSERT INTO doctors (name, specialization, experience_years, image)
           VALUES (?, ?, ?, ?)""",
        (name, specialization, experience_years, image),
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Doctor added."}), 201


# ---------------------------------------------------------------------------

if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        init_db()
    app.run(debug=True, port=5000)
