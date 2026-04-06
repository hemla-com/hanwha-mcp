import { z } from "zod";
import { getActiveClient } from "./connect.js";

export const getSsdrSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
});

export async function getSsdr(input: z.infer<typeof getSsdrSchema>): Promise<string> {
  const client = getActiveClient();
  const ch = String(input.channel ?? 0);
  const data = await client.request("image.cgi", "ssdr", "view", { Channel: ch });

  const prefix = `Channel.${ch}.`;
  const get = (key: string) => {
    if (data[`${prefix}${key}`] !== undefined) return data[`${prefix}${key}`];
    for (const [k, v] of Object.entries(data)) {
      if (k.endsWith(`.${key}`)) return v;
    }
    return "N/A";
  };

  return [
    "## SSDR (Samsung Super Dynamic Range)",
    "",
    `- Enabled: ${get("Enable")}`,
    `- Level: ${get("Level")}`,
    `- Dynamic Range: ${get("DynamicRange")}`,
  ].join("\n");
}

export const setSsdrSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  enable: z.boolean().optional().describe("Enable/disable SSDR"),
  level: z.number().optional().describe("SSDR level"),
  dynamicRange: z.string().optional().describe("Dynamic range (Narrow, Wide)"),
});

export async function setSsdr(input: z.infer<typeof setSsdrSchema>): Promise<string> {
  const client = getActiveClient();
  const ch = String(input.channel ?? 0);

  const params: Record<string, string> = { Channel: ch };

  if (input.enable !== undefined) params["Enable"] = String(input.enable);
  if (input.level !== undefined) params["Level"] = String(input.level);
  if (input.dynamicRange !== undefined) params["DynamicRange"] = input.dynamicRange;

  await client.request("image.cgi", "ssdr", "set", params);

  const changed = Object.entries(params)
    .filter(([k]) => k !== "Channel")
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

  return `SSDR updated: ${changed}`;
}
