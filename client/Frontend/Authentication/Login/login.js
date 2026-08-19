const form = document.querySelector("#login-form");
const message = document.querySelector("#form-message");

document.querySelector("#year").textContent = new Date().getFullYear();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Authentication API wiring belongs here once the backend endpoint is available.
  message.textContent = "Your sign-in details are ready to be securely verified.";
});
