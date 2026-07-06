// ===============================
// WINDOW LOAD & LOADER
// ===============================

window.addEventListener("load", () => {
    const loader = document.getElementById("loader");

    if (loader) {
        setTimeout(() => {
            loader.style.opacity = "0";
            loader.style.visibility = "hidden";
        }, 1000);
    }

    reveal();
});


// ===============================
// SCROLL PROGRESS BAR + TOP BUTTON
// ===============================

const progressBar = document.getElementById("progressBar");
const topBtn = document.getElementById("topBtn");

window.addEventListener("scroll", () => {

    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const percent = (scrollTop / scrollHeight) * 100;

    if (progressBar) {
        progressBar.style.width = percent + "%";
    }

    if (topBtn) {
        topBtn.style.display = scrollTop > 300 ? "block" : "none";
    }

    reveal();

});

if (topBtn) {
    topBtn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}


// ===============================
// DARK MODE
// ===============================

const themeBtn = document.getElementById("themeBtn");

if (themeBtn) {

    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
        themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }

    themeBtn.addEventListener("click", () => {

        document.body.classList.toggle("dark");

        if (document.body.classList.contains("dark")) {

            localStorage.setItem("theme", "dark");
            themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';

        } else {

            localStorage.setItem("theme", "light");
            themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';

        }

    });

}


// ===============================
// COUNTER
// ===============================

const counters = document.querySelectorAll(".counter");

counters.forEach(counter => {

    counter.innerText = "0";

    const update = () => {

        const target = +counter.dataset.target;
        const current = +counter.innerText;

        const increment = target / 150;

        if (current < target) {

            counter.innerText = Math.ceil(current + increment);

            setTimeout(update, 15);

        } else {

            counter.innerText = target;

        }

    };

    update();

});


// ===============================
// DOCTOR SEARCH
// ===============================

const doctorSearch = document.getElementById("doctorSearch");

if (doctorSearch) {

    doctorSearch.addEventListener("keyup", () => {

        const value = doctorSearch.value.toLowerCase();

        document.querySelectorAll(".doctorCard").forEach(card => {

            const text = card.innerText.toLowerCase();

            card.style.display = text.includes(value) ? "block" : "none";

        });

    });

}


// ===============================
// BMI CALCULATOR
// ===============================

const bmiBtn = document.getElementById("bmiBtn");

if (bmiBtn) {

    bmiBtn.addEventListener("click", () => {

        const h = parseFloat(document.getElementById("height").value);
        const w = parseFloat(document.getElementById("weight").value);

        const result = document.getElementById("result");

        if (!h || !w) {

            result.innerHTML = "Please enter valid values.";

            return;

        }

        const bmi = (w / ((h / 100) * (h / 100))).toFixed(1);

        let status = "";

        if (bmi < 18.5) status = "Underweight";
        else if (bmi < 25) status = "Normal";
        else if (bmi < 30) status = "Overweight";
        else status = "Obese";

        result.innerHTML = `Your BMI : <b>${bmi}</b> (${status})`;

    });

}


// ===============================
// APPOINTMENT
// ===============================

const form = document.getElementById("appointmentForm");

if (form) {

    form.addEventListener("submit", (e) => {

        e.preventDefault();

        const appointment = {

            name: document.getElementById("name").value,
            phone: document.getElementById("phone").value,
            email: document.getElementById("email").value,
            department: document.getElementById("department").value,
            date: document.getElementById("date").value,
            time: document.getElementById("time").value

        };

        localStorage.setItem("appointment", JSON.stringify(appointment));

        alert("Appointment Booked Successfully!");

        form.reset();

    });

}


// ===============================
// NEWSLETTER
// ===============================

const newsBtn = document.querySelector(".newsletterBox button");

if (newsBtn) {

    newsBtn.addEventListener("click", () => {

        const email = document.querySelector(".newsletterBox input");

        if (email.value.trim() === "") {

            alert("Please enter your email.");

            return;

        }

        alert("Subscribed Successfully!");

        email.value = "";

    });

}


// ===============================
// BOOK BUTTON
// ===============================

document.querySelectorAll(".doctorCard button").forEach(btn => {

    btn.addEventListener("click", () => {

        document.getElementById("appointment").scrollIntoView({

            behavior: "smooth"

        });

    });

});


// ===============================
// FAQ
// ===============================

document.querySelectorAll(".faq").forEach(faq => {

    const p = faq.querySelector("p");

    p.style.display = "none";

    faq.addEventListener("click", () => {

        const open = p.style.display === "block";

        document.querySelectorAll(".faq p").forEach(x => x.style.display = "none");

        p.style.display = open ? "none" : "block";

    });

});


// ===============================
// TESTIMONIAL SLIDER
// ===============================

const testimonials = document.querySelectorAll(".testimonialCard");

if (testimonials.length > 0) {

    let current = 0;

    testimonials.forEach((t, i) => {

        t.style.display = i === 0 ? "block" : "none";

    });

    setInterval(() => {

        testimonials[current].style.display = "none";

        current++;

        if (current >= testimonials.length) current = 0;

        testimonials[current].style.display = "block";

    }, 3000);

}


// ===============================
// SCROLL REVEAL
// ===============================

const revealItems = document.querySelectorAll(
".serviceCard,.doctorCard,.chooseCard,.departmentCard,.testimonialCard,.tipCard,.faq"
);

function reveal() {

    const trigger = window.innerHeight - 120;

    revealItems.forEach(item => {

        const top = item.getBoundingClientRect().top;

        if (top < trigger) {

            item.style.opacity = "1";
            item.style.transform = "translateY(0)";

        }

    });

}

revealItems.forEach(item => {

    item.style.opacity = "0";
    item.style.transform = "translateY(40px)";
    item.style.transition = ".6s";

});


// ===============================
// FOOTER YEAR
// ===============================

const year = document.getElementById("year");

if (year) {

    year.innerText = new Date().getFullYear();

}

console.log("Central Care Hospital Loaded Successfully");