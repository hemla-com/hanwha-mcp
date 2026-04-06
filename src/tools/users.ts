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

  for (const [, value] of userEntries) {
    const parts = value.split("/");
    const username = parts[0] ?? "unknown";
    const enabled = parts[2] === "True" ? "Yes" : "No";
    const videoAccess = parts[3] === "True" ? "Yes" : "No";

    lines.push(`### ${username}`);
    lines.push(`- Enabled: ${enabled}`);
    lines.push(`- Video Profile Access: ${videoAccess}`);
    lines.push("");
  }

  return lines.join("\n");
}

export async function createUser(input: {
  username: string;
  password: string;
  enabled?: boolean;
}): Promise<string> {
  const client = getActiveClient();
  const params: Record<string, string> = {
    UserID: input.username,
    Password: input.password,
  };
  if (input.enabled !== false) params.Enable = "True";

  const result = await client.request("security.cgi", "users", "add", params);
  const index = result["Index"];
  return `User "${input.username}" created${index ? ` at slot ${index}` : ""} (enabled=${input.enabled !== false})`;
}

export async function updateUser(input: {
  username: string;
  password?: string;
  enabled?: boolean;
}): Promise<string> {
  const client = getActiveClient();

  const data = await client.request("security.cgi", "users", "view");
  const existing = Object.values(data).find((v) => v.startsWith(input.username + "/"));
  if (!existing) throw new Error(`User "${input.username}" not found`);

  const parts = existing.split("/");
  const oldEnabled = parts[2] === "True";

  await client.request("security.cgi", "users", "remove", { UserID: input.username });

  const addParams: Record<string, string> = {
    UserID: input.username,
    Password: input.password ?? "",
  };
  const enable = input.enabled ?? oldEnabled;
  if (enable) addParams.Enable = "True";

  await client.request("security.cgi", "users", "add", addParams);
  return `User "${input.username}" updated`;
}

export async function removeUser(input: { username: string }): Promise<string> {
  const client = getActiveClient();
  await client.request("security.cgi", "users", "remove", {
    UserID: input.username,
  });
  return `User "${input.username}" removed`;
}
