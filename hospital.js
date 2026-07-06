const form = document.getElementById("appointmentForm");
if (form){

    form.addEventListener("submit", function(e){

        e.preventDefault();

        alert("✅ Appointment booked successfully!");
form.reset();
    });
}
const counters=document.querySelectorAll(".counter");

counters.forEach(counter=>{

const updateCounter=()=>{

const target=+counter.dataset.target;

const current=+counter.innerText;

const increment=Math.ceil(target/80);

if(current<target){

counter.innerText=current+increment;

setTimeout(updateCounter,20);

}else{

counter.innerText=target+"+";

}

}

updateCounter();

});
document.querySelectorAll(".doctorCard button").forEach(button => {

    button.addEventListener("click", () => {

        document.getElementById("appointment").scrollIntoView({
            behavior:"smooth"
        });

    });

});