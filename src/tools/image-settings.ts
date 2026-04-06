import { z } from "zod";
import { getActiveClient } from "./connect.js";
import { SunapiClient } from "../sunapi/client.js";

export const getImageSettingsSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
});

export async function getImageSettings(input: z.infer<typeof getImageSettingsSchema>): Promise<string> {
  const client = getActiveClient();
  const ch = String(input.channel);
  const prefix = `Channel.${ch}.`;

  const [enhancements, whitebalance, camera, ssdr, flip, irled] = await Promise.all([
    client.request("image.cgi", "imageenhancements", "view", { Channel: ch }),
    client.request("image.cgi", "whitebalance", "view", { Channel: ch }),
    client.request("image.cgi", "camera", "view", { Channel: ch }),
    client.request("image.cgi", "ssdr", "view", { Channel: ch }),
    client.request("image.cgi", "flip", "view", { Channel: ch }),
    client.request("image.cgi", "irled", "view", { Channel: ch }),
  ]);

  const get = (data: Record<string, string>, key: string) =>
    data[`${prefix}${key}`] ?? data[key] ?? "N/A";

  const lines = [
    "## Image Settings",
    "",
    "### Enhancements",
    `- Brightness: ${get(enhancements, "Brightness")}`,
    `- Sharpness: ${get(enhancements, "SharpnessLevel")} (enabled: ${get(enhancements, "SharpnessEnable")})`,
    `- Gamma: ${get(enhancements, "Gamma")}`,
    `- Saturation: ${get(enhancements, "Saturation")}`,
    `- LDC: ${get(enhancements, "LDCMode")} (level: ${get(enhancements, "LDCLevel")})`,
    "",
    "### White Balance",
    `- Mode: ${get(whitebalance, "WhiteBalanceMode") || findPresetValue(whitebalance, "WhiteBalanceMode")}`,
    `- Manual Red: ${get(whitebalance, "WhiteBalanceManualRedLevel") || findPresetValue(whitebalance, "WhiteBalanceManualRedLevel")}`,
    `- Manual Blue: ${get(whitebalance, "WhiteBalanceManualBlueLevel") || findPresetValue(whitebalance, "WhiteBalanceManualBlueLevel")}`,
    "",
    "### Exposure",
    `- Compensation: ${findPresetValue(camera, "CompensationMode")}`,
    `- WDR Level: ${findPresetValue(camera, "WDRLevel")}`,
    `- AGC Mode: ${findPresetValue(camera, "AGCMode")}`,
    `- SSNR: ${findPresetValue(camera, "SSNREnable")} (mode: ${findPresetValue(camera, "SSNRMode")}, level: ${findPresetValue(camera, "SSNRLevel")})`,
    "",
    "### SSDR (Samsung Super Dynamic Range)",
    `- Enabled: ${findPresetValue(ssdr, "Enable")}`,
    `- Level: ${findPresetValue(ssdr, "Level")}`,
    `- Dynamic Range: ${findPresetValue(ssdr, "DynamicRange")}`,
    "",
    "### Orientation",
    `- Horizontal Flip: ${get(flip, "HorizontalFlipEnable")}`,
    `- Vertical Flip: ${get(flip, "VerticalFlipEnable")}`,
    `- Rotate: ${get(flip, "Rotate")}`,
    "",
    "### IR LED",
    `- Mode: ${findPresetValue(irled, "Mode")}`,
  ];

  return lines.join("\n");
}

function findPresetValue(data: Record<string, string>, suffix: string): string {
  for (const [key, value] of Object.entries(data)) {
    if (key.endsWith(`.${suffix}`)) return value;
  }
  return "N/A";
}

export const setImageSettingsSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  brightness: z.number().min(0).max(100).optional().describe("Brightness (0-100)"),
  sharpness: z.number().optional().describe("Sharpness level"),
  gamma: z.number().optional().describe("Gamma level"),
  saturation: z.number().min(0).max(100).optional().describe("Color saturation (0-100)"),
});

export async function setImageSettings(input: z.infer<typeof setImageSettingsSchema>): Promise<string> {
  const client = getActiveClient();
  const params: Record<string, string> = { Channel: String(input.channel) };

  if (input.brightness !== undefined) params["Brightness"] = String(input.brightness);
  if (input.sharpness !== undefined) params["SharpnessLevel"] = String(input.sharpness);
  if (input.gamma !== undefined) params["Gamma"] = String(input.gamma);
  if (input.saturation !== undefined) params["Saturation"] = String(input.saturation);

  await client.request("image.cgi", "imageenhancements", "set", params);

  const changed = Object.entries(params)
    .filter(([k]) => k !== "Channel")
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

  return `Image settings updated: ${changed}`;
}

export const setFlipSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  horizontalFlip: z.boolean().optional().describe("Enable horizontal flip"),
  verticalFlip: z.boolean().optional().describe("Enable vertical flip"),
  rotate: z.string().optional().describe("Rotation: Off, 90, 180, 270"),
});

export async function setFlip(input: z.infer<typeof setFlipSchema>): Promise<string> {
  const client = getActiveClient();
  const params: Record<string, string> = { Channel: String(input.channel) };

  if (input.horizontalFlip !== undefined) params["HorizontalFlipEnable"] = SunapiClient.toBool(input.horizontalFlip);
  if (input.verticalFlip !== undefined) params["VerticalFlipEnable"] = SunapiClient.toBool(input.verticalFlip);
  if (input.rotate !== undefined) params["Rotate"] = input.rotate;

  await client.request("image.cgi", "flip", "set", params);

  const changed = Object.entries(params)
    .filter(([k]) => k !== "Channel")
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

  return `Flip/rotation updated: ${changed}`;
}

export const setIrLedSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  mode: z.string().describe("IR LED mode (e.g. Auto, Off, On)"),
});

export async function setIrLed(input: z.infer<typeof setIrLedSchema>): Promise<string> {
  const client = getActiveClient();
  await client.request("image.cgi", "irled", "set", {
    Channel: String(input.channel),
    Mode: input.mode,
  });
  return `IR LED mode set to: ${input.mode}`;
}
