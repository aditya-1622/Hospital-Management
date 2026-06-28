const form = document.getElementById("appointmentForm");
if (form){

    form.addEventListener("submit", function(e){

        e.preventDefault();

        alert("Your appointment request has been submitted successfully!");
    });
}