import { vi, describe, it, expect, beforeEach } from "vitest";
import { setActiveClient } from "../tools/connect.js";
import { getUsers, createUser, updateUser, removeUser } from "../tools/users.js";

const mockRequest = vi.fn();

function createMockClient() {
  return {
    request: mockRequest,
    requestRaw: vi.fn().mockResolvedValue(Buffer.from([])),
  } as any;
}

beforeEach(() => {
  vi.restoreAllMocks();
  setActiveClient(createMockClient());
});

describe("getUsers", () => {
  it("returns formatted user list", async () => {
    mockRequest.mockResolvedValue({
      "Users.0": "admin//True/True////",
      "Users.1": "viewer//False/True////",
    });

    const result = await getUsers();

    expect(result).toContain("admin");
    expect(result).toContain("viewer");
    expect(result).toContain("Admin: Yes");
    expect(result).toContain("Admin: No");
    expect(result).toContain("Enabled: Yes");
    expect(mockRequest).toHaveBeenCalledWith("security.cgi", "users", "view");
  });

  it("returns no users message when empty", async () => {
    mockRequest.mockResolvedValue({});
    const result = await getUsers();
    expect(result).toContain("No users found");
  });
});

describe("createUser", () => {
  it("creates a viewer user by default", async () => {
    mockRequest.mockResolvedValue({});
    const result = await createUser({ username: "john", password: "secret" });
    expect(result).toContain("john");
    expect(result).toContain("Viewer");
    expect(mockRequest).toHaveBeenCalledWith("security.cgi", "users", "add", {
      Username: "john",
      Password: "secret",
      UserLevel: "Viewer",
    });
  });

  it("creates an admin user", async () => {
    mockRequest.mockResolvedValue({});
    const result = await createUser({ username: "boss", password: "pass", role: "admin" });
    expect(result).toContain("boss");
    expect(result).toContain("Admin");
    expect(mockRequest).toHaveBeenCalledWith("security.cgi", "users", "add", {
      Username: "boss",
      Password: "pass",
      UserLevel: "Admin",
    });
  });
});

describe("updateUser", () => {
  it("updates password", async () => {
    mockRequest.mockResolvedValue({});
    const result = await updateUser({ username: "john", password: "newpass" });
    expect(result).toContain("john");
    expect(result).toContain("updated");
    expect(mockRequest).toHaveBeenCalledWith("security.cgi", "users", "set", {
      Username: "john",
      Password: "newpass",
    });
  });

  it("updates role", async () => {
    mockRequest.mockResolvedValue({});
    const result = await updateUser({ username: "john", role: "user" });
    expect(result).toContain("john");
    expect(mockRequest).toHaveBeenCalledWith("security.cgi", "users", "set", {
      Username: "john",
      UserLevel: "User",
    });
  });
});

describe("removeUser", () => {
  it("removes user by name", async () => {
    mockRequest.mockResolvedValue({});
    const result = await removeUser({ username: "john" });
    expect(result).toContain("john");
    expect(result).toContain("removed");
    expect(mockRequest).toHaveBeenCalledWith("security.cgi", "users", "remove", {
      Username: "john",
    });
  });
});
