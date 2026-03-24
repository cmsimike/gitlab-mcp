import { describe, expect, it, vi } from "vitest";

import { compileDeniedToolsRegex } from "../src/lib/regex.js";

function createLogger() {
  return {
    warn: vi.fn()
  };
}

describe("compileDeniedToolsRegex", () => {
  it("returns undefined when pattern is empty", () => {
    const logger = createLogger();

    expect(compileDeniedToolsRegex("   ", logger)).toBeUndefined();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("compiles a valid pattern", () => {
    const logger = createLogger();
    const regex = compileDeniedToolsRegex("^gitlab_(delete|create)_", logger);

    expect(regex).toBeInstanceOf(RegExp);
    expect(regex?.test("gitlab_delete_issue")).toBe(true);
    expect(regex?.test("gitlab_get_project")).toBe(false);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("allows character classes followed by quantifiers", () => {
    const logger = createLogger();

    const alphaRegex = compileDeniedToolsRegex("^gitlab_[a-z]+$", logger);
    const mixedRegex = compileDeniedToolsRegex("^gitlab_(foo|bar)[0-9]+$", logger);

    expect(alphaRegex).toBeInstanceOf(RegExp);
    expect(alphaRegex?.test("gitlab_delete")).toBe(true);
    expect(mixedRegex).toBeInstanceOf(RegExp);
    expect(mixedRegex?.test("gitlab_foo123")).toBe(true);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("rejects overly long patterns", () => {
    const logger = createLogger();
    const pattern = `^${"a".repeat(201)}$`;

    expect(() => compileDeniedToolsRegex(pattern, logger)).toThrow(
      "Invalid GITLAB_DENIED_TOOLS_REGEX: pattern exceeds maximum safe length of 200 characters"
    );
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it("rejects nested quantifier patterns", () => {
    const logger = createLogger();

    expect(() => compileDeniedToolsRegex("(gitlab_.*)+$", logger)).toThrow(
      "Invalid GITLAB_DENIED_TOOLS_REGEX: nested quantifiers are not allowed"
    );
    expect(() => compileDeniedToolsRegex("([a-z]{1,10})+$", logger)).toThrow(
      "Invalid GITLAB_DENIED_TOOLS_REGEX: nested quantifiers are not allowed"
    );
    expect(logger.warn).toHaveBeenCalledTimes(2);
  });

  it("rejects invalid regex syntax", () => {
    const logger = createLogger();

    expect(() => compileDeniedToolsRegex("[unterminated", logger)).toThrow(
      "Invalid GITLAB_DENIED_TOOLS_REGEX"
    );
    expect(logger.warn).toHaveBeenCalledOnce();
  });
});
