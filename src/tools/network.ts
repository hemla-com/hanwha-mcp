import { getActiveClient } from "./connect.js";

export async function getNetworkInfo(): Promise<string> {
  const client = getActiveClient();

  const [iface, dns] = await Promise.all([
    client.request("network.cgi", "interface", "view"),
    client.request("network.cgi", "dns", "view"),
  ]);

  const lines = [
    "## Network Configuration",
    "",
    `- MAC Address: ${iface["MACAddress"] ?? "N/A"}`,
    `- Link Status: ${iface["LinkStatus"] ?? "N/A"}`,
    `- Interface Type: ${iface["InterfaceType"] ?? "N/A"}`,
    `- Broadcast: ${iface["BroadcastAddress"] ?? "N/A"}`,
    `- IPv6 Address: ${iface["IPv6DefaultAddress"] ?? "N/A"}`,
    "",
    "### DNS",
    `- Type: ${dns["Type"] ?? "N/A"}`,
    `- Primary: ${dns["PrimaryDNS"] ?? "N/A"}`,
    `- Secondary: ${dns["SecondaryDNS"] ?? "N/A"}`,
  ];

  return lines.join("\n");
}
