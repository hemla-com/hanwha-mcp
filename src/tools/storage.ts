import { z } from "zod";
import { getActiveClient } from "./connect.js";
import { SunapiClient } from "../sunapi/client.js";

export const getStorageConfigSchema = z.object({});

export async function getStorageConfig(): Promise<string> {
  const client = getActiveClient();
  const data = await client.request("recording.cgi", "storage", "view");

  return [
    "## Storage Configuration",
    "",
    `- Enabled: ${data["Enable"] ?? "N/A"}`,
    `- Overwrite: ${data["OverWrite"] ?? "N/A"}`,
    `- Auto Delete: ${data["AutoDeleteEnable"] ?? "N/A"}`,
    `- Auto Delete Days: ${data["AutoDeleteDays"] ?? "N/A"}`,
  ].join("\n");
}

export const setStorageConfigSchema = z.object({
  enable: z.boolean().optional().describe("Enable/disable storage"),
  overwrite: z.boolean().optional().describe("Enable/disable overwrite when full"),
  autoDeleteEnable: z.boolean().optional().describe("Enable/disable auto delete"),
  autoDeleteDays: z.number().optional().describe("Auto delete after N days"),
});

export async function setStorageConfig(input: z.infer<typeof setStorageConfigSchema>): Promise<string> {
  const client = getActiveClient();

  const params: Record<string, string> = {};

  if (input.enable !== undefined) params["Enable"] = SunapiClient.toBool(input.enable);
  if (input.overwrite !== undefined) params["OverWrite"] = SunapiClient.toBool(input.overwrite);
  if (input.autoDeleteEnable !== undefined) params["AutoDeleteEnable"] = SunapiClient.toBool(input.autoDeleteEnable);
  if (input.autoDeleteDays !== undefined) params["AutoDeleteDays"] = String(input.autoDeleteDays);

  await client.request("recording.cgi", "storage", "set", params);

  const changed = Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

  return `Storage config updated: ${changed}`;
}
