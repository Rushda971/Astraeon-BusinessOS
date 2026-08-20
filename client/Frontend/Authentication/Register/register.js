const form = document.querySelector("#register-form");
const message = document.querySelector("#form-message");
const { request } = window.AstraeonApi;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.checkValidity()) return form.reportValidity();
  const values = Object.fromEntries(new FormData(form));
  if (values.password !== values.confirmPassword) {
    message.textContent = "Passwords do not match.";
    return;
  }
  const button = form.querySelector("button");
  button.disabled = true;
  message.textContent = "Creating account...";
  try {
    const payload = await request("/api/auth/register", { method: "POST", body: JSON.stringify(values) });
    sessionStorage.setItem("verificationEmail", values.email.trim().toLowerCase());
    sessionStorage.setItem("registrationMessage", payload.message);
    window.location.href = "verify-otp.html";
  } catch (error) { message.textContent = error.message; }
  finally { button.disabled = false; }
});
