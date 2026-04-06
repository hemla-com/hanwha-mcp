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

export async function createUser(input: {
  username: string;
  password: string;
  role?: string;
}): Promise<string> {
  const client = getActiveClient();
  const role = input.role ?? "viewer";

  const levelMap: Record<string, string> = {
    admin: "Admin",
    user: "User",
    viewer: "Viewer",
  };
  const userLevel = levelMap[role] ?? "Viewer";

  await client.request("security.cgi", "users", "add", {
    Username: input.username,
    Password: input.password,
    UserLevel: userLevel,
  });

  return `User "${input.username}" created with role ${userLevel}`;
}

export async function updateUser(input: {
  username: string;
  password?: string;
  role?: string;
}): Promise<string> {
  const client = getActiveClient();
  const params: Record<string, string> = {
    Username: input.username,
  };

  if (input.password) params.Password = input.password;
  if (input.role) {
    const levelMap: Record<string, string> = {
      admin: "Admin",
      user: "User",
      viewer: "Viewer",
    };
    params.UserLevel = levelMap[input.role] ?? "Viewer";
  }

  await client.request("security.cgi", "users", "set", params);
  return `User "${input.username}" updated`;
}

export async function removeUser(input: { username: string }): Promise<string> {
  const client = getActiveClient();
  await client.request("security.cgi", "users", "remove", {
    Username: input.username,
  });
  return `User "${input.username}" removed`;
}
