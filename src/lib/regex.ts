interface RegexLogger {
  warn: (obj: Record<string, unknown>, msg: string) => void;
}

const MAX_DENIED_TOOLS_REGEX_LENGTH = 200;
const NESTED_QUANTIFIER_PATTERN =
  /(\((?:[^()\\]|\\.)*[+*?](?:[^()\\]|\\.)*\)|\[[^\]]+\])(?:[+*?]|\{\d+(?:,\d*)?\})/;

export function compileDeniedToolsRegex(
  pattern: string | undefined,
  logger: RegexLogger
): RegExp | undefined {
  const normalizedPattern = pattern?.trim();
  if (!normalizedPattern) {
    return undefined;
  }

  if (normalizedPattern.length > MAX_DENIED_TOOLS_REGEX_LENGTH) {
    logger.warn(
      { patternLength: normalizedPattern.length, maxLength: MAX_DENIED_TOOLS_REGEX_LENGTH },
      "Ignoring GITLAB_DENIED_TOOLS_REGEX because it exceeds the maximum safe length"
    );
    return undefined;
  }

  if (NESTED_QUANTIFIER_PATTERN.test(normalizedPattern)) {
    logger.warn(
      { pattern: normalizedPattern },
      "Ignoring GITLAB_DENIED_TOOLS_REGEX because it appears to contain nested quantifiers"
    );
    return undefined;
  }

  try {
    const regex = new RegExp(normalizedPattern);
    regex.test("gitlab_list_projects");
    return regex;
  } catch (error) {
    logger.warn(
      {
        pattern: normalizedPattern,
        error: error instanceof Error ? error.message : String(error)
      },
      "Ignoring invalid GITLAB_DENIED_TOOLS_REGEX"
    );
    return undefined;
  }
}
