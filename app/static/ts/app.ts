import { addDays, esc, parseCsv, ymd } from "./lib";
import {
  PRIORITIES,
  WORKING_STATUSES,
  canComplete,
  canDivide,
  canEditDetails,
  canManage,
  canRequestChange,
  canReview,
  progressOf,
  responsible,
  statusClass,
  unmetDependencies,
  type RuleContext,
} from "./task-rules";
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
        status: t.status || (t.assignee ? "Not Started" : "Unassigned"),
        projects: t.projects || [t.project].filter(Boolean),
        departments: t.departments || [t.department].filter(Boolean),
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
  structureSelection: { kind: string; name: string } | null = null,
  structureDetailKey = "",
  structureDetailTimer = 0,
  animateStructureClose = false,
  calendarDate = new Date(),
  calendarView: "month" | "week" | "day" = "month",
  calendarMine = false,
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
  profileSetupPending = false,
  profileFormOwner = "",
  openingSessionFor = "";
const $ = (id: string): any => document.getElementById(id) as any;

function authNotice(message = "", isError = false) {
  const notice = $("authMessage");
  notice.textContent = message;
  notice.classList.toggle("error", isError);
}

// "/" is the hub and "/login" is the sign-in page. These two fixed paths are the
// only places the app ever sends the browser; nothing from the URL is used.
const HUB_PATH = "/";
const LOGIN_PATH = "/login";
const onLoginPage = window.location.pathname.replace(/\/+$/, "") === LOGIN_PATH;
const AUTH_NOTICE_KEY = "vines-auth-notice";

function go(path: typeof HUB_PATH | typeof LOGIN_PATH) {
  window.location.replace(path);
}
// Exactly one screen is ever visible: the loading splash, sign-in, or the hub.
function reveal(which: "gate" | "profile" | "app") {
  $("bootSplash").classList.add("hidden");
  $("authGate").classList.toggle("hidden", which !== "gate");
  $("profileGate").classList.toggle("hidden", which !== "profile");
  $("appShell").classList.toggle("hidden", which !== "app");
}

// ---- Profile details: faculties, years, photo ----------------------------
// Every faculty is a 4-year programme except Engineering (5 years).
const FACULTIES = [
  "Engineering",
  "Computer Science",
  "Business Informatics",
  "Digital Arts and Design",
];
// Phone numbers default to Egypt. Stored as +<country code><number>.
const COUNTRIES: { name: string; dial: string }[] = [
  { name: "Egypt", dial: "20" },
  { name: "Saudi Arabia", dial: "966" },
  { name: "United Arab Emirates", dial: "971" },
  { name: "Kuwait", dial: "965" },
  { name: "Qatar", dial: "974" },
  { name: "Jordan", dial: "962" },
  { name: "Libya", dial: "218" },
  { name: "Sudan", dial: "249" },
  { name: "Germany", dial: "49" },
  { name: "United Kingdom", dial: "44" },
  { name: "United States / Canada", dial: "1" },
];
function splitPhone(phone: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  const match = [...COUNTRIES]
    .sort((x, y) => y.dial.length - x.dial.length)
    .find((c) => digits.startsWith(c.dial));
  return match
    ? { dial: match.dial, number: digits.slice(match.dial.length) }
    : { dial: "20", number: digits };
}
// Returns the +E.164 number, "" when empty, or null when it is not valid.
function normalizePhone(dial: string, raw: string): string | null {
  let digits = String(raw || "").replace(/[\s\-().]/g, "");
  if (!digits) return "";
  if (!/^\d+$/.test(digits)) return null;
  digits = digits.replace(/^0+/, "");
  if (dial === "20")
    return /^1[0125]\d{8}$/.test(digits) ? "+20" + digits : null;
  return digits.length >= 6 && digits.length <= 12 ? "+" + dial + digits : null;
}
const YEAR_NAMES = ["1st", "2nd", "3rd", "4th", "5th"];
function yearsFor(faculty: string) {
  return faculty === "Engineering" ? 5 : 4;
}
function splitName(full: string) {
  const parts = String(full || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") };
}
function avatarUrl(path: string) {
  if (!supabase || !path) return "";
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}
function setAvatar(el: HTMLElement, path: string, name: string) {
  const url = avatarUrl(path);
  el.style.backgroundImage = url ? `url("${url}")` : "";
  el.textContent = url ? "" : initials(name);
}
function profileMissing(profile: any) {
  const missing: string[] = [];
  if (!profile?.avatar_path) missing.push("profile photo");
  if (!profile?.phone) missing.push("phone number");
  if (!profile?.faculty) missing.push("faculty");
  if (!profile?.study_year) missing.push("year of study");
  return missing;
}
// A square, 400px JPEG keeps photos small and consistent.
function squarePhoto(file: File): Promise<{ blob: Blob; preview: string }> {
  return new Promise((resolve, reject) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      return reject(new Error("Choose a JPG, PNG or WebP image."));
    if (file.size > 8 * 1024 * 1024)
      return reject(new Error("That photo is too large. Use one under 8 MB."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that photo."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not read that photo."));
      image.onload = () => {
        const side = Math.min(image.width, image.height);
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 400;
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("Could not process the photo."));
        context.drawImage(
          image,
          (image.width - side) / 2,
          (image.height - side) / 2,
          side,
          side,
          0,
          0,
          400,
          400,
        );
        const preview = canvas.toDataURL("image/jpeg", 0.85);
        canvas.toBlob(
          (blob) =>
            blob
              ? resolve({ blob, preview })
              : reject(new Error("Could not process the photo.")),
          "image/jpeg",
          0.85,
        );
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

// One form, mounted in two places: the first-login step and My profile.
function mountProfileForm(
  host: HTMLElement,
  prefix: string,
  profile: any,
  options: { submitLabel: string; stacked: boolean; onSaved: () => void },
) {
  const names = splitName(profile.name);
  const phoneParts = splitPhone(profile.phone || "");
  const state = {
    blob: null as Blob | null,
    path: profile.avatar_path || "",
    previous: profile.avatar_path || "",
  };
  const facultyOptions = [...FACULTIES];
  if (profile.faculty && !facultyOptions.includes(profile.faculty))
    facultyOptions.push(profile.faculty);
  host.innerHTML = `<form class="pf" novalidate>
    <div class="pf-photo">
      <div class="pf-avatar" id="${prefix}Avatar" aria-hidden="true"></div>
      <div class="pf-photo-actions">
        <div class="pf-photo-buttons">
          <button class="btn ghost" type="button" id="${prefix}Upload">Upload a photo</button>
          <button class="btn ghost" type="button" id="${prefix}Remove">Remove</button>
        </div>
        <div class="pf-hint">JPG, PNG or WebP. Square works best. You can change it later.</div>
        <input type="file" id="${prefix}File" accept="image/jpeg,image/png,image/webp" hidden />
      </div>
    </div>
    <div class="pf-row">
      <div class="pf-field"><label for="${prefix}First">First name</label>
        <input id="${prefix}First" autocomplete="given-name" maxlength="60" value="${esc(names.first)}" /></div>
      <div class="pf-field"><label for="${prefix}Last">Last name</label>
        <input id="${prefix}Last" autocomplete="family-name" maxlength="60" value="${esc(names.last)}" /></div>
    </div>
    <div class="pf-hint" style="margin-top:-10px">Filled in from the name on your invitation. Change it if it is not right.</div>
    <div class="pf-field"><label for="${prefix}Email">Email</label>
      <input id="${prefix}Email" type="email" readonly value="${esc(profile.email)}" />
      <div class="pf-hint">Your email is tied to your invitation and can only be changed by the system admin.</div></div>
    <div class="pf-field"><label for="${prefix}Phone">Phone number</label>
      <div class="pf-phone">
        <select id="${prefix}Dial" aria-label="Country code">${COUNTRIES.map((c) => `<option value="${c.dial}" ${c.dial === phoneParts.dial ? "selected" : ""}>${esc(c.name)} (+${c.dial})</option>`).join("")}</select>
        <input id="${prefix}Phone" type="tel" inputmode="tel" autocomplete="tel-national" maxlength="20" value="${esc(phoneParts.number)}" placeholder="10 1234 5678" />
      </div>
      <div class="pf-hint">Egypt is selected by default. Club leaders and teammates on your projects can see it.</div></div>
    <div class="pf-row">
      <div class="pf-field"><label for="${prefix}Faculty">Faculty</label>
        <select id="${prefix}Faculty"><option value="">Choose your faculty</option>${options_(facultyOptions, profile.faculty || "")}</select></div>
      <div class="pf-field"><label for="${prefix}Year">Year of study</label>
        <select id="${prefix}Year"></select></div>
    </div>
    <div class="pf-error" id="${prefix}Error" role="alert"></div>
    <div class="pf-actions${options.stacked ? " stacked" : ""}">
      <button class="btn lime" type="submit" id="${prefix}Save">${esc(options.submitLabel)}</button>
      ${options.stacked ? "" : `<button class="btn ghost" type="button" id="${prefix}Cancel">Cancel</button>`}
    </div></form>`;
  const q = (id: string): any => host.querySelector("#" + prefix + id);
  const fillYears = (selected: string) => {
    const count = yearsFor(q("Faculty").value);
    q("Year").innerHTML =
      `<option value="">Choose your year</option>` +
      YEAR_NAMES.slice(0, count)
        .map(
          (name, i) =>
            `<option value="${i + 1}" ${String(i + 1) === selected ? "selected" : ""}>${name} year</option>`,
        )
        .join("");
  };
  fillYears(profile.study_year ? String(profile.study_year) : "");
  q("Faculty").onchange = () => {
    const kept = q("Year").value;
    fillYears(Number(kept) <= yearsFor(q("Faculty").value) ? kept : "");
  };
  const showAvatar = (preview = "") => {
    const box = q("Avatar");
    const name = `${q("First").value} ${q("Last").value}`;
    if (preview) box.style.backgroundImage = `url("${preview}")`;
    else if (state.path && !state.blob)
      box.style.backgroundImage = `url("${avatarUrl(state.path)}")`;
    else box.style.backgroundImage = "";
    const has = Boolean(
      preview || (state.path && !state.blob && avatarUrl(state.path)),
    );
    box.classList.toggle("has-photo", has);
    box.textContent = has ? "" : initials(name);
    q("Remove").hidden = !has;
  };
  showAvatar();
  q("First").oninput = q("Last").oninput = () => {
    if (!q("Avatar").classList.contains("has-photo")) showAvatar();
  };
  q("Upload").onclick = () => q("File").click();
  q("File").onchange = async (event: any) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const photo = await squarePhoto(file);
      state.blob = photo.blob;
      q("Error").textContent = "";
      showAvatar(photo.preview);
    } catch (error) {
      q("Error").textContent =
        error instanceof Error ? error.message : "Could not use that photo.";
    }
  };
  q("Remove").onclick = () => {
    state.blob = null;
    state.path = "";
    showAvatar();
  };
  const cancel = q("Cancel");
  if (cancel) cancel.onclick = () => options.onSaved();
  const submit = host.querySelector("form") as HTMLFormElement;
  submit.onsubmit = async (event) => {
    event.preventDefault();
    const first = q("First").value.trim();
    const last = q("Last").value.trim();
    const faculty = q("Faculty").value;
    const year = q("Year").value ? Number(q("Year").value) : null;
    const phone = normalizePhone(q("Dial").value, q("Phone").value);
    q("Error").textContent = "";
    if (phone === null) {
      q("Error").textContent =
        q("Dial").value === "20"
          ? "Enter an Egyptian mobile number, like 010 1234 5678."
          : "Enter a valid phone number.";
      return;
    }
    if (!first) {
      q("Error").textContent = "Enter your first name.";
      return;
    }
    if (year && year > yearsFor(faculty)) {
      q("Error").textContent = "Choose a valid year for that faculty.";
      return;
    }
    const button = q("Save");
    button.disabled = true;
    try {
      await saveOwnProfile({
        name: `${first} ${last}`.trim(),
        faculty,
        year,
        phone,
        blob: state.blob,
        path: state.path,
        previous: state.previous,
        status: faculty && year && phone ? "Complete" : "Pending",
      });
      options.onSaved();
    } catch (error) {
      q("Error").textContent =
        error instanceof Error ? error.message : "Could not save your profile.";
    } finally {
      button.disabled = false;
    }
  };
}
function options_(list: string[], selected: string) {
  return options(list, selected);
}

async function saveOwnProfile(input: {
  name: string;
  faculty: string;
  year: number | null;
  phone: string;
  blob: Blob | null;
  path: string;
  previous: string;
  status: "Pending" | "Skipped" | "Complete";
}) {
  if (!supabase || !authProfile) throw new Error("You are not signed in.");
  let path = input.path;
  if (input.blob) {
    path = `${authProfile.id}/avatar-${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, input.blob, { contentType: "image/jpeg" });
    if (error)
      throw new Error(
        "Your photo could not be uploaded. Try a smaller image or try again.",
      );
  }
  const { error } = await supabase.rpc("update_own_profile", {
    p_name: input.name,
    p_faculty: input.faculty || null,
    p_study_year: input.year,
    p_avatar_path: path || null,
    p_profile_status: input.status,
    p_phone: input.phone || null,
  });
  if (error) {
    if (input.blob) await supabase.storage.from("avatars").remove([path]);
    throw new Error(
      error.message.includes("function")
        ? "Profile saving is not set up in Supabase yet. Ask the system admin to run shared-app/profile-update.sql."
        : error.message,
    );
  }
  if (input.previous && input.previous !== path)
    void supabase.storage.from("avatars").remove([input.previous]);
  applyOwnProfile({
    name: input.name,
    faculty: input.faculty || null,
    study_year: input.year,
    avatar_path: path || null,
    profile_status: input.status,
    phone: input.phone || null,
  });
}
// Keep the signed-in profile and the loaded member list in step with the save.
function applyOwnProfile(fields: any) {
  Object.assign(authProfile, fields);
  const map: Record<string, string> = {
    name: "name",
    faculty: "faculty",
    study_year: "studyYear",
    avatar_path: "avatarPath",
    profile_status: "profileStatus",
    phone: "phone",
  };
  for (const list of [db, syncedDb]) {
    const me = list?.members?.find((m: any) => m.id === authProfile.id);
    if (!me) continue;
    for (const [column, key] of Object.entries(map))
      if (column in fields)
        me[key] = fields[column] ?? (key === "phone" ? "" : null);
  }
  paintChip();
  render();
}
function paintChip() {
  if (!authProfile) return;
  $("signedInAs").textContent = authProfile.name || authProfile.email;
  setAvatar($("chipAvatar"), authProfile.avatar_path, authProfile.name);
}

const STEPS = [
  "Create your password",
  "Complete your profile",
  "Open your workspace",
];
// The left-hand panel changes with the step the person is on.
function setAuthSide(mode: "login" | "invite" | "recovery" | "profile") {
  const copy = {
    login: [
      "Welcome to Vines",
      "Make something people remember.",
      "People bring the skills. Projects bring the stories. This is where they meet.",
    ],
    invite: [
      "You are invited",
      "Join the crew in three quick steps.",
      "Create a password, tell us a little about yourself, and you are in.",
    ],
    recovery: [
      "Almost back in",
      "Choose a new password.",
      "Pick something you have not used before. You will be signed in right after.",
    ],
    profile: [
      "Welcome to Vines",
      "Tell us who is joining the crew.",
      "A photo, your faculty and your year help department heads and teammates know who they are working with.",
    ],
  }[mode];
  const step = mode === "invite" ? 0 : mode === "profile" ? 1 : -1;
  document
    .querySelectorAll<HTMLElement>("[data-pitch-kicker]")
    .forEach((el) => {
      el.textContent = copy[0];
    });
  document.querySelectorAll<HTMLElement>("[data-pitch-title]").forEach((el) => {
    el.textContent = copy[1];
  });
  document.querySelectorAll<HTMLElement>("[data-pitch-copy]").forEach((el) => {
    el.textContent = copy[2];
  });
  document
    .querySelectorAll<HTMLElement>("[data-auth-steps]")
    .forEach((list) => {
      list.hidden = step < 0;
      list.innerHTML = STEPS.map((label, i) => {
        const state = i < step ? "done" : i === step ? "current" : "";
        return `<li class="${state}"><span class="dot" aria-hidden="true">${i < step ? "✓" : i + 1}</span>${esc(label)}</li>`;
      }).join("");
    });
  $("authEyebrow").textContent =
    mode === "invite" ? "Step 1 of 3" : "Members workspace";
}
// A message for the sign-in page survives the redirect in sessionStorage, not
// in the URL, and is only ever shown as text.
function rememberNotice(message: string, isError: boolean) {
  try {
    sessionStorage.setItem(
      AUTH_NOTICE_KEY,
      JSON.stringify({ message, isError }),
    );
  } catch {
    /* storage unavailable: the message is simply not carried over */
  }
}
function takeNotice(): { message: string; isError: boolean } | null {
  try {
    const raw = sessionStorage.getItem(AUTH_NOTICE_KEY);
    sessionStorage.removeItem(AUTH_NOTICE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return typeof parsed?.message === "string"
      ? {
          message: parsed.message.slice(0, 300),
          isError: parsed.isError === true,
        }
      : null;
  } catch {
    return null;
  }
}
// Show the sign-in form when already on /login, otherwise move to /login.
function sendToLogin(message = "", isError = false) {
  forgetSetup();
  if (onLoginPage) {
    showAuthGate(message, isError);
    return;
  }
  rememberNotice(message, isError);
  go(LOGIN_PATH);
}
// The token an invitation or reset link arrived with. It is read here, before
// the Supabase client consumes and clears the address-bar hash.
const linkToken =
  new URLSearchParams(window.location.hash.slice(1)).get("access_token") || "";
// While someone is choosing a password after such a link, remember it for that
// user only, so a refresh keeps the screen but a typed-in URL cannot start it.
const SETUP_KEY = "vines-password-setup";
// Browser tabs share one sign-in. While a password is being set in one tab, every other
// Vines tab must leave that new session alone (it cannot read a not-yet-registered
// profile and would otherwise sign the invitee out from under the setup screen).
const SETUP_LOCK = "vines-setup-lock";
let ownsSetupLock = false;
function lockSetup(userId = "") {
  ownsSetupLock = true;
  try {
    localStorage.setItem(SETUP_LOCK, JSON.stringify({ userId, at: Date.now() }));
  } catch {
    /* storage unavailable: other tabs just are not told */
  }
}
function unlockSetup() {
  if (!ownsSetupLock) return; // another tab's setup is not ours to end
  ownsSetupLock = false;
  try {
    localStorage.removeItem(SETUP_LOCK);
  } catch {
    /* nothing to clear */
  }
}
function setupLockedElsewhere(userId: string) {
  try {
    const lock = JSON.parse(localStorage.getItem(SETUP_LOCK) || "null");
    return (
      Boolean(lock) &&
      Date.now() - Number(lock.at) < 30 * 60 * 1000 &&
      (!lock.userId || lock.userId === userId)
    );
  } catch {
    return false;
  }
}
function rememberSetup(flow: string, userId: string) {
  lockSetup(userId);
  try {
    sessionStorage.setItem(SETUP_KEY, JSON.stringify({ flow, userId }));
  } catch {
    /* storage unavailable: the screen simply will not survive a refresh */
  }
}
function pendingSetup(userId: string): "invite" | "recovery" | "" {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SETUP_KEY) || "null");
    return saved?.userId === userId &&
      (saved.flow === "invite" || saved.flow === "recovery")
      ? saved.flow
      : "";
  } catch {
    return "";
  }
}
function forgetSetup() {
  unlockSetup();
  try {
    sessionStorage.removeItem(SETUP_KEY);
  } catch {
    /* nothing to clear */
  }
}
// Only the two known invitation/reset values are honoured; anything else in the
// URL is ignored.
function readSetupFlow(): "invite" | "recovery" | "" {
  const value =
    new URLSearchParams(window.location.search).get("flow") ||
    new URLSearchParams(window.location.hash.slice(1)).get("type") ||
    "";
  return value === "invite" || value === "recovery" ? value : "";
}
// Drop any query string or hash (tokens, injected text) once it has been read.
function tidyUrl() {
  if (window.location.search || window.location.hash)
    window.history.replaceState(null, "", window.location.pathname);
}

function showAuthGate(message = "", isError = false) {
  reveal("gate");
  $("loginForm").classList.remove("hidden");
  $("forgotForm").classList.add("hidden");
  $("setPasswordForm").classList.add("hidden");
  $("authTitle").textContent = "Welcome back";
  $("authCopy").textContent =
    "Sign in with the email and password from your Vines invitation.";
  setAuthSide("login");
  authNotice(message, isError);
}

async function openWorkspace(user: any) {
  if (!supabase || !user?.email) return;
  if (passwordSetupFlow) {
    reveal("gate");
    $("loginForm").classList.add("hidden");
    $("setPasswordForm").classList.remove("hidden");
    return;
  }
  if (setupLockedElsewhere(user.id)) return;
  if (sessionReady && authUser?.id === user.id) return;
  if (openingSessionFor === user.id) return;
  openingSessionFor = user.id;
  const { data: profile, error } = await supabase
    .from("members")
    .select(
      "id,name,email,club_role,is_club_admin,is_club_owner,status,faculty,study_year,avatar_path,profile_status",
    )
    .ilike("email", user.email)
    .maybeSingle();
  if (error || !profile) {
    openingSessionFor = "";
    await supabase.auth.signOut();
    sendToLogin(
      "This email is not linked to a Vines member profile. Ask the system admin for help.",
      true,
    );
    return;
  }
  if (profile.status !== "Active") {
    openingSessionFor = "";
    await supabase.auth.signOut();
    sendToLogin(
      "Your Vines invitation is not active yet. Ask the system admin to check your profile.",
      true,
    );
    return;
  }

  if (onLoginPage) {
    // Signed in from the sign-in page: the hub loads its own data.
    go(HUB_PATH);
    return;
  }
  authUser = user;
  authProfile = profile;
  // Phone numbers live in their own table with narrower read rules.
  const contact = await supabase
    .from("member_contacts")
    .select("phone")
    .eq("member_id", profile.id)
    .maybeSingle();
  authProfile.phone = contact.data?.phone || "";
  // Fetched together so the hub opens after one round trip, not four.
  const [positionsResult, catalogResult, workspace] = await Promise.all([
    supabase
      .from("member_positions")
      .select("position_id,department_id,project_id")
      .eq("member_id", profile.id),
    supabase.from("positions").select("id,name"),
    loadSharedWorkspace().then(
      (value) => ({ value, failure: null as unknown }),
      (failure: unknown) => ({ value: null as any, failure }),
    ),
  ]);
  if (positionsResult.error || catalogResult.error) {
    openingSessionFor = "";
    await supabase.auth.signOut();
    sendToLogin(
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
    if (workspace.failure) throw workspace.failure;
    db = workspace.value;
    if (
      db.departments.some((department: any) => department.head === profile.id)
    )
      currentPositions.push("Department Head");
    if (db.projects.some((project: any) => project.lead === profile.id))
      currentPositions.push("Project Head");
    currentPositions = [...new Set(currentPositions)];
    if (!profile.is_club_admin) {
      role =
        ["President", "Vice President", "Department Head", "Project Head"].find(
          (position) => currentPositions.includes(position),
        ) || profile.club_role;
    }
  } catch (loadError) {
    openingSessionFor = "";
    await supabase.auth.signOut();
    sendToLogin(
      loadError instanceof Error
        ? loadError.message
        : "Could not load the shared workspace.",
      true,
    );
    return;
  }
  sessionReady = true;
  startLiveUpdates();
  syncedDb = structuredClone(db);
  openingSessionFor = "";
  paintChip();
  render();
  // Right after accepting an invitation, offer the profile step (skippable).
  if (profileSetupPending && profile.profile_status === "Pending") {
    profileSetupPending = false;
    showProfileSetup();
    return;
  }
  profileSetupPending = false;
  reveal("app");
}

function showProfileSetup() {
  setAuthSide("profile");
  mountProfileForm($("profileSetupHost"), "ps", authProfile, {
    submitLabel: "Save and continue",
    stacked: true,
    onSaved: () => {
      reveal("app");
      show("home");
    },
  });
  reveal("profile");
}
$("profileLater").addEventListener("click", async () => {
  const button = $("profileLater");
  button.disabled = true;
  try {
    if (supabase && authProfile && authProfile.profile_status === "Pending") {
      await supabase.rpc("update_own_profile", {
        p_name: authProfile.name,
        p_faculty: authProfile.faculty || null,
        p_study_year: authProfile.study_year || null,
        p_avatar_path: authProfile.avatar_path || null,
        p_profile_status: "Skipped",
        p_phone: authProfile.phone || null,
      });
      applyOwnProfile({ profile_status: "Skipped" });
    }
  } catch {
    /* skipping never blocks the person from entering the workspace */
  }
  button.disabled = false;
  reveal("app");
  show("home");
});

async function initializeSupabase() {
  try {
    const configResponse = await fetch("/api/config", { cache: "no-store" });
    const config = await configResponse.json();
    if (!config.supabaseUrl || !config.supabasePublishableKey)
      throw new Error(
        "Supabase settings are not configured for this site yet.",
      );

    // The link's session is about to be stored where every tab can see it.
    if (!onLoginPage && linkToken && readSetupFlow()) lockSetup();
    supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    const requestedFlow = onLoginPage ? "" : readSetupFlow();
    const { data } = await supabase.auth.getSession();
    // An invitation or reset link counts only if the session Supabase created is
    // the one carried in that very link. A forged or stale URL changes nothing.
    let flow: "invite" | "recovery" | "" = "";
    if (!onLoginPage && data.session) {
      const linkWorked =
        requestedFlow !== "" &&
        linkToken !== "" &&
        data.session.access_token === linkToken;
      if (linkWorked) {
        flow = requestedFlow;
        rememberSetup(flow, data.session.user.id);
      } else flow = pendingSetup(data.session.user.id);
    }
    if (!flow) unlockSetup();
    inviteSetupFlow = flow === "invite";
    passwordSetupFlow = flow !== "";
    if (passwordSetupFlow) {
      $("loginForm").classList.add("hidden");
      $("setPasswordForm").classList.remove("hidden");
      $("authTitle").textContent = "Create your password";
      $("authCopy").textContent =
        "Create a password to finish setting up your Vines account.";
      setAuthSide(inviteSetupFlow ? "invite" : "recovery");
    }
    // The session (including one carried in an invitation link) has been read.
    if (!passwordSetupFlow) tidyUrl();
    if (data.session) await openWorkspace(data.session.user);
    else if (requestedFlow)
      sendToLogin(
        "This link has expired or was already used. Ask the system admin for a new invitation, or use Forgot password.",
        true,
      );
    else if (onLoginPage) {
      const notice = takeNotice();
      showAuthGate(notice?.message || "", notice?.isError);
    } else sendToLogin();
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
          sendToLogin("You have signed out.");
        }
      }, 0);
    });
  } catch (error) {
    sendToLogin(
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
      .select(
        "id,name,email,club_role,department_id,is_club_admin,is_club_owner,status,faculty,study_year,avatar_path,profile_status",
      ),
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
        "id,title,description,task_type,project_id,department_id,assignee_id,assigned_by,status,priority,due_at,progress_update,parent_task_id,created_by,division_owner_id,updated_at",
      ),
    supabase.from("task_projects").select("task_id,project_id"),
    supabase.from("task_departments").select("task_id,department_id"),
    supabase.from("task_updates").select("task_id,author_id,note,created_at"),
    supabase
      .from("member_positions")
      .select("member_id,position_id,department_id,project_id"),
    supabase.from("positions").select("id,name"),
    supabase.from("member_contacts").select("member_id,phone"),
    supabase.from("pending_plans").select("member_id,plan,expires_at"),
    supabase
      .from("task_requests")
      .select(
        "id,task_id,request_type,requested_by,changes,reason,status,created_at,reviewed_by,reviewed_at,review_note",
      ),
    supabase.from("task_dependencies").select("task_id,depends_on_task_id"),
    supabase
      .from("notifications")
      .select("id,kind,title,body,task_id,created_at,read_at")
      .order("created_at", { ascending: false })
      .limit(50),
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
    taskProjects,
    taskDepartments,
    updates,
    memberPositions,
    positions,
    contacts,
    pendingPlans,
    requestRows,
    dependencyRows,
    notificationRows,
  ] = results.map((result) => result.data || []) as any[][];
  const planByMember = new Map<string, any>(
    pendingPlans.map((item: any) => [item.member_id, item]),
  );
  const phoneByMember = new Map<string, string>(
    contacts.map((item: any) => [item.member_id, item.phone || ""]),
  );
  const departmentNames = new Map<string, string>(
    departments.map((item: any) => [item.id, item.name]),
  );
  const projectNames = new Map<string, string>(
    projects.map((item: any) => [item.id, item.name]),
  );
  const projectsByTask = new Map<string, string[]>();
  taskProjects.forEach((item: any) => {
    const name = projectNames.get(item.project_id);
    if (name) {
      const list = projectsByTask.get(item.task_id) || [];
      if (!list.includes(name)) list.push(name);
      projectsByTask.set(item.task_id, list);
    }
  });
  const departmentsByTask = new Map<string, string[]>();
  taskDepartments.forEach((item: any) => {
    const name = departmentNames.get(item.department_id);
    if (name) {
      const list = departmentsByTask.get(item.task_id) || [];
      if (!list.includes(name)) list.push(name);
      departmentsByTask.set(item.task_id, list);
    }
  });
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
  departments.forEach((item: any) => {
    if (item.head_member_id && !departmentHeads.has(item.id)) {
      departmentHeads.set(item.id, item.head_member_id);
      headScopeByMember.set(
        item.head_member_id,
        departmentNames.get(item.id) || "",
      );
    }
  });
  projects.forEach((item: any) => {
    if (item.project_lead_id && !projectHeads.has(item.id)) {
      projectHeads.set(item.id, item.project_lead_id);
      headScopeByMember.set(
        item.project_lead_id,
        projectNames.get(item.id) || "",
      );
    }
  });
  // Progress is counted in the database, so it is right even when this person sees only some subtasks.
  const progress: Record<string, { total: number; completed: number; blocked: number }> = {};
  const mainIds = tasks.filter((item: any) => !item.parent_task_id).map((item: any) => item.id);
  if (mainIds.length) {
    const counted = await supabase.rpc("get_task_progress", { p_task_ids: mainIds });
    (counted.data || []).forEach((row: any) => {
      progress[row.task_id] = { total: row.total, completed: row.completed, blocked: row.blocked };
    });
  }
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
      head: departmentHeads.get(item.id) || item.head_member_id || "",
    })),
    projects: projects.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      lead: projectHeads.get(item.id) || item.project_lead_id || "",
      status: item.status,
    })),
    members: members.map((item) => {
      const memberDeptList = departmentsByMember.get(item.id) || [];
      const legacyDepartment = departmentNames.get(item.department_id);
      if (legacyDepartment && !memberDeptList.includes(legacyDepartment))
        memberDeptList.push(legacyDepartment);
      const memberPositionNames = [...(rolesByMember.get(item.id) || [])];
      if (
        [...departmentHeads.values()].includes(item.id) &&
        !memberPositionNames.includes("Department Head")
      )
        memberPositionNames.push("Department Head");
      if (
        [...projectHeads.values()].includes(item.id) &&
        !memberPositionNames.includes("Project Head")
      )
        memberPositionNames.push("Project Head");
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
        isClubOwner: Boolean(item.is_club_owner),
        status: item.status,
        faculty: item.faculty || null,
        studyYear: item.study_year || null,
        avatarPath: item.avatar_path || null,
        profileStatus: item.profile_status || "Pending",
        phone: phoneByMember.get(item.id) || "",
        plan: planByMember.get(item.id)?.plan || null,
        planExpires: planByMember.get(item.id)?.expires_at || null,
        departments: memberDeptList,
        department: memberDeptList[0] || "",
        projects: assignmentsByMember.get(item.id) || [],
        positionNames: memberPositionNames,
      };
    }),
    tasks: tasks.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description || "",
      projects:
        projectsByTask.get(item.id) ||
        [projectNames.get(item.project_id)].filter(Boolean),
      departments:
        departmentsByTask.get(item.id) ||
        [departmentNames.get(item.department_id)].filter(Boolean),
      project: projectNames.get(item.project_id) || "",
      department: departmentNames.get(item.department_id) || "",
      assignee: item.assignee_id || "",
      assigner: item.assigned_by,
      status: item.status,
      priority: item.priority,
      due: item.due_at ? String(item.due_at).slice(0, 10) : "",
      update: item.progress_update || "",
      updates: updatesByTask.get(item.id) || [],
      parent: item.parent_task_id || "",
      creator: item.created_by || "",
      divisionOwner: item.division_owner_id || "",
      updatedAt: item.updated_at || "",
    })),
    requests: requestRows.map((item: any) => ({
      id: item.id,
      task: item.task_id,
      type: item.request_type,
      by: item.requested_by,
      changes: item.changes || {},
      reason: item.reason || "",
      status: item.status,
      at: item.created_at,
      reviewedBy: item.reviewed_by || "",
      reviewedAt: item.reviewed_at || "",
      note: item.review_note || "",
    })),
    dependencies: dependencyRows.map((item: any) => ({
      task: item.task_id,
      dependsOn: item.depends_on_task_id,
    })),
    notifications: notificationRows,
    progress,
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

// "Forgot password?" opens its own screen; the email field is pre-filled from sign-in.
$("forgotPassword").addEventListener("click", () => {
  $("forgotEmail").value = String($("loginEmail").value || "").trim();
  $("loginForm").classList.add("hidden");
  $("forgotForm").classList.remove("hidden");
  $("authTitle").textContent = "Reset your password";
  $("authCopy").textContent =
    "Enter the email on your Vines profile and we will send you a link to choose a new password.";
  authNotice("");
  $("forgotEmail").focus();
});
$("forgotBack").addEventListener("click", () => showAuthGate());
$("forgotForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) return authNotice("Supabase is not configured yet.", true);
  const email = String($("forgotEmail").value || "").trim();
  if (!email || !email.includes("@"))
    return authNotice("Enter the email address on your profile.", true);
  const button = $("forgotSend");
  button.disabled = true;
  authNotice("Sending…");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/?flow=recovery`,
  });
  button.disabled = false;
  if (error)
    authNotice(
      error.status === 429
        ? "Too many requests. Wait a few minutes and try again."
        : "The reset email could not be sent. The club's email delivery may not be working yet. Ask the system admin to check the Supabase email settings.",
      true,
    );
  else
    authNotice(
      "If that email belongs to a Vines member, a reset link is on its way. Check your inbox and spam folder.",
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
  profileSetupPending = inviteSetupFlow;
  passwordSetupFlow = false;
  inviteSetupFlow = false;
  forgetSetup();
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

  const removedTasks = before.tasks.filter(
    (old: any) => !after.tasks.some((task: any) => task.id === old.id),
  );
  if (removedTasks.length && !canDeleteTask())
    throw new Error(
      "Only the system admin, President or Vice President can delete tasks.",
    );
  for (const task of removedTasks) {
    // Project links, department links and progress updates go with the task.
    const { data, error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", task.id)
      .select("id");
    if (error) throw new Error(`tasks: ${error.message}`);
    if (!data?.length)
      throw new Error(
        `tasks: "${task.title}" could not be deleted. It may already be gone or you may not have permission.`,
      );
  }

  const changedTasks = after.tasks.filter((task: any) => {
    const old = before.tasks.find((row: any) => row.id === task.id);
    return (
      !old ||
      !same(old, task) ||
      !same(taskProjects(old), taskProjects(task)) ||
      !same(taskDepartments(old), taskDepartments(task))
    );
  });
  if (changedTasks.length) {
    for (const task of changedTasks) {
      const old = before.tasks.find((row: any) => row.id === task.id);
      const projects = taskProjects(task);
      const departments = taskDepartments(task);
      const row: any = {
        id: task.id,
        title: task.title,
        description: task.description || "",
        task_type: projects.length
          ? "Project task"
          : departments.length
            ? "Department task"
            : "Club-wide",
        project_id: byName(after.projects, projects[0] || ""),
        department_id: byName(after.departments, departments[0] || ""),
        assignee_id: task.assignee || null,
        assigned_by: task.assigner || authProfile.id,
        status: task.status || (task.assignee ? "Not Started" : "Unassigned"),
        priority: task.priority || "Medium",
        due_at: task.due ? `${task.due}T23:59:00` : null,
        progress_update: task.update || "",
      };
      if (!old) {
        const { error } = await supabase.from("tasks").insert([row]);
        if (error) throw new Error(`tasks: ${error.message}`);
      } else {
        const allowed: any = {};
        if (old.assignee !== task.assignee)
          allowed.assignee_id = task.assignee || null;
        if (old.assigner !== task.assigner)
          allowed.assigned_by = task.assigner || authProfile.id;
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
      const priorProjects = taskProjects(old || {});
      const priorDepartments = taskDepartments(old || {});
      for (const name of priorProjects.filter(
        (name) => !projects.includes(name),
      )) {
        const projectId = byName(after.projects, name);
        if (projectId)
          await deleteRows("task_projects", {
            task_id: task.id,
            project_id: projectId,
          });
      }
      for (const name of priorDepartments.filter(
        (name) => !departments.includes(name),
      )) {
        const departmentId = byName(after.departments, name);
        if (departmentId)
          await deleteRows("task_departments", {
            task_id: task.id,
            department_id: departmentId,
          });
      }
      const projectRows = projects
        .filter((name) => !priorProjects.includes(name))
        .map((name) => ({
          task_id: task.id,
          project_id: byName(after.projects, name),
        }))
        .filter((item: any) => item.project_id);
      const departmentRows = departments
        .filter((name) => !priorDepartments.includes(name))
        .map((name) => ({
          task_id: task.id,
          department_id: byName(after.departments, name),
        }))
        .filter((item: any) => item.department_id);
      if (projectRows.length) {
        const { error } = await supabase
          .from("task_projects")
          .insert(projectRows);
        if (error) throw new Error(`task_projects: ${error.message}`);
      }
      if (departmentRows.length) {
        const { error } = await supabase
          .from("task_departments")
          .insert(departmentRows);
        if (error) throw new Error(`task_departments: ${error.message}`);
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

// Where a not-yet-registered person will be placed once they create a password.
// Kept in an admin-only table; it does not touch any department, project or member list.
async function savePendingPlan(member: any) {
  if (!supabase || !member?.id || !member.plan) return;
  const { error } = await supabase
    .from("pending_plans")
    .upsert({ member_id: member.id, plan: member.plan }, { onConflict: "member_id" });
  if (error) throw new Error(`Could not save the planned role: ${error.message}`);
  // The database starts the 14-day window on first save; mirror it until the next reload.
  const live = db.members.find((m: any) => m.id === member.id) || member;
  if (!live.planExpires)
    live.planExpires = member.planExpires = new Date(
      Date.now() + 14 * 86400000,
    ).toISOString();
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
  const legacyRole =
    m.clubRole === "Department head" || m.clubRole === "Head"
      ? "Department Head"
      : m.clubRole === "Project lead"
        ? "Project Head"
        : m.clubRole;
  const departmentHeadLabels = db.departments
    .filter((department) => department.head === m.id)
    .map((department) => `${department.name} Head`);
  const projectHeadLabels = db.projects
    .filter((project) => project.lead === m.id)
    .map((project) => `${project.name} Head`);
  const labels = [...(m.positionNames || []), legacyRole, m.extraRole].filter(
    (position) => position && position !== "Member",
  );
  if (departmentHeadLabels.length) {
    labels.push(...departmentHeadLabels);
    while (labels.includes("Department Head"))
      labels.splice(labels.indexOf("Department Head"), 1);
  } else if (legacyRole === "Department Head" && m.headScope) {
    labels.push(`${m.headScope} Head`);
    while (labels.includes("Department Head"))
      labels.splice(labels.indexOf("Department Head"), 1);
  }
  if (projectHeadLabels.length) {
    labels.push(...projectHeadLabels);
    while (labels.includes("Project Head"))
      labels.splice(labels.indexOf("Project Head"), 1);
  } else if (legacyRole === "Project Head" && m.headScope) {
    labels.push(`${m.headScope} Head`);
    while (labels.includes("Project Head"))
      labels.splice(labels.indexOf("Project Head"), 1);
  }
  const unique = [...new Set(labels)];
  return unique.length ? unique : ["Member"];
}
function isAdmin() {
  return role === "System admin access";
}
// Only the club owner may grant or revoke system access.
function isOwner() {
  return Boolean(authProfile?.is_club_owner);
}
// President / Vice President, judged by the position rows the database also uses
// (app_private.is_executive). Deliberately separate from isAdmin(): executives manage
// tasks across the whole club but get no system administration.
function isExecutive() {
  return currentPositions.some((position) =>
    ["President", "Vice President"].includes(position),
  );
}
function scope() {
  return selectedPerson || registeredMembers()[0]?.id || "";
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
function badge(s) {
  return `<span class="badge ${statusClass(s)}">${esc(s || "Not Started")}</span>`;
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
// People who have not created a password yet ("Pending invitation") are not members:
// they appear only in the Administration pending list.
function registeredMembers() {
  return db.members.filter((m: any) => m.status !== "Pending invitation");
}
function allowedMembers() {
  return registeredMembers();
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
function managedProjects() {
  return db.projects.filter((project) => project.lead === authProfile?.id);
}
function managedDepartments() {
  return db.departments.filter(
    (department) => department.head === authProfile?.id,
  );
}
function taskProjects(task) {
  return task?.projects?.length
    ? task.projects
    : [task?.project].filter(Boolean);
}
function taskDepartments(task) {
  return task?.departments?.length
    ? task.departments
    : [task?.department].filter(Boolean);
}
function taskScopeLabel(task) {
  return (
    [...taskProjects(task), ...taskDepartments(task)].join(" · ") || "Club-wide"
  );
}
function ruleCtx(): RuleContext {
  return {
    me: authProfile?.id || "",
    isAdmin: isAdmin(),
    isExecutive: isExecutive(),
    isHead: currentPositions.some((position) =>
      ["Project Head", "Department Head"].includes(position),
    ),
    ledProjects: managedProjects().map((project) => project.name),
    managedDepartments: managedDepartments().map((department) => department.name),
    tasks: db.tasks,
    departmentsOf: (id) => {
      const member = person(id);
      return member ? deptsOf(member) : [];
    },
  };
}
function canManageTask(task) {
  return canManage(ruleCtx(), task);
}
function canMarkTaskDone(task) {
  return canComplete(ruleCtx(), task);
}
// Matches the database policy tasks_admin_delete (system admin, President, VP).
function canDeleteTask() {
  return isAdmin() || isExecutive();
}
// Subtasks can also be deleted by whoever created them or answers for the main task.
function canDeleteTaskItem(task) {
  return (
    canDeleteTask() ||
    (Boolean(task.parent) &&
      (task.creator === authProfile?.id ||
        responsible(ruleCtx(), task) === authProfile?.id))
  );
}
function canCreateTask() {
  return (
    isAdmin() ||
    isExecutive() ||
    managedProjects().length > 0 ||
    managedDepartments().length > 0
  );
}
function allowedProjects() {
  return db.projects;
}
function show(view) {
  if (view === "administration" && !isAdmin()) view = "home";
  const previousStructureMode = structureMode;
  if (["departments", "projects"].includes(view)) structureMode = view;
  else if (view === "structure") structureMode = "structure";
  if (structureMode !== previousStructureMode) structureSelection = null;
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
      profile: "My profile",
    }[view] || "Overview";
  if (activeView === "structure") renderStructure();
  if (view === "profile") mountOwnProfile();
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
  fill(
    "taskDepartmentFilter",
    db.departments.map((department) => department.name),
    "All departments",
  );
  let members = registeredMembers()
    .map((m) => `<option value="${m.id}">${esc(m.name)}</option>`)
    .join("");
  $("deptHead").innerHTML =
    '<option value="">Choose a member</option>' + members;
  $("projectLead").innerHTML =
    '<option value="">Choose a member</option>' + members;
  const leader =
    SHARED_WRITES_ENABLED && (isAdmin() || isExecutive() || isHeadRole());
  $("importMembersBtn").classList.toggle("hidden", !leader || !isAdmin());
  $("addDept")
    .closest(".form")
    .classList.toggle("hidden", !leader || !isAdmin());
  $("addProject")
    .closest(".form")
    .classList.toggle("hidden", !leader || !isAdmin());
  $("addTaskBtn").classList.toggle(
    "hidden",
    !SHARED_WRITES_ENABLED || !canCreateTask(),
  );
  $("adminNav").classList.toggle("hidden", !isAdmin());
  renderHome();
  renderNotifications();
  renderMembers();
  renderTasks();
  renderCalendar();
  renderAdministration();
  renderStructure();
  renderProfileInfo();
}
function mountOwnProfile() {
  if (!authProfile) return;
  mountProfileForm($("profileEditHost"), "pe", authProfile, {
    submitLabel: "Save changes",
    stacked: false,
    onSaved: () => {
      mountOwnProfile();
      renderProfileInfo();
    },
  });
}
function renderProfileInfo() {
  if (!authProfile) return;
  const missing = profileMissing(authProfile);
  const total = 5; // photo, name, phone, faculty, year (name is always present)
  const done = total - missing.length;
  const pct = Math.round((done / total) * 100);
  const nudge = $("profileNudge");
  nudge.classList.toggle("hidden", missing.length === 0);
  $("profileNudgeText").textContent = missing.length
    ? `Still missing: ${missing.join(", ")}.`
    : "";
  const banner = $("profileBanner");
  banner.classList.toggle("hidden", missing.length === 0);
  $("profileBannerTitle").textContent = `Your profile is ${pct}% complete`;
  $("profileBannerMissing").textContent = missing.length
    ? `Still missing: ${missing.join(", ")}.`
    : "";
  $("profileMeter").setAttribute("aria-valuenow", String(pct));
  $("profileMeterFill").style.width = pct + "%";
  const me = db.members.find((m: any) => m.id === authProfile.id);
  const chips = (list: string[], empty: string) =>
    `<div class="profile-place-chips">${
      list.length
        ? list.map((x) => `<span class="chip">${esc(x)}</span>`).join("")
        : `<span class="quiet">${empty}</span>`
    }</div>`;
  $("profilePlace").innerHTML = me
    ? `<div class="profile-place-label">Position</div>${chips(memberRoles(me), "Member")}` +
      `<div class="profile-place-label">Departments</div>${chips(deptsOf(me), "No department")}` +
      `<div class="profile-place-label">Projects</div>${chips(me.projects || [], "No project")}`
    : "";
}
$("profileBtn").onclick = () => show("profile");
$("passwordChangeForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase || !authProfile) return;
  const note = $("pwNote");
  const say = (text: string, isError = false) => {
    note.textContent = text;
    note.classList.toggle("error", isError);
  };
  const current = $("pwCurrent").value;
  const next = $("pwNew").value;
  const confirmation = $("pwConfirm").value;
  if (!current) return say("Enter your current password.", true);
  if (next.length < 8)
    return say("Your new password needs at least 8 characters.", true);
  if (next !== confirmation)
    return say("The new passwords do not match.", true);
  if (next === current)
    return say("Choose a password different from your current one.", true);
  $("pwSave").disabled = true;
  try {
    // Confirm it is really the account owner before changing anything.
    const check = await supabase.auth.signInWithPassword({
      email: authProfile.email,
      password: current,
    });
    if (check.error) return say("Your current password is not correct.", true);
    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) return say("Could not change the password. Try again.", true);
    $("passwordChangeForm").reset();
    say("Password changed. Use it the next time you sign in.");
  } finally {
    $("pwSave").disabled = false;
  }
});
$("profileReset").onclick = async () => {
  if (!supabase || !authProfile) return;
  const { error } = await supabase.auth.resetPasswordForEmail(
    authProfile.email,
    { redirectTo: `${window.location.origin}/?flow=recovery` },
  );
  $("profileResetNote").textContent = error
    ? "Could not send the email. Try again later."
    : `A reset link is on its way to ${authProfile.email}.`;
};
$("importMembersBtn").onclick = () => {
  if (isAdmin()) $("memberCsv").click();
};
$("memberCsv").onchange = (e) => {
  importMembersCsv(e.target.files[0]);
  e.target.value = "";
};
// The overview adapts to who is looking:
//  full   - system admin, President, Vice President: the whole club
//  head   - department/project heads: only their own departments and projects
//  member - everyone else: only the tasks assigned to them, no people count
function overviewMode(): "full" | "head" | "member" {
  if (isAdmin() || isExecutive()) return "full";
  if (managedDepartments().length || managedProjects().length) return "head";
  return "member";
}
function renderHome() {
  const mode = overviewMode();
  const today = new Date().toISOString().slice(0, 10);
  const weekAhead = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  let people: any[] = registeredMembers();
  let ts: any[] = db.tasks;
  if (mode === "head") {
    const ds = managedDepartments().map((d) => d.name);
    const ps = managedProjects().map((p) => p.name);
    people = registeredMembers().filter(
      (m) =>
        deptsOf(m).some((d) => ds.includes(d)) ||
        (m.projects || []).some((p) => ps.includes(p)),
    );
    ts = db.tasks.filter(
      (t) =>
        taskDepartments(t).some((d) => ds.includes(d)) ||
        taskProjects(t).some((p) => ps.includes(p)),
    );
  } else if (mode === "member") {
    ts = db.tasks.filter((t) => t.assignee === authProfile?.id);
  }
  const open = ts.filter((t) => t.status !== "Completed");
  const soon = open.filter((t) => t.due && t.due <= weekAhead);
  const done = ts.filter((t) => t.status === "Completed").length;
  const donePct = ts.length ? Math.round((done / ts.length) * 100) : 0;
  const scopeNote =
    mode === "head"
      ? [
          ...managedDepartments().map((d) => d.name),
          ...managedProjects().map((p) => p.name),
        ].join(" · ")
      : "";
  const cards: any[] = [];
  if (mode !== "member")
    cards.push([
      "People",
      people.length,
      "♙",
      mode === "head" ? scopeNote : "across the club",
    ]);
  cards.push(
    ["Open tasks", open.length, "✦", "still moving"],
    ["Due this week", soon.length, "◷", "next 7 days"],
    ["Completed", done, "✓", `${donePct}% complete`],
  );
  $("stats").classList.toggle("three", cards.length === 3);
  $("stats").innerHTML = cards
    .map(
      ([label, value, icon, foot]) =>
        `<div class="stat"><div class="stat-label"><span class="stat-ico">${icon}</span>${label}</div><strong>${value}</strong><div class="stat-foot">${esc(foot)}</div></div>`,
    )
    .join("");
  $("homeTasksTitle").textContent =
    mode === "member"
      ? "Your tasks"
      : mode === "head"
        ? "Coming up in your team"
        : "Coming up";
  const upcoming = [...ts]
    .filter((t) => t.status !== "Completed")
    .sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"))
    .slice(0, 5);
  $("homeTasks").innerHTML = upcoming.length
    ? upcoming
        .map(
          (t) =>
            `<div class="row"><div class="task-mini"><span class="task-marker ${t.due && t.due < today ? "late" : ""}"></span><div><div class="row-title">${esc(t.title)}</div><div class="row-sub">${esc(mode === "member" ? taskScopeLabel(t) : personName(t.assignee) + " · " + taskScopeLabel(t))}</div></div></div><div>${badge(t.status)}<div class="row-sub align-right">${t.due ? new Date(t.due + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "No due date"}</div></div></div>`,
        )
        .join("")
    : mode === "member"
      ? '<div class="empty"><strong>Nothing assigned to you yet.</strong>Tasks your department or project head gives you will show up here.</div>'
      : '<div class="empty"><strong>Your next story starts here.</strong>Assign the first task to bring it to life.</div>';
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
              `<div class="member"><div class="person"><span class="avatar c${(i % 4) + 1}${m.avatarPath ? " photo" : ""}"${m.avatarPath ? ` style="background-image:url('${esc(avatarUrl(m.avatarPath))}')"` : ""}>${initials(m.name)}</span><div><div class="row-title">${esc(m.name)}</div><div class="row-sub">${esc(m.email || "Club member")}${m.isClubAdmin ? " · System admin access" : ""}</div></div></div><div>${
                deptsOf(m).length
                  ? deptsOf(m)
                      .map((d) => `<span class="chip">${esc(d)}</span>`)
                      .join(" ")
                  : '<span class="quiet">No department</span>'
              }</div><div class="items">${m.projects.length ? m.projects.map((p) => `<span class="chip">${esc(p)}</span>`).join("") : '<span class="quiet">No project</span>'}</div><div>${memberRoles(
                m,
              )
                .map((r) => `<span class="badge role">${esc(r)}</span>`)
                .concat(m.isClubOwner ? ['<span class="badge role">Admin</span>'] : [])
                .join(
                  " ",
                )}</div><div>${SHARED_WRITES_ENABLED && isAdmin() ? `<button class="btn ghost small" data-action="edit-member" data-id="${m.id}">Edit profile</button>${isOwner() && !m.isClubOwner ? `<button class="btn ghost small" data-action="toggle-system-access" data-id="${m.id}">${m.isClubAdmin ? "Revoke system access" : "Grant system access"}</button>` : ""}${m.status === "Pending invitation" ? `<button class="btn ghost small" data-action="resend-invitation" data-id="${m.id}">Send invitation</button>` : ""}${canRemoveMember(m) ? `<button class="btn danger small" data-action="remove-member" data-id="${m.id}">Remove</button>` : ""}` : SHARED_WRITES_ENABLED && canManageMember(m) ? `<button class="btn ghost small" data-action="assign-projects" data-id="${m.id}">Change assignments</button>` : ""}</div></div>`,
          )
          .join("")
      : '<div class="empty"><strong>No members in this view yet.</strong>Add your team one department at a time.</div>');
}
function weekStart(d: Date) {
  let first = 1; // Monday unless the browser says otherwise
  try {
    const info: any = new (Intl as any).Locale(navigator.language);
    const wi = info.getWeekInfo ? info.getWeekInfo() : info.weekInfo;
    if (wi?.firstDay) first = wi.firstDay % 7;
  } catch {
    /* keep Monday */
  }
  const back = (d.getDay() - first + 7) % 7;
  return addDays(d, -back);
}
function calendarTaskMap() {
  const map = new Map<string, any[]>();
  allowedTasks()
    .filter(
      (task) =>
        task.due && (!calendarMine || task.assignee === authProfile?.id),
    )
    .sort((a, b) => a.title.localeCompare(b.title))
    .forEach((task) => {
      if (!map.has(task.due)) map.set(task.due, []);
      map.get(task.due)!.push(task);
    });
  return map;
}
const isOverdue = (task: any) =>
  task.due && task.status !== "Completed" && task.due < ymd(new Date());
function calChip(task: any) {
  return `<button type="button" class="cal-chip ${statusClass(task.status)}${isOverdue(task) ? " overdue" : ""}" data-cal-task="${task.id}" title="${esc(task.title)}"><span>${esc(task.title)}</span></button>`;
}
function calCard(task: any, full = false) {
  const who = personName(task.assignee);
  return `<button type="button" class="cal-event ${statusClass(task.status)}${isOverdue(task) ? " overdue" : ""}" data-cal-task="${task.id}"><strong>${esc(task.title)}</strong><span class="cal-event-sub">${esc(taskScopeLabel(task))}</span>${full && task.description ? `<span class="cal-event-desc">${esc(task.description)}</span>` : ""}<span class="cal-event-foot"><span class="avatar c2">${initials(who)}</span>${esc(who)}${isOverdue(task) ? '<em>Overdue</em>' : ""}</span></button>`;
}
function renderCalendar() {
  const map = calendarTaskMap();
  const todayKey = ymd(new Date());
  const anchor = calendarDate;
  let label = "";
  let html = "";
  const dayName = (d: Date, style: "short" | "long" = "short") =>
    d.toLocaleDateString(undefined, { weekday: style });
  if (calendarView === "month") {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    label = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    const start = weekStart(first);
    const weeks = Math.ceil(
      ((first.getTime() - start.getTime()) / 86400000 +
        new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate()) /
        7,
    );
    html = `<div class="cal-grid month"><div class="cal-head">${Array.from({ length: 7 }, (_, i) => `<div>${esc(dayName(addDays(start, i)))}</div>`).join("")}</div>`;
    for (let w = 0; w < weeks; w++) {
      html += '<div class="cal-week">';
      for (let i = 0; i < 7; i++) {
        const day = addDays(start, w * 7 + i);
        const key = ymd(day);
        const items = map.get(key) || [];
        const other = day.getMonth() !== anchor.getMonth();
        html += `<div class="cal-cell${other ? " other" : ""}${key === todayKey ? " today" : ""}"><button type="button" class="cal-num" data-cal-day="${key}">${day.getDate()}</button>${items.slice(0, 3).map(calChip).join("")}${items.length > 3 ? `<button type="button" class="cal-more" data-cal-day="${key}">+${items.length - 3} more</button>` : ""}</div>`;
      }
      html += "</div>";
    }
    html += "</div>";
  } else if (calendarView === "week") {
    const start = weekStart(anchor);
    const end = addDays(start, 6);
    label = `${start.toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${end.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;
    html = '<div class="cal-grid weekview">';
    for (let i = 0; i < 7; i++) {
      const day = addDays(start, i);
      const key = ymd(day);
      const items = map.get(key) || [];
      html += `<div class="cal-col${key === todayKey ? " today" : ""}"><button type="button" class="cal-colhead" data-cal-day="${key}"><span>${esc(dayName(day))}</span><b>${day.getDate()}</b></button><div class="cal-colbody">${items.length ? items.map((t) => calCard(t)).join("") : '<div class="cal-none">Nothing due</div>'}</div></div>`;
    }
    html += "</div>";
  } else {
    label = anchor.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const items = map.get(ymd(anchor)) || [];
    html = `<div class="cal-dayview${ymd(anchor) === todayKey ? " today" : ""}">${items.length ? items.map((t) => calCard(t, true)).join("") : '<div class="empty"><strong>Nothing due this day.</strong>Tasks with this due date will appear here.</div>'}</div>`;
  }
  $("calendarMonthLabel").textContent = label;
  $("calendarBoard").innerHTML = html;
  document.querySelectorAll<HTMLButtonElement>("[data-cal-view]").forEach((button) => {
    const on = button.dataset.calView === calendarView;
    button.classList.toggle("on", on);
    button.setAttribute("aria-pressed", String(on));
  });
  if (!map.size)
    $("calendarBoard").insertAdjacentHTML(
      "beforeend",
      `<div class="cal-hint">${calendarMine ? "You have no tasks with deadlines." : "No tasks with deadlines yet."}</div>`,
    );
}
function showCalendarTask(id: string) {
  const task = db.tasks.find((t: any) => t.id === id);
  if (!task) return;
  const canManage = canManageTask(task);
  const canUpdate = Boolean(canManage || task.assignee === authProfile?.id);
  const dueText = new Date(`${task.due}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  openModal(
    task.title,
    `<div class="cal-detail"><div class="cal-detail-badges">${badge(task.status)}<span class="badge ${task.priority === "Urgent" ? "urgent" : task.priority === "High" ? "high" : ""}">${esc(task.priority)}</span>${isOverdue(task) ? '<span class="badge urgent">Overdue</span>' : ""}</div><div class="cal-detail-when">◷ Due ${esc(dueText)}</div><h4>Description</h4><p class="cal-detail-desc">${task.description ? esc(task.description) : '<span class="quiet">No description was added.</span>'}</p><dl class="cal-detail-meta"><div><dt>Assigned to</dt><dd>${task.assignee ? esc(personName(task.assignee)) : "Unassigned"}</dd></div><div><dt>Assigned by</dt><dd>${task.assigner ? esc(personName(task.assigner)) : "—"}</dd></div><div><dt>Project / department</dt><dd>${esc(taskScopeLabel(task))}</dd></div></dl>${task.update ? `<h4>Latest update</h4><p class="cal-detail-desc">${esc(task.update)}</p>` : ""}<div class="form-actions"><button type="button" class="btn ghost" data-close-modal>Close</button>${SHARED_WRITES_ENABLED && canManage ? `<button type="button" class="btn ghost" data-action="assign-task" data-id="${task.id}">${task.assignee ? "Reassign" : "Assign"}</button>` : ""}${SHARED_WRITES_ENABLED && canUpdate ? `<button type="button" class="btn lime" data-action="add-update" data-id="${task.id}">＋ Update</button>` : ""}</div></div>`,
  );
}
function shiftCalendar(direction: number) {
  if (calendarView === "month")
    calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + direction, 1);
  else calendarDate = addDays(calendarDate, direction * (calendarView === "week" ? 7 : 1));
  renderCalendar();
}

function renderAdministration() {
  if (!isAdmin()) return;
  const pending = db.members.filter(
    (member) => member.status === "Pending invitation",
  );
  $("adminStats").innerHTML = [
    ["Members", registeredMembers().length, "♙", "registered members"],
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
          (member) => {
            const plan = member.plan || {};
            const planned = [
              plan.clubRole && plan.clubRole !== "Member" ? plan.clubRole : "",
              plan.extraRole || "",
              plan.headScope ? `of ${plan.headScope}` : "",
            ]
              .filter(Boolean)
              .join(" · ");
            const extras = [
              ...(plan.departments || []),
              ...(plan.projects || []),
            ].join(", ");
            const left = member.planExpires
              ? Math.max(
                  0,
                  Math.ceil(
                    (new Date(member.planExpires).getTime() - Date.now()) /
                      86400000,
                  ),
                )
              : null;
            return `<div class="row"><div><div class="row-title">${esc(member.name)}</div><div class="row-sub">${esc(member.email)}</div><div class="row-sub">Planned: ${esc(planned || "Member")}${extras ? ` · ${esc(extras)}` : ""}${left === null ? "" : ` · removed in ${left} day${left === 1 ? "" : "s"} if not accepted`}</div></div><div class="controls"><span class="badge role">Pending invitation</span><button class="btn ghost small" type="button" data-edit-pending="${esc(member.id)}">Edit plan</button><button class="btn ghost small" type="button" data-resend="${esc(member.email)}">Resend invitation</button></div></div>`;
          },
        )
        .join("")
    : '<div class="empty"><strong>Everyone is set up.</strong>New profiles waiting to register will appear here.</div>';
}

$("pendingInvitations").addEventListener("click", async (event) => {
  const editButton = (event.target as HTMLElement).closest<HTMLButtonElement>(
    "[data-edit-pending]",
  );
  if (editButton && isAdmin()) {
    const target = person(editButton.dataset.editPending || "");
    if (target) memberForm(target);
    return;
  }
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
    "[data-resend]",
  );
  if (!button || !isAdmin()) return;
  const email = button.dataset.resend || "";
  button.disabled = true;
  button.textContent = "Sending…";
  try {
    await sendInvitation(email);
    const again = db.members.find((m: any) => m.email.toLowerCase() === email.toLowerCase());
    if (again) again.planExpires = new Date(Date.now() + 14 * 86400000).toISOString();
    alert(`Invitation sent to ${email}.`);
    renderAdministration();
    return;
  } catch (error) {
    alert(
      `The invitation was not sent: ${error instanceof Error ? error.message : "Check the Supabase email settings."}`,
    );
  }
  button.disabled = false;
  button.textContent = "Resend invitation";
});

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
        taskScopeLabel(task),
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
  const selectedClass = (kind: string, name: string) =>
    structureSelection?.kind === kind && structureSelection.name === name
      ? " selected"
      : "";
  $("deptList").innerHTML = dlist
    .map(
      (d) =>
        `<div class="row clickable${selectedClass("dept", d.name)}" role="button" tabindex="0" data-kind="dept" data-name="${esc(d.name)}"><div><div class="row-title">${esc(d.name)}</div><div class="row-sub">${registeredMembers().filter((m) => deptsOf(m).includes(d.name)).length} people · Head: ${esc(personName(d.head))}</div></div><span class="row-chevron" aria-hidden="true">›</span></div>`,
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
        `<div class="row clickable${selectedClass("project", p.name)}" role="button" tabindex="0" data-kind="project" data-name="${esc(p.name)}"><div><div class="row-title">${esc(p.name)}</div><div class="row-sub">${db.members.filter((m) => m.projects.includes(p.name)).length} people · Lead: ${esc(personName(p.lead))}</div></div><span class="row-chevron" aria-hidden="true">›</span></div>`,
    )
    .join("");
  renderStructureDetail();
}
function structureEntity(kind: string, name: string) {
  if (kind === "dept") {
    const d = db.departments.find((x) => x.name === name);
    if (!d) return null;
    return {
      title: d.name,
      icon: "🌱",
      iconClass: "mint",
      leaderLabel: "Head",
      description: d.description || "",
      leader: person(d.head),
      members: registeredMembers().filter((m) => deptsOf(m).includes(d.name)),
    };
  }
  const p = db.projects.find((x) => x.name === name);
  if (!p) return null;
  return {
    title: p.name,
    icon: "🎬",
    iconClass: "coral",
    leaderLabel: "Lead",
    description: p.description || "",
    leader: person(p.lead),
    members: registeredMembers().filter((m) => m.projects.includes(p.name)),
  };
}
function structureDetailHtml(kind: string, name: string, withClose: boolean) {
  const e = structureEntity(kind, name);
  if (!e) return "";
  const personRow = (m, i: number) =>
    `<div class="detail-person"><div class="person"><span class="avatar c${(i % 4) + 1}">${esc(initials(m.name))}</span><div><div class="row-title">${esc(m.name)}</div><div class="row-sub">${esc(m.email || "Club member")}</div></div></div>${m.id === e.leader?.id ? `<span class="badge role">${e.leaderLabel}</span>` : ""}</div>`;
  const head = withClose
    ? `<div class="detail-head"><div class="card-title"><span class="card-icon ${e.iconClass}">${e.icon}</span><h3>${esc(e.title)}</h3></div><button type="button" class="detail-close" id="structureDetailClose" aria-label="Close details">×</button></div>`
    : "";
  return `${head}${e.description ? `<p class="quiet">${esc(e.description)}</p>` : ""}<div class="detail-label">${e.leaderLabel}</div>${
    e.leader
      ? personRow(e.leader, 0)
      : `<div class="quiet">No ${e.leaderLabel.toLowerCase()} assigned yet.</div>`
  }<div class="detail-label">Members · ${e.members.length}</div>${
    e.members.length
      ? e.members.map(personRow).join("")
      : '<div class="quiet">No members yet.</div>'
  }`;
}
function renderStructureDetail() {
  const panel = $("structureDetail");
  const sel = structureSelection;
  const fitsMode =
    !!sel &&
    ((structureMode === "departments" && sel.kind === "dept") ||
      (structureMode === "projects" && sel.kind === "project"));
  const exists = fitsMode && !!structureEntity(sel.kind, sel.name);
  const body: HTMLElement = $("structureDetailBody");
  const play = (cls: string) => {
    body.classList.remove("detail-enter", "detail-leave");
    void body.offsetWidth; // restart the animation even if the class was just removed
    body.classList.add(cls);
  };
  window.clearTimeout(structureDetailTimer);
  if (!exists) {
    if (sel) structureSelection = null;
    const slideOut = animateStructureClose && !panel.hidden;
    animateStructureClose = false;
    structureDetailKey = "";
    if (slideOut) {
      play("detail-leave");
      structureDetailTimer = window.setTimeout(() => {
        panel.hidden = true;
        body.innerHTML = "";
        body.classList.remove("detail-leave");
      }, 160);
    } else {
      panel.hidden = true;
      body.innerHTML = "";
      body.classList.remove("detail-enter", "detail-leave");
    }
    return;
  }
  // Animate only when a different item opens or the panel was closed, so a
  // background re-render (for example after a save) does not replay it.
  const key = `${sel.kind}:${sel.name}`;
  const opening = key !== structureDetailKey || panel.hidden;
  structureDetailKey = key;
  body.innerHTML = structureDetailHtml(sel.kind, sel.name, true);
  panel.hidden = false;
  if (opening) {
    body
      .querySelectorAll<HTMLElement>(".detail-person")
      .forEach((row, i) => row.style.setProperty("--i", String(i)));
    play("detail-enter");
  } else {
    body.classList.remove("detail-enter", "detail-leave");
  }
}
function selectStructureItem(kind: string, name: string) {
  const sideBySide =
    structureMode !== "structure" &&
    !window.matchMedia("(max-width: 680px)").matches;
  if (!sideBySide) {
    // Both cards (or a phone) leave no empty column, so use the modal.
    const e = structureEntity(kind, name);
    if (e) openModal(e.title, structureDetailHtml(kind, name, false));
    return;
  }
  const same =
    structureSelection?.kind === kind && structureSelection.name === name;
  structureSelection = same ? null : { kind, name };
  animateStructureClose = same;
  renderStructure();
  // Keep keyboard focus on the row after the list re-renders.
  const list = $(kind === "dept" ? "deptList" : "projectList");
  [...list.querySelectorAll(".row.clickable")]
    .find((row: HTMLElement) => row.dataset.name === name)
    ?.focus();
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
  // Someone who has not created a password yet is only planned: the position,
  // departments and projects are stored as a plan and applied when they register.
  const pending = !m.id || m.status === "Pending invitation";
  const src: any = pending
    ? {
        clubRole: "Member",
        extraRole: "",
        headScope: "",
        departments: [],
        projects: [],
        ...(m.plan || {}),
      }
    : m;
  let depts = db.departments,
    projects = db.projects,
    departments = src.departments || [src.department].filter(Boolean),
    roleNow = src.clubRole || "Member";
  const full = true;
  openModal(
    m.id ? "Edit member" : "Add a member",
    `<form class="form" id="memberForm"><div class="field"><label>Full name</label><input name="name" required value="${esc(m.name)}" placeholder="Member name"></div><div class="field"><label>Email</label><input type="email" name="email" required value="${esc(m.email)}" placeholder="name@university.edu"></div>${full ? `<div class="field full"><label>Position</label><select name="clubRole" id="memberPosition">${options(["Member", "Department Head", "Project Head", "Vice President", "President"], roleNow)}</select><small class="quiet">${pending ? "Planned position: it takes effect, and shows anywhere, only after they create a password." : "System access is a separate permission, granted only by the global admin."}</small></div><div class="field full hidden" id="extraPositionWrap"><label>Additional position (optional)</label><select name="extraRole" id="extraPosition"><option value="">None</option>${options(["Member", "Department Head", "Project Head"], src.extraRole || "")}</select></div><div class="field full hidden" id="headScopeWrap"><label id="headScopeLabel">Head of</label><select name="headScope" id="headScope"><option value="">Choose one</option></select><small class="quiet">A head role is attached to one department or one project.</small></div><div class="field full hidden" id="memberAssignments"><label>Departments</label><div class="form-checks">${depts.map((d) => `<label class="check"><input type="checkbox" name="departments" value="${esc(d.name)}" ${departments.includes(d.name) ? "checked" : ""}>${esc(d.name)}</label>`).join("")}</div><label>Projects</label><div class="form-checks">${projectChecks(src.projects || [])}</div><small class="quiet">Members can have any number of department and project assignments, or none.</small></div>` : ""}<div class="note field full">${pending ? "Not counted or shown anywhere as a member, head or team member until they create a password. Unaccepted invitations are removed after 14 days." : "Profiles are created by the system admin. Members do not sign themselves up; registration is linked to the email on this profile."}</div><div class="form-actions"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button class="btn lime">${m.id ? "Save member" : "Add member"}</button></div></form>`,
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
      prior = src.headScope || src.department || src.headProject || "";
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
  if (full) {
    $("memberPosition").onchange = sync;
    $("extraPosition").onchange = sync;
    sync();
  }
  $("memberForm").onsubmit = async (e) => {
    e.preventDefault();
    let f = new FormData(e.target as HTMLFormElement),
      primary = String(f.get("clubRole") || src.clubRole || "Member"),
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
    if (pending) {
      if (headRole === "Department Head")
        memberships = [...new Set([...memberships, scopeValue])];
      if (headRole === "Project Head")
        assignedProjects = [...new Set([...assignedProjects, scopeValue])];
      const plan = {
        clubRole: primary,
        extraRole: ["President", "Vice President"].includes(primary) ? extra : "",
        headScope: headRole ? scopeValue : "",
        departments: memberships,
        projects: assignedProjects,
      };
      const name = String(f.get("name") || "").trim();
      const email = String(f.get("email") || "").trim();
      const isNew = !m.id;
      let target = m;
      if (isNew) {
        target = {
          id: uid(),
          name,
          email,
          clubRole: "Member",
          extraRole: "",
          departments: [],
          department: "",
          projects: [],
          headScope: "",
          status: "Pending invitation",
          plan,
        };
        db.members.push(target);
      } else Object.assign(m, { name, email, plan });
      closeModal();
      if (!(await save())) return;
      try {
        await savePendingPlan(target);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Could not save the plan.");
        return;
      }
      if (isNew) {
        try {
          await sendInvitation(target.email);
          alert(`Saved, and an invitation was sent to ${target.email}.`);
        } catch (error) {
          alert(
            `Saved as pending. The invitation was not sent: ${error instanceof Error ? error.message : "Check the Supabase email settings."}`,
          );
        }
      }
      render();
      return;
    }
    // Changing someone's position replaces it: drop every department/project
    // head link they held before, so the old role does not linger.
    if (
      m.id &&
      (m.clubRole !== primary ||
        (m.extraRole || "") !== extra ||
        (m.headScope || "") !== scopeValue)
    ) {
      db.departments.forEach((d) => {
        if (d.head === m.id) d.head = "";
      });
      db.projects.forEach((p) => {
        if (p.lead === m.id) p.lead = "";
      });
      m.positionNames = [];
      // ...and leave the old departments and projects too. Only memberships
      // newly ticked in this edit (plus the new head scope below) are kept.
      const oldDepartments: string[] = m.departments || [];
      const oldProjects: string[] = m.projects || [];
      memberships = memberships.filter(
        (name) => !oldDepartments.includes(name),
      );
      assignedProjects = assignedProjects.filter(
        (name) => !oldProjects.includes(name),
      );
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
    else db.members.push({ id: uid(), ...data, status: "Pending invitation" });
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
  if (!canCreateTask()) return;
  const globalManager = isAdmin() || isExecutive();
  const projects = globalManager ? db.projects : managedProjects();
  const departments = globalManager ? db.departments : managedDepartments();
  // Only admins and executives may create club-wide tasks (can_create_task in the database).
  if (!globalManager && !projects.length && !departments.length) return;
  const scopeOptions = (items: any[], name: string) =>
    items
      .map(
        (item) =>
          `<label class="check"><input type="checkbox" name="${name}" value="${esc(item.name)}">${esc(item.name)}</label>`,
      )
      .join("");
  openModal(
    "Create a task",
    `<form class="form" id="taskForm"><div class="field full"><label>Task name</label><input name="title" required placeholder="e.g. Cut the opening 20 seconds"></div><div class="field full"><label>Brief</label><textarea name="description" rows="2" placeholder="What should the finished work include?"></textarea></div>${projects.length ? `<div class="field full"><label>Projects</label><div class="form-checks">${scopeOptions(projects, "projects")}</div></div>` : ""}${departments.length ? `<div class="field full"><label>Departments</label><div class="form-checks">${scopeOptions(departments, "departments")}</div>` : ""}${globalManager ? '<div class="field full"><label class="check"><input type="checkbox" name="clubwide" id="clubWideTask">Club-wide task (the whole club, no project or department)</label></div>' : ""}<small class="quiet field full">Choose one or more projects and/or departments${globalManager ? ", or tick club-wide" : ""}. New tasks start as Unassigned.</small>${departments.length ? "</div>" : ""}<div class="field"><label>Deadline</label><input type="date" name="due"></div><div class="field"><label>Priority</label><select name="priority">${options(["Medium", "High", "Urgent", "Low"], "Medium")}</select></div><div class="form-actions"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button class="btn lime">Create unassigned task</button></div></form>`,
  );
  $("taskForm").onsubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    const selectedProjects = [
      ...(e.target as HTMLFormElement).querySelectorAll<HTMLInputElement>(
        '[name="projects"]:checked',
      ),
    ].map((input) => input.value);
    const selectedDepartments = [
      ...(e.target as HTMLFormElement).querySelectorAll<HTMLInputElement>(
        '[name="departments"]:checked',
      ),
    ].map((input) => input.value);
    const clubWide = globalManager && form.get("clubwide") === "on";
    if (clubWide && (selectedProjects.length || selectedDepartments.length)) {
      alert(
        "A club-wide task cannot also belong to a project or department. Untick club-wide, or clear the projects and departments.",
      );
      return;
    }
    if (!clubWide && !selectedProjects.length && !selectedDepartments.length) {
      alert("Choose at least one project or department, or tick club-wide.");
      return;
    }
    db.tasks.unshift({
      id: uid(),
      title: String(form.get("title") || "").trim(),
      description: String(form.get("description") || "").trim(),
      projects: selectedProjects,
      departments: selectedDepartments,
      project: selectedProjects[0] || "",
      department: selectedDepartments[0] || "",
      assignee: "",
      assigner: authProfile.id,
      status: "Unassigned",
      priority: String(form.get("priority") || "Medium"),
      due: String(form.get("due") || ""),
      update: "",
      updates: [],
    });
    closeModal();
    save();
  };
}
function assignTask(id) {
  const task = db.tasks.find((item) => item.id === id);
  if (!task || !canManageTask(task)) return;
  const taskProjectNames = taskProjects(task);
  const taskDepartmentNames = taskDepartments(task);
  const clubWide = !taskProjectNames.length && !taskDepartmentNames.length;
  const eligibleMembers = db.members.filter(
    (member) =>
      member.status === "Active" &&
      (!task.parent || coversTaskMember(task, member)) &&
      (clubWide ||
        member.projects.some((project) => taskProjectNames.includes(project)) ||
        deptsOf(member).some((department) =>
          taskDepartmentNames.includes(department),
        )),
  );
  openModal(
    task.assignee ? "Assign this task to someone else" : "Assign this task",
    `<form class="form" id="assignTaskForm"><div class="field full"><label>Projects and departments</label><input value="${esc(taskScopeLabel(task))}" disabled></div><div class="field full"><label>Assign to</label><select name="assignee" required><option value="">Choose an active member in these scopes</option>${eligibleMembers
      .map(
        (member) =>
          `<option value="${member.id}" ${member.id === task.assignee ? "selected" : ""}>${esc(member.name)}</option>`,
      )
      .join(
        "",
      )}</select>${eligibleMembers.length ? "" : '<small class="quiet">Add an active member to at least one selected project or department before assigning this task.</small>'}</div><div class="form-actions"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button class="btn lime" ${eligibleMembers.length ? "" : "disabled"}>Assign task</button></div></form>`,
  );
  $("assignTaskForm").onsubmit = (event) => {
    event.preventDefault();
    const assignee = String(
      new FormData(event.currentTarget as HTMLFormElement).get("assignee") ||
        "",
    );
    if (!eligibleMembers.some((member) => member.id === assignee)) return;
    task.assignee = assignee;
    task.assigner = authProfile.id;
    task.status = "Not Started";
    closeModal();
    save();
  };
}
function addUpdate(id) {
  let t = db.tasks.find((t) => t.id === id);
  if (!t) return;
  const canChangeDeadline = SHARED_WRITES_ENABLED && canEditDetails(ruleCtx(), t) && t.status !== "Completed";
  openModal(
    "Share a progress update",
    `<form class="form" id="updateForm"><div class="field full"><label>What changed or what do you need?</label><textarea name="update" rows="4" required placeholder="Add a short note for the team…">${esc(t.update || "")}</textarea></div>${canChangeDeadline ? `<div class="field"><label>Deadline</label><input type="date" name="due" value="${esc(t.due || "")}"></div><div class="note field full">Leave the deadline as it is, or pick a new date. People on the task are notified of a change.</div>` : ""}<div class="form-actions"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button class="btn lime">Save update</button></div></form>`,
  );
  $("updateForm").onsubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    let value = String(form.get("update") || "").trim();
    if (canChangeDeadline) {
      const due = String(form.get("due") || "");
      if (due !== (t.due || "")) {
        // Deadlines are changed by the database function, which re-checks who may do it.
        const ok = await runRpc("update_task_details", {
          p_task: id,
          p_title: null,
          p_description: null,
          p_due: due ? `${due}T23:59:00` : null,
          p_clear_due: !due,
          p_priority: null,
        });
        if (!ok) return;
        t = db.tasks.find((x) => x.id === id) || t;
      }
    }
    t.update = value;
    t.updates = [
      ...(t.updates || []),
      { text: value, by: scope(), at: new Date().toISOString() },
    ];
    closeModal();
    save();
  };
}
function deleteTask(id) {
  const t = db.tasks.find((task) => task.id === id);
  if (!t || !canDeleteTaskItem(t)) return;
  openModal(
    t.parent ? "Delete subtask" : "Delete task",
    `<p>Delete <strong>${esc(t.title)}</strong>? ${t.parent ? "" : "Its subtasks are deleted with it. "}Its progress updates and comments are deleted too. This cannot be undone.</p><div class="form-actions" style="margin-top:16px"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button type="button" class="btn danger" id="confirmDeleteTask">Delete task</button></div>`,
  );
  $("confirmDeleteTask").onclick = () => {
    db.tasks = db.tasks.filter((task) => task.id !== id && task.parent !== id);
    closeModal();
    save();
  };
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
// Heads are positions (member_positions), and departments/projects are admin-only tables,
// so the database accepts this only from a system admin. Executives are not offered it.
function editLead(type, n) {
  if (!isAdmin()) return;
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
// Department/project membership: system admin, or the head of that department/project.
// Presidents and Vice Presidents do not get it just for being executives (the database
// policies member_departments_scoped_* and assignments_scoped_* agree).
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
// Only the system admin, and never themselves or another system admin. The
// server enforces the same rules.
function canRemoveMember(m) {
  return (
    SHARED_WRITES_ENABLED &&
    isAdmin() &&
    m.id !== authProfile?.id &&
    !m.isClubAdmin
  );
}
function removeMember(id: string) {
  const m = person(id);
  if (!m || !canRemoveMember(m)) return;
  const assigned = db.tasks.filter((t) => t.assignee === id).length;
  const headed =
    db.departments.filter((d) => d.head === id).length +
    db.projects.filter((p) => p.lead === id).length;
  const items = [
    "Their profile and Supabase login are deleted. They can no longer sign in.",
    "They are taken out of every department and project.",
    assigned
      ? `${assigned} task${assigned === 1 ? "" : "s"} assigned to them ${assigned === 1 ? "is" : "are"} deleted, with ${assigned === 1 ? "its" : "their"} progress updates.`
      : "",
    headed
      ? `${headed} department${headed === 1 ? "" : "s"} or project${headed === 1 ? "" : "s"} they lead will have no head.`
      : "",
  ].filter(Boolean);
  openModal(
    "Remove member",
    `<p>Remove <strong>${esc(m.name)}</strong> from the club completely?</p><ul style="padding-left:18px;margin:10px 0">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul><p><strong>This cannot be undone.</strong></p><div class="note" id="removeMemberError" role="alert" hidden></div><div class="form-actions" style="margin-top:16px"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button type="button" class="btn danger" id="confirmRemoveMember">Remove member</button></div>`,
  );
  const confirm = $("confirmRemoveMember");
  confirm.onclick = async () => {
    const problem = $("removeMemberError");
    confirm.disabled = true;
    confirm.textContent = "Removing…";
    problem.hidden = true;
    let removed = false;
    try {
      await saveQueue; // let any pending save finish first
      const { data } = await supabase!.auth.getSession();
      const response = await fetch("/api/remove-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (data.session?.access_token || ""),
        },
        body: JSON.stringify({ memberId: id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(result.error || "Could not remove this member.");
      removed = true;
    } catch (error) {
      problem.textContent =
        error instanceof Error
          ? error.message
          : "Could not remove this member.";
      problem.hidden = false;
      confirm.disabled = false;
      confirm.textContent = "Try again";
    }
    // Reload either way: a partly finished removal changes what is shown.
    try {
      db = await loadSharedWorkspace();
      syncedDb = structuredClone(db);
      render();
    } catch {
      await supabase?.auth.signOut();
      return;
    }
    if (removed) closeModal();
  };
}
function toggleSystemAccess(id) {
  if (!isAdmin() || !isOwner()) return;
  let m = person(id);
  if (m && !m.isClubOwner) {
    m.isClubAdmin = !m.isClubAdmin;
    save();
  }
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
          clubRole: "Member",
          extraRole: "",
          departments: [],
          department: "",
          projects: [],
          headScope: "",
          status: "Pending invitation",
          // Planned placement: applied only when they create their password.
          plan: {
            clubRole: position,
            extraRole: extra,
            headScope,
            departments: ds,
            projects: ps,
          },
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
        const plan = m.plan;
        const canon = (list: any[], name: string) =>
          list.find((x) => x.name.toLowerCase() === String(name).toLowerCase())
            ?.name || name;
        plan.departments = plan.departments.map((n: string) =>
          canon(db.departments, n),
        );
        plan.projects = plan.projects.map((n: string) => canon(db.projects, n));
        const headRole = ["Department Head", "Project Head"].includes(
          plan.clubRole,
        )
          ? plan.clubRole
          : plan.extraRole;
        if (headRole === "Department Head") {
          plan.headScope = canon(db.departments, plan.headScope);
          plan.departments = [...new Set([...plan.departments, plan.headScope])];
        }
        if (headRole === "Project Head") {
          plan.headScope = canon(db.projects, plan.headScope);
          plan.projects = [...new Set([...plan.projects, plan.headScope])];
        }
        db.members.push(m);
      });
      if (!(await save())) return;
      for (const member of made) await savePendingPlan(member);
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
    case "remove-member":
      removeMember(target.dataset.id || "");
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
    case "assign-task":
      assignTask(target.dataset.id || "");
      break;
    case "delete-task":
      deleteTask(target.dataset.id || "");
      break;
    case "edit-lead":
      editLead(target.dataset.type || "", target.dataset.name || "");
      break;
    case "open-task":
      void openTaskDetails(target.dataset.id || "");
      break;
    case "toggle-subtasks": {
      const id = target.dataset.id || "";
      if (expandedTasks.has(id)) expandedTasks.delete(id);
      else expandedTasks.add(id);
      renderTasks();
      break;
    }
    case "divide-task":
      divideForm(target.dataset.id || "");
      break;
    case "edit-task-details":
      editDetailsForm(target.dataset.id || "");
      break;
    case "request-change":
      requestForm(target.dataset.id || "");
      break;
    case "edit-dependencies":
      dependenciesForm(target.dataset.id || "");
      break;
    case "review-request":
      void reviewRequest(target.dataset.id || "", target.dataset.decision || "");
      break;
    case "cancel-request":
      void cancelRequest(target.dataset.id || "");
      break;
    case "open-notification": {
      document.getElementById("notifPanel")?.classList.add("hidden");
      void markNotificationsRead([target.dataset.id || ""]);
      if (target.dataset.task) void openTaskDetails(target.dataset.task);
      break;
    }
  }
});
document.addEventListener("change", (event) => {
  const target = event.target as HTMLSelectElement;
  if (target.matches("[data-task-status]"))
    updateTask(target.dataset.taskStatus || "", "status", target.value);
});
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
$("taskDepartmentFilter").onchange = renderTasks;
$("calendarPrev").onclick = () => shiftCalendar(-1);
$("calendarNext").onclick = () => shiftCalendar(1);
$("calendarToday").onclick = () => {
  calendarDate = new Date();
  renderCalendar();
};
$("calendarMine").onchange = () => {
  calendarMine = ($("calendarMine") as HTMLInputElement).checked;
  renderCalendar();
};
document.querySelectorAll<HTMLButtonElement>("[data-cal-view]").forEach((button) => {
  button.onclick = () => {
    calendarView = button.dataset.calView as typeof calendarView;
    renderCalendar();
  };
});
$("calendarBoard").addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const taskButton = target.closest<HTMLElement>("[data-cal-task]");
  if (taskButton) return showCalendarTask(taskButton.dataset.calTask || "");
  const dayButton = target.closest<HTMLElement>("[data-cal-day]");
  if (dayButton) {
    calendarDate = new Date(`${dayButton.dataset.calDay}T00:00:00`);
    calendarView = "day";
    renderCalendar();
  }
});
$("exportCalendar").onclick = exportCalendar;
$("adminAddMember").onclick = () => {
  if (isAdmin()) memberForm();
};
$("addDept").onclick = () => {
  if (!isAdmin()) return; // creating departments is admin-only (departments_admin_write)
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
  if (!isAdmin()) return; // creating projects is admin-only (projects_admin_write)
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
for (const listId of ["deptList", "projectList"]) {
  const list = $(listId);
  const pick = (target: EventTarget | null) => {
    const row = (target as HTMLElement | null)?.closest<HTMLElement>(
      ".row.clickable",
    );
    if (row) selectStructureItem(row.dataset.kind, row.dataset.name);
  };
  list.addEventListener("click", (e: MouseEvent) => pick(e.target));
  list.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(e.target);
    }
  });
}
$("structureDetail").addEventListener("click", (e: MouseEvent) => {
  if ((e.target as HTMLElement).closest("#structureDetailClose")) {
    structureSelection = null;
    animateStructureClose = true;
    renderStructure();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});
// Pressing Back after signing out can restore the hub from the browser's
// back/forward cache. Re-run the session check instead of showing it.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) window.location.reload();
});
void initializeSupabase();

// ---------------------------------------------------------------------------------------------
// Tasks and subtasks: hierarchy, details, requests, comments, notifications
// ---------------------------------------------------------------------------------------------
const expandedTasks = new Set<string>();
let openDetailsId = "";
const confirmAction = (message: string, okLabel = "Confirm"): Promise<boolean> =>
  (window as any).vinesConfirm(message, okLabel);
const fmtDay = (day: string) =>
  new Date(day + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const fmtMoment = (iso: string) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";
const byDue = (a: any, b: any) => (a.due || "9999").localeCompare(b.due || "9999") || a.title.localeCompare(b.title);

function subtasksOf(id: string) {
  return db.tasks.filter((t) => t.parent === id).sort(byDue);
}
function progressFor(task: any) {
  const kids = subtasksOf(task.id);
  const counted = db.progress?.[task.id];
  return progressOf(
    counted?.total ?? kids.length,
    counted?.completed ?? kids.filter((k) => k.status === "Completed").length,
  );
}
function coversTaskMember(task: any, member: any) {
  const c = ruleCtx();
  return (
    c.isAdmin ||
    c.isExecutive ||
    member.projects.some((p: string) => taskProjects(task).includes(p) && c.ledProjects.includes(p)) ||
    deptsOf(member).some((d: string) => taskDepartments(task).includes(d) && c.managedDepartments.includes(d))
  );
}
function pendingRequestsFor(taskId: string) {
  return (db.requests || []).filter((r: any) => r.task === taskId && r.status === "Pending");
}

function taskRow(t: any, isSub = false) {
  const me = authProfile?.id;
  const canManageIt = canManageTask(t);
  const canMarkDone = canMarkTaskDone(t);
  const canUpdateProgress = Boolean(canManageIt || t.assignee === me);
  const statusChoices = [...WORKING_STATUSES, ...(canMarkDone ? ["Completed"] : [])];
  const canEditStatus = canUpdateProgress && t.assignee && (canMarkDone || t.status !== "Completed");
  const waiting = unmetDependencies(db.dependencies || [], db.tasks, t.id);
  const pending = pendingRequestsFor(t.id).length;
  const kids = isSub ? [] : subtasksOf(t.id);
  const prog = isSub ? null : progressFor(t);
  const open = expandedTasks.has(t.id);
  const ctx = ruleCtx();
  const chips = [
    isSub ? '<span class="chip subtle">Subtask</span>' : "",
    waiting.length ? `<span class="chip warn" title="Waiting on ${esc(waiting.map((w) => w.title).join(", "))}">⏳ Waiting on ${waiting.length}</span>` : "",
    pending ? `<span class="chip">✉ ${pending} request${pending === 1 ? "" : "s"}</span>` : "",
    isOverdue(t) ? '<span class="badge urgent">Overdue</span>' : "",
  ].join(" ");
  const caret = kids.length
    ? `<button type="button" class="caret" data-action="toggle-subtasks" data-id="${t.id}" aria-expanded="${open}" aria-label="${open ? "Hide" : "Show"} subtasks">${open ? "▾" : "▸"}</button>`
    : "";
  const bar =
    prog && prog.total
      ? `<div class="progress" title="${esc(prog.label)}"><div class="progress-bar"><span style="width:${prog.pct}%"></span></div><small>${esc(prog.label)}</small></div>`
      : "";
  return `<div class="task${isSub ? " subtask" : ""}" data-task-row="${t.id}"><div><div class="row-title">${caret}<button type="button" class="task-title-button" data-action="open-task" data-id="${t.id}">${esc(t.title)}</button> ${chips}</div><div class="row-sub">${esc(t.description || "")}${t.assigner ? ` · assigned by ${esc(personName(t.assigner))}` : ""}</div>${bar}${t.update ? `<div class="progress-update">↳ ${esc(t.update)}</div>` : ""}</div><div class="person"><span class="avatar c2">${initials(personName(t.assignee))}</span><span>${esc(personName(t.assignee))}</span></div><div>${esc(taskScopeLabel(t))}</div><div><span class="badge ${t.priority === "Urgent" ? "urgent" : t.priority === "High" ? "high" : ""}">${esc(t.priority)}</span></div><div>${t.due ? fmtDay(t.due) : "No deadline"}</div><div>${SHARED_WRITES_ENABLED && canEditStatus ? `<select class="status-select" data-task-status="${t.id}">${options(statusChoices, t.status)}</select>` : badge(t.status)}</div><div>${SHARED_WRITES_ENABLED ? `${canManageIt ? `<button class="btn ghost small" data-action="assign-task" data-id="${t.id}">${t.assignee ? "Reassign" : "Assign"}</button>` : ""}${canDivide(ctx, t) ? `<button class="btn ghost small" data-action="divide-task" data-id="${t.id}">＋ Subtask</button>` : ""}<button class="btn ghost small" data-action="add-update" data-id="${t.id}">＋ Update</button>${canDeleteTaskItem(t) ? `<button class="btn danger small" data-action="delete-task" data-id="${t.id}">Delete</button>` : ""}` : ""}</div></div>`;
}

function renderTasks() {
  const q = $("taskSearch").value.toLowerCase(),
    sf = $("taskStatusFilter").value,
    pf = $("taskProjectFilter").value,
    df = $("taskDepartmentFilter").value;
  const matches = (t: any) =>
    (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) &&
    (!sf || t.status === sf) &&
    (!pf || taskProjects(t).includes(pf)) &&
    (!df || taskDepartments(t).includes(df));
  const filtering = Boolean(q || sf || pf || df);
  const tops = allowedTasks()
    .filter((t) => !t.parent || !db.tasks.some((p) => p.id === t.parent))
    .sort(byDue);
  const rows: string[] = [];
  for (const main of tops) {
    const kids = subtasksOf(main.id);
    const shownKids = filtering ? kids.filter(matches) : kids;
    if (!matches(main) && !shownKids.length) continue;
    rows.push(taskRow(main, Boolean(main.parent)));
    if (expandedTasks.has(main.id) || (filtering && shownKids.length))
      shownKids.forEach((kid) => rows.push(taskRow(kid, true)));
  }
  $("taskList").innerHTML =
    `<div class="task header"><span>Task</span><span>Assignee</span><span>Projects / departments</span><span>Priority</span><span>Deadline</span><span>Status</span><span></span></div>` +
    (rows.length
      ? rows.join("")
      : '<div class="empty"><strong>Nothing on the board.</strong>Tasks for your role will show up here.</div>');
  renderTaskSummary();
}

function renderTaskSummary() {
  const me = authProfile?.id;
  const ctx = ruleCtx();
  const blocked = db.tasks.filter((t) => t.status === "Blocked").length;
  const overdue = db.tasks.filter((t) => isOverdue(t)).length;
  const reviewable = (db.requests || []).filter(
    (r: any) => r.status === "Pending" && canReview(ctx, db.tasks.find((t) => t.id === r.task) || { id: "" }) && r.by !== me,
  );
  const mine = (db.requests || []).filter((r: any) => r.by === me).slice(0, 8);
  $("taskSummary").innerHTML =
    `<span class="chip ${blocked ? "warn" : ""}">⛔ ${blocked} blocked</span><span class="chip ${overdue ? "warn" : ""}">◷ ${overdue} overdue</span><span class="chip">✉ ${reviewable.length} request${reviewable.length === 1 ? "" : "s"} waiting for you</span>`;
  const item = (r: any, review: boolean) => {
    const task = db.tasks.find((t) => t.id === r.task);
    return `<div class="req-item"><div><strong>${esc(r.type === "Edit" ? "Edit" : "Reassign")}</strong> · ${esc(task?.title || "Removed subtask")}<div class="row-sub">${esc(describeRequest(r))}${r.reason ? ` — “${esc(r.reason)}”` : ""}</div><div class="row-sub">${review ? `From ${esc(personName(r.by))}` : `<span class="badge ${r.status === "Approved" ? "done" : r.status === "Rejected" ? "urgent" : "pending"}">${esc(r.status)}</span>`} · ${esc(fmtMoment(r.at))}</div></div><div class="req-actions"><button class="btn ghost small" data-action="open-task" data-id="${r.task}">Open</button>${review ? `<button class="btn lime small" data-action="review-request" data-id="${r.id}" data-decision="Approve">Approve</button><button class="btn danger small" data-action="review-request" data-id="${r.id}" data-decision="Reject">Reject</button>` : r.status === "Pending" ? `<button class="btn ghost small" data-action="cancel-request" data-id="${r.id}">Cancel</button>` : ""}</div></div>`;
  };
  const html = [
    reviewable.length ? `<h4>Waiting for your decision</h4>${reviewable.map((r: any) => item(r, true)).join("")}` : "",
    mine.length ? `<h4>Requests you sent</h4>${mine.map((r: any) => item(r, false)).join("")}` : "",
  ].join("");
  $("taskRequests").innerHTML = html;
  $("taskRequests").classList.toggle("hidden", !html);
}

function describeRequest(r: any) {
  if (r.type === "Reassign") return `Move it to ${personName(r.changes.assignee_id)}`;
  const parts: string[] = [];
  if (r.changes.title) parts.push(`title → “${r.changes.title}”`);
  if (r.changes.description !== undefined) parts.push("new description");
  if (r.changes.due_at !== undefined) parts.push(r.changes.due_at ? `deadline → ${fmtDay(String(r.changes.due_at).slice(0, 10))}` : "remove deadline");
  if (r.changes.priority) parts.push(`priority → ${r.changes.priority}`);
  return parts.join(", ") || "Edit";
}

function describeActivity(a: any) {
  const d = a.detail || {};
  const who = a.actor_id ? personName(a.actor_id) : "The system";
  const name = (id: string) => (id ? personName(id) : "nobody");
  switch (a.event) {
    case "Task created": return `${who} created the task`;
    case "Subtask created": return `${who} created this subtask for ${name(d.assignee)}`;
    case "Task divided": return `${who} added the subtask “${d.title}” for ${name(d.assignee)}`;
    case "Assigned": return `${who} assigned it to ${name(d.to)}`;
    case "Reassigned": return `${who} moved it from ${name(d.from)} to ${name(d.to)}`;
    case "Unassigned": return `${who} removed the assignee`;
    case "Status changed": return `${who} changed the status from ${d.from} to ${d.to}`;
    case "Completed": return `${who} marked it completed`;
    case "Deadline changed": return `${who} changed the deadline${d.to ? ` to ${fmtDay(String(d.to).slice(0, 10))}` : " (removed)"}`;
    case "Priority changed": return `${who} changed the priority from ${d.from} to ${d.to}`;
    case "Details edited": return `${who} edited the details`;
    case "Dependencies changed": return `${who} changed what this waits on`;
    case "Edit requested": return `${who} asked to edit it${d.reason ? `: “${d.reason}”` : ""}`;
    case "Reassignment requested": return `${who} asked to reassign it to ${name(d.changes?.assignee_id)}${d.reason ? `: “${d.reason}”` : ""}`;
    case "Request approved": return `${who} approved the ${String(d.type || "").toLowerCase()} request`;
    case "Request rejected": return `${who} rejected the ${String(d.type || "").toLowerCase()} request${d.note ? `: “${d.note}”` : ""}`;
    case "Request cancelled": return `${who} cancelled a request`;
    case "Comment": return `${who} commented: “${d.text || ""}”`;
    default: return `${who}: ${a.event}`;
  }
}

async function runRpc(name: string, args: any): Promise<boolean> {
  const { error } = await supabase.rpc(name, args);
  // Always reload: the screen then shows what the database really holds, which matters when two
  // people acted at nearly the same moment and only the first action counted.
  try {
    db = await loadSharedWorkspace();
    render();
  } catch (e) {
    /* the error below is more useful */
  }
  if (error) {
    alert(error.message);
    return false;
  }
  return true;
}

async function fetchTaskExtras(id: string) {
  const ids = [id, ...subtasksOf(id).map((t) => t.id)];
  const [comments, activity, requests] = await Promise.all([
    supabase.from("task_comments").select("id,author_id,body,created_at").eq("task_id", id).order("created_at"),
    supabase.from("task_activity").select("id,actor_id,event,detail,created_at").eq("task_id", id).order("created_at", { ascending: false }),
    supabase
      .from("task_requests")
      .select("id,task_id,request_type,requested_by,changes,reason,status,created_at,reviewed_by,reviewed_at,review_note")
      .in("task_id", ids),
  ]);
  if (requests.data) {
    const fresh = requests.data.map((item: any) => ({
      id: item.id, task: item.task_id, type: item.request_type, by: item.requested_by, changes: item.changes || {},
      reason: item.reason || "", status: item.status, at: item.created_at, reviewedBy: item.reviewed_by || "",
      reviewedAt: item.reviewed_at || "", note: item.review_note || "",
    }));
    db.requests = [...(db.requests || []).filter((r: any) => !ids.includes(r.task)), ...fresh];
  }
  return { comments: comments.data || [], activity: activity.data || [] };
}

function taskDetailsHtml(t: any, extras: { comments: any[]; activity: any[] } | null) {
  const ctx = ruleCtx();
  const isSub = Boolean(t.parent);
  const parent = isSub ? db.tasks.find((x) => x.id === t.parent) : null;
  const kids = subtasksOf(t.id);
  const prog = isSub ? null : progressFor(t);
  const ids = [t.id, ...kids.map((k) => k.id)];
  const requests = (db.requests || []).filter((r: any) => ids.includes(r.task)).sort((a: any, b: any) => String(b.at).localeCompare(String(a.at)));
  const waiting = unmetDependencies(db.dependencies || [], db.tasks, t.id);
  const dependsOn = (db.dependencies || []).filter((d: any) => d.task === t.id).map((d: any) => db.tasks.find((x) => x.id === d.dependsOn)).filter(Boolean);
  const writes = SHARED_WRITES_ENABLED;
  const buttons = [
    writes && canDivide(ctx, t) ? `<button type="button" class="btn lime" data-action="divide-task" data-id="${t.id}">＋ Add subtask</button>` : "",
    writes && canEditDetails(ctx, t) ? `<button type="button" class="btn ghost" data-action="edit-task-details" data-id="${t.id}">Edit details</button>` : "",
    writes && canManageTask(t) ? `<button type="button" class="btn ghost" data-action="assign-task" data-id="${t.id}">${t.assignee ? "Reassign" : "Assign"}</button>` : "",
    writes && canRequestChange(ctx, t) ? `<button type="button" class="btn ghost" data-action="request-change" data-id="${t.id}">Request a change</button>` : "",
    writes && isSub && canEditDetails(ctx, t) ? `<button type="button" class="btn ghost" data-action="edit-dependencies" data-id="${t.id}">Dependencies</button>` : "",
  ].join("");
  const requestHtml = requests.length
    ? requests.map((r: any) => {
        const target = db.tasks.find((x) => x.id === r.task);
        const reviewable = r.status === "Pending" && target && canReview(ctx, target) && r.by !== authProfile?.id;
        return `<div class="req-item"><div><strong>${esc(r.type)}</strong>${r.task !== t.id ? ` · ${esc(target?.title || "")}` : ""} · <span class="badge ${r.status === "Approved" ? "done" : r.status === "Rejected" ? "urgent" : "pending"}">${esc(r.status)}</span><div class="row-sub">${esc(describeRequest(r))}${r.reason ? ` — “${esc(r.reason)}”` : ""}</div><div class="row-sub">${esc(personName(r.by))}, ${esc(fmtMoment(r.at))}${r.reviewedBy ? ` · decided by ${esc(personName(r.reviewedBy))}, ${esc(fmtMoment(r.reviewedAt))}` : ""}</div></div><div class="req-actions">${reviewable ? `<button class="btn lime small" data-action="review-request" data-id="${r.id}" data-decision="Approve">Approve</button><button class="btn danger small" data-action="review-request" data-id="${r.id}" data-decision="Reject">Reject</button>` : ""}${r.status === "Pending" && r.by === authProfile?.id ? `<button class="btn ghost small" data-action="cancel-request" data-id="${r.id}">Cancel</button>` : ""}</div></div>`;
      }).join("")
    : '<p class="quiet">No requests.</p>';
  const subtaskHtml = !isSub
    ? kids.length
      ? kids.map((k) => `<div class="sub-line"><button type="button" class="task-title-button" data-action="open-task" data-id="${k.id}">${esc(k.title)}</button> ${badge(k.status)}<span class="quiet">${esc(personName(k.assignee))}${k.due ? ` · ${esc(fmtDay(k.due))}` : ""}</span>${unmetDependencies(db.dependencies || [], db.tasks, k.id).length ? '<span class="chip warn">⏳ waiting</span>' : ""}</div>`).join("")
      : '<p class="quiet">This task has not been divided. It can be completed directly.</p>'
    : "";
  const comments = extras
    ? extras.comments.length
      ? extras.comments.map((c: any) => `<div class="comment"><strong>${esc(personName(c.author_id))}</strong> <span class="quiet">${esc(fmtMoment(c.created_at))}</span><p>${esc(c.body)}</p></div>`).join("")
      : '<p class="quiet">No comments yet.</p>'
    : '<p class="quiet">Loading…</p>';
  const activity = extras
    ? extras.activity.map((a: any) => `<li>${esc(describeActivity(a))} <span class="quiet">${esc(fmtMoment(a.created_at))}</span></li>`).join("") || '<li class="quiet">Nothing recorded yet.</li>'
    : "<li class=\"quiet\">Loading…</li>";
  return `<div class="cal-detail task-detail" data-detail-task="${t.id}"><div class="cal-detail-badges">${badge(t.status)}<span class="badge ${t.priority === "Urgent" ? "urgent" : t.priority === "High" ? "high" : ""}">${esc(t.priority)}</span>${isOverdue(t) ? '<span class="badge urgent">Overdue</span>' : ""}${isSub ? '<span class="chip subtle">Subtask</span>' : ""}</div>${parent ? `<p class="quiet">Part of <button type="button" class="task-title-button" data-action="open-task" data-id="${parent.id}">${esc(parent.title)}</button></p>` : ""}${waiting.length ? `<div class="note warn-note">⏳ Waiting on ${esc(waiting.map((w) => w.title).join(", "))}. Starting it now is possible, but that work is not finished yet.</div>` : ""}<div class="cal-detail-when">◷ Due ${t.due ? esc(fmtDay(t.due)) : "no deadline"}</div><h4>Description</h4><p class="cal-detail-desc">${t.description ? esc(t.description) : '<span class="quiet">No description was added.</span>'}</p><dl class="cal-detail-meta"><div><dt>Assigned to</dt><dd>${t.assignee ? esc(personName(t.assignee)) : "Unassigned"}</dd></div><div><dt>Created by</dt><dd>${t.creator ? esc(personName(t.creator)) : "—"}</dd></div><div><dt>Responsible</dt><dd>${responsible(ctx, t) ? esc(personName(responsible(ctx, t))) : "—"}</dd></div><div><dt>Project / department</dt><dd>${esc(taskScopeLabel(t))}</dd></div></dl>${isSub ? `<h4>Waits for</h4>${dependsOn.length ? dependsOn.map((d: any) => `<div class="sub-line">${esc(d.title)} ${badge(d.status)}</div>`).join("") : '<p class="quiet">Nothing. It can start any time.</p>'}` : `<h4>Progress</h4>${prog && prog.total ? `<div class="progress"><div class="progress-bar"><span style="width:${prog.pct}%"></span></div><small>${esc(prog.label)}. Completing every subtask does not complete the main task; the responsible person confirms that.</small></div>` : ""}<h4>Subtasks</h4>${subtaskHtml}`}${t.update ? `<h4>Latest update</h4><p class="cal-detail-desc">${esc(t.update)}</p>` : ""}<div class="form-actions detail-actions">${buttons}<button type="button" class="btn ghost" data-close-modal>Close</button></div><h4>Requests</h4>${requestHtml}<h4>Comments</h4><div class="comments">${comments}</div>${writes ? `<form class="comment-form" id="commentForm" data-id="${t.id}"><textarea name="body" rows="2" maxlength="2000" required placeholder="Add a comment, report progress or explain a blocker…"></textarea><button class="btn lime small">Post comment</button></form>` : ""}<h4>Activity</h4><ul class="activity">${activity}</ul></div>`;
}

async function openTaskDetails(id: string) {
  const t = db.tasks.find((x) => x.id === id);
  if (!t) return;
  openDetailsId = id;
  openModal(t.title, taskDetailsHtml(t, null));
  try {
    const extras = await fetchTaskExtras(id);
    if (openDetailsId !== id || !$("modal").classList.contains("open")) return;
    $("modalBody").innerHTML = taskDetailsHtml(db.tasks.find((x) => x.id === id) || t, extras);
    wireCommentForm();
  } catch {
    /* keep the instant view */
  }
}
function wireCommentForm() {
  const form = document.getElementById("commentForm") as HTMLFormElement | null;
  if (!form) return;
  form.onsubmit = async (event) => {
    event.preventDefault();
    const body = String(new FormData(form).get("body") || "").trim();
    if (!body) return;
    const { error } = await supabase
      .from("task_comments")
      .insert([{ task_id: form.dataset.id, author_id: authProfile.id, body }]);
    if (error) return alert(`Could not post the comment: ${error.message}`);
    openTaskDetails(form.dataset.id || "");
  };
}

function eligibleForSubtask(projectNames: string[], departmentNames: string[]) {
  const c = ruleCtx();
  const leader = c.isAdmin || c.isExecutive;
  return db.members.filter((m) => {
    if (m.status !== "Active") return false;
    if (!projectNames.length && !departmentNames.length) return leader;
    const inScope = m.projects.some((p: string) => projectNames.includes(p)) || deptsOf(m).some((d: string) => departmentNames.includes(d));
    const covered = leader || m.projects.some((p: string) => projectNames.includes(p) && c.ledProjects.includes(p)) || deptsOf(m).some((d: string) => departmentNames.includes(d) && c.managedDepartments.includes(d));
    return inScope && covered;
  });
}

function divideForm(parentId: string) {
  const parent = db.tasks.find((t) => t.id === parentId);
  const c = ruleCtx();
  if (!parent || !canDivide(c, parent)) return alert("You cannot divide this task. Only its creator, or a head it was assigned to directly by the President, Vice President or System Admin, can.");
  const leader = c.isAdmin || c.isExecutive;
  const parentProjects = taskProjects(parent);
  const projectChoices = parentProjects.length ? parentProjects : leader ? db.projects.map((p) => p.name) : c.ledProjects;
  openModal(
    `Add a subtask to “${parent.title}”`,
    `<form class="form" id="divideForm"><div class="field full"><label>Subtask</label><input name="title" required placeholder="e.g. Filming"></div><div class="field full"><label>Brief</label><textarea name="description" rows="2" placeholder="What does this piece of work include?"></textarea></div>${projectChoices.length ? `<div class="field full"><label>Projects</label><div class="form-checks">${projectChoices.map((n) => `<label class="check"><input type="checkbox" name="projects" value="${esc(n)}" ${parentProjects.includes(n) ? "checked" : ""}>${esc(n)}</label>`).join("")}</div></div>` : ""}<div class="field full"><label>Departments</label><div class="form-checks">${db.departments.map((d) => `<label class="check"><input type="checkbox" name="departments" value="${esc(d.name)}" ${taskDepartments(parent).includes(d.name) ? "checked" : ""}>${esc(d.name)}</label>`).join("")}</div><small class="quiet">Department heads can follow subtasks linked to their department.</small></div><div class="field full"><label>Assign to</label><select name="assignee" id="subAssignee" required></select><small class="quiet" id="subAssigneeHint"></small></div><div class="field"><label>Deadline</label><input type="date" name="due"></div><div class="field"><label>Priority</label><select name="priority">${options(PRIORITIES, "Medium")}</select></div><div class="form-actions"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button class="btn lime">Create subtask</button></div></form>`,
  );
  const form = $("divideForm") as HTMLFormElement;
  const picked = (name: string) => [...form.querySelectorAll<HTMLInputElement>(`[name="${name}"]:checked`)].map((i) => i.value);
  const refresh = () => {
    const list = eligibleForSubtask(picked("projects"), picked("departments"));
    const select = $("subAssignee");
    const keep = select.value;
    select.innerHTML = `<option value="">Choose a member</option>${list.map((m) => `<option value="${m.id}" ${m.id === keep ? "selected" : ""}>${esc(m.name)}</option>`).join("")}`;
    $("subAssigneeHint").textContent = list.length ? "" : "No active member in your scope belongs to the selected projects or departments.";
  };
  form.addEventListener("change", refresh);
  refresh();
  form.onsubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const idsOf = (names: string[], source: any[]) => names.map((n) => source.find((x) => x.name === n)?.id).filter(Boolean);
    const due = String(data.get("due") || "");
    const ok = await runRpc("create_subtask", {
      p_parent: parentId,
      p_title: String(data.get("title") || "").trim(),
      p_description: String(data.get("description") || "").trim(),
      p_assignee: String(data.get("assignee") || ""),
      p_due: due ? `${due}T23:59:00` : null,
      p_priority: String(data.get("priority") || "Medium"),
      p_project_ids: idsOf(picked("projects"), db.projects),
      p_department_ids: idsOf(picked("departments"), db.departments),
    });
    if (ok) {
      expandedTasks.add(parentId);
      closeModal();
      render();
    }
  };
}

function editDetailsForm(id: string) {
  const t = db.tasks.find((x) => x.id === id);
  if (!t || !canEditDetails(ruleCtx(), t)) return;
  openModal(
    `Edit “${t.title}”`,
    `<form class="form" id="detailsForm"><div class="field full"><label>Title</label><input name="title" required value="${esc(t.title)}"></div><div class="field full"><label>Description</label><textarea name="description" rows="3">${esc(t.description || "")}</textarea></div><div class="field"><label>Deadline</label><input type="date" name="due" value="${esc(t.due || "")}"></div><div class="field"><label>Priority</label><select name="priority">${options(PRIORITIES, t.priority)}</select></div><div class="form-actions"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button class="btn lime">Save changes</button></div></form>`,
  );
  $("detailsForm").onsubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    const due = String(data.get("due") || "");
    const ok = await runRpc("update_task_details", {
      p_task: id,
      p_title: String(data.get("title") || "").trim(),
      p_description: String(data.get("description") || ""),
      p_due: due ? `${due}T23:59:00` : null,
      p_clear_due: !due && Boolean(t.due),
      p_priority: String(data.get("priority") || t.priority),
    });
    if (ok) openTaskDetails(id);
  };
}

function requestForm(id: string) {
  const t = db.tasks.find((x) => x.id === id);
  const c = ruleCtx();
  if (!t || !canRequestChange(c, t)) return;
  const mine = db.members.filter((m) => m.status === "Active" && m.id !== t.assignee && deptsOf(m).some((d: string) => c.managedDepartments.includes(d)));
  openModal(
    `Request a change to “${t.title}”`,
    `<form class="form" id="requestForm"><div class="field full"><label>What do you want?</label><div class="form-checks"><label class="check"><input type="radio" name="type" value="Edit" checked>Edit the subtask</label><label class="check"><input type="radio" name="type" value="Reassign">Give it to someone else</label></div></div><div id="editFields"><div class="field full"><label>Title</label><input name="title" value="${esc(t.title)}"></div><div class="field full"><label>Description</label><textarea name="description" rows="2">${esc(t.description || "")}</textarea></div><div class="field"><label>Deadline</label><input type="date" name="due" value="${esc(t.due || "")}"></div><div class="field"><label>Priority</label><select name="priority">${options(PRIORITIES, t.priority)}</select></div></div><div id="reassignFields" class="field full hidden"><label>New assignee (from your department)</label><select name="assignee"><option value="">Choose a member</option>${mine.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join("")}</select></div><div class="field full"><label>Reason</label><textarea name="reason" rows="2" required placeholder="Why should this change?"></textarea></div><div class="note field full">Nothing changes until ${esc(personName(responsible(c, t)) || "the responsible head")} approves it.</div><div class="form-actions"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button class="btn lime">Send request</button></div></form>`,
  );
  const form = $("requestForm") as HTMLFormElement;
  const sync = () => {
    const reassign = (form.querySelector('[name="type"]:checked') as HTMLInputElement).value === "Reassign";
    $("editFields").classList.toggle("hidden", reassign);
    $("reassignFields").classList.toggle("hidden", !reassign);
  };
  form.addEventListener("change", sync);
  form.onsubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const type = String(data.get("type"));
    const changes: any = {};
    if (type === "Reassign") {
      changes.assignee_id = String(data.get("assignee") || "");
      if (!changes.assignee_id) return alert("Choose the member to give it to.");
    } else {
      const title = String(data.get("title") || "").trim();
      const description = String(data.get("description") || "");
      const due = String(data.get("due") || "");
      const priority = String(data.get("priority") || "");
      if (title && title !== t.title) changes.title = title;
      if (description !== (t.description || "")) changes.description = description;
      if (due !== (t.due || "")) changes.due_at = due ? `${due}T23:59:00` : "";
      if (priority !== t.priority) changes.priority = priority;
      if (!Object.keys(changes).length) return alert("Change at least one field, or choose reassign.");
    }
    const ok = await runRpc("submit_task_request", { p_task: id, p_type: type, p_changes: changes, p_reason: String(data.get("reason") || "").trim() });
    if (ok) {
      alert("Your request was sent. Nothing changes until it is approved.");
      openTaskDetails(id);
    }
  };
}

function dependenciesForm(id: string) {
  const t = db.tasks.find((x) => x.id === id);
  if (!t || !t.parent || !canEditDetails(ruleCtx(), t)) return;
  const siblings = subtasksOf(t.parent).filter((k) => k.id !== id);
  const current = (db.dependencies || []).filter((d: any) => d.task === id).map((d: any) => d.dependsOn);
  openModal(
    `What must finish before “${t.title}”?`,
    `<form class="form" id="dependencyForm"><div class="field full">${siblings.length ? `<div class="form-checks">${siblings.map((k) => `<label class="check"><input type="checkbox" name="deps" value="${k.id}" ${current.includes(k.id) ? "checked" : ""}>${esc(k.title)} <span class="quiet">(${esc(k.status)})</span></label>`).join("")}</div>` : '<p class="quiet">This main task has no other subtasks yet.</p>'}<small class="quiet">Only subtasks of the same main task. A dependency never creates another level.</small></div><div class="form-actions"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button class="btn lime">Save</button></div></form>`,
  );
  $("dependencyForm").onsubmit = async (event) => {
    event.preventDefault();
    const picked = [...(event.currentTarget as HTMLFormElement).querySelectorAll<HTMLInputElement>('[name="deps"]:checked')].map((i) => i.value);
    const ok = await runRpc("set_subtask_dependencies", { p_task: id, p_depends_on: picked });
    if (ok) openTaskDetails(id);
  };
}

async function reviewRequest(id: string, decision: string) {
  const r = (db.requests || []).find((x: any) => x.id === id);
  if (!r) return;
  const task = db.tasks.find((t) => t.id === r.task);
  const approve = decision === "Approve";
  const sure = await confirmAction(
    `${approve ? "Approve" : "Reject"} this ${r.type.toLowerCase()} request on “${task?.title || "this subtask"}”? ${approve ? `It will be applied right away: ${describeRequest(r)}.` : "Nothing will change."} If someone else decides first, theirs counts and yours is ignored.`,
    approve ? "Approve" : "Reject",
  );
  if (!sure) return;
  const ok = await runRpc("review_task_request", { p_request: id, p_decision: decision, p_note: "" });
  if (ok && openDetailsId) openTaskDetails(openDetailsId);
  else if (!ok && openDetailsId && $("modal").classList.contains("open")) openTaskDetails(openDetailsId);
}

async function cancelRequest(id: string) {
  if (!(await confirmAction("Cancel this request?", "Cancel request"))) return;
  const ok = await runRpc("cancel_task_request", { p_request: id });
  if (ok && openDetailsId && $("modal").classList.contains("open")) openTaskDetails(openDetailsId);
}

async function updateTask(id, key, value) {
  const t = db.tasks.find((x) => x.id === id);
  if (
    key === "status" &&
    (!t || (!canManageTask(t) && t.assignee !== authProfile?.id) || (value === "Completed" && !canMarkTaskDone(t)))
  )
    return;
  if (!t) return;
  if (key === "status") {
    const waiting = unmetDependencies(db.dependencies || [], db.tasks, t.id);
    if (waiting.length && ["In Progress", "Under Review", "Completed"].includes(value)) {
      const go = await confirmAction(`“${t.title}” is waiting on ${waiting.map((w) => w.title).join(", ")}. Move it to ${value} anyway?`, "Continue anyway");
      if (!go) return render();
    }
    if (value === "Completed") {
      const open = t.parent ? 0 : subtasksOf(t.id).filter((k) => k.status !== "Completed").length;
      const go = await confirmAction(
        open
          ? `Confirm “${t.title}” as completed? ${open} subtask${open === 1 ? " is" : "s are"} not completed yet.`
          : `Confirm “${t.title}” as completed?`,
        "Mark completed",
      );
      if (!go) return render();
    }
  }
  t[key] = value;
  save();
}

// Notifications: kept by the database for the people involved, read here.
function relativeTime(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} h ago`;
  return fmtMoment(iso);
}
function renderNotifications() {
  const list: any[] = db.notifications || [];
  const unread = list.filter((n) => !n.read_at).length;
  const count = document.getElementById("notifCount");
  if (!count) return;
  count.textContent = unread > 99 ? "99+" : String(unread);
  count.classList.toggle("hidden", !unread);
  $("notifList").innerHTML = list.length
    ? list.map((n) => `<button type="button" class="notif${n.read_at ? "" : " unread"}" data-action="open-notification" data-id="${n.id}" data-task="${n.task_id || ""}"><strong>${esc(n.title)}</strong>${n.body ? `<span>${esc(n.body)}</span>` : ""}<time>${esc(relativeTime(n.created_at))}</time></button>`).join("")
    : '<div class="empty"><strong>No notifications yet.</strong>Assignments, requests and deadlines for you appear here.</div>';
}
async function markNotificationsRead(ids: string[]) {
  const stamp = new Date().toISOString();
  (db.notifications || []).forEach((n: any) => {
    if (ids.includes(n.id)) n.read_at = n.read_at || stamp;
  });
  renderNotifications();
  if (ids.length) await supabase.from("notifications").update({ read_at: stamp }).in("id", ids);
}
document.getElementById("notifBtn")?.addEventListener("click", (event) => {
  event.stopPropagation();
  document.getElementById("notifPanel")?.classList.toggle("hidden");
});
document.addEventListener("click", (event) => {
  const panel = document.getElementById("notifPanel");
  if (panel && !panel.classList.contains("hidden") && !(event.target as HTMLElement).closest("#notifPanel,#notifBtn")) panel.classList.add("hidden");
});
document.getElementById("notifReadAll")?.addEventListener("click", () =>
  markNotificationsRead((db.notifications || []).filter((n: any) => !n.read_at).map((n: any) => n.id)),
);

// Live updates. The database tells the page when something changed (Supabase Realtime), and the
// page then reloads what this person is allowed to see. Row-level security still decides what
// arrives, so the signal reveals nothing. A short poll and a refresh on returning to the tab cover
// the cases where the live connection is down. Nothing refreshes while a form is open or being typed
// in; it catches up as soon as that is over.
let liveRefreshTimer: number | undefined;
let liveRefreshing = false;
let livePending = false;
function liveBusy() {
  const el = document.activeElement;
  const typing = el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
  return Boolean(
    document.hidden || typing || $("modal").classList.contains("open") || document.getElementById("popup")?.classList.contains("open"),
  );
}
async function liveRefresh() {
  if (!supabase || !authProfile || liveRefreshing) return;
  if (liveBusy()) {
    livePending = true;
    return;
  }
  liveRefreshing = true;
  livePending = false;
  try {
    db = await loadSharedWorkspace();
    render();
  } catch {
    /* try again on the next signal */
  } finally {
    liveRefreshing = false;
  }
}
function scheduleLiveRefresh() {
  window.clearTimeout(liveRefreshTimer);
  liveRefreshTimer = window.setTimeout(liveRefresh, 600);
}
const LIVE_TABLES = [
  "members",
  "departments",
  "projects",
  "member_departments",
  "member_positions",
  "project_assignments",
  "tasks",
  "task_projects",
  "task_departments",
  "task_dependencies",
  "task_requests",
  "task_comments",
  "notifications",
];
let liveChannelFor = "";
function startLiveUpdates() {
  if (!supabase || !authProfile || liveChannelFor === authProfile.id || typeof supabase.channel !== "function") return;
  liveChannelFor = authProfile.id;
  try {
    let channel = supabase.channel(`vines-live-${authProfile.id}`);
    for (const table of LIVE_TABLES) channel = channel.on("postgres_changes", { event: "*", schema: "public", table }, scheduleLiveRefresh);
    channel.subscribe();
  } catch {
    /* the poll below still keeps the page current */
  }
}
setInterval(() => {
  startLiveUpdates();
  void liveRefresh();
}, 20000);
setInterval(() => {
  if (livePending) void liveRefresh();
}, 2000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) void liveRefresh();
});
window.addEventListener("focus", () => void liveRefresh());

// Site messages. Every alert() in the app shows this centred, on-theme popup instead of the
// browser's "<site> says…" box. Messages queue so none is lost. vinesConfirm() is the same popup
// with Cancel and a custom confirm button, for important actions.
(() => {
  const queue: string[] = [];
  let showing = false;
  let confirmDone: ((answer: boolean) => void) | null = null;
  const popup = () => document.getElementById("popup");
  const looksLikeProblem = (text: string) =>
    /could not|couldn't|not sent|failed|only the|nothing imported|expired|please fix|enter |choose |do not match|cannot|can't|too many|unable|error|not configured|not active|try again|already|no longer|nothing was changed/i.test(
      text,
    );
  function close() {
    const box = popup();
    showing = false;
    box?.classList.remove("open");
    box?.setAttribute("aria-hidden", "true");
    document.getElementById("popupCancel")?.classList.add("hidden");
    const ok = document.getElementById("popupOk");
    if (ok) ok.textContent = "OK";
  }
  function next() {
    const box = popup();
    const message = queue.shift();
    if (!box || message === undefined) return close();
    const problem = looksLikeProblem(message);
    box.classList.toggle("error", problem);
    document.getElementById("popupIcon")!.textContent = problem ? "!" : "✓";
    document.getElementById("popupTitle")!.textContent = problem
      ? "Heads up"
      : "All set";
    document.getElementById("popupText")!.textContent = message;
    box.classList.add("open");
    box.setAttribute("aria-hidden", "false");
    document.getElementById("popupOk")?.focus();
  }
  function answer(value: boolean) {
    const done = confirmDone;
    confirmDone = null;
    close();
    done?.(value);
    if (queue.length) {
      showing = true;
      next();
    }
  }
  window.alert = (message?: any) => {
    queue.push(String(message ?? ""));
    if (!showing) {
      showing = true;
      next();
    }
  };
  (window as any).vinesConfirm = (message: string, okLabel = "Confirm") =>
    new Promise<boolean>((resolve) => {
      const box = popup();
      if (!box) return resolve(false);
      confirmDone?.(false);
      confirmDone = resolve;
      showing = true;
      box.classList.remove("error");
      document.getElementById("popupIcon")!.textContent = "?";
      document.getElementById("popupTitle")!.textContent = "Please confirm";
      document.getElementById("popupText")!.textContent = message;
      document.getElementById("popupCancel")?.classList.remove("hidden");
      document.getElementById("popupOk")!.textContent = okLabel;
      box.classList.add("open");
      box.setAttribute("aria-hidden", "false");
      document.getElementById("popupCancel")?.focus();
    });
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("popupOk")?.addEventListener("click", () => (confirmDone ? answer(true) : next()));
    document.getElementById("popupCancel")?.addEventListener("click", () => answer(false));
    popup()?.addEventListener("click", (event) => {
      if (event.target === popup()) confirmDone ? answer(false) : next();
    });
  });
  document.addEventListener("keydown", (event) => {
    if (!showing) return;
    if (confirmDone) {
      // A confirmation is only accepted by clicking its button, never by a stray Enter.
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        answer(false);
      }
      return;
    }
    if (event.key === "Escape" || event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      next();
    }
  }, true);
})();
