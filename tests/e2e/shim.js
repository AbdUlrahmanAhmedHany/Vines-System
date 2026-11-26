/* Preview-only stand-in for Supabase and the Flask API.
   Everything lives in memory; nothing talks to a real project. */
(function () {
  var KEY = "sb-mock-auth-token";
  var HOST = "mock.supabase.test";
  var ADMIN = "admin@vines.test";
  function b64(o) {
    return btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  }
  var USER = {
    id: "m0", aud: "authenticated", role: "authenticated", email: ADMIN,
    app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z"
  };
  var SESSION = {
    access_token: b64({ alg: "HS256", typ: "JWT" }) + "." + b64({ sub: "m0", exp: 4102444800, role: "authenticated" }) + ".sig",
    refresh_token: "refresh", token_type: "bearer", expires_in: 3600, expires_at: 4102444800, user: USER
  };

  var NAMES = [
    ["m0", "Demo Admin", ADMIN, true],
    ["m1", "Layla Hassan", "layla@vines.test", false],
    ["m2", "Omar Khaled", "omar@vines.test", false],
    ["m3", "Nour Samir", "nour@vines.test", false],
    ["m4", "Youssef Adel", "youssef@vines.test", false],
    ["m5", "Mariam Tarek", "mariam@vines.test", true],
    ["m6", "Karim Nabil", "karim@vines.test", false],
    ["m7", "Salma Fathy", "salma@vines.test", false],
    ["m8", "Hana Mostafa", "hana@vines.test", false]
  ];
  var DEPTS = ["Marketing", "HR", "PR", "Editing", "Designing", "Videography", "Educational", "Actors"];
  var DEPT_HEADS = { d0: "m1", d3: "m4", d5: "m6" };
  var PROJECTS = ["Podcasts", "Workshops", "Game Show", "Reels", "Sarcastic Shows"];
  var PROJECT_LEADS = { p0: "m2", p3: "m7" };
  var LINKS_D = { d0: ["m1", "m3", "m5", "m7"], d3: ["m4", "m6"], d4: ["m2", "m8"], d5: ["m4", "m6", "m7"], d7: ["m3", "m5"] };
  var LINKS_P = { p0: ["m2", "m3", "m6", "m8"], p1: ["m1", "m5"], p3: ["m7", "m8", "m4"] };

  var DATA = {
    members: NAMES.map(function (n) {
      return { id: n[0], name: n[1], email: n[2], club_role: "Member", department_id: null, is_club_admin: n[3], status: "Active", faculty: null, study_year: null, avatar_path: null, profile_status: "Pending", is_club_owner: n[3] === true && n[0] === "m0" };
    }),
    departments: DEPTS.map(function (n, i) {
      return { id: "d" + i, name: n, description: "", head_member_id: DEPT_HEADS["d" + i] || null };
    }),
    projects: PROJECTS.map(function (n, i) {
      return { id: "p" + i, name: n, description: "", project_lead_id: PROJECT_LEADS["p" + i] || null, status: "Active" };
    }),
    member_departments: [],
    project_assignments: [],
    tasks: [
      { id: "t1", title: "Record episode 4 intro", description: "Two takes, one with the new mic.", task_type: "Project task", project_id: "p0", department_id: null, assignee_id: "m3", assigned_by: "m2", status: "In progress", priority: "High", due_at: "2026-12-02T23:59:00", progress_update: "Script is locked." },
      { id: "t2", title: "Design workshop poster", description: "A3 portrait, club colors.", task_type: "Project task", project_id: "p1", department_id: null, assignee_id: "m8", assigned_by: "m1", status: "Pending", priority: "Medium", due_at: "2026-12-09T23:59:00", progress_update: "" },
      { id: "t3", title: "Cut the Reels teaser", description: "Under 30 seconds.", task_type: "Project task", project_id: "p3", department_id: null, assignee_id: "m4", assigned_by: "m7", status: "In review", priority: "Urgent", due_at: "2026-11-30T23:59:00", progress_update: "" }
    ],
    task_projects: [
      { task_id: "t1", project_id: "p0" }, { task_id: "t2", project_id: "p1" }, { task_id: "t3", project_id: "p3" }
    ],
    task_departments: [], task_updates: [], member_positions: [], member_contacts: [], pending_plans: [],
    positions: [
      { id: "pos1", name: "President" }, { id: "pos2", name: "Vice President" },
      { id: "pos3", name: "Department Head" }, { id: "pos4", name: "Project Head" }
    ]
  };
  Object.keys(LINKS_D).forEach(function (d) {
    LINKS_D[d].forEach(function (m) { DATA.member_departments.push({ member_id: m, department_id: d }); });
  });
  Object.keys(LINKS_P).forEach(function (p) {
    LINKS_P[p].forEach(function (m) {
      DATA.project_assignments.push({ member_id: m, project_id: p, status: "Active", role_on_project: "" });
    });
  });

  // Sign-in session. Falls back to an in-memory store if browser storage is blocked.
  try {
    localStorage.setItem(KEY, JSON.stringify(SESSION));
    localStorage.getItem(KEY);
  } catch (e) {
    var mem = {};
    var store = {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
      setItem: function (k, v) { mem[k] = String(v); },
      removeItem: function (k) { delete mem[k]; },
      clear: function () { mem = {}; },
      key: function (i) { return Object.keys(mem)[i] || null; },
      get length() { return Object.keys(mem).length; }
    };
    store.setItem(KEY, JSON.stringify(SESSION));
    try { Object.defineProperty(window, "localStorage", { value: store, configurable: true }); } catch (_) {}
  }

  function reply(body, status) {
    var text = body === undefined || body === null ? null : JSON.stringify(body);
    return new Response(status === 204 ? null : text, {
      status: status || 200, headers: { "Content-Type": "application/json" }
    });
  }

  var RESERVED = { select: 1, order: 1, limit: 1, offset: 1, on_conflict: 1, columns: 1 };
  function matcher(params) {
    var tests = [];
    params.forEach(function (value, key) {
      if (RESERVED[key]) return;
      var op = value.split(".")[0];
      var val = value.slice(op.length + 1);
      tests.push(function (row) {
        var cell = row[key];
        if (op === "eq") return String(cell) === val;
        if (op === "ilike") return String(cell || "").toLowerCase() === val.replace(/%/g, "").toLowerCase();
        if (op === "in") return val.replace(/^\(|\)$/g, "").split(",").indexOf(String(cell)) >= 0;
        return true;
      });
    });
    return function (row) { return tests.every(function (t) { return t(row); }); };
  }

  function rest(table, method, url, init) {
    window.__DATA = DATA;
    var rows = DATA[table];
    if (!rows) return reply([]);
    var accept = new Headers((init && init.headers) || {}).get("accept") || "";
    var prefer = new Headers((init && init.headers) || {}).get("prefer") || "";
    var match = matcher(url.searchParams);
    if (method === "GET" || method === "HEAD") {
      var found = rows.filter(match);
      if (accept.indexOf("pgrst.object") >= 0) {
        return found.length ? reply(found[0]) : reply({}, 406);
      }
      return reply(found);
    }
    if (method === "POST") {
      var incoming = JSON.parse((init && init.body) || "[]");
      if (!Array.isArray(incoming)) incoming = [incoming];
      incoming.forEach(function (row) {
        var at = -1;
        for (var i = 0; i < rows.length; i++) {
          if (row.id !== undefined ? rows[i].id === row.id : (table === "pending_plans" && row.member_id !== undefined) ? rows[i].member_id === row.member_id : JSON.stringify(rows[i]) === JSON.stringify(row)) { at = i; break; }
        }
        if (at >= 0) rows[at] = Object.assign({}, rows[at], row); else { if (table === "pending_plans" && !row.expires_at) row = Object.assign({ expires_at: new Date(Date.now() + 14 * 86400000).toISOString() }, row); rows.push(row); }
      });
      return prefer.indexOf("return=representation") >= 0 ? reply(incoming, 201) : reply(null, 201);
    }
    if (method === "PATCH") {
      var patch = JSON.parse((init && init.body) || "{}");
      rows.forEach(function (row) { if (match(row)) Object.assign(row, patch); });
      return reply(null, 204);
    }
    if (method === "DELETE") {
      var removed = rows.filter(match);
      DATA[table] = rows.filter(function (row) { return !match(row); });
      if (table === "tasks") {
        var gone = removed.map(function (r) { return r.id; });
        ["task_projects", "task_departments", "task_updates"].forEach(function (child) {
          DATA[child] = DATA[child].filter(function (r) { return gone.indexOf(r.task_id) < 0; });
        });
      }
      return prefer.indexOf("return=representation") >= 0 ? reply(removed) : reply(null, 204);
    }
    return reply([]);
  }

  var realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var raw = typeof input === "string" ? input : input.url;
    var url = new URL(raw, location.href);
    var method = ((init && init.method) || (typeof input !== "string" && input.method) || "GET").toUpperCase();
    if (url.pathname === "/api/config" && url.hostname !== HOST) {
      return Promise.resolve(reply({ supabaseUrl: "http://" + HOST, supabasePublishableKey: "preview-key" }));
    }
    if (url.pathname === "/api/remove-member") {
      // Same rules and clean-up as the real endpoint, applied to the sample data.
      var id = JSON.parse((init && init.body) || "{}").memberId;
      var target = DATA.members.filter(function (m) { return m.id === id; })[0];
      if (!target) return Promise.resolve(reply({ error: "This member no longer exists." }, 404));
      if (target.id === "m0") return Promise.resolve(reply({ error: "You cannot remove yourself." }, 409));
      if (target.is_club_admin) return Promise.resolve(reply({ error: "Revoke this member's system access before removing them." }, 409));
      var goneTasks = DATA.tasks.filter(function (t) { return t.assignee_id === id; }).map(function (t) { return t.id; });
      DATA.tasks = DATA.tasks.filter(function (t) { return goneTasks.indexOf(t.id) < 0; });
      ["task_projects", "task_departments", "task_updates"].forEach(function (k) {
        DATA[k] = DATA[k].filter(function (r) { return goneTasks.indexOf(r.task_id) < 0; });
      });
      DATA.task_updates = DATA.task_updates.filter(function (r) { return r.author_id !== id; });
      DATA.tasks.forEach(function (t) { if (t.assigned_by === id) t.assigned_by = "m0"; });
      DATA.member_departments = DATA.member_departments.filter(function (r) { return r.member_id !== id; });
      DATA.project_assignments = DATA.project_assignments.filter(function (r) { return r.member_id !== id; });
      DATA.member_positions = DATA.member_positions.filter(function (r) { return r.member_id !== id; });
      DATA.departments.forEach(function (d) { if (d.head_member_id === id) d.head_member_id = null; });
      DATA.projects.forEach(function (p) { if (p.project_lead_id === id) p.project_lead_id = null; });
      DATA.members = DATA.members.filter(function (m) { return m.id !== id; });
      return Promise.resolve(reply({ ok: true }));
    }
    if (url.pathname === "/api/invitations" || url.pathname === "/api/activate-invited-member") {
      return Promise.resolve(reply({ ok: true }));
    }
    if (url.hostname === HOST) {
      if (url.pathname.indexOf("/auth/v1/token") === 0) return Promise.resolve(reply(SESSION));
      if (url.pathname.indexOf("/auth/v1/logout") === 0) return Promise.resolve(reply(null, 204));
      if (url.pathname.indexOf("/auth/v1/") === 0) return Promise.resolve(reply(USER));
      window.__calls = window.__calls || [];
      if (url.pathname.indexOf("/rest/v1/rpc/update_own_profile") === 0) {
        var a = JSON.parse((init && init.body) || "{}");
        window.__calls.push(["rpc", a]);
        var me = DATA.members.filter(function (r) { return r.email === USER.email; })[0];
        if (a.p_study_year === 5 && a.p_faculty !== "Engineering") return Promise.resolve(reply({ message: "Only Engineering has a fifth year" }, 400));
        me.name = a.p_name; me.faculty = a.p_faculty; me.study_year = a.p_study_year; me.avatar_path = a.p_avatar_path; me.profile_status = a.p_profile_status; DATA.member_contacts = DATA.member_contacts.filter(function (r) { return r.member_id !== me.id; }); DATA.member_contacts.push({ member_id: me.id, phone: a.p_phone });
        return Promise.resolve(reply(null, 204));
      }
      if (url.pathname.indexOf("/storage/v1/object/avatars") === 0) {
        window.__calls.push(["storage", method, url.pathname]);
        return Promise.resolve(reply({ Key: "avatars/x" }));
      }
      var m = url.pathname.match(/^\/rest\/v1\/(\w+)/);
      if (m) return Promise.resolve(rest(m[1], method, url, init));
      return Promise.resolve(reply([]));
    }
    return realFetch(input, init);
  };
})();
