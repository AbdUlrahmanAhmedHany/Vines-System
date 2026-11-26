import { describe, expect, it } from "vitest";
import { addDays, esc, parseCsv, ymd } from "../../app/static/ts/lib";

describe("esc", () => {
  it("escapes HTML so user text cannot inject markup", () => {
    expect(esc(`<img src=x onerror="a('b')">&`)).toBe(
      "&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;",
    );
  });
  it("handles empty and non-string values", () => {
    expect(esc()).toBe("");
    expect(esc(42 as any)).toBe("42");
  });
});

describe("date helpers", () => {
  it("formats local dates as YYYY-MM-DD with zero padding", () => {
    expect(ymd(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(ymd(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
  it("adds days across month and year boundaries", () => {
    expect(ymd(addDays(new Date(2026, 11, 30), 3))).toBe("2027-01-02");
    expect(ymd(addDays(new Date(2026, 2, 1), -1))).toBe("2026-02-28");
  });
});

describe("parseCsv", () => {
  it("parses rows and quoted cells with commas and escaped quotes", () => {
    expect(parseCsv('name,email\n"Doe, Jane","j@x.test"\n"Say ""hi""",b')).toEqual([
      ["name", "email"],
      ["Doe, Jane", "j@x.test"],
      ['Say "hi"', "b"],
    ]);
  });
  it("accepts Windows line endings and skips blank lines", () => {
    expect(parseCsv("a,b\r\n\r\nc,d\r\n")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });
  it("keeps newlines inside quoted cells", () => {
    expect(parseCsv('a\n"line1\nline2"')).toEqual([["a"], ["line1\nline2"]]);
  });
});
