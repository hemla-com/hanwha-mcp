import { z } from "zod";
import { getActiveClient } from "./connect.js";

export const getNetworkConfigSchema = z.object({});

export async function getNetworkConfig(): Promise<string> {
  const client = getActiveClient();

  const [iface, http, https, rtsp] = await Promise.all([
    client.request("network.cgi", "interface", "view"),
    client.request("network.cgi", "http", "view"),
    client.request("network.cgi", "https", "view"),
    client.request("network.cgi", "rtsp", "view"),
  ]);

  return [
    "## Network Configuration",
    "",
    "### Interface",
    `- IPv4 Type: ${iface["IPv4Type"] ?? "N/A"}`,
    `- IPv4 Address: ${iface["IPv4Address"] ?? "N/A"}`,
    `- Subnet Mask: ${iface["IPv4SubnetMask"] ?? "N/A"}`,
    `- Gateway: ${iface["IPv4Gateway"] ?? "N/A"}`,
    `- Hostname: ${iface["HostName"] ?? "N/A"}`,
    `- MTU Size: ${iface["MTUSize"] ?? "N/A"}`,
    `- MAC Address: ${iface["MACAddress"] ?? "N/A"}`,
    "",
    "### Ports",
    `- HTTP: ${http["Port"] ?? "N/A"}`,
    `- HTTPS: ${https["Port"] ?? "N/A"}`,
    `- RTSP: ${rtsp["Port"] ?? "N/A"}`,
    `- RTSP Timeout: ${rtsp["Timeout"] ?? "N/A"}`,
  ].join("\n");
}

export const setNetworkConfigSchema = z.object({
  ipv4Type: z.string().optional().describe("IPv4 type (DHCP, Static)"),
  ipv4Address: z.string().optional().describe("IPv4 address"),
  ipv4SubnetMask: z.string().optional().describe("Subnet mask"),
  ipv4Gateway: z.string().optional().describe("Default gateway"),
  hostname: z.string().optional().describe("Hostname"),
});

export async function setNetworkConfig(input: z.infer<typeof setNetworkConfigSchema>): Promise<string> {
  const client = getActiveClient();

  const params: Record<string, string> = {};

  if (input.ipv4Type !== undefined) params["IPv4Type"] = input.ipv4Type;
  if (input.ipv4Address !== undefined) params["IPv4Address"] = input.ipv4Address;
  if (input.ipv4SubnetMask !== undefined) params["IPv4SubnetMask"] = input.ipv4SubnetMask;
  if (input.ipv4Gateway !== undefined) params["IPv4Gateway"] = input.ipv4Gateway;
  if (input.hostname !== undefined) params["HostName"] = input.hostname;

  await client.request("network.cgi", "interface", "set", params);

  const changed = Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

  return `Network config updated: ${changed}`;
}
