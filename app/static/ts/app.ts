const KEY = "vines-club-hub-v1";
const starter = {
  departments: [
    {
      name: "Marketing",
      head: "",
      description: "Campaigns, promotion and audience growth.",
    },
    {
      name: "HR",
      head: "",
      description: "Recruitment, onboarding and member care.",
    },
    {
      name: "PR",
      head: "",
      description: "University, guest and partner relations.",
    },
    {
      name: "Editing",
      head: "",
      description: "Editing guidance, feedback and quality.",
    },
    {
      name: "Designing",
      head: "",
      description: "Visual identity, thumbnails and graphics.",
    },
    {
      name: "Videography",
      head: "",
      description: "Camera, lighting, sound and filming.",
    },
    {
      name: "Educational",
      head: "",
      description: "Workshop planning and learning.",
    },
    {
      name: "Actors",
      head: "",
      description: "On-camera talent and performance.",
    },
    {
      name: "Researchers",
      head: "",
      description: "Research, scripts and fact checking.",
    },
    {
      name: "OC",
      head: "",
      description: "Event logistics and club operations.",
    },
  ],
  projects: [
    {
      name: "Podcasts",
      lead: "",
      description: "Conversations worth listening to.",
    },
    { name: "Workshops", lead: "", description: "Learn it, try it, teach it." },
    {
      name: "Game Show",
      lead: "",
      description: "Big energy, friendly competition.",
    },
    {
      name: "Reels",
      lead: "",
      description: "Short stories with a quick spark.",
    },
    {
      name: "Sarcastic Shows",
      lead: "",
      description: "Satire and campus stories.",
    },
  ],
  members: [],
  tasks: [],
};
function load() {
  try {
    let old = JSON.parse(localStorage.getItem(KEY) || "{}");
    let members = old.members || [],
      tasks = old.tasks || [];
    let departments = (old.departments || []).map((d) =>
      typeof d === "string" ? { name: d, head: "" } : d,
    );
    let projects = (old.projects || []).map((p) =>
      typeof p === "string" ? { name: p, lead: "" } : p,
    );
    if (!members.length && !tasks.length) {
      departments = departments.filter(
        (d) => !["Editors", "HR", "PR", "Videography"].includes(d.name),
      );
      projects = projects.filter(
        (p) => !["Reels", "Podcasts", "Filmmaking"].includes(p.name),
      );
    }
    for (const d of starter.departments)
      if (!departments.some((x) => x.name === d.name)) departments.push(d);
    for (const p of starter.projects)
      if (!projects.some((x) => x.name === p.name)) projects.push(p);
    return {
      departments,
      projects,
      members: members.map((m) => ({
        ...m,
        projects: m.projects || [],
        email: m.email || "",
        department: m.department || "",
        clubRole: m.clubRole || "Member",
      })),
      tasks: tasks.map((t) => ({
        ...t,
        description: t.description || "",
        status: t.status || "To do",
        priority: t.priority || "Medium",
        update: t.update || "",
        updates: t.updates || [],
      })),
    };
  } catch {
    return structuredClone(starter);
  }
}
let db = load(),
  role = "System admin access",
  selectedPerson = "";
const $ = (id: string): any => document.getElementById(id) as any;
function save() {
  localStorage.setItem(KEY, JSON.stringify(db));
  render();
}
function esc(x = "") {
  return String(x).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function person(id) {
  return db.members.find((m) => m.id === id);
}
function personName(id) {
  return person(id)?.name || "Unassigned";
}
function deptsOf(m) {
  return m.departments || [m.department].filter(Boolean);
}
function memberRoles(m) {
  let labels = [];
  if (["President", "Vice President"].includes(m.clubRole))
    labels.push(m.clubRole);
  if (m.extraRole) labels.push(m.extraRole);
  if (m.clubRole === "Department Head" || m.clubRole === "Head")
    db.departments
      .filter((d) => d.head === m.id)
      .forEach((d) => labels.push(`${d.name} Head`));
  if (m.clubRole === "Project Head" || m.clubRole === "Project lead")
    db.projects
      .filter((p) => p.lead === m.id)
      .forEach((p) => labels.push(`${p.name} Project Head`));
  return labels.length ? labels : ["Member"];
}
function isAdmin() {
  return role === "System admin access";
}
function isExecutive() {
  return ["President", "Vice President"].includes(role);
}
function scope() {
  return selectedPerson || db.members[0]?.id || "";
}
function uid() {
  return crypto.randomUUID();
}
function initials(s = "?") {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
function statusClass(s) {
  return s === "Done"
    ? "done"
    : s === "In review"
      ? "review"
      : s === "In progress"
        ? "progress"
        : "todo";
}
function badge(s) {
  return `<span class="badge ${statusClass(s)}">${esc(s || "To do")}</span>`;
}
function options(list, selected = "") {
  return list
    .map(
      (v) =>
        `<option value="${esc(v)}" ${v === selected ? "selected" : ""}>${esc(v)}</option>`,
    )
    .join("");
}
function fill(id, list, first) {
  $(id).innerHTML =
    `<option value="">${first}</option>` +
    list.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
}
function isHeadRole() {
  return (
    role === "Head" ||
    role === "Department Head" ||
    role === "Project Head" ||
    role === "Department head" ||
    role === "Project lead"
  );
}
function allowedMembers() {
  if (isAdmin() || isExecutive()) return db.members;
  if (isHeadRole()) {
    let ds = db.departments
        .filter((d) => d.head === scope())
        .map((d) => d.name),
      ps = db.projects.filter((p) => p.lead === scope()).map((p) => p.name);
    return db.members.filter(
      (m) =>
        deptsOf(m).some((d) => ds.includes(d)) ||
        m.projects.some((p) => ps.includes(p)),
    );
  }
  return db.members.filter((m) => m.id === scope());
}
function allowedTasks() {
  let ids = allowedMembers().map((m) => m.id);
  if (isAdmin() || isExecutive()) return db.tasks;
  if (
    role === "Head" ||
    role === "Department Head" ||
    role === "Department head"
  ) {
    return db.tasks.filter(
      (t) => ids.includes(t.assignee) || t.assigner === scope(),
    );
  }
  if (role === "Project Head" || role === "Project lead") {
    let ps = db.projects.filter((p) => p.lead === scope()).map((p) => p.name);
    return db.tasks.filter((t) => ps.includes(t.project));
  }
  let assignedProjects = person(scope())?.projects || [];
  return db.tasks.filter(
    (t) => !!t.project && assignedProjects.includes(t.project),
  );
}
function canManageMember(m) {
  if (isAdmin()) return true;
  let ds = db.departments.filter((d) => d.head === scope()).map((d) => d.name),
    ps = db.projects.filter((p) => p.lead === scope()).map((p) => p.name);
  return (
    deptsOf(m).some((d) => ds.includes(d)) ||
    m.projects.some((p) => ps.includes(p))
  );
}
function canAssignTo(m) {
  return canManageMember(m);
}
function allowedProjects() {
  if (isAdmin() || isExecutive()) return db.projects;
  if (role === "Project Head" || role === "Project lead")
    return db.projects.filter((p) => p.lead === scope());
  if (isHeadRole()) {
    let ds = db.departments
      .filter((d) => d.head === scope())
      .map((d) => d.name);
    return db.projects.filter((p) =>
      db.members.some(
        (m) =>
          deptsOf(m).some((d) => ds.includes(d)) && m.projects.includes(p.name),
      ),
    );
  }
  return db.projects.filter((p) => person(scope())?.projects.includes(p.name));
}
function show(view) {
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.toggle("active", v.id === view));
  document
    .querySelectorAll<HTMLButtonElement>(".nav button")
    .forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  $("pageTitle").textContent =
    {
      home: "Overview",
      members: "Members",
      tasks: "Tasks",
      structure: "Departments & projects",
    }[view] || "Overview";
}
document
  .querySelectorAll<HTMLButtonElement>(".nav button")
  .forEach((b) => (b.onclick = () => show(b.dataset.view)));
document
  .querySelectorAll<HTMLElement>("[data-go]")
  .forEach((b) => (b.onclick = () => show(b.dataset.go)));
$("roleSelect").onchange = (e) => {
  role = e.target.value;
  selectedPerson = "";
  render();
};
$("personSelect").onchange = (e) => {
  selectedPerson = e.target.value;
  render();
};
function render() {
  const choices =
    role === "Head" || role === "Department Head" || role === "Department head"
      ? db.departments
          .filter((d) => d.head)
          .map((d) => person(d.head))
          .filter(Boolean)
      : role === "Project Head" || role === "Project lead"
        ? db.projects
            .filter((d) => d.lead)
            .map((d) => person(d.lead))
            .filter(Boolean)
        : db.members;
  $("personSelect").classList.toggle("hidden", isAdmin());
  $("personSelect").innerHTML =
    [
      ...new Map<string, any>(
        choices.map((m) => [m.id, m] as [string, any]),
      ).values(),
    ]
      .map(
        (m) =>
          `<option value="${m.id}" ${m.id === scope() ? "selected" : ""}>${esc(m.name)}</option>`,
      )
      .join("") || '<option value="">No people assigned yet</option>';
  fill(
    "memberDeptFilter",
    db.departments.map((d) => d.name),
    "All departments",
  );
  fill(
    "memberProjectFilter",
    db.projects.map((p) => p.name),
    "All projects",
  );
  fill(
    "taskProjectFilter",
    allowedProjects().map((p) => p.name),
    "All projects",
  );
  let members = db.members
    .map((m) => `<option value="${m.id}">${esc(m.name)}</option>`)
    .join("");
  $("deptHead").innerHTML =
    '<option value="">Choose a member</option>' + members;
  $("projectLead").innerHTML =
    '<option value="">Choose a member</option>' + members;
  const leader = isAdmin() || isExecutive() || isHeadRole();
  $("addMemberBtn").classList.toggle("hidden", !isAdmin());
  $("importMembersBtn").classList.toggle("hidden", !isAdmin());
  $("addDept").closest(".form").classList.toggle("hidden", !isAdmin());
  $("addProject").closest(".form").classList.toggle("hidden", !isAdmin());
  $("addTaskBtn").classList.toggle("hidden", !leader);
  renderHome();
  renderMembers();
  renderTasks();
  renderStructure();
}
$("importMembersBtn").onclick = () => {
  if (isAdmin()) $("memberCsv").click();
};
$("memberCsv").onchange = (e) => {
  importMembersCsv(e.target.files[0]);
  e.target.value = "";
};
function renderHome() {
  let ms = allowedMembers(),
    ts = allowedTasks(),
    open = ts.filter((t) => t.status !== "Done"),
    late = open.filter(
      (t) => t.due && t.due < new Date().toISOString().slice(0, 10),
    );
  let soon = open.filter(
    (t) =>
      t.due &&
      t.due <= new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
  );
  let total = db.members.length || 0;
  let fillPct = db.tasks.length
    ? Math.round(
        (db.tasks.filter((t) => t.status === "Done").length / db.tasks.length) *
          100,
      )
    : 0;
  $("stats").innerHTML = [
    ["People", isAdmin() ? total : ms.length, "♙", "in your view"],
    ["Open tasks", open.length, "✦", "still moving"],
    ["Due this week", soon.length, "◷", "next 7 days"],
    [
      "Done",
      db.tasks.filter((t) => t.status === "Done").length,
      "✓",
      `${fillPct}% complete`,
    ],
  ]
    .map(
      ([label, value, icon, foot]) =>
        `<div class="stat"><div class="stat-label"><span class="stat-ico">${icon}</span>${label}</div><strong>${value}</strong><div class="stat-foot">${foot}</div></div>`,
    )
    .join("");
  let upcoming = [...ts]
    .filter((t) => t.status !== "Done")
    .sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"))
    .slice(0, 5);
  $("homeTasks").innerHTML = upcoming.length
    ? upcoming
        .map(
          (t) =>
            `<div class="row"><div class="task-mini"><span class="task-marker ${t.due && t.due < new Date().toISOString().slice(0, 10) ? "late" : ""}"></span><div><div class="row-title">${esc(t.title)}</div><div class="row-sub">${esc(personName(t.assignee))} · ${esc(t.project || "Department task")}</div></div></div><div>${badge(t.status)}<div class="row-sub align-right">${t.due ? new Date(t.due + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "No due date"}</div></div></div>`,
        )
        .join("")
    : '<div class="empty"><strong>Your next story starts here.</strong>Assign the first task to bring it to life.</div>';
  $("structureSummary").textContent =
    `${db.departments.length} departments · ${db.projects.length} projects · ${total} people · ${fillPct}% of tasks done`;
  $("homeStructure").innerHTML = db.departments
    .slice(0, 5)
    .map(
      (d, i) =>
        `<div class="structure-row"><span class="structure-flower">${["🌱", "✳", "🎨", "🎥", "📚"][i % 5]}</span><div><strong>${esc(d.name)}</strong><small>${db.members.filter((m) => deptsOf(m).includes(d.name)).length} members · ${esc(personName(d.head))}</small></div></div>`,
    )
    .join("");
}
function renderMembers() {
  let q = $("memberSearch").value.toLowerCase(),
    df = $("memberDeptFilter").value,
    pf = $("memberProjectFilter").value;
  let list = allowedMembers().filter(
    (m) =>
      (!q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)) &&
      (!df || deptsOf(m).includes(df)) &&
      (!pf || m.projects.includes(pf)),
  );
  $("memberList").innerHTML =
    `<div class="member header"><span>Member</span><span>Departments</span><span>Projects</span><span>Positions</span><span></span></div>` +
    (list.length
      ? list
          .map(
            (m, i) =>
              `<div class="member"><div class="person"><span class="avatar c${(i % 4) + 1}">${initials(m.name)}</span><div><div class="row-title">${esc(m.name)}</div><div class="row-sub">${esc(m.email || "Club member")}${m.isClubAdmin ? " · System admin access" : ""}</div></div></div><div>${
                deptsOf(m).length
                  ? deptsOf(m)
                      .map((d) => `<span class="chip">${esc(d)}</span>`)
                      .join(" ")
                  : '<span class="quiet">No department</span>'
              }</div><div class="items">${m.projects.length ? m.projects.map((p) => `<span class="chip">${esc(p)}</span>`).join("") : '<span class="quiet">No project</span>'}</div><div>${memberRoles(
                m,
              )
                .map((r) => `<span class="badge role">${esc(r)}</span>`)
                .join(
                  " ",
                )}</div><div>${isAdmin() ? `<button class="btn ghost small" data-action="edit-member" data-id="${m.id}">Edit profile</button><button class="btn ghost small" data-action="toggle-system-access" data-id="${m.id}">${m.isClubAdmin ? "Revoke system access" : "Grant system access"}</button>` : canManageMember(m) ? `<button class="btn ghost small" data-action="assign-projects" data-id="${m.id}">Change assignments</button>` : ""}</div></div>`,
          )
          .join("")
      : '<div class="empty"><strong>No members in this view yet.</strong>Add your team one department at a time.</div>');
}
function renderTasks() {
  let q = $("taskSearch").value.toLowerCase(),
    sf = $("taskStatusFilter").value,
    pf = $("taskProjectFilter").value;
  let list = allowedTasks()
    .filter(
      (t) =>
        (!q ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)) &&
        (!sf || t.status === sf) &&
        (!pf || t.project === pf),
    )
    .sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
  $("taskList").innerHTML =
    `<div class="task header"><span>Task</span><span>Assignee</span><span>Project</span><span>Priority</span><span>Deadline</span><span>Status</span><span></span></div>` +
    (list.length
      ? list
          .map(
            (t) =>
              `<div class="task"><div><div class="row-title">${esc(t.title)}</div><div class="row-sub">${esc(t.description || "")} · assigned by ${esc(personName(t.assigner))}</div>${t.update ? `<div class="progress-update">↳ ${esc(t.update)}</div>` : ""}</div><div class="person"><span class="avatar c2">${initials(personName(t.assignee))}</span><span>${esc(personName(t.assignee))}</span></div><div>${esc(t.project || "Department task")}</div><div><span class="badge ${t.priority === "Urgent" ? "urgent" : t.priority === "High" ? "high" : ""}">${esc(t.priority)}</span></div><div>${t.due ? new Date(t.due + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "No deadline"}</div><div>${t.assignee === scope() || canAssignTo(person(t.assignee) || {}) ? `<select class="status-select" data-task-status="${t.id}">${options(["To do", "In progress", "In review", "Done"], t.status)}</select>` : badge(t.status)}</div><div><button class="btn ghost small" data-action="add-update" data-id="${t.id}">＋ Update</button></div></div>`,
          )
          .join("")
      : '<div class="empty"><strong>Nothing on the board.</strong>Tasks for your role will show up here.</div>');
}
function renderStructure() {
  let dlist =
    isAdmin() || isExecutive()
      ? db.departments
      : db.departments.filter((d) =>
          isHeadRole() ? d.head === scope() : true,
        );
  $("deptList").innerHTML = dlist
    .map(
      (d) =>
        `<div class="row"><div><div class="row-title">${esc(d.name)}</div><div class="row-sub">${db.members.filter((m) => m.department === d.name).length} people · Head: ${esc(personName(d.head))}</div></div>${isAdmin() || isExecutive() ? `<button class="btn ghost small" data-action="edit-lead" data-type="department" data-name="${esc(d.name)}">Set head</button>` : ""}</div>`,
    )
    .join("");
  let plist =
    isAdmin() || isExecutive()
      ? db.projects
      : role === "Project lead"
        ? db.projects.filter((p) => p.lead === scope())
        : isHeadRole()
          ? allowedProjects()
          : db.projects;
  $("projectList").innerHTML = plist
    .map(
      (p) =>
        `<div class="row"><div><div class="row-title">${esc(p.name)}</div><div class="row-sub">${db.members.filter((m) => m.projects.includes(p.name)).length} people · Lead: ${esc(personName(p.lead))}</div></div>${isAdmin() || isExecutive() ? `<button class="btn ghost small" data-action="edit-lead" data-type="project" data-name="${esc(p.name)}">Set lead</button>` : ""}</div>`,
    )
    .join("");
}
function openModal(title, body) {
  $("modalTitle").textContent = title;
  $("modalBody").innerHTML = body;
  $("modal").classList.add("open");
}
function closeModal() {
  $("modal").classList.remove("open");
}
function peopleOptions(list, selected = "") {
  return list
    .map(
      (m) =>
        `<option value="${m.id}" ${m.id === selected ? "selected" : ""}>${esc(m.name)} · ${esc(m.department || "—")}</option>`,
    )
    .join("");
}
function projectChecks(chosen = []) {
  return db.projects
    .map(
      (p) =>
        `<label class="check"><input type="checkbox" name="projects" value="${esc(p.name)}" ${chosen.includes(p.name) ? "checked" : ""}>${esc(p.name)}</label>`,
    )
    .join("");
}
function memberForm(
  m: any = {
    name: "",
    email: "",
    department: "",
    departments: [],
    clubRole: "Member",
    projects: [],
  },
) {
  if (!isAdmin()) return;
  let depts = db.departments,
    projects = db.projects,
    departments = m.departments || [m.department].filter(Boolean),
    roleNow = m.clubRole || "Member";
  openModal(
    m.id ? "Edit member" : "Add a member",
    `<form class="form" id="memberForm"><div class="field"><label>Full name</label><input name="name" required value="${esc(m.name)}" placeholder="Member name"></div><div class="field"><label>Email</label><input type="email" name="email" required value="${esc(m.email)}" placeholder="name@university.edu"></div><div class="field full"><label>Position</label><select name="clubRole" id="memberPosition">${options(["Member", "Department Head", "Project Head", "Vice President", "President"], roleNow)}</select><small class="quiet">System access is a separate permission, granted only by the global admin.</small></div><div class="field full hidden" id="extraPositionWrap"><label>Additional position (optional)</label><select name="extraRole" id="extraPosition"><option value="">None</option>${options(["Member", "Department Head", "Project Head"], m.extraRole || "")}</select></div><div class="field full hidden" id="headScopeWrap"><label id="headScopeLabel">Head of</label><select name="headScope" id="headScope"><option value="">Choose one</option></select><small class="quiet">A head role is attached to one department or one project.</small></div><div class="field full hidden" id="memberAssignments"><label>Departments</label><div class="form-checks">${depts.map((d) => `<label class="check"><input type="checkbox" name="departments" value="${esc(d.name)}" ${departments.includes(d.name) ? "checked" : ""}>${esc(d.name)}</label>`).join("")}</div><label>Projects</label><div class="form-checks">${projectChecks(m.projects || [])}</div><small class="quiet">Members can have any number of department and project assignments, or none.</small></div><div class="note field full">Profiles are created by the system admin. Members do not sign themselves up; registration is linked to the email on this profile.</div><div class="form-actions"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button class="btn lime">${m.id ? "Save member" : "Add member"}</button></div></form>`,
  );
  let sync = () => {
    let primary = $("memberPosition").value,
      secondary = $("extraPosition").value,
      headRole = ["Department Head", "Project Head"].includes(primary)
        ? primary
        : secondary,
      showExtra = ["President", "Vice President"].includes(primary),
      isMember = primary === "Member",
      head = $("headScope"),
      prior = m.headScope || m.department || m.headProject || "";
    $("extraPositionWrap").classList.toggle("hidden", !showExtra);
    $("memberAssignments").classList.toggle(
      "hidden",
      !isMember && !(showExtra && secondary === "Member"),
    );
    $("headScopeWrap").classList.toggle("hidden", !headRole);
    $("headScopeLabel").textContent =
      headRole === "Department Head" ? "Department headed" : "Project headed";
    let opts = headRole === "Department Head" ? depts : projects;
    head.innerHTML =
      '<option value="">Choose one</option>' +
      opts
        .map(
          (x) =>
            `<option value="${esc(x.name)}" ${x.name === prior ? "selected" : ""}>${esc(x.name)}</option>`,
        )
        .join("");
  };
  $("memberPosition").onchange = sync;
  $("extraPosition").onchange = sync;
  sync();
  $("memberForm").onsubmit = (e) => {
    e.preventDefault();
    let f = new FormData(e.target as HTMLFormElement),
      primary = String(f.get("clubRole") || ""),
      extra = String(f.get("extraRole") || ""),
      headRole = ["Department Head", "Project Head"].includes(primary)
        ? primary
        : extra,
      scopeValue = String(f.get("headScope") || ""),
      memberships = [
        ...(e.target as HTMLFormElement).querySelectorAll<HTMLInputElement>(
          "[name=departments]:checked",
        ),
      ].map((x) => x.value),
      assignedProjects = [
        ...(e.target as HTMLFormElement).querySelectorAll<HTMLInputElement>(
          "[name=projects]:checked",
        ),
      ].map((x) => x.value);
    if (headRole && !scopeValue) {
      alert("Choose the department or project for this head position.");
      return;
    }
    if (headRole === "Department Head") {
      let d = db.departments.find((x) => x.name === scopeValue);
      if (d) d.head = m.id || "";
      memberships = [...new Set([...memberships, scopeValue])];
    }
    if (headRole === "Project Head") {
      let p = db.projects.find((x) => x.name === scopeValue);
      if (p) p.lead = m.id || "";
      assignedProjects = [...new Set([...assignedProjects, scopeValue])];
    }
    let data = {
      name: String(f.get("name") || "").trim(),
      email: String(f.get("email") || "").trim(),
      clubRole: primary,
      extraRole: extra,
      departments: memberships,
      department: memberships[0] || "",
      projects: assignedProjects,
      headScope: scopeValue,
    };
    if (m.id) Object.assign(m, data);
    else db.members.push({ id: uid(), ...data });
    if (headRole === "Department Head") {
      let d = db.departments.find((x) => x.name === scopeValue);
      if (d) d.head = m.id || db.members.at(-1).id;
    }
    if (headRole === "Project Head") {
      let p = db.projects.find((x) => x.name === scopeValue);
      if (p) p.lead = m.id || db.members.at(-1).id;
    }
    closeModal();
    save();
  };
}
function taskForm() {
  let visible = allowedMembers();
  let projects = allowedProjects();
  openModal(
    "Put a task in motion",
    `<form class="form" id="taskForm"><div class="field full"><label>Task name</label><input name="title" required placeholder="e.g. Cut the opening 20 seconds"></div><div class="field full"><label>Brief</label><textarea name="description" rows="2" placeholder="What should the finished work include?"></textarea></div><div class="field"><label>Assign to</label><select name="assignee" required><option value="">Choose a member</option>${visible
      .filter(canAssignTo)
      .map(
        (m) =>
          `<option value="${m.id}">${esc(m.name)} · ${esc(m.department)}</option>`,
      )
      .join(
        "",
      )}</select></div><div class="field"><label>Project <span class="quiet">(optional)</span></label><select name="project"><option value="">Department-only task</option>${options(projects.map((p) => p.name))}</select></div><div class="field"><label>Department</label><select name="department"><option value="">Select department</option>${options(db.departments.map((d) => d.name))}</select></div><div class="field"><label>Deadline</label><input type="date" name="due"></div><div class="field"><label>Priority</label><select name="priority">${options(["Medium", "High", "Urgent", "Low"], "Medium")}</select></div><div class="field"><label>Status</label><select name="status">${options(["To do", "In progress", "In review", "Done"], "To do")}</select></div><div class="form-actions"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button class="btn lime">Assign task</button></div></form>`,
  );
  $("taskForm").onsubmit = (e) => {
    e.preventDefault();
    let v = Object.fromEntries(new FormData(e.target as HTMLFormElement));
    db.tasks.unshift({
      id: uid(),
      ...v,
      assigner: isAdmin() ? scope() : scope(),
      update: "",
      updates: [],
    });
    closeModal();
    save();
  };
}
function addUpdate(id) {
  let t = db.tasks.find((t) => t.id === id);
  if (!t) return;
  openModal(
    "Share a progress update",
    `<form class="form" id="updateForm"><div class="field full"><label>What changed or what do you need?</label><textarea name="update" rows="4" required placeholder="Add a short note for the team…">${esc(t.update || "")}</textarea></div><div class="form-actions"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button class="btn lime">Save update</button></div></form>`,
  );
  $("updateForm").onsubmit = (e) => {
    e.preventDefault();
    let value = String(
      new FormData(e.target as HTMLFormElement).get("update") || "",
    ).trim();
    t.update = value;
    t.updates = [
      ...(t.updates || []),
      { text: value, by: scope(), at: new Date().toISOString() },
    ];
    closeModal();
    save();
  };
}
function updateTask(id, key, value) {
  let t = db.tasks.find((t) => t.id === id);
  if (t) {
    t[key] = value;
    save();
  }
}
function editMember(id) {
  let m = person(id);
  if (m) memberForm(m);
}
function editLead(type, n) {
  if (!isAdmin() && !isExecutive()) return;
  let record =
    type === "department"
      ? db.departments.find((x) => x.name === n)
      : db.projects.find((x) => x.name === n);
  openModal(
    type === "department"
      ? "Choose a department head"
      : "Choose a project lead",
    `<form class="form" id="leadForm"><div class="field full"><label>${esc(n)}</label><select name="lead"><option value="">No lead assigned</option>${peopleOptions(db.members, record.head || record.lead)}</select></div><div class="form-actions"><button class="btn ghost" type="button" data-close-modal>Cancel</button><button class="btn lime">Save lead</button></div></form>`,
  );
  $("leadForm").onsubmit = (e) => {
    e.preventDefault();
    let id = String(
      new FormData(e.target as HTMLFormElement).get("lead") || "",
    );
    if (type === "department") record.head = id;
    else record.lead = id;
    closeModal();
    save();
  };
}
function assignProjects(id) {
  let m = person(id);
  if (!m || !canManageMember(m)) return;
  let managedDepts = db.departments
      .filter((d) => d.head === scope())
      .map((d) => d.name),
    managedProjects = db.projects
      .filter((p) => p.lead === scope())
      .map((p) => p.name),
    editableDepts = isAdmin()
      ? db.departments.map((d) => d.name)
      : managedDepts,
    editableProjects =
      isAdmin() || managedDepts.length
        ? db.projects.map((p) => p.name)
        : managedProjects,
    currentDepts = deptsOf(m),
    currentProjects = m.projects || [];
  let checks = (items, key, current) =>
    items
      .map(
        (x) =>
          `<label class="check"><input type="checkbox" name="${key}" value="${esc(x)}" ${current.includes(x) ? "checked" : ""}>${esc(x)}</label>`,
      )
      .join("");
  openModal(
    "Change scoped assignments",
    `<form class="form" id="assignmentForm"><div class="field full"><strong>${esc(m.name)}</strong><p class="quiet">Change only the department or project placements within your leadership scope.</p>${editableDepts.length ? `<label>Departments</label><div class="form-checks">${checks(editableDepts, "departments", currentDepts)}</div>` : ""}${editableProjects.length ? `<label>Projects</label><div class="form-checks">${checks(editableProjects, "projects", currentProjects)}</div>` : ""}</div><div class="form-actions"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button class="btn lime">Save assignments</button></div></form>`,
  );
  $("assignmentForm").onsubmit = (e) => {
    e.preventDefault();
    let ds = [
        ...(e.target as HTMLFormElement).querySelectorAll<HTMLInputElement>(
          "[name=departments]:checked",
        ),
      ].map((x) => x.value),
      ps = [
        ...(e.target as HTMLFormElement).querySelectorAll<HTMLInputElement>(
          "[name=projects]:checked",
        ),
      ].map((x) => x.value);
    m.departments = [
      ...new Set([
        ...currentDepts.filter((x) => !editableDepts.includes(x)),
        ...ds,
      ]),
    ];
    m.department = m.departments[0] || "";
    m.projects = [
      ...new Set([
        ...currentProjects.filter((x) => !editableProjects.includes(x)),
        ...ps,
      ]),
    ];
    closeModal();
    save();
  };
}
function toggleSystemAccess(id) {
  if (!isAdmin()) return;
  let m = person(id);
  if (m) {
    m.isClubAdmin = !m.isClubAdmin;
    save();
  }
}
function parseCsv(text) {
  let rows = [],
    row = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    let c = text[i];
    if (c === '"' && quoted && text[i + 1] === '"') {
      cell += '"';
      i++;
    } else if (c === '"') quoted = !quoted;
    else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
}
function importMembersCsv(file) {
  if (!file || !isAdmin()) return;
  file
    .text()
    .then((text) => {
      let rows = parseCsv(text);
      if (rows.length < 2)
        throw new Error(
          "The CSV needs a header row and at least one member row.",
        );
      let headers = rows
          .shift()
          .map((x) => x.trim().toLowerCase().replace(/\s+/g, "_")),
        col = (r, k) => r[headers.indexOf(k)]?.trim() || "",
        validRoles = [
          "Member",
          "Department Head",
          "Project Head",
          "Vice President",
          "President",
        ],
        seen = new Set(db.members.map((m) => m.email.toLowerCase())),
        made = [],
        errors = [];
      rows.forEach((r, i) => {
        let line = i + 2,
          name = col(r, "name"),
          email = col(r, "email").toLowerCase(),
          position = col(r, "position") || "Member",
          extra = col(r, "additional_position"),
          ds = col(r, "departments")
            .split(/[|;]/)
            .map((x) => x.trim())
            .filter(Boolean),
          ps = col(r, "projects")
            .split(/[|;]/)
            .map((x) => x.trim())
            .filter(Boolean),
          headScope = col(r, "head_scope");
        if (!name || !/^\S+@\S+\.\S+$/.test(email))
          errors.push(`Row ${line}: enter a name and valid email.`);
        if (seen.has(email))
          errors.push(`Row ${line}: duplicate email ${email}.`);
        if (!validRoles.includes(position))
          errors.push(`Row ${line}: unknown position “${position}”.`);
        if (
          extra &&
          !["Member", "Department Head", "Project Head"].includes(extra)
        )
          errors.push(`Row ${line}: unknown additional position “${extra}”.`);
        if (
          ds.some(
            (x) =>
              !db.departments.some(
                (d) => d.name.toLowerCase() === x.toLowerCase(),
              ),
          )
        )
          errors.push(
            `Row ${line}: department not found. Use exact department names.`,
          );
        if (
          ps.some(
            (x) =>
              !db.projects.some(
                (p) => p.name.toLowerCase() === x.toLowerCase(),
              ),
          )
        )
          errors.push(
            `Row ${line}: project not found. Use exact project names.`,
          );
        let headRole = ["Department Head", "Project Head"].includes(position)
          ? position
          : extra;
        if (headRole && !headScope)
          errors.push(`Row ${line}: a head needs one head_scope.`);
        if (
          headRole === "Department Head" &&
          !db.departments.some(
            (d) => d.name.toLowerCase() === headScope.toLowerCase(),
          )
        )
          errors.push(`Row ${line}: head_scope must be one department name.`);
        if (
          headRole === "Project Head" &&
          !db.projects.some(
            (p) => p.name.toLowerCase() === headScope.toLowerCase(),
          )
        )
          errors.push(`Row ${line}: head_scope must be one project name.`);
        if (email) seen.add(email);
        made.push({
          name,
          email,
          clubRole: position,
          extraRole: extra,
          departments: ds,
          department: ds[0] || "",
          projects: ps,
          headScope,
          status: "Pending invitation",
        });
      });
      if (errors.length) {
        alert(
          "Nothing imported. Please fix these issues:\n\n" +
            errors.slice(0, 12).join("\n") +
            (errors.length > 12 ? `\n…and ${errors.length - 12} more.` : ""),
        );
        return;
      }
      made.forEach((m) => {
        m.id = uid();
        let headRole = ["Department Head", "Project Head"].includes(m.clubRole)
          ? m.clubRole
          : m.extraRole;
        if (headRole === "Department Head") {
          let d = db.departments.find(
            (x) => x.name.toLowerCase() === m.headScope.toLowerCase(),
          );
          d.head = m.id;
          m.departments = [...new Set([...m.departments, d.name])];
          m.department = m.departments[0];
        }
        if (headRole === "Project Head") {
          let p = db.projects.find(
            (x) => x.name.toLowerCase() === m.headScope.toLowerCase(),
          );
          p.lead = m.id;
          m.projects = [...new Set([...m.projects, p.name])];
        }
        db.members.push(m);
      });
      save();
      alert(
        `${made.length} member profile${made.length === 1 ? "" : "s"} imported as pending invitations. Email invitations will work after Supabase is connected.`,
      );
    })
    .catch((e) => alert(e.message || "Could not read the CSV file."));
}
document.addEventListener("click", (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>(
    "[data-action],[data-close-modal]",
  );
  if (!target) return;
  if (target.hasAttribute("data-close-modal")) {
    closeModal();
    return;
  }
  switch (target.dataset.action) {
    case "edit-member":
      editMember(target.dataset.id || "");
      break;
    case "toggle-system-access":
      toggleSystemAccess(target.dataset.id || "");
      break;
    case "assign-projects":
      assignProjects(target.dataset.id || "");
      break;
    case "add-update":
      addUpdate(target.dataset.id || "");
      break;
    case "edit-lead":
      editLead(target.dataset.type || "", target.dataset.name || "");
      break;
  }
});
document.addEventListener("change", (event) => {
  const target = event.target as HTMLSelectElement;
  if (target.matches("[data-task-status]"))
    updateTask(target.dataset.taskStatus || "", "status", target.value);
});
$("addMemberBtn").onclick = () => memberForm();
$("addTaskBtn").onclick = taskForm;
$("closeModal").onclick = closeModal;
$("modal").onclick = (e) => {
  if (e.target === $("modal")) closeModal();
};
$("memberSearch").oninput = renderMembers;
$("memberDeptFilter").onchange = renderMembers;
$("memberProjectFilter").onchange = renderMembers;
$("taskSearch").oninput = renderTasks;
$("taskStatusFilter").onchange = renderTasks;
$("taskProjectFilter").onchange = renderTasks;
$("addDept").onclick = () => {
  let n = $("deptName").value.trim();
  if (
    n &&
    !db.departments.some((d) => d.name.toLowerCase() === n.toLowerCase())
  ) {
    db.departments.push({
      name: n,
      head: $("deptHead").value || "",
      description: "",
    });
    $("deptName").value = "";
    save();
  }
};
$("addProject").onclick = () => {
  let n = $("projectName").value.trim();
  if (n && !db.projects.some((p) => p.name.toLowerCase() === n.toLowerCase())) {
    db.projects.push({
      name: n,
      lead: $("projectLead").value || "",
      description: "",
    });
    $("projectName").value = "";
    save();
  }
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});
render();
