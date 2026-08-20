const LOGIN_URL = "../Authentication/Login/login.html";
const { request, getToken, clearToken, ApiError } = window.AstraeonApi;

const elements = {
  addButton: document.querySelector("#add-employee"), form: document.querySelector("#employee-form"),
  formError: document.querySelector("#form-error"), employeeModal: document.querySelector("#employee-modal"),
  viewModal: document.querySelector("#view-modal"), closeModal: document.querySelector("#close-modal"), cancelModal: document.querySelector("#cancel-modal"),
  closeView: document.querySelectorAll("[data-close-view]"), table: document.querySelector("#employee-table"),
  search: document.querySelector("#employee-search"), loading: document.querySelector("#loading"), empty: document.querySelector("#empty-state"),
  emptyTitle: document.querySelector("#empty-title"), emptyCopy: document.querySelector("#empty-copy"), pageMessage: document.querySelector("#page-message"),
  resultCount: document.querySelector("#result-count"), toast: document.querySelector("#toast"), details: document.querySelector("#employee-details"),
  total: document.querySelector("#total-count"), active: document.querySelector("#active-count"), managers: document.querySelector("#manager-count"), inactive: document.querySelector("#inactive-count"),
};

let employees = [];
let editingId = null;
let lastFocus = null;
let toastTimer;

const money = new Intl.NumberFormat(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", "\"":"&quot;" })[character]);

const api = async (path = "", options = {}) => {
  if (!getToken()) return redirectToLogin();
  try {
    const payload = await request(`/api/employees${path}`, { ...options, authenticated: true });
    return payload.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearToken();
      redirectToLogin();
    }
    throw error;
  }
};

const redirectToLogin = () => { window.location.href = LOGIN_URL; };
const setLoading = (loading) => { elements.loading.hidden = !loading; };
const showPageError = (message = "") => { elements.pageMessage.textContent = message; elements.pageMessage.hidden = !message; };
const showToast = (message) => { clearTimeout(toastTimer); elements.toast.textContent = message; elements.toast.hidden = false; toastTimer = setTimeout(() => { elements.toast.hidden = true; }, 3500); };
const updateStatistics = () => {
  const active = employees.filter((employee) => employee.status === "ACTIVE");
  elements.total.textContent = employees.length; elements.active.textContent = active.length;
  elements.managers.textContent = employees.filter((employee) => employee.role.toLowerCase().includes("manager")).length;
  elements.inactive.textContent = employees.length - active.length;
};
const renderEmployees = () => {
  elements.table.innerHTML = employees.map((employee) => `<tr>
    <td><span class="employee-name">${escapeHtml(employee.name)}</span><span class="employee-id">#${employee.id}</span></td>
    <td>${escapeHtml(employee.email)}</td><td>${escapeHtml(employee.phone)}</td><td>${escapeHtml(employee.role)}</td>
    <td class="salary">${money.format(employee.salary)}</td><td>${date.format(new Date(employee.joiningDate))}</td>
    <td><span class="badge badge-${employee.status.toLowerCase()}">${employee.status}</span></td>
    <td><div class="row-actions"><button class="action" type="button" data-action="view" data-id="${employee.id}">View</button><button class="action" type="button" data-action="edit" data-id="${employee.id}">Edit</button><button class="action delete" type="button" data-action="delete" data-id="${employee.id}">Delete</button></div></td>
  </tr>`).join("");
  const isSearching = Boolean(elements.search.value.trim());
  elements.empty.hidden = employees.length > 0;
  elements.emptyTitle.textContent = isSearching ? "No matching employees" : "No employees yet";
  elements.emptyCopy.textContent = isSearching ? "Try a different name, email, or role." : "Add your first team member to begin building your workforce.";
  elements.resultCount.textContent = employees.length === 1 ? "1 employee" : `${employees.length} employees`;
  updateStatistics();
};
const loadEmployees = async () => {
  setLoading(true); showPageError();
  try {
    const query = elements.search.value.trim();
    const data = await api(query ? `?search=${encodeURIComponent(query)}` : "");
    employees = data.employees; renderEmployees();
  } catch (error) { showPageError(error.message); }
  finally { setLoading(false); }
};
const openModal = (employee = null) => {
  lastFocus = document.activeElement; editingId = employee?.id ?? null; elements.form.reset(); elements.formError.hidden = true;
  document.querySelector("#modal-title").textContent = employee ? "Edit employee" : "Add employee";
  document.querySelector("#modal-kicker").textContent = employee ? `Employee #${employee.id}` : "New roster entry";
  document.querySelector("#save-employee").textContent = employee ? "Save changes" : "Save employee";
  if (employee) Object.entries(employee).forEach(([key, value]) => {
    const field = elements.form.elements.namedItem(key);
    if (field) field.value = key === "joiningDate" ? value.slice(0, 10) : value;
  });
  elements.employeeModal.hidden = false; elements.form.elements.name.focus();
};
const closeModal = () => { elements.employeeModal.hidden = true; lastFocus?.focus(); };
const openView = (employee) => {
  lastFocus = document.activeElement;
  const fields = [["Name", employee.name], ["Email", employee.email], ["Phone", employee.phone], ["Role", employee.role], ["Monthly salary", money.format(employee.salary)], ["Joining date", date.format(new Date(employee.joiningDate))], ["Status", employee.status]];
  elements.details.innerHTML = fields.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");
  elements.viewModal.hidden = false; elements.viewModal.querySelector("[data-close-view]").focus();
};
const closeView = () => { elements.viewModal.hidden = true; lastFocus?.focus(); };
const employeeById = (id) => employees.find((employee) => employee.id === Number(id));

elements.addButton.addEventListener("click", () => openModal());
elements.closeModal.addEventListener("click", closeModal); elements.cancelModal.addEventListener("click", closeModal);
elements.closeView.forEach((button) => button.addEventListener("click", closeView));
[elements.employeeModal, elements.viewModal].forEach((modal) => modal.addEventListener("click", (event) => { if (event.target === modal) modal === elements.employeeModal ? closeModal() : closeView(); }));
document.addEventListener("keydown", (event) => { if (event.key === "Escape") { if (!elements.employeeModal.hidden) closeModal(); if (!elements.viewModal.hidden) closeView(); } });
elements.form.addEventListener("submit", async (event) => {
  event.preventDefault(); elements.formError.hidden = true;
  if (!elements.form.checkValidity()) return elements.form.reportValidity();
  const formData = Object.fromEntries(new FormData(elements.form));
  const save = document.querySelector("#save-employee"); save.disabled = true; save.textContent = "Saving...";
  try {
    const data = await api(editingId ? `/${editingId}` : "", { method: editingId ? "PUT" : "POST", body: JSON.stringify(formData) });
    closeModal(); showToast(editingId ? "Employee updated successfully." : "Employee created successfully.");
    await loadEmployees();
  } catch (error) { elements.formError.textContent = error.message; elements.formError.hidden = false; }
  finally { save.disabled = false; save.textContent = editingId ? "Save changes" : "Save employee"; }
});
elements.table.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]"); if (!button) return;
  const employee = employeeById(button.dataset.id); if (!employee) return;
  if (button.dataset.action === "view") return openView(employee);
  if (button.dataset.action === "edit") return openModal(employee);
  if (!window.confirm(`Delete ${employee.name} from the employee directory?`)) return;
  try { await api(`/${employee.id}`, { method: "DELETE" }); showToast("Employee deleted successfully."); await loadEmployees(); }
  catch (error) { showPageError(error.message); }
});
let searchTimer;
elements.search.addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadEmployees, 250); });
loadEmployees();
