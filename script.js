const STORAGE_KEY = "gp_portal_complaints_v1";
const USER_KEY = "gp_portal_current_user";
const $ = (id) => document.getElementById(id);
const readComplaints = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
};
const saveComplaints = (items) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const currentUser = () => {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY) || "null"); }
  catch { return null; }
};
const setMessage = (id, text, error=false) => {
  const el = $(id); el.textContent = text; el.classList.toggle("error", error);
};
function showView(role, email) {
  $("loginView").classList.add("hidden");
  $("citizenView").classList.toggle("hidden", role !== "citizen");
  $("adminView").classList.toggle("hidden", role !== "admin");
  $("logoutBtn").classList.remove("hidden");
  if (role === "citizen") {
    $("citizenName").textContent = email.split("@")[0];
    renderCitizen();
  } else renderAdmin();
}
function statusClass(status) {
  return status === "Resolved" ? "status-resolved" : status === "In Progress" ? "status-progress" : "status-pending";
}
function renderCitizen() {
  const user = currentUser(); if (!user) return;
  const all = readComplaints();
  const mine = all.filter(c => c.email === user.email);
  $("myTotal").textContent = mine.length;
  $("myPending").textContent = mine.filter(c => c.status === "Pending").length;
  $("myResolved").textContent = mine.filter(c => c.status === "Resolved").length;
  $("citizenRows").innerHTML = mine.slice().reverse().map(c => `<tr><td><strong>${c.id}</strong></td><td>${escapeHtml(c.category)}</td><td>${escapeHtml(c.location)}</td><td>${c.date}</td><td><span class="status-pill ${statusClass(c.status)}">${c.status}</span></td></tr>`).join("");
  $("citizenEmpty").classList.toggle("hidden", mine.length > 0);
}
function renderAdmin() {
  const all = readComplaints();
  $("adminTotal").textContent = all.length;
  $("adminPending").textContent = all.filter(c => c.status === "Pending").length;
  $("adminProgress").textContent = all.filter(c => c.status === "In Progress").length;
  $("adminResolved").textContent = all.filter(c => c.status === "Resolved").length;
  const filter = $("statusFilter").value;
  const shown = all.filter(c => filter === "All" || c.status === filter).slice().reverse();
  $("adminRows").innerHTML = shown.map(c => `<tr>
    <td><strong>${c.id}</strong><br>${escapeHtml(c.name)}<br><span class="muted">${escapeHtml(c.phone)}</span></td>
    <td>${escapeHtml(c.category)}</td>
    <td><strong>${escapeHtml(c.location)}</strong><br>${escapeHtml(c.description)}</td>
    <td>${c.date}</td>
    <td><select aria-label="Update status for ${c.id}" data-id="${c.id}" class="status-update">
      ${["Pending","In Progress","Resolved"].map(s => `<option ${c.status===s?"selected":""}>${s}</option>`).join("")}
    </select></td></tr>`).join("");
  $("adminEmpty").classList.toggle("hidden", shown.length > 0);
  document.querySelectorAll(".status-update").forEach(select => select.addEventListener("change", e => {
    const items = readComplaints(); const item = items.find(x => x.id === e.target.dataset.id);
    if (item) { item.status = e.target.value; saveComplaints(items); renderAdmin(); }
  }));
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
$("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const role = $("role").value, email = $("email").value.trim().toLowerCase(), password = $("password").value;
  if (role === "admin" && !(email === "admin@gp.in" && password === "admin123")) {
    setMessage("loginMessage", "Admin demo login is admin@gp.in / admin123.", true); return;
  }
  if (role === "citizen" && password.length < 4) {
    setMessage("loginMessage", "Please enter a password with at least 4 characters.", true); return;
  }
  sessionStorage.setItem(USER_KEY, JSON.stringify({role, email}));
  setMessage("loginMessage", "");
  showView(role, email);
});
$("complaintForm").addEventListener("submit", e => {
  e.preventDefault();
  const user = currentUser(); if (!user) return;
  const items = readComplaints();
  const complaint = {
    id: "GP" + Date.now().toString().slice(-7),
    name: $("fullName").value.trim(), phone: $("phone").value.trim(),
    category: $("category").value, location: $("location").value.trim(),
    description: $("description").value.trim(), email: user.email,
    date: new Date().toLocaleDateString("en-IN"), status: "Pending"
  };
  items.push(complaint); saveComplaints(items); $("complaintForm").reset();
  setMessage("complaintMessage", "Complaint submitted successfully. Your ID is " + complaint.id);
  renderCitizen();
});
$("statusFilter").addEventListener("change", renderAdmin);
$("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem(USER_KEY);
  $("loginView").classList.remove("hidden");
  $("citizenView").classList.add("hidden");
  $("adminView").classList.add("hidden");
  $("logoutBtn").classList.add("hidden");
  $("loginForm").reset(); setMessage("loginMessage", "");
});
const savedUser = currentUser();
if (savedUser) showView(savedUser.role, savedUser.email);
