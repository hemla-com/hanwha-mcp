import { z } from "zod";
import { SunapiClient } from "../sunapi/client.js";

let activeClient: SunapiClient | null = null;

export function getActiveClient(): SunapiClient {
  if (!activeClient) {
    throw new Error("No camera connected. Call connect_camera first.");
  }
  return activeClient;
}

export function setActiveClient(client: SunapiClient): void {
  activeClient = client;
}

export const connectCameraSchema = z.object({
  host: z.string().describe("Camera IP address or hostname"),
  username: z.string().describe("Camera username"),
  password: z.string().describe("Camera password"),
  port: z.number().optional().default(80).describe("HTTP port (default 80)"),
});

export type ConnectCameraInput = z.infer<typeof connectCameraSchema>;

export async function connectCamera(input: ConnectCameraInput): Promise<string> {
  const client = new SunapiClient({
    host: input.host,
    username: input.username,
    password: input.password,
    port: input.port,
  });

  const info = await client.request("system.cgi", "deviceinfo", "view");

  setActiveClient(client);

  const model = info["Model"] ?? "unknown";
  const serial = info["SerialNumber"] ?? "unknown";
  const firmware = info["FirmwareVersion"] ?? "unknown";
  const mac = info["ConnectedMACAddress"] ?? info["MACAddress"] ?? "unknown";

  return [
    `Connected to ${model}`,
    `Serial: ${serial}`,
    `Firmware: ${firmware}`,
    `MAC: ${mac}`,
  ].join("\n");
}
