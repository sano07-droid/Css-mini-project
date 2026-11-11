// script.js - logic for the Subject Allocation for College Faculty website
// Works with index.html (the plain HTML version). No CSS needed.

const KEY = "subject_allocation_data";
const PASSWORDS = {
  "Administrator": "admin123",
  "Head of Department (HOD)": "hod123",
  "Faculty Member": "faculty123"
};

const seed = {
  faculty: [
    { id: "F101", name: "Dr. Meera Nair", spec: ["Databases", "Software Engineering"], max: 16, avail: "Mon-Fri", active: true },
    { id: "F102", name: "Prof. Arjun Rao", spec: ["Networks", "Operating Systems"], max: 14, avail: "Mon-Thu", active: true },
    { id: "F103", name: "Dr. Kavya Iyer", spec: ["Web Technologies", "Software Engineering"], max: 16, avail: "Mon-Fri", active: true },
    { id: "F104", name: "Prof. Sameer Khan", spec: ["Algorithms", "Mathematics"], max: 12, avail: "Tue-Fri", active: true }
  ],
  subjects: [
    { code: "CS301", title: "Database Management Systems", sem: 5, credits: 4, hours: 5, area: "Databases" },
    { code: "CS302", title: "Computer Networks", sem: 5, credits: 3, hours: 4, area: "Networks" },
    { code: "CS303", title: "Software Development Practices", sem: 5, credits: 3, hours: 4, area: "Software Engineering" },
    { code: "CS304", title: "Web Technologies", sem: 5, credits: 3, hours: 4, area: "Web Technologies" },
    { code: "CS305", title: "Design and Analysis of Algorithms", sem: 5, credits: 4, hours: 5, area: "Algorithms" }
  ],
  alloc: [
    { sub: "CS301", fac: "F101" },
    { sub: "CS302", fac: "F102" },
    { sub: "CS303", fac: "F101" },
    { sub: "CS304", fac: "F103" },
    { sub: "CS305", fac: "F104" }
  ]
};

let data;
try {
  data = JSON.parse(localStorage.getItem(KEY)) || JSON.parse(JSON.stringify(seed));
} catch (e) {
  data = JSON.parse(JSON.stringify(seed));
}
let currentRole = null;

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
}
function $(sel) { return document.querySelector(sel); }
function esc(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}
function getSubject(code) { return data.subjects.find(function (s) { return s.code === code; }); }
function getFaculty(id) { return data.faculty.find(function (f) { return f.id === id; }); }
function loadOf(id) {
  return data.alloc
    .filter(function (a) { return a.fac === id; })
    .reduce(function (t, a) { return t + (getSubject(a.sub) ? getSubject(a.sub).hours : 0); }, 0);
}
function matches(f, s) {
  return f.spec.some(function (x) { return x.toLowerCase() === s.area.toLowerCase(); });
}

// Only the right role can use each form
function allowed(role) {
  if (!currentRole) { alert("Please log in first."); return false; }
  if (currentRole !== role) {
    alert("Only the " + role + " can do this. You are logged in as " + currentRole + ".");
    return false;
  }
  return true;
}

// ---------- Rendering ----------
function renderFaculty() {
  var rows = '<tr><th>ID</th><th>Name</th><th>Specialization</th><th>Max hours</th><th>Availability</th><th>Status</th><th>Action</th></tr>';
  data.faculty.forEach(function (f) {
    rows += "<tr><td>" + esc(f.id) + "</td><td>" + esc(f.name) + "</td><td>" + esc(f.spec.join(", ")) +
      "</td><td>" + f.max + "</td><td>" + esc(f.avail) + "</td><td>" + (f.active ? "Active" : "Inactive") +
      '</td><td><button type="button" data-toggle="' + esc(f.id) + '">' + (f.active ? "Deactivate" : "Reactivate") + "</button></td></tr>";
  });
  $("#faculty table").innerHTML = rows;
}

function renderSubjects() {
  var rows = "<tr><th>Code</th><th>Title</th><th>Semester</th><th>Credits</th><th>Hours per week</th><th>Specialization needed</th></tr>";
  data.subjects.forEach(function (s) {
    rows += "<tr><td>" + esc(s.code) + "</td><td>" + esc(s.title) + "</td><td>" + s.sem + "</td><td>" + s.credits +
      "</td><td>" + s.hours + "</td><td>" + esc(s.area) + "</td></tr>";
  });
  $("#subjects table").innerHTML = rows;
}

function renderAllocation() {
  var subSel = $("#asub"), facSel = $("#afac");
  subSel.innerHTML = data.subjects.map(function (s) {
    return '<option value="' + esc(s.code) + '">' + esc(s.code + " " + s.title) + "</option>";
  }).join("");
  facSel.innerHTML = data.faculty.filter(function (f) { return f.active; }).map(function (f) {
    return '<option value="' + esc(f.id) + '">' + esc(f.id + " " + f.name) + "</option>";
  }).join("");

  var rows = "<tr><th>Subject</th><th>Allocated to</th><th>Hours</th><th>Action</th></tr>";
  data.alloc.forEach(function (a) {
    var s = getSubject(a.sub), f = getFaculty(a.fac);
    rows += "<tr><td>" + esc(s.code + " " + s.title) + "</td><td>" + esc(f.name) + "</td><td>" + s.hours +
      '</td><td><button type="button" data-remove="' + esc(s.code) + '">Remove</button></td></tr>';
  });
  data.subjects.forEach(function (s) {
    if (!data.alloc.some(function (a) { return a.sub === s.code; })) {
      rows += "<tr><td>" + esc(s.code + " " + s.title) + "</td><td><i>Not allocated yet</i></td><td>" + s.hours + "</td><td></td></tr>";
    }
  });
  $("#allocation table").innerHTML = rows;
}

function renderWorkload() {
  var rows = "<tr><th>Faculty</th><th>Assigned hours</th><th>Limit</th><th>Load</th><th>Review</th></tr>";
  data.faculty.filter(function (f) { return f.active; }).forEach(function (f) {
    var l = loadOf(f.id);
    var review = l > f.max ? "Over-allocated" : (l < f.max * 0.5 ? "Under-allocated" : "Balanced");
    rows += "<tr><td>" + esc(f.name) + "</td><td>" + l + "</td><td>" + f.max + '</td><td><progress value="' + l +
      '" max="' + f.max + '">' + l + " of " + f.max + "</progress></td><td>" + review + "</td></tr>";
  });
  $("#workload table").innerHTML = rows;
}

function renderReports() {
  var rows = "<tr><th>Faculty</th><th>Subjects</th><th>Total hours</th></tr>";
  data.faculty.filter(function (f) { return f.active; }).forEach(function (f) {
    var subs = data.alloc.filter(function (a) { return a.fac === f.id; }).map(function (a) { return a.sub; });
    rows += "<tr><td>" + esc(f.name) + "</td><td>" + (subs.join(", ") || "None") + "</td><td>" + loadOf(f.id) + "</td></tr>";
  });
  $("#reports table").innerHTML = rows;
}

function renderAll() {
  renderFaculty(); renderSubjects(); renderAllocation(); renderWorkload(); renderReports();
}

// ---------- Login ----------
$("#login form").addEventListener("submit", function (e) {
  e.preventDefault();
  var role = $("#role").value;
  if ($("#pw").value !== PASSWORDS[role]) {
    alert("Wrong password for this role. Demo passwords: admin123, hod123, faculty123.");
    return;
  }
  currentRole = role;
  var status = $("#login-status");
  if (!status) {
    status = document.createElement("p");
    status.id = "login-status";
    $("#login form").after(status);
  }
  status.innerHTML = "Logged in as <b>" + esc(role) + '</b>. <button type="button" id="logout">Log out</button>';
  $("#logout").onclick = function () {
    currentRole = null;
    status.innerHTML = "You are logged out.";
    $("#pw").value = "";
  };
  $("#pw").value = "";
});

// ---------- Faculty (Administrator) ----------
$("#faculty form").addEventListener("submit", function (e) {
  e.preventDefault();
  if (!allowed("Administrator")) return;
  var id = $("#fid").value.trim(), name = $("#fname").value.trim();
  if (!id || !name) { alert("Enter a faculty ID and name."); return; }
  if (getFaculty(id)) { alert("That faculty ID already exists."); return; }
  data.faculty.push({
    id: id,
    name: name,
    spec: $("#fspec").value.split(",").map(function (x) { return x.trim(); }).filter(Boolean),
    max: Number($("#fmax").value) || 14,
    avail: $("#favail").value,
    active: true
  });
  save(); renderAll(); this.reset();
});

$("#faculty table").addEventListener("click", function (e) {
  var id = e.target.getAttribute("data-toggle");
  if (!id) return;
  if (!allowed("Administrator")) return;
  var f = getFaculty(id);
  f.active = !f.active;
  save(); renderAll();
});

// ---------- Subjects (Administrator) ----------
// The form in the HTML has no specialization box, so add one here.
if (!$("#sspec")) {
  var p = document.createElement("p");
  p.innerHTML = '<label for="sspec">Specialization needed: </label><input type="text" id="sspec">';
  $("#subjects form button[type=submit]").parentElement.before(p);
}

$("#subjects form").addEventListener("submit", function (e) {
  e.preventDefault();
  if (!allowed("Administrator")) return;
  var code = $("#scode").value.trim(), title = $("#stitle").value.trim();
  if (!code || !title) { alert("Enter a subject code and title."); return; }
  if (getSubject(code)) { alert("That subject code already exists."); return; }
  data.subjects.push({
    code: code,
    title: title,
    sem: Number($("#ssem").value),
    credits: Number($("#scred").value),
    hours: Number($("#shrs").value) || 1,
    area: $("#sspec").value.trim()
  });
  save(); renderAll(); this.reset();
});

// ---------- Allocation (HOD) ----------
$("#allocation form").addEventListener("submit", function (e) {
  e.preventDefault();
  if (!allowed("Head of Department (HOD)")) return;
  var s = getSubject($("#asub").value), f = getFaculty($("#afac").value);
  if (!s || !f) { alert("Choose a subject and a faculty member."); return; }

  if (data.alloc.some(function (a) { return a.sub === s.code && a.fac === f.id; })) {
    alert("Duplicate assignment: " + f.name + " already has " + s.code + "."); return;
  }
  // If the subject is already allocated to someone else, this reassigns it.
  var others = data.alloc.filter(function (a) { return a.sub !== s.code; });
  var newLoad = others.filter(function (a) { return a.fac === f.id; })
    .reduce(function (t, a) { return t + getSubject(a.sub).hours; }, 0) + s.hours;
  if (newLoad > f.max) {
    alert("Workload limit exceeded: " + f.name + " would have " + newLoad + " hours, but the limit is " + f.max + ".");
    return;
  }
  if (!matches(f, s) && !confirm(f.name + " has no specialization match for " + s.code + ". Approve as an exception?")) return;

  data.alloc = others;
  data.alloc.push({ sub: s.code, fac: f.id });
  save(); renderAll();
});

$("#allocation table").addEventListener("click", function (e) {
  var code = e.target.getAttribute("data-remove");
  if (!code) return;
  if (!allowed("Head of Department (HOD)")) return;
  data.alloc = data.alloc.filter(function (a) { return a.sub !== code; });
  save(); renderAll();
});

renderAll();
