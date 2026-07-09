# Central Care — Hospital Management (Enhanced)

A full rebuild of your original static hospital landing page into a real
full-stack app: a redesigned frontend, a working appointment-booking system
backed by a real database, and an admin dashboard to manage appointments.

## What changed from your original project

| Area | Before | After |
|---|---|---|
| Design | Default template look | New teal/coral design system, custom type pairing (Fraunces + Work Sans + IBM Plex Mono), animated pulse-line signature element |
| Navigation | No mobile menu | Responsive hamburger menu, sticky nav, dark mode toggle |
| Appointment form | `alert()` only, nothing saved | Real validation, live available-slots picker, saved to a database, prevents double-booking |
| Doctors | Hardcoded in HTML | Loaded live from the backend (`/api/doctors`), each doctor has real availability |
| Data | None | SQLite database (`hospital.db`) — appointments, doctors, admin accounts |
| Admin | None | `/admin.html` — login, filter/view/update appointment status, add new doctors |
| Accessibility | Empty `alt=""` everywhere, no labels | Descriptive alt text, `<label>`s on every input, skip-link, focus outlines, `prefers-reduced-motion` respected |

## Project structure

```
hospital-enhanced/
├── backend/
│   ├── app.py            # Flask app: serves frontend + JSON API
│   ├── database.py       # SQLite schema + seed data
│   └── requirements.txt
├── frontend/
│   ├── index.html        # Public site
│   ├── admin.html         # Staff dashboard
│   ├── css/
│   ├── js/
│   └── images/
└── README.md
```

## Running it locally

1. Install Python dependencies (Python 3.9+ recommended):
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Start the server:
   ```bash
   python app.py
   ```
3. Open your browser:
   - Public site: http://127.0.0.1:5000
   - Staff dashboard: http://127.0.0.1:5000/admin.html

The database (`hospital.db`) is created automatically on first run, seeded
with 4 doctors and one admin account.

**Default admin login:** `admin` / `admin123`
Change this in production — see "Next steps" below.

## How booking works

1. Visitor picks a doctor and a date on the public site.
2. Frontend calls `GET /api/slots?doctor_id=..&date=..`, which computes that
   doctor's working hours minus any slots already booked that day.
3. On submit, `POST /api/appointments` re-validates everything server-side
   (never trust the browser) and re-checks the slot is still free before
   saving — this prevents two people booking the same slot at once.

## Admin dashboard

- Log in at `/admin.html`.
- Filter appointments by status or date.
- Change an appointment's status (pending → confirmed → completed, or cancel).
- Add new doctors via the "+ Add doctor" button.
- Session is cookie-based (Flask's built-in session), so it persists across
  page reloads until you log out.

## Suggested next steps (not yet built)

If you want to keep going, natural next additions:
- **Password reset / multiple admin accounts** — currently one hardcoded seed admin.
- **Email/SMS confirmation** on booking (e.g. via SendGrid or Twilio).
- **Patient login** so people can view/cancel their own upcoming appointments.
- **Deploy** — this Flask dev server isn't for production; deploy behind
  gunicorn/Nginx, or on Render/Railway/PythonAnywhere for a live URL.
- **Doctor photo uploads** from the admin panel instead of hardcoded filenames.

## Notes

- All original images were kept and reused (`frontend/images/`).
- No external JS frameworks — plain HTML/CSS/JS on the frontend, so it's
  easy to keep editing without a build step.
