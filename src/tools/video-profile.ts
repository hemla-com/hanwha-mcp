import { z } from "zod";
import { getActiveClient } from "./connect.js";

export const getVideoProfilesSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
});

export async function getVideoProfiles(input: z.infer<typeof getVideoProfilesSchema>): Promise<string> {
  const client = getActiveClient();
  const ch = String(input.channel ?? 0);
  const data = await client.request("media.cgi", "videoprofile", "view");

  const groups: Record<string, Record<string, string>> = {};

  for (const [key, value] of Object.entries(data)) {
    const match = key.match(/^Channel\.(\d+)\.Profile\.(\d+)\.(.+)$/);
    if (!match || match[1] !== ch) continue;
    const profileKey = `Profile.${match[2]}`;
    groups[profileKey] ??= {};
    groups[profileKey][match[3]] = value;
  }

  if (Object.keys(groups).length === 0) {
    return "No video profiles found.";
  }

  const lines: string[] = ["## Video Profiles", ""];

  for (const [profileKey, fields] of Object.entries(groups).sort(
    ([a], [b]) => Number(a.split(".")[1]) - Number(b.split(".")[1])
  )) {
    const num = profileKey.split(".")[1];
    const name = fields["Name"] ?? "unnamed";
    const codec = fields["EncodingType"] ?? "unknown";

    lines.push(`### ${name} (${profileKey})`);
    lines.push(`- Encoding: ${codec}`);
    lines.push(`- Resolution: ${fields["Resolution"] ?? "N/A"}`);
    lines.push(`- Frame Rate: ${fields["FrameRate"] ?? "N/A"}`);
    lines.push(`- Bitrate: ${fields["Bitrate"] ?? fields["BitRate"] ?? "N/A"}`);
    lines.push(`- Compression Level: ${fields["CompressionLevel"] ?? "N/A"}`);

    const codecPrefix = codec.toUpperCase() === "MJPEG" ? "MJPEG" : codec;
    const codecFields = Object.entries(fields).filter(([k]) => k.startsWith(`${codecPrefix}.`));
    if (codecFields.length > 0) {
      lines.push(`- **${codecPrefix} Settings:**`);
      for (const [k, v] of codecFields) {
        const fieldName = k.slice(codecPrefix.length + 1);
        lines.push(`  - ${fieldName}: ${v}`);
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}

export const setVideoProfileSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  profile: z.number().describe("Profile number to update"),
  name: z.string().optional().describe("Profile name"),
  encodingType: z.string().optional().describe("Encoding type (H264, H265, MJPEG)"),
  resolution: z.string().optional().describe("Resolution (e.g. 2560x1440)"),
  frameRate: z.number().optional().describe("Frame rate"),
  bitrate: z.number().optional().describe("Bitrate in kbps"),
  bitrateControlType: z.string().optional().describe("Bitrate control type (CBR, VBR)"),
  govLength: z.number().optional().describe("GOV length"),
});

export async function setVideoProfile(input: z.infer<typeof setVideoProfileSchema>): Promise<string> {
  const client = getActiveClient();
  const ch = String(input.channel ?? 0);
  const pNum = String(input.profile);
  const prefix = `Channel.${ch}.Profile.${pNum}`;

  const params: Record<string, string> = {};

  if (input.name !== undefined) params[`${prefix}.Name`] = input.name;
  if (input.encodingType !== undefined) params[`${prefix}.EncodingType`] = input.encodingType;
  if (input.resolution !== undefined) params[`${prefix}.Resolution`] = input.resolution;
  if (input.frameRate !== undefined) params[`${prefix}.FrameRate`] = String(input.frameRate);
  if (input.bitrate !== undefined) params[`${prefix}.Bitrate`] = String(input.bitrate);

  if (input.bitrateControlType !== undefined || input.govLength !== undefined) {
    const data = await client.request("media.cgi", "videoprofile", "view");
    const codec = data[`${prefix}.EncodingType`] ?? "H264";

    if (input.bitrateControlType !== undefined) {
      params[`${prefix}.${codec}.BitrateControlType`] = input.bitrateControlType;
    }
    if (input.govLength !== undefined) {
      params[`${prefix}.${codec}.GOVLength`] = String(input.govLength);
    }
  }

  await client.request("media.cgi", "videoprofile", "update", params);

  const changed = Object.entries(params)
    .map(([k, v]) => `${k.slice(prefix.length + 1)}=${v}`)
    .join(", ");

  return `Video profile ${pNum} updated: ${changed}`;
}

export const addVideoProfileSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  name: z.string().describe("Profile name"),
  encodingType: z.string().describe("Encoding type (H264, H265, MJPEG)"),
  resolution: z.string().describe("Resolution (e.g. 1920x1080)"),
  frameRate: z.number().describe("Frame rate"),
  bitrate: z.number().describe("Bitrate in kbps"),
});

export async function addVideoProfile(input: z.infer<typeof addVideoProfileSchema>): Promise<string> {
  const client = getActiveClient();
  const ch = String(input.channel ?? 0);

  await client.request("media.cgi", "videoprofile", "add", {
    Channel: ch,
    Name: input.name,
    EncodingType: input.encodingType,
    Resolution: input.resolution,
    FrameRate: String(input.frameRate),
    Bitrate: String(input.bitrate),
  });

  return `Video profile "${input.name}" added (${input.encodingType}, ${input.resolution}, ${input.frameRate}fps, ${input.bitrate}kbps)`;
}

export const removeVideoProfileSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  profile: z.number().describe("Profile number to remove"),
});

export async function removeVideoProfile(input: z.infer<typeof removeVideoProfileSchema>): Promise<string> {
  const client = getActiveClient();
  const ch = String(input.channel ?? 0);

  await client.request("media.cgi", "videoprofile", "remove", {
    Channel: ch,
    Profile: String(input.profile),
  });

  return `Video profile ${input.profile} removed.`;
}
