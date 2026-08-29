const LOGIN_URL = "../Authentication/Login/login.html";
const { request, getToken, clearToken } = window.AstraeonApi;
const elements = {
  message: document.querySelector("#page-message"), userName: document.querySelector("#user-name"), profileName: document.querySelector("#profile-name"),
  profileEmail: document.querySelector("#profile-email"), profileRole: document.querySelector("#profile-role"), roster: document.querySelector("#roster"),
  total: document.querySelector("#total-count"), active: document.querySelector("#active-count"), managers: document.querySelector("#manager-count"), teamCaption: document.querySelector("#team-caption"),
  avatar: document.querySelector("#avatar"), profileAvatar: document.querySelector("#profile-avatar"), healthPercent: document.querySelector("#health-percent"), healthActive: document.querySelector("#health-active"), healthInactive: document.querySelector("#health-inactive"), healthTotal: document.querySelector("#health-total"),
};

const redirectToLogin = () => { window.location.href = LOGIN_URL; };
const showError = (message) => { elements.message.textContent = message; elements.message.hidden = false; };
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", "\"":"&quot;" })[character]);
const initials = (value) => String(value || "A").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const animateNumber = (element, value) => {
  const target = Number(value) || 0;
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - start) / 650, 1);
    element.textContent = Math.round(target * (1 - (1 - progress) ** 3));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const loadDashboard = async () => {
  if (!getToken()) return redirectToLogin();
  try {
    const [profilePayload, employeePayload] = await Promise.all([
      request("/api/auth/profile", { authenticated: true }),
      request("/api/employees", { authenticated: true }),
    ]);
    const profile = profilePayload.data.user || profilePayload.data;
    const employees = employeePayload.data.employees || [];
    const active = employees.filter((employee) => employee.status === "ACTIVE");
    const managers = employees.filter((employee) => employee.role.toLowerCase().includes("manager"));
    const displayName = profile.name || profile.email?.split("@")[0] || "there";
    elements.userName.textContent = displayName;
    elements.avatar.textContent = initials(displayName);
    elements.profileAvatar.textContent = initials(displayName);
    elements.profileName.textContent = displayName;
    elements.profileEmail.textContent = profile.email || "—";
    elements.profileRole.textContent = profile.role || "Account owner";
    animateNumber(elements.total, employees.length);
    animateNumber(elements.active, active.length);
    animateNumber(elements.managers, managers.length);
    animateNumber(elements.healthActive, active.length);
    animateNumber(elements.healthInactive, employees.length - active.length);
    animateNumber(elements.healthTotal, employees.length);
    elements.healthPercent.textContent = employees.length ? `${Math.round((active.length / employees.length) * 100)}%` : "0%";
    elements.teamCaption.textContent = employees.length === 1 ? "One person on the roster" : "People on the roster";
    elements.roster.innerHTML = employees.length ? employees.slice(0, 5).map((employee) => `<div class="roster-row"><div><strong>${escapeHtml(employee.name)}</strong><span>${escapeHtml(employee.role)}</span></div><span class="status">${escapeHtml(employee.status)}</span></div>`).join("") : '<p class="muted">No employees yet. Add your first team member from the directory.</p>';
  } catch (error) {
    if (error.status === 401) { clearToken(); return redirectToLogin(); }
    showError(error.message);
    elements.roster.innerHTML = '<p class="muted">The live workspace could not be loaded.</p>';
  }
};

document.querySelector("#logout").addEventListener("click", async () => {
  try { if (getToken()) await request("/api/auth/logout", { method: "POST", authenticated: true }); } catch { /* Clear the local session even if the API is unavailable. */ }
  clearToken(); redirectToLogin();
});
document.querySelectorAll(".chart-controls button").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll(".chart-controls button").forEach((item) => item.classList.remove("selected"));
  button.classList.add("selected");
}));
document.querySelector("#menu-toggle").addEventListener("click", () => document.querySelector("#sidebar").classList.toggle("open"));
loadDashboard();
