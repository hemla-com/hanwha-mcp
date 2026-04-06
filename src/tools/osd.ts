import { z } from "zod";
import { getActiveClient } from "./connect.js";
import { SunapiClient } from "../sunapi/client.js";

export const getOSDSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
});

export async function getOSD(input: z.infer<typeof getOSDSchema>) {
  const client = getActiveClient();
  const data = await client.request("image.cgi", "multilineosd", "view", {
    Channel: String(input.channel),
  });

  const prefix = `Channel.${input.channel}.`;
  const entries: Record<string, Record<string, string>> = {};

  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith(prefix)) continue;
    const rest = key.slice(prefix.length);
    const match = rest.match(/^Index\.(\d+)\.(.+)$/);
    if (!match) continue;
    const [, idx, field] = match;
    entries[idx] ??= {};
    entries[idx][field] = value;
  }

  if (Object.keys(entries).length === 0) {
    return "No multiline OSD entries configured.";
  }

  const lines: string[] = ["## Multiline OSD Entries", ""];

  for (const [idx, fields] of Object.entries(entries).sort(([a], [b]) => Number(a) - Number(b))) {
    const enabled = fields["Enable"] ?? "N/A";
    const type = fields["OSDType"] ?? "N/A";
    const text = fields["OSD"] ?? "";
    const pos = `(${fields["PositionX"] ?? "?"}, ${fields["PositionY"] ?? "?"})`;
    const font = fields["FontSize"] ?? "N/A";
    const color = fields["OSDColor"] ?? "N/A";

    lines.push(`### Index ${idx} (${enabled === "True" ? "active" : "disabled"})`);
    lines.push(`- Type: ${type}`);
    if (type === "Custom" && text) lines.push(`- Text: "${text}"`);
    if (type === "Title" && text) lines.push(`- Text: "${text}"`);
    lines.push(`- Position: ${pos}`);
    lines.push(`- Font: ${font}, Color: ${color}`);
    lines.push("");
  }

  return lines.join("\n");
}

export const setOSDSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  index: z.number().describe("OSD index slot (1-6 typically)"),
  enable: z.boolean().optional().describe("Enable this OSD entry"),
  osdType: z.enum(["Date", "Time", "DateAndTime", "Title"]).optional().describe("OSD content type"),
  text: z.string().optional().describe("Custom text (when osdType is Custom)"),
  positionX: z.number().optional().describe("X position (0-8)"),
  positionY: z.number().optional().describe("Y position (0-8)"),
  fontSize: z.enum(["Small", "Medium", "Large"]).optional().describe("Font size"),
  color: z.enum(["White", "Red", "Blue", "Green", "Yellow", "Cyan", "Magenta", "Gray", "Black"]).optional().describe("OSD text color"),
  transparency: z.enum(["Off", "Low", "Middle", "High"]).optional().describe("Text transparency"),
});

export async function setOSD(input: z.infer<typeof setOSDSchema>) {
  const client = getActiveClient();
  const params: Record<string, string> = {
    Channel: String(input.channel),
    Index: String(input.index),
  };

  if (input.enable !== undefined) params["Enable"] = SunapiClient.toBool(input.enable);
  if (input.osdType !== undefined) params["OSDType"] = input.osdType;
  if (input.text !== undefined) params["OSD"] = input.text;
  if (input.positionX !== undefined) params["PositionX"] = String(input.positionX);
  if (input.positionY !== undefined) params["PositionY"] = String(input.positionY);
  if (input.fontSize !== undefined) params["FontSize"] = input.fontSize;
  if (input.color !== undefined) params["OSDColor"] = input.color;
  if (input.transparency !== undefined) params["Transparency"] = input.transparency;

  await client.request("image.cgi", "multilineosd", "add", {
    Channel: String(input.channel),
    Index: String(input.index),
  }).catch(() => {});
  await client.request("image.cgi", "multilineosd", "update", params);
  return `OSD index ${input.index} updated.`;
}

export const removeOSDSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  index: z.number().describe("OSD index slot to remove"),
});

export async function removeOSD(input: z.infer<typeof removeOSDSchema>) {
  const client = getActiveClient();
  await client.request("image.cgi", "multilineosd", "remove", {
    Channel: String(input.channel),
    Index: String(input.index),
  });
  return `OSD index ${input.index} removed.`;
}
