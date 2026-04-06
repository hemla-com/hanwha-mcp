import { z } from "zod";
import { getActiveClient } from "./connect.js";

export const getTamperingDetectionSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
});

export async function getTamperingDetection(input: z.infer<typeof getTamperingDetectionSchema>): Promise<string> {
  const client = getActiveClient();
  const ch = String(input.channel ?? 0);
  const data = await client.request("eventsources.cgi", "tamperingdetection", "view");

  const prefix = `Channel.${ch}.`;
  const get = (key: string) => data[`${prefix}${key}`] ?? "N/A";

  return [
    "## Tampering Detection",
    "",
    `- Enabled: ${get("Enable")}`,
    `- Sensitivity: ${get("Sensitivity")}`,
    `- Sensitivity Level: ${get("SensitivityLevel")}`,
    `- Threshold Level: ${get("ThresholdLevel")}`,
    `- Duration: ${get("Duration")}`,
    `- Darkness Detection: ${get("DarknessDetection")}`,
  ].join("\n");
}

export const setTamperingDetectionSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  enable: z.boolean().optional().describe("Enable/disable tampering detection"),
  sensitivityLevel: z.number().optional().describe("Sensitivity level (0-100)"),
  thresholdLevel: z.number().optional().describe("Threshold level (0-100)"),
  duration: z.number().optional().describe("Duration in seconds"),
  darknessDetection: z.boolean().optional().describe("Enable/disable darkness detection"),
});

export async function setTamperingDetection(input: z.infer<typeof setTamperingDetectionSchema>): Promise<string> {
  const client = getActiveClient();
  const ch = String(input.channel ?? 0);

  const params: Record<string, string> = { Channel: ch };

  if (input.enable !== undefined) params["Enable"] = String(input.enable);
  if (input.sensitivityLevel !== undefined) params["SensitivityLevel"] = String(input.sensitivityLevel);
  if (input.thresholdLevel !== undefined) params["ThresholdLevel"] = String(input.thresholdLevel);
  if (input.duration !== undefined) params["Duration"] = String(input.duration);
  if (input.darknessDetection !== undefined) params["DarknessDetection"] = String(input.darknessDetection);

  await client.request("eventsources.cgi", "tamperingdetection", "set", params);

  const changed = Object.entries(params)
    .filter(([k]) => k !== "Channel")
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

  return `Tampering detection updated: ${changed}`;
}

export const getDefocusDetectionSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
});

export async function getDefocusDetection(input: z.infer<typeof getDefocusDetectionSchema>): Promise<string> {
  const client = getActiveClient();
  const ch = String(input.channel ?? 0);
  const data = await client.request("eventsources.cgi", "defocusdetection", "view");

  const prefix = `Channel.${ch}.`;
  const get = (key: string) => data[`${prefix}${key}`] ?? "N/A";

  return [
    "## Defocus Detection",
    "",
    `- Enabled: ${get("Enable")}`,
    `- Sensitivity: ${get("Sensitivity")}`,
    `- Threshold Level: ${get("ThresholdLevel")}`,
    `- Duration: ${get("Duration")}`,
  ].join("\n");
}

export const setDefocusDetectionSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  enable: z.boolean().optional().describe("Enable/disable defocus detection"),
  sensitivity: z.number().optional().describe("Sensitivity level (0-100)"),
  thresholdLevel: z.number().optional().describe("Threshold level (0-100)"),
  duration: z.number().optional().describe("Duration in seconds"),
});

export async function setDefocusDetection(input: z.infer<typeof setDefocusDetectionSchema>): Promise<string> {
  const client = getActiveClient();
  const ch = String(input.channel ?? 0);

  const params: Record<string, string> = { Channel: ch };

  if (input.enable !== undefined) params["Enable"] = String(input.enable);
  if (input.sensitivity !== undefined) params["Sensitivity"] = String(input.sensitivity);
  if (input.thresholdLevel !== undefined) params["ThresholdLevel"] = String(input.thresholdLevel);
  if (input.duration !== undefined) params["Duration"] = String(input.duration);

  await client.request("eventsources.cgi", "defocusdetection", "set", params);

  const changed = Object.entries(params)
    .filter(([k]) => k !== "Channel")
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

  return `Defocus detection updated: ${changed}`;
}
