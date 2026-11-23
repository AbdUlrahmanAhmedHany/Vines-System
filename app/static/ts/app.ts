import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const KEY_PREFIX = "vines-club-hub-v1:";
let KEY = "";
const SHARED_WRITES_ENABLED = true;
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
let db: any = structuredClone(starter),
  role = "",
  selectedPerson = "",
  structureMode = "structure",
  calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  supabase: SupabaseClient | null = null,
  authUser: any = null,
  authProfile: any = null,
  currentPositions: string[] = [],
  positionsCatalog: any[] = [],
  sessionReady = false,
  syncedDb: any = null,
  saveQueue: Promise<void> = Promise.resolve(),
  passwordSetupFlow = false,
  inviteSetupFlow = false,
  openingSessionFor = "";
const $ = (id: string): any => document.getElementById(id) as any;

function authNotice(message = "", isError = false) {
  const notice = $("authMessage");
  notice.textContent = message;
  notice.classList.toggle("error", isError);
}

function showAuthGate(message = "", isError = false) {
  $("appShell").classList.add("hidden");
  $("authGate").classList.remove("hidden");
  $("loginForm").classList.remove("hidden");
  $("setPasswordForm").classList.add("hidden");
  $("authTitle").textContent = "Welcome back";
  $("authCopy").textContent =
    "Sign in with the email and password from your Vines invitation.";
  authNotice(message, isError);
}

async function openWorkspace(user: any) {
  if (!supabase || !user?.email) return;
  if (passwordSetupFlow) {
    $("appShell").classList.add("hidden");
    $("authGate").classList.remove("hidden");
    $("loginForm").classList.add("hidden");
    $("setPasswordForm").classList.remove("hidden");
    return;
  }
  if (sessionReady && authUser?.id === user.id) return;
  if (openingSessionFor === user.id) return;
  openingSessionFor = user.id;
  const { data: profile, error } = await supabase
    .from("members")
    .select("id,name,email,club_role,is_club_admin,status")
    .ilike("email", user.email)
    .maybeSingle();
  if (error || !profile) {
    openingSessionFor = "";
    await supabase.auth.signOut();
    showAuthGate(
      "This email is not linked to a Vines member profile. Ask the system admin for help.",
      true,
    );
    return;
  }
  if (profile.status !== "Active") {
    openingSessionFor = "";
    await supabase.auth.signOut();
    showAuthGate(
      "Your Vines invitation is not active yet. Ask the system admin to check your profile.",
      true,
    );
    return;
  }

  authUser = user;
  authProfile = profile;
  const positionsResult = await supabase
    .from("member_positions")
    .select("position_id,department_id,project_id")
    .eq("member_id", profile.id);
  const catalogResult = await supabase.from("positions").select("id,name");
  if (positionsResult.error || catalogResult.error) {
    openingSessionFor = "";
    await supabase.auth.signOut();
    showAuthGate(
      "Your profile is linked, but role data is not ready. Ask the system admin to check the matrix migration.",
      true,
    );
    return;
  }
  const positionNames = new Map(
    catalogResult.data.map((item) => [item.id, item.name]),
  );
  currentPositions = positionsResult.data
    .map((item) => positionNames.get(item.position_id))
    .filter(Boolean) as string[];
  positionsCatalog = catalogResult.data || [];
  role = profile.is_club_admin
    ? "System admin access"
    : currentPositions.includes("President")
      ? "President"
      : currentPositions.includes("Vice President")
        ? "Vice President"
        : currentPositions.includes("Department Head")
          ? "Department Head"
          : currentPositions.includes("Project Head")
            ? "Project Head"
            : profile.club_role;
  selectedPerson = profile.id;
  KEY = `${KEY_PREFIX}${String(profile.email).toLowerCase()}`;
  try {
    db = await loadSharedWorkspace();
  } catch (loadError) {
    openingSessionFor = "";
    await supabase.auth.signOut();
    showAuthGate(
      loadError instanceof Error
        ? loadError.message
        : "Could not load the shared workspace.",
      true,
    );
    return;
  }
  sessionReady = true;
  syncedDb = structuredClone(db);
  openingSessionFor = "";
  $("signedInAs").textContent = profile.name || profile.email;
  $("authGate").classList.add("hidden");
  $("appShell").classList.remove("hidden");
  render();
}

async function initializeSupabase() {
  try {
    const configResponse = await fetch("/api/config", { cache: "no-store" });
    const config = await configResponse.json();
    if (!config.supabaseUrl || !config.supabasePublishableKey)
      throw new Error(
        "Supabase settings are not configured for this site yet.",
      );

    supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    const flow =
      new URLSearchParams(window.location.search).get("flow") ||
      new URLSearchParams(window.location.hash.slice(1)).get("type") ||
      "";
    inviteSetupFlow = flow === "invite";
    passwordSetupFlow = ["invite", "recovery"].includes(flow);
    if (passwordSetupFlow) {
      $("loginForm").classList.add("hidden");
      $("setPasswordForm").classList.remove("hidden");
      $("authTitle").textContent = "Choose a password";
      $("authCopy").textContent =
        "Create a password to finish setting up your Vines account.";
    }

    const { data } = await supabase.auth.getSession();
    if (data.session) await openWorkspace(data.session.user);
    supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (session) void openWorkspace(session.user);
        else if (sessionReady) {
          sessionReady = false;
          authUser = null;
          authProfile = null;
          currentPositions = [];
          openingSessionFor = "";
          role = "";
          selectedPerson = "";
          showAuthGate("You have signed out.");
        }
      }, 0);
    });
  } catch (error) {
    showAuthGate(
      error instanceof Error ? error.message : "Could not connect to Supabase.",
      true,
    );
  }
}

async function loadSharedWorkspace() {
  if (!supabase) throw new Error("Supabase is not connected.");
  const results = await Promise.all([
    supabase
      .from("members")
      .select("id,name,email,club_role,department_id,is_club_admin,status"),
    supabase.from("departments").select("id,name,description,head_member_id"),
    supabase
      .from("projects")
      .select("id,name,description,project_lead_id,status"),
    supabase.from("member_departments").select("member_id,department_id"),
    supabase
      .from("project_assignments")
      .select("member_id,project_id,status,role_on_project"),
    supabase
      .from("tasks")
      .select(
        "id,title,description,task_type,project_id,department_id,assignee_id,assigned_by,status,priority,due_at,progress_update",
      ),
    supabase.from("task_updates").select("task_id,author_id,note,created_at"),
    supabase
      .from("member_positions")
      .select("member_id,position_id,department_id,project_id"),
    supabase.from("positions").select("id,name"),
  ]);
  const failed = results.find((result) => result.error);
  if (failed?.error)
    throw new Error(`Could not load shared club data: ${failed.error.message}`);
  const [
    members,
    departments,
    projects,
    memberDepartments,
    assignments,
    tasks,
    updates,
    memberPositions,
    positions,
  ] = results.map((result) => result.data || []) as any[][];
  const departmentNames = new Map<string, string>(
    departments.map((item: any) => [item.id, item.name]),
  );
  const projectNames = new Map<string, string>(
    projects.map((item: any) => [item.id, item.name]),
  );
  const positionNames = new Map<string, string>(
    positions.map((item: any) => [item.id, item.name]),
  );
  const assignmentsByMember = new Map<string, string[]>();
  assignments
    .filter((item) => item.status === "Active")
    .forEach((item) => {
      const list = assignmentsByMember.get(item.member_id) || [];
      const name = projectNames.get(item.project_id);
      if (name && !list.includes(name)) list.push(name);
      assignmentsByMember.set(item.member_id, list);
    });
  const departmentsByMember = new Map<string, string[]>();
  memberDepartments.forEach((item) => {
    const list = departmentsByMember.get(item.member_id) || [];
    const name = departmentNames.get(item.department_id);
    if (name && !list.includes(name)) list.push(name);
    departmentsByMember.set(item.member_id, list);
  });
  const rolesByMember = new Map<string, string[]>();
  memberPositions.forEach((item) => {
    const list = rolesByMember.get(item.member_id) || [];
    const name = positionNames.get(item.position_id);
    if (name && !list.includes(name)) list.push(name);
    rolesByMember.set(item.member_id, list);
  });
  const departmentHeads = new Map<string, string>();
  const projectHeads = new Map<string, string>();
  const headScopeByMember = new Map<string, string>();
  memberPositions.forEach((item: any) => {
    const position = positionNames.get(item.position_id);
    if (position === "Department Head" && item.department_id) {
      departmentHeads.set(item.department_id, item.member_id);
      headScopeByMember.set(
        item.member_id,
        departmentNames.get(item.department_id) || "",
      );
    }
    if (position === "Project Head" && item.project_id) {
      projectHeads.set(item.project_id, item.member_id);
      headScopeByMember.set(
        item.member_id,
        projectNames.get(item.project_id) || "",
      );
    }
  });
  const updatesByTask = new Map<string, any[]>();
  updates.forEach((item) => {
    const list = updatesByTask.get(item.task_id) || [];
    list.push({ text: item.note, by: item.author_id, at: item.created_at });
    updatesByTask.set(item.task_id, list);
  });
  return {
    departments: departments.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      head: departmentHeads.get(item.id) || "",
    })),
    projects: projects.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      lead: projectHeads.get(item.id) || "",
      status: item.status,
    })),
    members: members.map((item) => {
      const memberDeptList = departmentsByMember.get(item.id) || [];
      const legacyDepartment = departmentNames.get(item.department_id);
      if (legacyDepartment && !memberDeptList.includes(legacyDepartment))
        memberDeptList.push(legacyDepartment);
      return {
        id: item.id,
        name: item.name,
        email: item.email,
        clubRole:
          item.club_role === "Department head"
            ? "Department Head"
            : item.club_role === "Project lead" || item.club_role === "Head"
              ? "Project Head"
              : item.club_role,
        extraRole: ["President", "Vice President"].includes(item.club_role)
          ? (rolesByMember.get(item.id) || []).find((name) =>
              ["Department Head", "Project Head"].includes(name),
            ) || ""
          : "",
        headScope: headScopeByMember.get(item.id) || "",
        isClubAdmin: item.is_club_admin,
        status: item.status,
        departments: memberDeptList,
        department: memberDeptList[0] || "",
        projects: assignmentsByMember.get(item.id) || [],
        positionNames: rolesByMember.get(item.id) || [],
      };
    }),
    tasks: tasks.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description || "",
      project: projectNames.get(item.project_id) || "",
      department: departmentNames.get(item.department_id) || "",
      assignee: item.assignee_id,
      assigner: item.assigned_by,
      status: item.status,
      priority: item.priority,
      due: item.due_at ? String(item.due_at).slice(0, 10) : "",
      update: item.progress_update || "",
      updates: updatesByTask.get(item.id) || [],
    })),
  };
}

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) return authNotice("Supabase is not configured yet.", true);
  const form = new FormData(event.currentTarget as HTMLFormElement);
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  authNotice("Signing in…");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) authNotice("That email and password could not sign in.", true);
});

$("forgotPassword").addEventListener("click", async () => {
  if (!supabase) return authNotice("Supabase is not configured yet.", true);
  const email = String($("loginEmail").value || "").trim();
  if (!email) return authNotice("Enter your email first.", true);
  const redirectTo = `${window.location.origin}/?flow=recovery`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  authNotice(
    error
      ? "Could not send a reset email. Check Auth email delivery settings."
      : "If that account is registered, a password reset email is on its way.",
    Boolean(error),
  );
});

$("setPasswordForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) return authNotice("Supabase is not configured yet.", true);
  const form = new FormData(event.currentTarget as HTMLFormElement);
  const password = String(form.get("password") || "");
  const confirmation = String(form.get("confirmPassword") || "");
  if (password !== confirmation)
    return authNotice("The passwords do not match.", true);
  const { error } = await supabase.auth.updateUser({ password });
  if (error)
    return authNotice(
      "Could not set the password. Try the invite link again.",
      true,
    );
  if (inviteSetupFlow) {
    const { data: sessionData } = await supabase.auth.getSession();
    const activation = await fetch("/api/activate-invited-member", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + (sessionData.session?.access_token || ""),
      },
    });
    if (!activation.ok) {
      const result = await activation.json().catch(() => ({}));
      return authNotice(
        result.error ||
          "Password saved, but your profile could not be activated. Contact the system admin.",
        true,
      );
    }
  }
  passwordSetupFlow = false;
  inviteSetupFlow = false;
  window.history.replaceState({}, "", window.location.pathname);
  const { data } = await supabase.auth.getUser();
  if (data.user) await openWorkspace(data.user);
});

$("signOutBtn").addEventListener("click", async () => {
  if (supabase) await supabase.auth.signOut();
});

function same(a: any, b: any) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function byName(items: any[], name: string) {
  return items.find((item) => item.name === name)?.id || null;
}

async function writeTable(table: string, rows: any[], onConflict = "") {
  if (!rows.length) return;
  const { error } = await supabase!
    .from(table)
    .upsert(rows, onConflict ? { onConflict } : undefined);
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function deleteRows(table: string, filters: Record<string, string>) {
  let query: any = supabase!.from(table).delete();
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  const { error } = await query;
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function persistChanges(before: any, after: any) {
  if (!supabase || !authUser || !authProfile)
    throw new Error("Your sign-in session has expired. Please sign in again.");

  // The member record itself is admin-only. Keep position and assignment data
  // in their own relations so department/project heads can only change scope.
  const changedMembers = after.members.filter((member: any) => {
    const old = before.members.find((row: any) => row.id === member.id);
    return (
      !old ||
      ["name", "email", "clubRole", "isClubAdmin", "status"].some(
        (field) => old[field] !== member[field],
      )
    );
  });
  if (changedMembers.length && !isAdmin())
    throw new Error(
      "Only the system admin can create or edit member profiles.",
    );
  if (changedMembers.length) {
    await writeTable(
      "members",
      changedMembers.map((member: any) => ({
        id: member.id,
        name: member.name,
        email: member.email.trim().toLowerCase(),
        club_role: ["President", "Vice President"].includes(member.clubRole)
          ? member.clubRole
          : member.clubRole === "Department Head"
            ? "Department head"
            : member.clubRole === "Project Head"
              ? "Project lead"
              : "Member",
        department_id: null,
        is_club_admin: Boolean(member.isClubAdmin),
        status: member.status || "Pending invitation",
      })),
    );
  }

  const changedDepartments = after.departments.filter((item: any) => {
    const old = before.departments.find((row: any) => row.id === item.id);
    return !old || !same(old, item);
  });
  if (changedDepartments.length) {
    if (!isAdmin())
      throw new Error("Only the system admin can edit department records.");
    await writeTable(
      "departments",
      changedDepartments.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || "",
        head_member_id: item.head || null,
      })),
      "name",
    );
  }

  const changedProjects = after.projects.filter((item: any) => {
    const old = before.projects.find((row: any) => row.id === item.id);
    return !old || !same(old, item);
  });
  if (changedProjects.length) {
    if (!isAdmin())
      throw new Error("Only the system admin can edit project records.");
    await writeTable(
      "projects",
      changedProjects.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || "",
        project_lead_id: item.lead || null,
        status: item.status || "Planning",
      })),
      "name",
    );
  }

  const changedAssignments = after.members.filter((member: any) => {
    const old = before.members.find((row: any) => row.id === member.id);
    return (
      !old ||
      !same(old.departments || [], member.departments || []) ||
      !same(old.projects || [], member.projects || [])
    );
  });
  for (const member of changedAssignments) {
    const old = before.members.find((row: any) => row.id === member.id);
    const oldDepartments: string[] = old?.departments || [];
    const newDepartments: string[] = member.departments || [];
    for (const name of oldDepartments.filter(
      (name) => !newDepartments.includes(name),
    )) {
      const departmentId = byName(after.departments, name);
      if (departmentId)
        await deleteRows("member_departments", {
          member_id: member.id,
          department_id: departmentId,
        });
    }
    const departmentRows = newDepartments
      .filter((name) => !oldDepartments.includes(name))
      .map((name) => ({
        member_id: member.id,
        department_id: byName(after.departments, name),
        assigned_by: authProfile.id,
      }))
      .filter((row: any) => row.department_id);
    await writeTable("member_departments", departmentRows);

    const oldProjects: string[] = old?.projects || [];
    const newProjects: string[] = member.projects || [];
    for (const name of oldProjects.filter(
      (name) => !newProjects.includes(name),
    )) {
      const projectId = byName(after.projects, name);
      if (projectId)
        await deleteRows("project_assignments", {
          member_id: member.id,
          project_id: projectId,
        });
    }
    const projectRows = newProjects
      .filter((name) => !oldProjects.includes(name))
      .map((name) => ({
        member_id: member.id,
        project_id: byName(after.projects, name),
        allocated_by: authProfile.id,
        status: "Active",
        role_on_project: "Core",
      }))
      .filter((row: any) => row.project_id);
    await writeTable(
      "project_assignments",
      projectRows,
      "member_id,project_id",
    );
  }

  if (isAdmin()) {
    const changedPositions = after.members.filter((member: any) => {
      const old = before.members.find((row: any) => row.id === member.id);
      return (
        !old ||
        old.clubRole !== member.clubRole ||
        old.extraRole !== member.extraRole ||
        old.headScope !== member.headScope
      );
    });
    for (const member of changedPositions) {
      const { error: deleteError } = await supabase
        .from("member_positions")
        .delete()
        .eq("member_id", member.id);
      if (deleteError)
        throw new Error(`member_positions: ${deleteError.message}`);
      const names = [member.clubRole, member.extraRole].filter(Boolean);
      const positionRows = names
        .map((name: string) => {
          const scopeId = byName(
            name === "Department Head" ? after.departments : after.projects,
            member.headScope || "",
          );
          return {
            member_id: member.id,
            position_id: byName(positionsCatalog, name),
            department_id: name === "Department Head" ? scopeId : null,
            project_id: name === "Project Head" ? scopeId : null,
            assigned_by: authProfile.id,
          };
        })
        .filter((row: any) => row.position_id);
      await writeTable("member_positions", positionRows);
    }
  }

  const changedTasks = after.tasks.filter((task: any) => {
    const old = before.tasks.find((row: any) => row.id === task.id);
    return !old || !same(old, task);
  });
  if (changedTasks.length) {
    for (const task of changedTasks) {
      const old = before.tasks.find((row: any) => row.id === task.id);
      const row: any = {
        id: task.id,
        title: task.title,
        description: task.description || "",
        task_type: task.project
          ? "Project task"
          : task.department
            ? "Department task"
            : "Club-wide",
        project_id: byName(after.projects, task.project || ""),
        department_id: byName(after.departments, task.department || ""),
        assignee_id: task.assignee,
        assigned_by: task.assigner || authProfile.id,
        status: task.status || "To do",
        priority: task.priority || "Medium",
        due_at: task.due ? `${task.due}T23:59:00` : null,
        progress_update: task.update || "",
      };
      if (!old) await writeTable("tasks", [row]);
      else {
        const allowed: any = {};
        if (old.status !== task.status) allowed.status = task.status;
        if (old.update !== task.update)
          allowed.progress_update = task.update || "";
        if (Object.keys(allowed).length) {
          const { error } = await supabase
            .from("tasks")
            .update(allowed)
            .eq("id", task.id);
          if (error) throw new Error(`tasks: ${error.message}`);
        }
      }
      const oldUpdates = old?.updates || [];
      const newUpdates = task.updates || [];
      const additions = newUpdates
        .slice(oldUpdates.length)
        .map((update: any) => ({
          task_id: task.id,
          author_id: update.by || authProfile.id,
          note: update.text,
        }));
      await writeTable("task_updates", additions);
    }
  }
}

function save(): Promise<boolean> {
  render();
  if (!SHARED_WRITES_ENABLED || !supabase || !syncedDb)
    return Promise.resolve(false);
  const next = structuredClone(db);
  let succeeded = true;
  saveQueue = saveQueue
    .then(async () => {
      await persistChanges(syncedDb, next);
      syncedDb = next;
    })
    .catch(async (error) => {
      succeeded = false;
      alert(error instanceof Error ? error.message : "Could not save changes.");
      try {
        db = await loadSharedWorkspace();
        syncedDb = structuredClone(db);
        render();
      } catch {
        await supabase?.auth.signOut();
      }
    });
  return saveQueue.then(() => succeeded);
}

async function sendInvitation(email: string) {
  const { data } = await supabase!.auth.getSession();
  const response = await fetch("/api/invitations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + (data.session?.access_token || ""),
    },
    body: JSON.stringify({ email }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(result.error || "Could not send the invitation.");
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
  if (m.positionNames?.length)
    labels.push(...m.positionNames.filter((position) => position !== "Member"));
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
  return (
    ["President", "Vice President"].includes(role) ||
    currentPositions.some((position) =>
      ["President", "Vice President"].includes(position),
    )
  );
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
    role === "Project lead" ||
    currentPositions.some((position) =>
      ["Department Head", "Project Head"].includes(position),
    )
  );
}
function allowedMembers() {
  return db.members;
}
function allowedTasks() {
  return db.tasks;
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
  return isAdmin() || isExecutive() || canManageMember(m);
}
function allowedProjects() {
  return db.projects;
}
function show(view) {
  if (view === "administration" && !isAdmin()) view = "home";
  if (["departments", "projects"].includes(view)) structureMode = view;
  else if (view === "structure") structureMode = "structure";
  const activeView = ["departments", "projects"].includes(view)
    ? "structure"
    : view;
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.toggle("active", v.id === activeView));
  document
    .querySelectorAll<HTMLButtonElement>(".nav button")
    .forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  $("pageTitle").textContent =
    {
      home: "Overview",
      members: "Members",
      tasks: "Tasks",
      calendar: "Calendar",
      administration: "Administration",
      departments: "Departments",
      projects: "Projects",
      structure: "Departments & projects",
    }[view] || "Overview";
  if (activeView === "structure") renderStructure();
}
document
  .querySelectorAll<HTMLButtonElement>(".nav button")
  .forEach((b) => (b.onclick = () => show(b.dataset.view)));
document
  .querySelectorAll<HTMLElement>("[data-go]")
  .forEach((b) => (b.onclick = () => show(b.dataset.go)));
function render() {
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
  const leader =
    SHARED_WRITES_ENABLED && (isAdmin() || isExecutive() || isHeadRole());
  $("addMemberBtn").classList.toggle("hidden", !leader || !isAdmin());
  $("importMembersBtn").classList.toggle("hidden", !leader || !isAdmin());
  $("addDept")
    .closest(".form")
    .classList.toggle("hidden", !leader || !isAdmin());
  $("addProject")
    .closest(".form")
    .classList.toggle("hidden", !leader || !isAdmin());
  $("addTaskBtn").classList.toggle("hidden", !leader);
  $("adminNav").classList.toggle("hidden", !isAdmin());
  renderHome();
  renderMembers();
  renderTasks();
  renderCalendar();
  renderAdministration();
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
                )}</div><div>${SHARED_WRITES_ENABLED && isAdmin() ? `<button class="btn ghost small" data-action="edit-member" data-id="${m.id}">Edit profile</button><button class="btn ghost small" data-action="toggle-system-access" data-id="${m.id}">${m.isClubAdmin ? "Revoke system access" : "Grant system access"}</button>${m.status === "Pending invitation" ? `<button class="btn ghost small" data-action="resend-invitation" data-id="${m.id}">Send invitation</button>` : ""}` : SHARED_WRITES_ENABLED && canManageMember(m) ? `<button class="btn ghost small" data-action="assign-projects" data-id="${m.id}">Change assignments</button>` : ""}</div></div>`,
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
              `<div class="task"><div><div class="row-title">${esc(t.title)}</div><div class="row-sub">${esc(t.description || "")} · assigned by ${esc(personName(t.assigner))}</div>${t.update ? `<div class="progress-update">↳ ${esc(t.update)}</div>` : ""}</div><div class="person"><span class="avatar c2">${initials(personName(t.assignee))}</span><span>${esc(personName(t.assignee))}</span></div><div>${esc(t.project || "Department task")}</div><div><span class="badge ${t.priority === "Urgent" ? "urgent" : t.priority === "High" ? "high" : ""}">${esc(t.priority)}</span></div><div>${t.due ? new Date(t.due + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "No deadline"}</div><div>${SHARED_WRITES_ENABLED && (t.assignee === scope() || canAssignTo(person(t.assignee) || {})) ? `<select class="status-select" data-task-status="${t.id}">${options(["To do", "In progress", "In review", "Done"], t.status)}</select>` : badge(t.status)}</div><div>${SHARED_WRITES_ENABLED ? `<button class="btn ghost small" data-action="add-update" data-id="${t.id}">＋ Update</button>` : ""}</div></div>`,
          )
          .join("")
      : '<div class="empty"><strong>Nothing on the board.</strong>Tasks for your role will show up here.</div>');
}

function renderCalendar() {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  $("calendarMonthLabel").textContent = calendarMonth.toLocaleDateString(
    undefined,
    { month: "long", year: "numeric" },
  );
  const tasks = allowedTasks()
    .filter((task) => {
      if (!task.due) return false;
      const due = new Date(`${task.due}T00:00:00`);
      return due.getFullYear() === year && due.getMonth() === month;
    })
    .sort((a, b) => a.due.localeCompare(b.due));
  $("calendarList").innerHTML = tasks.length
    ? tasks
        .map(
          (task) =>
            `<div class="row"><div><div class="row-title">${esc(task.title)}</div><div class="row-sub">${esc(task.project || task.department || "Club-wide")} · ${esc(personName(task.assignee))}</div></div><div>${new Date(`${task.due}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div><div>${badge(task.status)}</div></div>`,
        )
        .join("")
    : '<div class="empty"><strong>No deadlines this month.</strong>Tasks with due dates will appear here.</div>';
}

function renderAdministration() {
  if (!isAdmin()) return;
  const pending = db.members.filter(
    (member) => member.status === "Pending invitation",
  );
  $("adminStats").innerHTML = [
    ["Members", db.members.length, "♙", "club profiles"],
    ["Pending", pending.length, "✉", "invitation setup"],
    ["Departments", db.departments.length, "⌘", "skill teams"],
  ]
    .map(
      ([label, value, icon, foot]) =>
        `<div class="stat"><div class="stat-label"><span class="stat-ico">${icon}</span>${label}</div><strong>${value}</strong><div class="stat-foot">${foot}</div></div>`,
    )
    .join("");
  $("pendingInvitations").innerHTML = pending.length
    ? pending
        .map(
          (member) =>
            `<div class="row"><div><div class="row-title">${esc(member.name)}</div><div class="row-sub">${esc(member.email)}</div></div><span class="badge role">Pending invitation</span></div>`,
        )
        .join("")
    : '<div class="empty"><strong>Everyone is set up.</strong>New profiles waiting to register will appear here.</div>';
}

function exportCalendar() {
  const tasks = allowedTasks().filter((task) => task.due);
  if (!tasks.length) {
    alert("There are no task deadlines to export yet.");
    return;
  }
  const escapeIcs = (value: string) =>
    String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const events = tasks
    .map((task) => {
      const start = task.due.replace(/-/g, "");
      const end = new Date(Date.parse(`${task.due}T00:00:00Z`) + 86400000)
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");
      const description = [
        task.description,
        `Assignee: ${personName(task.assignee)}`,
        `Status: ${task.status}`,
        `Priority: ${task.priority}`,
        task.project || task.department || "",
      ]
        .filter(Boolean)
        .join("\n");
      return [
        "BEGIN:VEVENT",
        `UID:${escapeIcs(task.id)}@vines-club-hub`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${escapeIcs(task.title)}`,
        `DESCRIPTION:${escapeIcs(description)}`,
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");
  const content = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Vines Club Hub//EN\r\nCALSCALE:GREGORIAN\r\n${events}\r\nEND:VCALENDAR\r\n`;
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/calendar;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "vines-club-tasks.ics";
  link.click();
  URL.revokeObjectURL(url);
}
function renderStructure() {
  $("departmentCard").classList.toggle("hidden", structureMode === "projects");
  $("projectCard").classList.toggle("hidden", structureMode === "departments");
  let dlist =
    isAdmin() || isExecutive()
      ? db.departments
      : db.departments.filter((d) =>
          isHeadRole() ? d.head === scope() : true,
        );
  $("deptList").innerHTML = dlist
    .map(
      (d) =>
        `<div class="row"><div><div class="row-title">${esc(d.name)}</div><div class="row-sub">${db.members.filter((m) => deptsOf(m).includes(d.name)).length} people · Head: ${esc(personName(d.head))}</div></div></div>`,
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
        `<div class="row"><div><div class="row-title">${esc(p.name)}</div><div class="row-sub">${db.members.filter((m) => m.projects.includes(p.name)).length} people · Lead: ${esc(personName(p.lead))}</div></div></div>`,
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
  $("memberForm").onsubmit = async (e) => {
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
    const isNewMember = !m.id;
    if (m.id) Object.assign(m, data);
    else db.members.push({ id: uid(), ...data });
    const savedMember = m.id ? m : db.members.at(-1);
    if (headRole === "Department Head") {
      let d = db.departments.find((x) => x.name === scopeValue);
      if (d) d.head = m.id || db.members.at(-1).id;
    }
    if (headRole === "Project Head") {
      let p = db.projects.find((x) => x.name === scopeValue);
      if (p) p.lead = m.id || db.members.at(-1).id;
    }
    closeModal();
    const saved = await save();
    if (!saved) return;
    if (isNewMember) {
      try {
        await sendInvitation(savedMember.email);
        alert(
          `Profile saved and an invitation was sent to ${savedMember.email}.`,
        );
      } catch (error) {
        alert(
          `Profile saved as pending. The invitation was not sent: ${error instanceof Error ? error.message : "Check the Supabase email settings."}`,
        );
      }
    }
  };
}
function taskForm() {
  if (!isAdmin() && !isExecutive() && !isHeadRole()) return;
  const globalManager = isAdmin() || isExecutive();
  const managedProjects = db.projects.filter((p) => p.lead === scope());
  const managedDepartments = db.departments.filter((d) => d.head === scope());
  const projects = globalManager ? db.projects : managedProjects;
  const departments = globalManager ? db.departments : managedDepartments;
  const visible = allowedMembers().filter(canAssignTo);
  const projectRequired = !globalManager && projects.length > 0;
  const departmentRequired = !globalManager && !projectRequired;
  openModal(
    "Put a task in motion",
    `<form class="form" id="taskForm"><div class="field full"><label>Task name</label><input name="title" required placeholder="e.g. Cut the opening 20 seconds"></div><div class="field full"><label>Brief</label><textarea name="description" rows="2" placeholder="What should the finished work include?"></textarea></div><div class="field"><label>Assign to</label><select name="assignee" required><option value="">Choose a member</option>${visible
      .map(
        (m) =>
          `<option value="${m.id}">${esc(m.name)} · ${esc(m.department)}</option>`,
      )
      .join(
        "",
      )}</select></div><div class="field ${projects.length ? "" : "hidden"}"><label>Project</label><select name="project" ${projectRequired ? "required" : ""}><option value="">${projectRequired ? "Choose a project" : "Department-only task"}</option>${options(projects.map((p) => p.name))}</select></div><div class="field ${departments.length ? "" : "hidden"}"><label>Department</label><select name="department" ${departmentRequired ? "required" : ""}><option value="">${departmentRequired ? "Choose your department" : "Select department (optional)"}</option>${options(departments.map((d) => d.name))}</select></div><div class="field"><label>Deadline</label><input type="date" name="due"></div><div class="field"><label>Priority</label><select name="priority">${options(["Medium", "High", "Urgent", "Low"], "Medium")}</select></div><div class="field"><label>Status</label><select name="status">${options(["To do", "In progress", "In review", "Done"], "To do")}</select></div><div class="form-actions"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button class="btn lime">Assign task</button></div></form>`,
  );
  $("taskForm").onsubmit = (e) => {
    e.preventDefault();
    let v = Object.fromEntries(new FormData(e.target as HTMLFormElement));
    db.tasks.unshift({
      id: uid(),
      ...v,
      assigner: scope(),
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
async function resendMemberInvitation(id: string) {
  if (!isAdmin()) return;
  const member = person(id);
  if (!member || member.status !== "Pending invitation") return;
  try {
    await sendInvitation(member.email);
    alert(`An invitation was sent to ${member.email}.`);
  } catch (error) {
    alert(
      error instanceof Error ? error.message : "Could not send the invitation.",
    );
  }
}
function editLead(type, n) {
  if (!isAdmin() && !isExecutive()) return;
  let record =
    type === "department"
      ? db.departments.find((x) => x.name === n)
      : db.projects.find((x) => x.name === n);
  if (!record) return;
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
    .then(async (text) => {
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
      if (!(await save())) return;
      let sent = 0,
        failed = 0;
      for (const member of made) {
        try {
          await sendInvitation(member.email);
          sent++;
        } catch {
          failed++;
        }
      }
      alert(
        `${made.length} profiles saved. ${sent} invitation${sent === 1 ? "" : "s"} sent${failed ? `; ${failed} not sent. Check Supabase email delivery settings and try those again.` : "."}`,
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
    case "resend-invitation":
      void resendMemberInvitation(target.dataset.id || "");
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
$("calendarPrev").onclick = () => {
  calendarMonth = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() - 1,
    1,
  );
  renderCalendar();
};
$("calendarNext").onclick = () => {
  calendarMonth = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    1,
  );
  renderCalendar();
};
$("exportCalendar").onclick = exportCalendar;
$("adminAddMember").onclick = () => {
  if (isAdmin()) {
    show("members");
    memberForm();
  }
};
$("addDept").onclick = () => {
  let n = $("deptName").value.trim();
  if (
    n &&
    !db.departments.some((d) => d.name.toLowerCase() === n.toLowerCase())
  ) {
    db.departments.push({
      id: uid(),
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
      id: uid(),
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
showAuthGate();
void initializeSupabase();
