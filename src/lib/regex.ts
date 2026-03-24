interface RegexLogger {
  warn: (obj: Record<string, unknown>, msg: string) => void;
}

const MAX_DENIED_TOOLS_REGEX_LENGTH = 200;
const NESTED_QUANTIFIER_PATTERN =
  /\((?:[^()\\]|\\.)*(?:[+*?]|\{\d+(?:,\d*)?\})(?:[^()\\]|\\.)*\)(?:[+*?]|\{\d+(?:,\d*)?\})/;

export function compileDeniedToolsRegex(
  pattern: string | undefined,
  logger: RegexLogger
): RegExp | undefined {
  const normalizedPattern = pattern?.trim();
  if (!normalizedPattern) {
    return undefined;
  }

  if (normalizedPattern.length > MAX_DENIED_TOOLS_REGEX_LENGTH) {
    throwLoggedRegexError(
      logger,
      { patternLength: normalizedPattern.length, maxLength: MAX_DENIED_TOOLS_REGEX_LENGTH },
      `Invalid GITLAB_DENIED_TOOLS_REGEX: pattern exceeds maximum safe length of ${MAX_DENIED_TOOLS_REGEX_LENGTH} characters`
    );
  }

  if (NESTED_QUANTIFIER_PATTERN.test(normalizedPattern)) {
    throwLoggedRegexError(
      logger,
      { pattern: normalizedPattern },
      "Invalid GITLAB_DENIED_TOOLS_REGEX: nested quantifiers are not allowed"
    );
  }

  try {
    const regex = new RegExp(normalizedPattern);
    regex.test("gitlab_list_projects");
    return regex;
  } catch (error) {
    throwLoggedRegexError(
      logger,
      {
        pattern: normalizedPattern,
        error: error instanceof Error ? error.message : String(error)
      },
      `Invalid GITLAB_DENIED_TOOLS_REGEX: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function throwLoggedRegexError(
  logger: RegexLogger,
  context: Record<string, unknown>,
  message: string
): never {
  logger.warn(context, message);
  throw new Error(message);
}
