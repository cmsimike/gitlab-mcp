const DEFAULT_OAUTH_SCOPES = ["api"];
const DEFAULT_READ_ONLY_OAUTH_SCOPES = ["read_api"];

export function parseOauthScopes(rawScopes: string): string[] {
  return rawScopes
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter((scope) => scope.length > 0);
}

export function resolveOauthScopes(rawScopes: string | undefined, readOnlyMode: boolean): string[] {
  const configuredScopes = rawScopes ? parseOauthScopes(rawScopes) : [];
  if (configuredScopes.length > 0) {
    return configuredScopes;
  }

  return readOnlyMode ? DEFAULT_READ_ONLY_OAUTH_SCOPES : DEFAULT_OAUTH_SCOPES;
}
