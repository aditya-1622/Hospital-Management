const API = "";

// ---------- theme (shared behavior with main site) ----------
const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;
function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
}
applyTheme((() => { try { return localStorage.getItem("cc-theme"); } catch { return null; } })() || "light");
themeToggle.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem("cc-theme", next); } catch { /* ignore */ }
});

const loginView = document.getElementById("loginView");
const dashboardView = document.getElementById("dashboardView");
const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");
const logoutBtn = document.getElementById("logoutBtn");
const apptTableBody = document.getElementById("apptTableBody");
const statusFilter = document.getElementById("statusFilter");
const dateFilter = document.getElementById("dateFilter");
const refreshBtn = document.getElementById("refreshBtn");
const addDoctorBtn = document.getElementById("addDoctorBtn");
const doctorModal = document.getElementById("doctorModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const addDoctorForm = document.getElementById("addDoctorForm");
const doctorFormStatus = document.getElementById("doctorFormStatus");

function showDashboard(show) {
  loginView.style.display = show ? "none" : "block";
  dashboardView.style.display = show ? "block" : "none";
  logoutBtn.style.display = show ? "inline-flex" : "none";
}

async function checkSession() {
  try {
    const res = await fetch(`${API}/api/admin/session`);
    const data = await res.json();
    if (data.logged_in) {
      showDashboard(true);
      loadAppointments();
    } else {
      showDashboard(false);
    }
  } catch (err) {
    console.error(err);
  }
}
checkSession();

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginStatus.className = "form-status";
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${API}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      loginStatus.className = "form-status error";
      loginStatus.textContent = data.error || "Login failed.";
      return;
    }
    showDashboard(true);
    loadAppointments();
  } catch (err) {
    loginStatus.className = "form-status error";
    loginStatus.textContent = "Network error.";
    console.error(err);
  }
});

logoutBtn.addEventListener("click", async () => {
  await fetch(`${API}/api/admin/logout`, { method: "POST" });
  showDashboard(false);
});


async function loadAppointments() {
  apptTableBody.innerHTML = `<tr><td colspan="8" class="loading-cell">Loading…</td></tr>`;
  const params = new URLSearchParams();
  if (statusFilter.value) params.set("status", statusFilter.value);
  if (dateFilter.value) params.set("date", dateFilter.value);

  try {
    const res = await fetch(`${API}/api/admin/appointments?${params.toString()}`);
    if (res.status === 401) { showDashboard(false); return; }
    const rows = await res.json();

    if (rows.length === 0) {
      apptTableBody.innerHTML = `<tr><td colspan="8" class="loading-cell">No appointments found.</td></tr>`;
      return;
    }

    apptTableBody.innerHTML = "";
    rows.forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(row.patient_name)}</td>
        <td>${escapeHtml(row.phone)}</td>
        <td>${escapeHtml(row.doctor_name)}</td>
        <td>${row.appointment_date}</td>
        <td>${row.appointment_time}</td>
        <td><span class="status-pill status-${row.status}">${row.status}</span></td>
        <td>${escapeHtml(row.notes || "—")}</td>
        <td class="row-actions">
          <select data-id="${row.id}">
            <option value="pending" ${row.status === "pending" ? "selected" : ""}>Pending</option>
            <option value="confirmed" ${row.status === "confirmed" ? "selected" : ""}>Confirmed</option>
            <option value="completed" ${row.status === "completed" ? "selected" : ""}>Completed</option>
            <option value="cancelled" ${row.status === "cancelled" ? "selected" : ""}>Cancelled</option>
          </select>
        </td>
      `;
      apptTableBody.appendChild(tr);

      tr.querySelector("select").addEventListener("change", async (e) => {
        const id = e.target.dataset.id;
        const status = e.target.value;
        await fetch(`${API}/api/admin/appointments/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        loadAppointments();
      });
    });
  } catch (err) {
    apptTableBody.innerHTML = `<tr><td colspan="8" class="loading-cell">Network error loading appointments.</td></tr>`;
    console.error(err);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

refreshBtn.addEventListener("click", loadAppointments);
statusFilter.addEventListener("change", loadAppointments);
dateFilter.addEventListener("change", loadAppointments);


addDoctorBtn.addEventListener("click", () => { doctorModal.style.display = "flex"; });
closeModalBtn.addEventListener("click", () => { doctorModal.style.display = "none"; });

addDoctorForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    name: document.getElementById("docName").value.trim(),
    specialization: document.getElementById("docSpec").value.trim(),
    experience_years: Number(document.getElementById("docExp").value),
  };
  try {
    const res = await fetch(`${API}/api/admin/doctors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      doctorFormStatus.className = "form-status error";
      doctorFormStatus.textContent = data.error || "Could not add doctor.";
      return;
    }
    doctorFormStatus.className = "form-status success";
    doctorFormStatus.textContent = "Doctor added!";
    addDoctorForm.reset();
    setTimeout(() => { doctorModal.style.display = "none"; doctorFormStatus.className = "form-status"; }, 900);
  } catch (err) {
    doctorFormStatus.className = "form-status error";
    doctorFormStatus.textContent = "Network error.";
    console.error(err);
  }
});
