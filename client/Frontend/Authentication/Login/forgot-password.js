const form = document.querySelector("#forgot-password-form");
const emailInput = document.querySelector("#email");
const message = document.querySelector("#form-message");

document.querySelector("#year").textContent = new Date().getFullYear();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // The reset API can be connected here without changing the presentation layer.
  message.textContent = `If an account exists for ${emailInput.value.trim()}, a reset link has been sent.`;
  form.reset();
});
