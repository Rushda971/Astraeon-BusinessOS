const form = document.querySelector("#login-form");
const message = document.querySelector("#form-message");
const { request, setToken } = window.AstraeonApi;

document.querySelector("#year").textContent = new Date().getFullYear();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const button = form.querySelector("button");
  button.disabled = true;
  message.textContent = "Signing in...";
  try {
    const payload = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    setToken(payload.data.token);
    message.textContent = "Login successful.";
    window.location.href = "../../Dashboard/dashboard.html";
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
