import { z } from "zod";
import { getActiveClient } from "./connect.js";
import { SunapiClient } from "../sunapi/client.js";

export const getOverlaySchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
});

export async function getOverlay(input: z.infer<typeof getOverlaySchema>): Promise<string> {
  const client = getActiveClient();
  const ch = String(input.channel);
  const prefix = `Channel.${ch}.`;

  const data = await client.request("image.cgi", "overlay", "view", { Channel: ch });

  const get = (key: string) => data[`${prefix}${key}`] ?? "N/A";

  return [
    "## Overlay Settings",
    "",
    "### Title",
    `- Enabled: ${get("TitleEnable")}`,
    `- Text: "${get("Title")}"`,
    `- Position: (${get("TitlePositionX")}, ${get("TitlePositionY")})`,
    "",
    "### Time",
    `- Enabled: ${get("TimeEnable")}`,
    `- Format: ${get("TimeFormat")}`,
    `- Position: (${get("TimePositionX")}, ${get("TimePositionY")})`,
    "",
    "### Other",
    `- Weekday: ${get("WeekdayEnable")}`,
    `- Font Size: ${get("FontSize")}`,
  ].join("\n");
}

export const setOverlaySchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  titleEnable: z.boolean().optional().describe("Show title overlay"),
  title: z.string().optional().describe("Title text to display"),
  titlePositionX: z.number().optional().describe("Title X position (0-9)"),
  titlePositionY: z.number().optional().describe("Title Y position (0-9)"),
  timeEnable: z.boolean().optional().describe("Show time overlay"),
  timeFormat: z.string().optional().describe("Time format (e.g. YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY)"),
  weekdayEnable: z.boolean().optional().describe("Show weekday in overlay"),
  fontSize: z.string().optional().describe("Font size: Small, Medium, Large"),
});

export async function setOverlay(input: z.infer<typeof setOverlaySchema>): Promise<string> {
  const client = getActiveClient();
  const params: Record<string, string> = { Channel: String(input.channel) };

  if (input.titleEnable !== undefined) params["TitleEnable"] = SunapiClient.toBool(input.titleEnable);
  if (input.title !== undefined) params["Title"] = input.title;
  if (input.titlePositionX !== undefined) params["TitlePositionX"] = String(input.titlePositionX);
  if (input.titlePositionY !== undefined) params["TitlePositionY"] = String(input.titlePositionY);
  if (input.timeEnable !== undefined) params["TimeEnable"] = SunapiClient.toBool(input.timeEnable);
  if (input.timeFormat !== undefined) params["TimeFormat"] = input.timeFormat;
  if (input.weekdayEnable !== undefined) params["WeekdayEnable"] = SunapiClient.toBool(input.weekdayEnable);
  if (input.fontSize !== undefined) params["FontSize"] = input.fontSize;

  await client.request("image.cgi", "overlay", "set", params);

  const changed = Object.entries(params)
    .filter(([k]) => k !== "Channel")
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

  return `Overlay updated: ${changed}`;
}

export const getOsdListSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
});

export async function getOsdList(input: z.infer<typeof getOsdListSchema>): Promise<string> {
  const client = getActiveClient();
  const data = await client.request("image.cgi", "multilineosd", "view", { Channel: String(input.channel) });

  const prefix = `Channel.${input.channel}.`;
  const osds: Record<string, Record<string, string>> = {};

  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith(prefix)) continue;
    const rest = key.slice(prefix.length);
    const match = rest.match(/^Index\.(\d+)\.(.+)$/);
    if (match) {
      const [, idx, field] = match;
      osds[idx] ??= {};
      osds[idx][field] = value;
    }
  }

  if (Object.keys(osds).length === 0) {
    return "No OSD entries found.";
  }

  const lines = ["## OSD Entries", ""];
  for (const [idx, fields] of Object.entries(osds)) {
    const enabled = fields["Enable"] ?? "N/A";
    const type = fields["OSDType"] ?? "N/A";
    const text = fields["OSD"] ?? "";
    const pos = `(${fields["PositionX"] ?? "?"}, ${fields["PositionY"] ?? "?"})`;
    const size = fields["FontSize"] ?? "N/A";
    const color = fields["OSDColor"] ?? "N/A";

    lines.push(`### Index ${idx} (${enabled === "True" ? "active" : "disabled"})`);
    lines.push(`- Type: ${type}`);
    if (text) lines.push(`- Text: "${text}"`);
    lines.push(`- Position: ${pos}`);
    lines.push(`- Font: ${size}, Color: ${color}`);
    lines.push("");
  }

  return lines.join("\n");
}

export const setOsdSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  index: z.number().describe("OSD index (1-8)"),
  enable: z.boolean().optional().describe("Enable this OSD entry"),
  osdType: z.string().optional().describe("OSD type: Text, Date, Time"),
  text: z.string().optional().describe("OSD text content (when type is Text)"),
  positionX: z.number().optional().describe("X position (0-9)"),
  positionY: z.number().optional().describe("Y position (0-9)"),
  fontSize: z.string().optional().describe("Font size: Small, Medium, Large"),
  osdColor: z.string().optional().describe("Color: White, Red, Blue, Green, Yellow, Cyan, Magenta, Black"),
  transparency: z.string().optional().describe("Transparency: Off, Low, Medium, High"),
});

export async function setOsd(input: z.infer<typeof setOsdSchema>): Promise<string> {
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
  if (input.osdColor !== undefined) params["OSDColor"] = input.osdColor;
  if (input.transparency !== undefined) params["Transparency"] = input.transparency;

  await client.request("image.cgi", "multilineosd", "add", {
    Channel: String(input.channel),
    Index: String(input.index),
  }).catch(() => {});
  await client.request("image.cgi", "multilineosd", "update", params);

  return `OSD index ${input.index} updated.`;
}

export const removeOsdSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  index: z.number().describe("OSD index to remove"),
});

export async function removeOsd(input: z.infer<typeof removeOsdSchema>): Promise<string> {
  const client = getActiveClient();
  await client.request("image.cgi", "multilineosd", "remove", {
    Channel: String(input.channel),
    Index: String(input.index),
  });
  return `OSD index ${input.index} removed.`;
}
