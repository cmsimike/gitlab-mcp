import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { buildContext, createLinkedPair } from "./_helpers.js";

describe("Common schema constraints", () => {
  let client: Client;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;

  beforeAll(async () => {
    const pair = await createLinkedPair(buildContext());
    client = pair.client;
    clientTransport = pair.clientTransport;
    serverTransport = pair.serverTransport;
  });

  afterAll(async () => {
    await clientTransport.close();
    await serverTransport.close();
  });

  it("exports maxLength and pattern metadata for shared constrained fields", async () => {
    const { tools } = await client.listTools();

    const getProject = tools.find((tool) => tool.name === "gitlab_get_project");
    const projectIdSchema = getPropertySchema(getProject?.inputSchema, "project_id");
    expect(JSON.stringify(projectIdSchema)).toContain('"maxLength":1024');
    expect(JSON.stringify(projectIdSchema)).toContain('"pattern"');

    const createPipeline = tools.find((tool) => tool.name === "gitlab_create_pipeline");
    const refSchema = getPropertySchema(createPipeline?.inputSchema, "ref");
    expect(refSchema?.maxLength).toBe(255);
    expect(typeof refSchema?.pattern).toBe("string");

    const getWikiPage = tools.find((tool) => tool.name === "gitlab_get_wiki_page");
    const slugSchema = getPropertySchema(getWikiPage?.inputSchema, "slug");
    expect(slugSchema?.maxLength).toBe(512);
    expect(typeof slugSchema?.pattern).toBe("string");

    const createLabel = tools.find((tool) => tool.name === "gitlab_create_label");
    const nameSchema = getPropertySchema(createLabel?.inputSchema, "name");
    expect(nameSchema?.maxLength).toBe(255);
    expect(typeof nameSchema?.pattern).toBe("string");

    const createMrNote = tools.find((tool) => tool.name === "gitlab_create_merge_request_note");
    const bodySchema = getPropertySchema(createMrNote?.inputSchema, "body");
    expect(bodySchema?.maxLength).toBe(1_000_000);
    expect(typeof bodySchema?.pattern).toBe("string");
  });

  it("rejects project_id values that exceed the shared limit", async () => {
    const result = await client.callTool({
      name: "gitlab_get_project",
      arguments: { project_id: "a".repeat(1025) }
    });

    expect(result.isError).toBe(true);
  });

  it("rejects invalid ref-like values", async () => {
    const result = await client.callTool({
      name: "gitlab_create_pipeline",
      arguments: {
        project_id: "group/project",
        ref: "feature..broken"
      }
    });

    expect(result.isError).toBe(true);
  });

  it("rejects invalid wiki slugs", async () => {
    const result = await client.callTool({
      name: "gitlab_get_wiki_page",
      arguments: {
        project_id: "group/project",
        slug: "../wiki"
      }
    });

    expect(result.isError).toBe(true);
  });

  it("rejects unsupported absolute URL schemes for attachment downloads", async () => {
    const result = await client.callTool({
      name: "gitlab_download_attachment",
      arguments: {
        url_or_path: "ftp://gitlab.example.com/uploads/secret/file.txt"
      }
    });

    expect(result.isError).toBe(true);
  });

  it("rejects oversized label names", async () => {
    const result = await client.callTool({
      name: "gitlab_create_label",
      arguments: {
        project_id: "group/project",
        name: "x".repeat(256),
        color: "#ff0000"
      }
    });

    expect(result.isError).toBe(true);
  });

  it("rejects null bytes in note bodies", async () => {
    const result = await client.callTool({
      name: "gitlab_create_merge_request_note",
      arguments: {
        project_id: "group/project",
        merge_request_iid: "1",
        body: "before\u0000after"
      }
    });

    expect(result.isError).toBe(true);
  });
});

function getPropertySchema(
  jsonSchema: Record<string, unknown> | undefined,
  propertyName: string
): Record<string, unknown> | undefined {
  const properties = jsonSchema?.properties;
  if (!properties || typeof properties !== "object") {
    return undefined;
  }

  const schema = (properties as Record<string, unknown>)[propertyName];
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return undefined;
  }

  if ("anyOf" in schema && Array.isArray((schema as { anyOf?: unknown[] }).anyOf)) {
    const firstObject = (schema as { anyOf: unknown[] }).anyOf.find(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null && !Array.isArray(item)
    );
    return firstObject;
  }

  return schema as Record<string, unknown>;
}
