// Simple in-memory data
const state = {
  children: [
    {
      id: 1,
      name: "Aarav Sharma",
      program: "Nursery",
      parent: "Rohan Sharma",
      phone: "9876543210",
    },
    {
      id: 2,
      name: "Diya Mehta",
      program: "LKG",
      parent: "Nidhi Mehta",
      phone: "9876501234",
    },
    {
      id: 3,
      name: "Ishaan Rao",
      program: "UKG",
      parent: "Vikram Rao",
      phone: "9811112233",
    },
  ],
  attendance: {}, // key: date -> { childId: { inTime, outTime } }
  feeds: [],
  ptms: [],
  lms: [],
  leads: [],
  invoices: [],
  reports: [],
  contacts: [
    {
      name: "Harish S",
      role: "Founder",
      dept: "Leadership",
      phone: "7411994342",
      email: "abc.com",
    },
  ],
};

// Helpers
const todayKey = () => new Date().toISOString().slice(0, 10);

function ensureAttendanceDate(dateKey) {
  if (!state.attendance[dateKey]) {
    state.attendance[dateKey] = {};
  }
}

// Navigation
document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".nav-item")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const target = btn.dataset.target;
    document
      .querySelectorAll(".view")
      .forEach((v) => v.classList.remove("view-active"));
    document.getElementById(target).classList.add("view-active");
  });
});

// Allow jump buttons
document.querySelectorAll("[data-jump]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;
    const nav = document.querySelector(`.nav-item[data-target="${target}"]`);
    nav?.click();
  });
});

// Initialize selects with children
function populateChildSelects() {
  const ids = ["ptmChild", "lmsChild", "billChild", "rcChild"];
  ids.forEach((id) => {
    const sel = document.getElementById(id);
    sel.innerHTML = "";
    state.children.forEach((c) => {
      const o = document.createElement("option");
      o.value = c.id;
      o.textContent = `${c.name} (${c.program})`;
      sel.appendChild(o);
    });
  });
}

// Attendance table
function renderAttendance() {
  const date = document.getElementById("attDate").value || todayKey();
  ensureAttendanceDate(date);
  const programFilter = document.getElementById("attProgramFilter").value;
  const tbody = document.getElementById("attendanceTable").querySelector("tbody");
  tbody.innerHTML = "";

  state.children
    .filter(
      (c) => programFilter === "ALL" || c.program === programFilter
    )
    .forEach((child) => {
      const row = document.createElement("tr");
      const record = state.attendance[date][child.id] || {};

      row.innerHTML = `
        <td>${child.name}</td>
        <td>${child.program}</td>
        <td>
          <span class="chip ${
            record.inTime ? "chip-success" : "chip-warning"
          }">
            ${record.inTime ? "Present" : "Not In"}
          </span>
        </td>
        <td>
          <button class="btn ghost small" data-action="checkin">Check-in</button>
          <span style="font-size:11px;color:#9ca3af;margin-left:4px;">
            ${record.inTime || "--"}
          </span>
        </td>
        <td>
          <button class="btn ghost small" data-action="checkout">Check-out</button>
          <span style="font-size:11px;color:#9ca3af;margin-left:4px;">
            ${record.outTime || "--"}
          </span>
        </td>
      `;

      row
        .querySelector('[data-action="checkin"]')
        .addEventListener("click", () => {
          const now = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          ensureAttendanceDate(date);
          if (!state.attendance[date][child.id]) {
            state.attendance[date][child.id] = {};
          }
          state.attendance[date][child.id].inTime = now;
          renderAttendance();
          renderDashboard();
        });

      row
        .querySelector('[data-action="checkout"]')
        .addEventListener("click", () => {
          const now = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          ensureAttendanceDate(date);
          if (!state.attendance[date][child.id]) {
            state.attendance[date][child.id] = {};
          }
          state.attendance[date][child.id].outTime = now;
          renderAttendance();
          renderDashboard();
        });

      tbody.appendChild(row);
    });
}

// Dashboard
function renderDashboard() {
  const date = todayKey();
  ensureAttendanceDate(date);
  const records = state.attendance[date];
  const total = state.children.length;
  const presentCount = Object.values(records).filter((r) => r.inTime).length;
  document.getElementById(
    "kpiAttendance"
  ).textContent = `${presentCount} / ${total}`;

  const pending = state.invoices
    .filter((i) => !i.paid)
    .reduce((sum, i) => sum + i.amount, 0);
  document.getElementById("kpiPendingFees").textContent = `₹${pending}`;

  const leadsOpen = state.leads.filter(
    (l) => l.stage !== "Joined" && l.stage !== "Lost"
  ).length;
  document.getElementById("kpiLeads").textContent = String(leadsOpen);

  // classroom table
  const tbody = document
    .getElementById("dashboardClassTable")
    .querySelector("tbody");
  tbody.innerHTML = "";
  state.children.forEach((child) => {
    const rec = records[child.id] || {};
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${child.name}</td>
      <td>${child.program}</td>
      <td>
        <span class="chip ${
          rec.inTime ? "chip-success" : "chip-warning"
        }">${rec.inTime ? "Present" : "Not In"}</span>
      </td>
      <td>${rec.inTime || "--"}</td>
      <td>${rec.outTime || "--"}</td>
    `;
    tbody.appendChild(tr);
  });

  // dashboard feed snippet
  const feedContainer = document.getElementById("dashboardFeed");
  feedContainer.innerHTML = "";
  state.feeds
    .slice()
    .reverse()
    .slice(0, 4)
    .forEach((f) => {
      const card = document.createElement("div");
      card.className = "feed-card";
      card.innerHTML = `
        <div class="feed-card-title">${f.title}</div>
        <div class="feed-card-meta">${f.program} • ${f.date}</div>
        <div class="feed-card-body">${f.text}</div>
      `;
      feedContainer.appendChild(card);
    });
}

// Feed
function renderFeed() {
  const container = document.getElementById("feedTimeline");
  container.innerHTML = "";
  state.feeds
    .slice()
    .reverse()
    .forEach((f) => {
      const card = document.createElement("div");
      card.className = "feed-card";
      card.innerHTML = `
        <div class="feed-card-title">${f.title}</div>
        <div class="feed-card-meta">${f.program} • ${f.date}</div>
        <div class="feed-card-body">${f.text}</div>
        ${
          f.media
            ? `<div style="margin-top:6px;font-size:11px;color:#60a5fa;">Media: ${f.media}</div>`
            : ""
        }
      `;
      container.appendChild(card);
    });
}

// PTM
function renderPtms() {
  const list = document.getElementById("ptmList");
  list.innerHTML = "";
  state.ptms
    .slice()
    .reverse()
    .forEach((p) => {
      const child = state.children.find((c) => c.id === p.childId);
      const div = document.createElement("div");
      div.className = "feed-card";
      div.innerHTML = `
        <div class="feed-card-title">${child?.name || "Child"}</div>
        <div class="feed-card-meta">${p.dateTime} • ${p.mode}</div>
        <div class="feed-card-body">${p.agenda}</div>
      `;
      list.appendChild(div);
    });
}

// LMS
function renderLms() {
  const list = document.getElementById("lmsList");
  list.innerHTML = "";
  state.lms
    .slice()
    .reverse()
    .forEach((m) => {
      const child = state.children.find((c) => c.id === m.childId);
      const div = document.createElement("div");
      div.className = "feed-card";
      div.innerHTML = `
        <div class="feed-card-title">${child?.name || "Child"} • ${
        m.domain
      }</div>
        <div class="feed-card-meta">${m.level} • ${m.date}</div>
        <div class="feed-card-body">${m.note}</div>
      `;
      list.appendChild(div);
    });
}

// Leads
function renderLeads() {
  const tbody = document.getElementById("leadTable").querySelector("tbody");
  tbody.innerHTML = "";
  state.leads.forEach((l) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${l.childName}</td>
      <td>${l.parentName}</td>
      <td>${l.program}</td>
      <td>${l.stage}</td>
      <td>${l.expectedJoin || "--"}</td>
      <td>
        <button class="btn ghost small" data-action="advance">Next Stage</button>
      </td>
    `;
    tr.querySelector('[data-action="advance"]').addEventListener("click", () => {
      const stages = ["New", "Follow-up", "Visit Done", "Offered", "Joined"];
      const idx = stages.indexOf(l.stage);
      l.stage = stages[Math.min(idx + 1, stages.length - 1)];
      renderLeads();
      renderDashboard();
    });
    tbody.appendChild(tr);
  });
}

// Invoices
function renderInvoices() {
  const tbody = document.getElementById("invoiceTable").querySelector("tbody");
  tbody.innerHTML = "";
  state.invoices.forEach((inv) => {
    const child = state.children.find((c) => c.id === inv.childId);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${child?.name || "Child"}</td>
      <td>${inv.label}</td>
      <td>₹${inv.amount}</td>
      <td>${inv.due}</td>
      <td>
        <span class="chip ${inv.paid ? "chip-success" : "chip-danger"}">
          ${inv.paid ? "Paid" : "Pending"}
        </span>
      </td>
      <td>
        ${
          inv.paid
            ? "-"
            : '<button class="btn primary small" data-action="markPaid">Mark Paid</button>'
        }
      </td>
    `;
    if (!inv.paid) {
      tr
        .querySelector('[data-action="markPaid"]')
        .addEventListener("click", () => {
          inv.paid = true;
          renderInvoices();
          renderDashboard();
        });
    }
    tbody.appendChild(tr);
  });
}

// Reports
function renderReports() {
  const list = document.getElementById("rcList");
  list.innerHTML = "";
  state.reports
    .slice()
    .reverse()
    .forEach((r) => {
      const child = state.children.find((c) => c.id === r.childId);
      const div = document.createElement("div");
      div.className = "feed-card";
      div.innerHTML = `
        <div class="feed-card-title">${child?.name || "Child"} • ${r.term}</div>
        <div class="feed-card-meta">Highlights: ${r.highlights}</div>
        <div class="feed-card-body">${r.remarks}</div>
      `;
      list.appendChild(div);
    });
}

// Contacts
function renderContacts() {
  const grid = document.getElementById("contactsGrid");
  grid.innerHTML = "";
  state.contacts.forEach((c) => {
    const div = document.createElement("div");
    div.className = "contact-card";
    div.innerHTML = `
      <div class="contact-name">${c.name}</div>
      <div class="contact-role">${c.role} • ${c.dept}</div>
      <div class="contact-meta">📞 ${c.phone}</div>
      <div class="contact-meta">✉️ ${c.email}</div>
    `;
    grid.appendChild(div);
  });
}

// Modals: Add Child
const childModal = document.getElementById("childModal");
document
  .getElementById("quickAddChildBtn")
  .addEventListener("click", () => childModal.classList.add("show"));
document
  .getElementById("closeChildModal")
  .addEventListener("click", () => childModal.classList.remove("show"));

document.getElementById("saveChildBtn").addEventListener("click", () => {
  const name = document.getElementById("childName").value.trim();
  const program = document.getElementById("childProgram").value;
  const parent = document.getElementById("childParent").value.trim();
  const phone = document.getElementById("childPhone").value.trim();
  if (!name) return;
  const id =
    state.children.length === 0
      ? 1
      : Math.max(...state.children.map((c) => c.id)) + 1;
  state.children.push({ id, name, program, parent, phone });
  document.getElementById("childName").value = "";
  document.getElementById("childParent").value = "";
  document.getElementById("childPhone").value = "";
  childModal.classList.remove("show");
  populateChildSelects();
  renderAttendance();
  renderDashboard();
});

// Feed events
document.getElementById("postFeedBtn").addEventListener("click", () => {
  const title = document.getElementById("feedTitle").value.trim();
  if (!title) return;
  state.feeds.push({
    title,
    program: document.getElementById("feedProgram").value,
    text: document.getElementById("feedText").value.trim(),
    media: document.getElementById("feedMediaUrl").value.trim(),
    date: todayKey(),
  });
  document.getElementById("feedTitle").value = "";
  document.getElementById("feedText").value = "";
  document.getElementById("feedMediaUrl").value = "";
  renderFeed();
  renderDashboard();
});

// PTM events
document.getElementById("savePtmBtn").addEventListener("click", () => {
  if (!state.children.length) return;
  state.ptms.push({
    childId: Number(document.getElementById("ptmChild").value),
    dateTime: document.getElementById("ptmDateTime").value,
    mode: document.getElementById("ptmMode").value,
    agenda: document.getElementById("ptmAgenda").value.trim(),
  });
  document.getElementById("ptmAgenda").value = "";
  renderPtms();
});

// LMS events
document.getElementById("saveLmsBtn").addEventListener("click", () => {
  state.lms.push({
    childId: Number(document.getElementById("lmsChild").value),
    domain: document.getElementById("lmsDomain").value,
    note: document.getElementById("lmsNote").value.trim(),
    level: document.getElementById("lmsLevel").value,
    date: todayKey(),
  });
  document.getElementById("lmsNote").value = "";
  renderLms();
});

// Leads
document.getElementById("addLeadBtn").addEventListener("click", () => {
  const name = prompt("Child name?");
  if (!name) return;
  const parent = prompt("Parent name?");
  const program = prompt("Program (Nursery/LKG/UKG)?") || "Nursery";
  const expectedJoin = prompt("Expected joining date (YYYY-MM-DD)?") || "";
  state.leads.push({
    childName: name,
    parentName: parent || "",
    program,
    stage: "New",
    expectedJoin,
  });
  renderLeads();
  renderDashboard();
});

// Billing
document.getElementById("createInvoiceBtn").addEventListener("click", () => {
  if (!state.children.length) return;
  const childId = Number(document.getElementById("billChild").value);
  const amount = Number(document.getElementById("billAmount").value || 0);
  if (!amount) return;
  const label =
    document.getElementById("billLabel").value || "Fee Invoice";
  const due = document.getElementById("billDue").value || todayKey();
  state.invoices.push({ childId, amount, label, due, paid: false });
  document.getElementById("billAmount").value = "";
  document.getElementById("billLabel").value = "";
  renderInvoices();
  renderDashboard();
});

// Reports
document.getElementById("createRcBtn").addEventListener("click", () => {
  if (!state.children.length) return;
  state.reports.push({
    childId: Number(document.getElementById("rcChild").value),
    term: document.getElementById("rcTerm").value,
    highlights: document.getElementById("rcHighlights").value.trim(),
    remarks: document.getElementById("rcRemarks").value.trim(),
  });
  document.getElementById("rcHighlights").value = "";
  document.getElementById("rcRemarks").value = "";
  renderReports();
});

// Contacts
document.getElementById("addContactBtn").addEventListener("click", () => {
  const name = prompt("Name?");
  if (!name) return;
  const role = prompt("Role? (e.g., Teacher, Transport)") || "Staff";
  const dept = prompt("Department?") || "General";
  const phone = prompt("Phone?") || "";
  const email = prompt("Email?") || "";
  state.contacts.push({ name, role, dept, phone, email });
  renderContacts();
});

// Attendance controls
document
  .getElementById("markAllPresentBtn")
  .addEventListener("click", () => {
    const date = document.getElementById("attDate").value || todayKey();
    ensureAttendanceDate(date);
    state.children.forEach((c) => {
      if (!state.attendance[date][c.id]) {
        state.attendance[date][c.id] = {};
      }
      state.attendance[date][c.id].inTime =
        state.attendance[date][c.id].inTime ||
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
    });
    renderAttendance();
    renderDashboard();
  });

document.getElementById("attDate").value = todayKey();
document
  .getElementById("attDate")
  .addEventListener("change", renderAttendance);
document
  .getElementById("attProgramFilter")
  .addEventListener("change", renderAttendance);

// Init
populateChildSelects();
renderAttendance();
renderFeed();
renderPtms();
renderLms();
renderLeads();
renderInvoices();
renderReports();
renderContacts();
renderDashboard();
