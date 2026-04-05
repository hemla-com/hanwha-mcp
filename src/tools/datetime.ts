import { z } from "zod";
import { getActiveClient } from "./connect.js";

export const getDateTimeSchema = z.object({});

export async function getDateTime(): Promise<string> {
  const client = getActiveClient();
  const data = await client.request("system.cgi", "date", "view");

  return [
    "## Date & Time",
    "",
    `- Local Time: ${data["LocalTime"] ?? "N/A"}`,
    `- UTC Time: ${data["UTCTime"] ?? "N/A"}`,
    `- Sync Type: ${data["SyncType"] ?? "N/A"}`,
    `- DST: ${data["DSTEnable"] ?? "N/A"}`,
    `- Timezone Index: ${data["TimeZoneIndex"] ?? "N/A"}`,
    `- POSIX Timezone: ${data["POSIXTimeZone"] ?? "N/A"}`,
    `- NTP Servers: ${data["NTPURLList"] ?? "N/A"}`,
  ].join("\n");
}

export const setNtpSchema = z.object({
  servers: z.string().describe("Comma-separated NTP server list (e.g. pool.ntp.org,time.nist.gov)"),
});

export async function setNtp(input: z.infer<typeof setNtpSchema>): Promise<string> {
  const client = getActiveClient();
  await client.request("system.cgi", "date", "set", {
    SyncType: "NTP",
    NTPURLList: input.servers,
  });
  return `NTP sync enabled with servers: ${input.servers}`;
}

export const setDateTimeSchema = z.object({
  year: z.number().describe("Year"),
  month: z.number().min(1).max(12).describe("Month (1-12)"),
  day: z.number().min(1).max(31).describe("Day (1-31)"),
  hour: z.number().min(0).max(23).describe("Hour (0-23)"),
  minute: z.number().min(0).max(59).describe("Minute (0-59)"),
  second: z.number().min(0).max(59).optional().default(0).describe("Second (0-59)"),
});

export async function setDateTime(input: z.infer<typeof setDateTimeSchema>): Promise<string> {
  const client = getActiveClient();
  await client.request("system.cgi", "date", "set", {
    SyncType: "Manual",
    Year: String(input.year),
    Month: String(input.month),
    Day: String(input.day),
    Hour: String(input.hour),
    Minute: String(input.minute),
    Second: String(input.second),
  });
  return `Date/time set to ${input.year}-${String(input.month).padStart(2, "0")}-${String(input.day).padStart(2, "0")} ${String(input.hour).padStart(2, "0")}:${String(input.minute).padStart(2, "0")}:${String(input.second).padStart(2, "0")}`;
}
