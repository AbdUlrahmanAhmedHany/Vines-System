import { describe, expect, it } from "vitest";
import {
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
  type TaskLike,
} from "../../app/static/ts/task-rules";

const main: TaskLike = { id: "m", creator: "pres", divisionOwner: "filmhead", assignee: "filmhead", status: "Not Started", projects: ["Film"] };
const sub: TaskLike = { id: "s", parent: "m", creator: "filmhead", assignee: "cam", status: "Not Started", projects: ["Film"], departments: ["Videography"] };
const tasks = [main, sub];
const base: RuleContext = {
  me: "x", isAdmin: false, isExecutive: false, isHead: false, ledProjects: [], managedDepartments: [], tasks,
  departmentsOf: (id) => (id === "cam" ? ["Videography"] : []),
};
const as = (patch: Partial<RuleContext>): RuleContext => ({ ...base, ...patch });

describe("who can divide", () => {
  it("lets executives and admins divide any open main task", () => {
    expect(canDivide(as({ isExecutive: true }), main)).toBe(true);
    expect(canDivide(as({ isAdmin: true }), main)).toBe(true);
  });
  it("lets a head divide a task an executive assigned directly to them", () => {
    expect(canDivide(as({ me: "filmhead", isHead: true }), main)).toBe(true);
  });
  it("lets a head divide a task they created", () => {
    expect(canDivide(as({ me: "h2", isHead: true }), { ...main, creator: "h2", divisionOwner: "" })).toBe(true);
  });
  it("does not let a head divide just because they can see or monitor it", () => {
    expect(canDivide(as({ me: "videohead", isHead: true, managedDepartments: ["Videography"] }), main)).toBe(false);
  });
  it("does not let a head divide a task another head assigned to them", () => {
    expect(canDivide(as({ me: "edit", isHead: true }), { ...main, assignee: "edit", divisionOwner: "" })).toBe(false);
  });
  it("never divides a subtask, even for executives", () => {
    expect(canDivide(as({ isExecutive: true }), sub)).toBe(false);
    expect(canDivide(as({ me: "filmhead", isHead: true }), sub)).toBe(false);
  });
  it("does not let regular members divide, even if they created or hold the task", () => {
    expect(canDivide(as({ me: "filmhead", isHead: false }), main)).toBe(false);
  });
  it("stops once the main task is completed", () => {
    expect(canDivide(as({ isExecutive: true }), { ...main, status: "Completed" })).toBe(false);
  });
});

describe("editing, managing and completing", () => {
  it("responsible head and creator edit a subtask; a department head does not", () => {
    expect(canEditDetails(as({ me: "filmhead" }), sub)).toBe(true);
    expect(canEditDetails(as({ me: "videohead", managedDepartments: ["Videography"] }), sub)).toBe(false);
    expect(canManage(as({ me: "videohead", managedDepartments: ["Videography"] }), sub)).toBe(false);
  });
  it("a subtask assignee cannot complete their own subtask", () => {
    expect(canComplete(as({ me: "cam" }), sub)).toBe(false);
    expect(canComplete(as({ me: "filmhead" }), sub)).toBe(true);
  });
  it("the responsible person confirms a main task", () => {
    expect(canComplete(as({ me: "filmhead" }), main)).toBe(true);
    expect(canComplete(as({ me: "other" }), main)).toBe(false);
  });
  it("a project head can manage tasks in the project they lead", () => {
    expect(canManage(as({ me: "ph", ledProjects: ["Film"] }), { ...main, creator: "pres" })).toBe(true);
    expect(canManage(as({ me: "ph", ledProjects: ["Other"] }), main)).toBe(false);
  });
});

describe("requests", () => {
  const dept = as({ me: "videohead", managedDepartments: ["Videography"] });
  it("a department head requests changes to subtasks held by their members", () => {
    expect(canRequestChange(dept, sub)).toBe(true);
  });
  it("not for other departments, main tasks or completed subtasks", () => {
    expect(canRequestChange(as({ me: "edit", managedDepartments: ["Editing"] }), sub)).toBe(false);
    expect(canRequestChange(dept, main)).toBe(false);
    expect(canRequestChange(dept, { ...sub, status: "Completed" })).toBe(false);
  });
  it("not when they can edit it directly (they created it)", () => {
    expect(canRequestChange(dept, { ...sub, creator: "videohead" })).toBe(false);
  });
  it("reviews go to the responsible head or leadership only", () => {
    expect(responsible(base, sub)).toBe("filmhead");
    expect(canReview(as({ me: "filmhead" }), sub)).toBe(true);
    expect(canReview(as({ isExecutive: true }), sub)).toBe(true);
    expect(canReview(dept, sub)).toBe(false);
  });
  it("follows a transfer of the main task", () => {
    const moved = as({ tasks: [{ ...main, assignee: "edit" }, sub], me: "filmhead" });
    expect(canReview(moved, sub)).toBe(false);
    expect(canReview({ ...moved, me: "edit" }, sub)).toBe(true);
  });
});

describe("progress and dependencies", () => {
  it("computes the percentage and label", () => {
    expect(progressOf(4, 3)).toMatchObject({ pct: 75, label: "3 of 4 done (75%)" });
    expect(progressOf(0, 0).label).toBe("No subtasks");
  });
  it("lists the subtasks still being waited on", () => {
    const list = [
      { id: "a", title: "Film", status: "Completed" },
      { id: "b", title: "Edit", status: "In Progress" },
      { id: "c", title: "Review", status: "Not Started" },
    ];
    const deps = [{ task: "c", dependsOn: "a" }, { task: "c", dependsOn: "b" }];
    expect(unmetDependencies(deps, list, "c").map((t) => t.id)).toEqual(["b"]);
    expect(unmetDependencies(deps, list, "a")).toEqual([]);
  });
  it("maps every status to a style", () => {
    expect(statusClass("Blocked")).toBe("blocked");
    expect(statusClass("Completed")).toBe("done");
    expect(statusClass("Something else")).toBe("todo");
  });
});
