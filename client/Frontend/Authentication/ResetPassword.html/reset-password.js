const form = document.querySelector("#reset-form");
const message = document.querySelector("#form-message");
const email = sessionStorage.getItem("resetEmail") || "";
const { request } = window.AstraeonApi;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.checkValidity()) return form.reportValidity();
  const values = Object.fromEntries(new FormData(form));
  if (values.password !== values.confirmPassword) return (message.textContent = "Passwords do not match.");
  const button = form.querySelector("button");
  button.disabled = true;
  try {
    const payload = await request("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ email, otp: values.otp, password: values.password }) });
    sessionStorage.removeItem("resetEmail"); message.textContent = payload.message; setTimeout(() => { window.location.href = "../Login/login.html"; }, 700);
  } catch (error) { message.textContent = error.message; }
  finally { button.disabled = false; }
});
