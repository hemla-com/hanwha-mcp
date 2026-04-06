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
  mockRequest.mockReset();
  setActiveClient(createMockClient());
});

describe("getUsers", () => {
  it("returns formatted user list", async () => {
    mockRequest.mockResolvedValue({
      "Users.0": "admin//True/True////",
      "Users.1": "viewer//False/False////",
    });

    const result = await getUsers();

    expect(result).toContain("admin");
    expect(result).toContain("viewer");
    expect(result).toContain("Enabled: Yes");
    expect(result).toContain("Enabled: No");
    expect(mockRequest).toHaveBeenCalledWith("security.cgi", "users", "view");
  });

  it("returns no users message when empty", async () => {
    mockRequest.mockResolvedValue({});
    const result = await getUsers();
    expect(result).toContain("No users found");
  });
});

describe("createUser", () => {
  it("creates an enabled user", async () => {
    mockRequest.mockResolvedValue({ Index: "5" });
    const result = await createUser({ username: "john", password: "secret" });
    expect(result).toContain("john");
    expect(result).toContain("slot 5");
    expect(mockRequest).toHaveBeenCalledWith("security.cgi", "users", "add", {
      UserID: "john",
      Password: "secret",
      Enable: "True",
    });
  });

  it("creates a disabled user when enabled=false", async () => {
    mockRequest.mockResolvedValue({ Index: "3" });
    const result = await createUser({ username: "bob", password: "pass", enabled: false });
    expect(result).toContain("bob");
    expect(mockRequest).toHaveBeenCalledWith("security.cgi", "users", "add", {
      UserID: "bob",
      Password: "pass",
    });
  });
});

describe("updateUser", () => {
  it("removes and re-adds user with new password", async () => {
    mockRequest
      .mockResolvedValueOnce({ "Users.1": "john//True/False////" })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ Index: "1" });

    const result = await updateUser({ username: "john", password: "newpass" });
    expect(result).toContain("john");
    expect(result).toContain("updated");

    expect(mockRequest).toHaveBeenNthCalledWith(1, "security.cgi", "users", "view");
    expect(mockRequest).toHaveBeenNthCalledWith(2, "security.cgi", "users", "remove", { UserID: "john" });
    expect(mockRequest).toHaveBeenNthCalledWith(3, "security.cgi", "users", "add", {
      UserID: "john",
      Password: "newpass",
      Enable: "True",
    });
  });

  it("throws when user not found", async () => {
    mockRequest.mockResolvedValue({});
    await expect(updateUser({ username: "nonexistent" })).rejects.toThrow("not found");
  });
});

describe("removeUser", () => {
  it("removes user by name", async () => {
    mockRequest.mockResolvedValue({});
    const result = await removeUser({ username: "john" });
    expect(result).toContain("john");
    expect(result).toContain("removed");
    expect(mockRequest).toHaveBeenCalledWith("security.cgi", "users", "remove", {
      UserID: "john",
    });
  });
});
