# 🏥 Central Care — Hospital Management System

A full-stack hospital management web app: browse doctors, check real-time appointment
availability, book a visit, and manage everything from an admin dashboard.

Originally a static landing page, rebuilt into a complete booking system with a
Flask + SQLite backend, a redesigned frontend, and an admin panel.

![Python](https://img.shields.io/badge/Python-3.9+-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1-000000?logo=flask&logoColor=white)
![SQLite](https://img.shields.io/badge/Database-SQLite-07405E?logo=sqlite&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active-success)

---

## ✨ Features

- **Live doctor directory** — pulled from the database, not hardcoded
- **Real-time slot booking** — pick a doctor and date, see actual open time slots
- **No double-booking** — server-side checks stop two people grabbing the same slot
- **Form validation** — client-side and server-side, so bad data never reaches the database
- **Admin dashboard** — secure login, filter/update appointment status, add new doctors
- **Responsive design** — mobile nav, dark mode, smooth scroll animations
- **Accessible** — proper labels, alt text, keyboard focus states, reduced-motion support

## 📸 Screenshots

<!-- Add your own screenshots here, e.g.: -->
<!-- ![Homepage](docs/screenshots/home.png) -->
<!-- ![Admin Dashboard](docs/screenshots/admin.png) -->

## 🧱 Tech Stack

| Layer | Tech |
|---|---|
| Backend | Python, Flask |
| Database | SQLite |
| Frontend | HTML, CSS, vanilla JavaScript |
| Auth | Flask sessions (cookie-based) |

## 📂 Project Structure
hospital-management/
├── backend/
│    app.py             # Flask app — routes + API
│    database.py        # Schema + seed data
│    requirements.txt
├── frontend/
│    index.html         # Public site
│    admin.html         # Staff dashboard
│    css/
│    js/
│    images/
└── README.md

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- pip

### Installation

```bash
git clone https://github.com/aditya-1622/Hospital-Management
cd <your-repo>/backend
pip install -r requirements.txt
python app.py
```

Then open:
- **Public site:** http://127.0.0.1:5000
- **Admin dashboard:** http://127.0.0.1:5000/admin.html

The SQLite database is created and seeded automatically on first run.

### Default admin login
Username: admin
Password: admin123

⚠️ Change this before deploying anywhere public — see [Security notes](#-security-notes).

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/doctors` | List all doctors |
| `GET` | `/api/slots?doctor_id=&date=` | Get open slots for a doctor on a date |
| `POST` | `/api/appointments` | Book an appointment |
| `POST` | `/api/admin/login` | Admin login |
| `POST` | `/api/admin/logout` | Admin logout |
| `GET` | `/api/admin/appointments` | List appointments (admin only) |
| `PATCH` | `/api/admin/appointments/<id>` | Update appointment status (admin only) |
| `POST` | `/api/admin/doctors` | Add a doctor (admin only) |

## 🗺️ Roadmap

- [ ] Patient login to view/cancel their own appointments
- [ ] Email/SMS booking confirmations
- [ ] Edit/remove doctors from the admin panel
- [ ] Deploy to a live URL (Render / Railway)

## 🔒 Security notes

This is a learning/portfolio project. Before using it for anything real:
- Change the default admin password and `SECRET_KEY` in `app.py`
- Don't run Flask's built-in dev server in production — use gunicorn/Nginx or a managed host
- Add HTTPS if deploying publicly

## 📄 License

This project is open source and available for personal or educational use.

-- LIVE DEPLOYMENT RENDER.COM
https://hospital-management-s1qa.onrender.com