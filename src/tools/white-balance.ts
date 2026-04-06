import { z } from "zod";
import { getActiveClient } from "./connect.js";

export const getWhiteBalanceSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
});

export async function getWhiteBalance(input: z.infer<typeof getWhiteBalanceSchema>): Promise<string> {
  const client = getActiveClient();
  const ch = String(input.channel ?? 0);
  const data = await client.request("image.cgi", "whitebalance", "view", { Channel: ch });

  const prefix = `Channel.${ch}.`;
  const get = (key: string) => {
    if (data[`${prefix}${key}`] !== undefined) return data[`${prefix}${key}`];
    for (const [k, v] of Object.entries(data)) {
      if (k.endsWith(`.${key}`)) return v;
    }
    return "N/A";
  };

  return [
    "## White Balance",
    "",
    `- Mode: ${get("WhiteBalanceMode")}`,
    `- Manual Red Level: ${get("WhiteBalanceManualRedLevel")}`,
    `- Manual Blue Level: ${get("WhiteBalanceManualBlueLevel")}`,
  ].join("\n");
}

export const setWhiteBalanceSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  mode: z.string().describe("White balance mode (ATW, Indoor, Outdoor, Manual)"),
  manualRedLevel: z.number().optional().describe("Manual red level (0-2048)"),
  manualBlueLevel: z.number().optional().describe("Manual blue level (0-2048)"),
});

export async function setWhiteBalance(input: z.infer<typeof setWhiteBalanceSchema>): Promise<string> {
  const client = getActiveClient();
  const ch = String(input.channel ?? 0);

  const params: Record<string, string> = {
    Channel: ch,
    WhiteBalanceMode: input.mode,
  };

  if (input.manualRedLevel !== undefined) params["WhiteBalanceManualRedLevel"] = String(input.manualRedLevel);
  if (input.manualBlueLevel !== undefined) params["WhiteBalanceManualBlueLevel"] = String(input.manualBlueLevel);

  await client.request("image.cgi", "whitebalance", "set", params);

  const changed = Object.entries(params)
    .filter(([k]) => k !== "Channel")
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

  return `White balance updated: ${changed}`;
}
