import { z } from "zod";
import { getActiveClient } from "./connect.js";
import { SunapiClient } from "../sunapi/client.js";

export const getPrivacyMaskSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
});

export async function getPrivacyMask(input: z.infer<typeof getPrivacyMaskSchema>): Promise<string> {
  const client = getActiveClient();
  const ch = String(input.channel ?? 0);
  const data = await client.request("image.cgi", "privacy", "view", { Channel: ch });

  const prefix = `Channel.${ch}.`;
  const get = (key: string) => {
    if (data[`${prefix}${key}`] !== undefined) return data[`${prefix}${key}`];
    for (const [k, v] of Object.entries(data)) {
      if (k.endsWith(`.${key}`)) return v;
    }
    return "N/A";
  };

  return [
    "## Privacy Mask",
    "",
    `- Enabled: ${get("Enable")}`,
    `- Mask Color: ${get("CommonMaskColor")}`,
  ].join("\n");
}

export const setPrivacyMaskSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  enable: z.boolean().optional().describe("Enable/disable privacy mask"),
  maskColor: z.string().optional().describe("Mask color (e.g. Gray, White, Black, Red, Blue, Green)"),
});

export async function setPrivacyMask(input: z.infer<typeof setPrivacyMaskSchema>): Promise<string> {
  const client = getActiveClient();
  const ch = String(input.channel ?? 0);

  const params: Record<string, string> = { Channel: ch };

  if (input.enable !== undefined) params["Enable"] = SunapiClient.toBool(input.enable);
  if (input.maskColor !== undefined) params["CommonMaskColor"] = input.maskColor;

  await client.request("image.cgi", "privacy", "set", params);

  const changed = Object.entries(params)
    .filter(([k]) => k !== "Channel")
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

  return `Privacy mask updated: ${changed}`;
}
