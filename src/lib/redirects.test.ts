import { describe, expect, it } from "vitest";

import { DEFAULT_REDIRECT, safeRedirect } from "@/lib/redirects";

describe("safeRedirect", () => {
  it("keeps a same-site path", () => {
    expect(safeRedirect("/entries")).toBe("/entries");
  });

  it("keeps a path with a query string", () => {
    expect(safeRedirect("/entries?status=OPEN")).toBe("/entries?status=OPEN");
  });

  it.each([
    ["missing", undefined],
    ["null", null],
    ["empty", ""],
  ])("falls back when the callback is %s", (_label, value) => {
    expect(safeRedirect(value)).toBe(DEFAULT_REDIRECT);
  });

  // The browser reads a leading `//` as protocol-relative and a `/\` gets
  // normalised to the same thing — both leave the origin despite starting "/".
  it.each([
    "//evil.com",
    "//evil.com/phish",
    "/\\evil.com",
    "https://evil.com",
    "http://evil.com",
    "javascript:alert(1)",
    "entries",
  ])("refuses %s", (value) => {
    expect(safeRedirect(value)).toBe(DEFAULT_REDIRECT);
  });
});
