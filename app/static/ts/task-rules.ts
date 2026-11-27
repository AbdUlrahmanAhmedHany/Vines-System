// Task and subtask rules as the app applies them. They mirror the database functions in
// shared-app/task-subtasks-system.sql (the database is the authority; these only decide which
// buttons to offer). Pure functions, so they can be unit tested.

export const STATUSES = ["Unassigned", "Not Started", "In Progress", "Under Review", "Completed", "Blocked"];
export const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
/** Statuses a member can move work between. "Completed" needs extra authority, see canComplete. */
export const WORKING_STATUSES = ["Not Started", "In Progress", "Under Review", "Blocked"];

export interface TaskLike {
  id: string;
  parent?: string;
  creator?: string;
  divisionOwner?: string;
  assignee?: string;
  status: string;
  projects?: string[];
  departments?: string[];
}

export interface RuleContext {
  me: string;
  isAdmin: boolean;
  isExecutive: boolean;
  /** Holds a Project Head or Department Head position. */
  isHead: boolean;
  ledProjects: string[];
  managedDepartments: string[];
  tasks: TaskLike[];
  /** Department names a member belongs to. */
  departmentsOf: (memberId: string) => string[];
}

const leadership = (c: RuleContext) => c.isAdmin || c.isExecutive;
export const isSubtask = (t: TaskLike) => Boolean(t.parent);
export const parentOf = (c: RuleContext, t: TaskLike) => (t.parent ? c.tasks.find((x) => x.id === t.parent) : undefined);

/** The person answerable for a main task: its assignee. A subtask answers to its parent's assignee. */
export function responsible(c: RuleContext, t: TaskLike): string {
  return (isSubtask(t) ? parentOf(c, t)?.assignee : t.assignee) || "";
}

/** Only main tasks divide: the creator or the head an executive/admin assigned it to directly. */
export function canDivide(c: RuleContext, t: TaskLike): boolean {
  if (isSubtask(t) || t.status === "Completed") return false;
  if (leadership(c)) return true;
  return c.isHead && (t.creator === c.me || t.divisionOwner === c.me);
}

export function canEditDetails(c: RuleContext, t: TaskLike): boolean {
  if (leadership(c)) return true;
  return t.creator === c.me || (isSubtask(t) && responsible(c, t) === c.me);
}

export function canComplete(c: RuleContext, t: TaskLike): boolean {
  if (leadership(c)) return true;
  if (!isSubtask(t) && t.assignee === c.me) return true;
  if (isSubtask(t) && (t.creator === c.me || responsible(c, t) === c.me)) return true;
  return (t.projects || []).some((p) => c.ledProjects.includes(p));
}

export function canManage(c: RuleContext, t: TaskLike): boolean {
  if (leadership(c)) return true;
  if (isSubtask(t)) return t.creator === c.me || responsible(c, t) === c.me;
  if ((t.projects || []).length) return t.projects!.some((p) => c.ledProjects.includes(p));
  return (t.departments || []).some((d) => c.managedDepartments.includes(d));
}

/** Department heads ask for changes to subtasks given to their members instead of making them. */
export function canRequestChange(c: RuleContext, t: TaskLike): boolean {
  if (!isSubtask(t) || t.status === "Completed" || !t.assignee || canEditDetails(c, t)) return false;
  return c.departmentsOf(t.assignee).some((d) => c.managedDepartments.includes(d));
}

/** Leadership, or the head currently responsible for the main task. */
export function canReview(c: RuleContext, t: TaskLike): boolean {
  return leadership(c) || responsible(c, t) === c.me;
}

export function progressOf(total: number, completed: number) {
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return { total, completed, pct, label: total ? `${completed} of ${total} done (${pct}%)` : "No subtasks" };
}

/** Subtasks a task is still waiting on. */
export function unmetDependencies(
  deps: { task: string; dependsOn: string }[],
  tasks: { id: string; title?: string; status: string }[],
  taskId: string,
) {
  return deps
    .filter((d) => d.task === taskId)
    .map((d) => tasks.find((t) => t.id === d.dependsOn))
    .filter((t): t is { id: string; title?: string; status: string } => Boolean(t) && t!.status !== "Completed");
}

export function statusClass(status: string): string {
  return (
    { Completed: "done", Unassigned: "unassigned", "Not Started": "pending", "Under Review": "review", "In Progress": "progress", Blocked: "blocked" }[
      status
    ] || "todo"
  );
}
