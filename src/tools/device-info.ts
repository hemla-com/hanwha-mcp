import { getActiveClient } from "./connect.js";

export async function getDeviceInfo(): Promise<string> {
  const client = getActiveClient();

  const [deviceInfo, profiles] = await Promise.all([
    client.request("system.cgi", "deviceinfo", "view"),
    client.request("media.cgi", "videoprofile", "view"),
  ]);

  const grouped = groupByPrefix(profiles);

  const lines: string[] = [
    "## Device Info",
    "",
    `- **Model:** ${deviceInfo["Model"] ?? "unknown"}`,
    `- **Serial:** ${deviceInfo["SerialNumber"] ?? "unknown"}`,
    `- **Firmware:** ${deviceInfo["FirmwareVersion"] ?? "unknown"}`,
    `- **MAC:** ${deviceInfo["ConnectedMACAddress"] ?? deviceInfo["MACAddress"] ?? "unknown"}`,
    `- **CGI Version:** ${deviceInfo["CGIVersion"] ?? "unknown"}`,
    "",
    "## Video Profiles",
    "",
  ];

  for (const [prefix, fields] of Object.entries(grouped)) {
    const name = fields["Name"] ?? prefix;
    const resolution = fields["Resolution"] ?? "unknown";
    const codec = fields["EncodingType"] ?? "unknown";
    const fps = fields["FrameRate"] ?? "unknown";
    const bitrate = fields["BitRate"] ?? fields["Bitrate"] ?? "unknown";

    lines.push(`### ${name} (${prefix})`);
    lines.push(`- Resolution: ${resolution}`);
    lines.push(`- Codec: ${codec}`);
    lines.push(`- FPS: ${fps}`);
    lines.push(`- Bitrate: ${bitrate}`);
    lines.push("");
  }

  return lines.join("\n");
}

function groupByPrefix(flat: Record<string, string>): Record<string, Record<string, string>> {
  const groups: Record<string, Record<string, string>> = {};

  for (const [key, value] of Object.entries(flat)) {
    const match = key.match(/^(Channel\.\d+\.Profile\.\d+)\.(.+)$/);
    if (match) {
      const [, prefix, field] = match;
      groups[prefix] ??= {};
      groups[prefix][field] = value;
    }
  }

  return groups;
}
