const form = document.querySelector("#verify-form");
const otpInput = document.querySelector("#otp");
const message = document.querySelector("#form-message");
const email = sessionStorage.getItem("verificationEmail") || "";
const { request } = window.AstraeonApi;

const registrationMessage = sessionStorage.getItem("registrationMessage");
if (registrationMessage) {
  message.textContent = registrationMessage;
  sessionStorage.removeItem("registrationMessage");
}

const postAuth = async (path, body) => {
  return request(`/api/auth/${path}`, { method: "POST", body: JSON.stringify(body) });
};
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.checkValidity()) return form.reportValidity();
  if (!email) { message.textContent = "Start registration again so we know which email to verify."; return; }
  const button = form.querySelector("button[type='submit']");
  button.disabled = true;
  try { await postAuth("verify-otp", { email, otp: otpInput.value }); sessionStorage.removeItem("verificationEmail"); message.textContent = "Email verified successfully. You can now sign in."; setTimeout(() => { window.location.href = "../Login/login.html"; }, 700); }
  catch (error) { message.textContent = error.message; }
  finally { button.disabled = false; }
});
document.querySelector("#resend").addEventListener("click", async (event) => { if (!email) { message.textContent = "Start registration again so we know which email to verify."; return; } event.currentTarget.disabled = true; try { const payload = await postAuth("resend-otp", { email }); message.textContent = payload.message; } catch (error) { message.textContent = error.message; } finally { event.currentTarget.disabled = false; } });
