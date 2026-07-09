
// Central Care — frontend logic


const API = ""; // same-origin, Flask serves both frontend and API

// ---------- Mobile nav ----------
const hamburgerBtn = document.getElementById("hamburgerBtn");
const navLinks = document.getElementById("navLinks");

hamburgerBtn.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  hamburgerBtn.setAttribute("aria-expanded", isOpen);
});

navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    hamburgerBtn.setAttribute("aria-expanded", "false");
  });
});


const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
}

const savedTheme = (() => {
  try { return localStorage.getItem("cc-theme"); } catch { return null; }
})();
applyTheme(savedTheme || "light");

themeToggle.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem("cc-theme", next); } catch { /* ignore */ }
});


const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));


document.querySelectorAll(".num[data-target]").forEach(counter => {
  const target = +counter.dataset.target;
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      let current = 0;
      const increment = Math.ceil(target / 80);
      const tick = () => {
        current += increment;
        if (current < target) {
          counter.textContent = current;
          requestAnimationFrame(() => setTimeout(tick, 16));
        } else {
          counter.textContent = target.toLocaleString() + "+";
        }
      };
      tick();
      counterObserver.unobserve(entry.target);
    });
  }, { threshold: 0.5 });
  counterObserver.observe(counter);
});

document.getElementById("heroBookBtn").addEventListener("click", () => {
  document.getElementById("appointment").scrollIntoView({ behavior: "smooth" });
});

const doctorsGrid = document.getElementById("doctorsGrid");
const doctorSelect = document.getElementById("doctorSelect");
let doctorsCache = [];

async function loadDoctors() {
  try {
    const res = await fetch(`${API}/api/doctors`);
    if (!res.ok) throw new Error("Failed to load doctors");
    doctorsCache = await res.json();
    renderDoctors(doctorsCache);
    populateDoctorSelect(doctorsCache);
  } catch (err) {
    doctorsGrid.innerHTML = `<p class="slot-hint">Couldn't load doctors right now. Is the backend running?</p>`;
    console.error(err);
  }
}

function renderDoctors(doctors) {
  doctorsGrid.innerHTML = "";
  doctors.forEach(doc => {
    const card = document.createElement("div");
    card.className = "doctor-card reveal";
    card.innerHTML = `
      <img src="images/${doc.image}" alt="Portrait of ${doc.name}, ${doc.specialization}">
      <h3>${doc.name}</h3>
      <p class="spec">${doc.specialization}</p>
      <div class="meta">⭐ ${doc.rating} &nbsp;|&nbsp; ${doc.experience_years} yrs exp.</div>
      <button class="btn btn-outline" data-doctor-id="${doc.id}">Book appointment</button>
    `;
    doctorsGrid.appendChild(card);
    revealObserver.observe(card);

    card.querySelector("button").addEventListener("click", () => {
      doctorSelect.value = String(doc.id);
      doctorSelect.dispatchEvent(new Event("change"));
      document.getElementById("appointment").scrollIntoView({ behavior: "smooth" });
    });
  });
}

function populateDoctorSelect(doctors) {
  doctors.forEach(doc => {
    const opt = document.createElement("option");
    opt.value = doc.id;
    opt.textContent = `${doc.name} — ${doc.specialization}`;
    doctorSelect.appendChild(opt);
  });
}

loadDoctors();

const form = document.getElementById("appointmentForm");
const dateInput = document.getElementById("apptDate");
const slotsWrap = document.getElementById("slotsWrap");
const apptTimeHidden = document.getElementById("apptTime");
const formStatus = document.getElementById("formStatus");
const submitBtn = document.getElementById("submitBtn");


dateInput.min = new Date().toISOString().split("T")[0];

function clearFieldError(fieldId) {
  const row = document.getElementById(fieldId).closest(".form-row");
  row.classList.remove("has-error");
  document.getElementById(`err-${fieldId}`).textContent = "";
}

function setFieldError(fieldId, message) {
  const row = document.getElementById(fieldId).closest(".form-row");
  row.classList.add("has-error");
  document.getElementById(`err-${fieldId}`).textContent = message;
}

async function refreshSlots() {
  const doctorId = doctorSelect.value;
  const date = dateInput.value;
  apptTimeHidden.value = "";

  if (!doctorId || !date) {
    slotsWrap.innerHTML = `<p class="slot-hint">Choose a doctor and date to see open slots.</p>`;
    return;
  }

  slotsWrap.innerHTML = `<p class="slot-hint">Loading slots…</p>`;

  try {
    const res = await fetch(`${API}/api/slots?doctor_id=${doctorId}&date=${date}`);
    const data = await res.json();

    if (!res.ok) {
      slotsWrap.innerHTML = `<p class="slot-hint">${data.error || "Could not load slots."}</p>`;
      return;
    }

    if (data.available_slots.length === 0) {
      slotsWrap.innerHTML = `<p class="slot-hint">No open slots for this date — try another day.</p>`;
      return;
    }

    slotsWrap.innerHTML = "";
    data.available_slots.forEach(slot => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot-btn";
      btn.textContent = slot;
      btn.addEventListener("click", () => {
        slotsWrap.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        apptTimeHidden.value = slot;
        clearFieldError("apptTime");
      });
      slotsWrap.appendChild(btn);
    });
  } catch (err) {
    slotsWrap.innerHTML = `<p class="slot-hint">Network error loading slots.</p>`;
    console.error(err);
  }
}

doctorSelect.addEventListener("change", refreshSlots);
dateInput.addEventListener("change", refreshSlots);

function validateForm() {
  let valid = true;
  const name = document.getElementById("patientName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const doctorId = doctorSelect.value;
  const date = dateInput.value;
  const time = apptTimeHidden.value;

  ["patientName", "phone", "doctorSelect", "apptDate", "apptTime"].forEach(clearFieldError);

  if (name.length < 2) { setFieldError("patientName", "Please enter your full name."); valid = false; }
  if (!/^[0-9+\-\s]{7,15}$/.test(phone)) { setFieldError("phone", "Enter a valid phone number."); valid = false; }
  if (!doctorId) { setFieldError("doctorSelect", "Please select a doctor."); valid = false; }
  if (!date) { setFieldError("apptDate", "Please choose a date."); valid = false; }
  if (!time) { setFieldError("apptTime", "Please pick an available time slot."); valid = false; }

  return valid;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formStatus.className = "form-status";
  formStatus.textContent = "";

  if (!validateForm()) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Booking…";

  const payload = {
    patient_name: document.getElementById("patientName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    doctor_id: Number(doctorSelect.value),
    appointment_date: dateInput.value,
    appointment_time: apptTimeHidden.value,
    notes: document.getElementById("notes").value.trim(),
  };

  try {
    const res = await fetch(`${API}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      if (data.errors) {
        Object.entries(data.errors).forEach(([field, msg]) => {
          const idMap = { doctor_id: "doctorSelect", appointment_date: "apptDate", appointment_time: "apptTime", patient_name: "patientName" };
          setFieldError(idMap[field] || field, msg);
        });
      }
      formStatus.className = "form-status error";
      formStatus.textContent = "Please fix the errors above and try again.";
      return;
    }

    formStatus.className = "form-status success";
    formStatus.textContent = `✅ Booked with ${data.appointment.doctor} on ${data.appointment.date} at ${data.appointment.time}.`;
    form.reset();
    slotsWrap.innerHTML = `<p class="slot-hint">Choose a doctor and date to see open slots.</p>`;
  } catch (err) {
    formStatus.className = "form-status error";
    formStatus.textContent = "Network error — please try again.";
    console.error(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Book appointment";
  }
});
