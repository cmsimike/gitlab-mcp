export const TOOL_CAPABILITIES = ["read", "write", "delete", "admin", "graphql"] as const;

export type ToolCapability = (typeof TOOL_CAPABILITIES)[number];

export const READ_ONLY_BLOCKED_CAPABILITIES = new Set<ToolCapability>(["write", "delete", "admin"]);
