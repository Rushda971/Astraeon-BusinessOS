const form = document.querySelector("#forgot-password-form");
const emailInput = document.querySelector("#email");
const message = document.querySelector("#form-message");
const { request } = window.AstraeonApi;

document.querySelector("#year").textContent = new Date().getFullYear();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const button = form.querySelector("button");
  button.disabled = true;
  message.textContent = "Sending reset OTP...";
  try {
    const payload = await request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: emailInput.value.trim() }),
    });
    sessionStorage.setItem("resetEmail", emailInput.value.trim().toLowerCase());
    message.textContent = payload.message;
    window.location.href = "../../Authentication/ResetPassword.html/reset-password.html";
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
