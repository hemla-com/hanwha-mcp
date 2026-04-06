import { z } from "zod";
import { getActiveClient } from "./connect.js";

export const getUsersSchema = z.object({});

export async function getUsers(): Promise<string> {
  const client = getActiveClient();
  const data = await client.request("security.cgi", "users", "view");

  const lines: string[] = ["## Users", ""];

  const userEntries = Object.entries(data)
    .filter(([key]) => key.match(/^Users\.\d+$/))
    .sort(([a], [b]) => {
      const numA = Number(a.split(".")[1]);
      const numB = Number(b.split(".")[1]);
      return numA - numB;
    });

  if (userEntries.length === 0) {
    return "No users found.";
  }

  for (const [key, value] of userEntries) {
    const parts = value.split("/");
    const username = parts[0] ?? "unknown";
    const admin = parts[2] === "True" ? "Yes" : "No";
    const enabled = parts[3] === "True" ? "Yes" : "No";

    lines.push(`### ${username}`);
    lines.push(`- Admin: ${admin}`);
    lines.push(`- Enabled: ${enabled}`);
    lines.push("");
  }

  return lines.join("\n");
}
