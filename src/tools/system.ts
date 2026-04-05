import { z } from "zod";
import { getActiveClient } from "./connect.js";

export async function rebootCamera(): Promise<string> {
  const client = getActiveClient();
  await client.request("system.cgi", "power", "control", { Action: "Reboot" });
  return "Camera is rebooting. It will be unavailable for ~60 seconds.";
}

export const getLogsSchema = z.object({
  type: z.enum(["system", "access", "event"]).describe("Log type: system, access, or event"),
});

export async function getLogs(input: z.infer<typeof getLogsSchema>): Promise<string> {
  const client = getActiveClient();
  const submenu = input.type === "system" ? "systemlog" : input.type === "access" ? "accesslog" : "eventlog";
  const data = await client.request("system.cgi", submenu, "view");

  const lines = [`## ${input.type.charAt(0).toUpperCase() + input.type.slice(1)} Log`, ""];

  for (const [key, value] of Object.entries(data)) {
    lines.push(`${key}: ${value}`);
  }

  if (lines.length === 2) {
    lines.push("(empty)");
  }

  return lines.join("\n");
}

export const setFocusSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  mode: z.string().describe("Focus mode: SimpleAutoFocus, ManualFocus"),
});

export async function setFocus(input: z.infer<typeof setFocusSchema>): Promise<string> {
  const client = getActiveClient();
  await client.request("image.cgi", "camera", "set", {
    Channel: String(input.channel),
    FocusMode: input.mode,
  });
  return `Focus mode set to: ${input.mode}`;
}
