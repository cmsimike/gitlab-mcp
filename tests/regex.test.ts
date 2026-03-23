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

  it("rejects overly long patterns", () => {
    const logger = createLogger();
    const pattern = `^${"a".repeat(201)}$`;

    expect(compileDeniedToolsRegex(pattern, logger)).toBeUndefined();
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it("rejects nested quantifier patterns", () => {
    const logger = createLogger();

    expect(compileDeniedToolsRegex("(gitlab_.*)+$", logger)).toBeUndefined();
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it("rejects invalid regex syntax", () => {
    const logger = createLogger();

    expect(compileDeniedToolsRegex("[unterminated", logger)).toBeUndefined();
    expect(logger.warn).toHaveBeenCalledOnce();
  });
});
