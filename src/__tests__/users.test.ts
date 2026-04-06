import { vi, describe, it, expect } from "vitest";
import { setActiveClient } from "../tools/connect.js";
import { getUsers } from "../tools/users.js";

function createMockClient(requestFn?: Function) {
  return {
    request: requestFn ?? vi.fn().mockResolvedValue({}),
    requestRaw: vi.fn().mockResolvedValue(Buffer.from([])),
  } as any;
}

describe("getUsers", () => {
  it("returns formatted user list", async () => {
    const mockRequest = vi.fn().mockResolvedValue({
      "Users.0": "admin//True/True////",
      "Users.1": "viewer//False/True////",
    });

    setActiveClient(createMockClient(mockRequest));
    const result = await getUsers();

    expect(result).toContain("admin");
    expect(result).toContain("viewer");
    expect(result).toContain("Admin: Yes");
    expect(result).toContain("Admin: No");
    expect(result).toContain("Enabled: Yes");
    expect(mockRequest).toHaveBeenCalledWith("security.cgi", "users", "view");
  });

  it("returns no users message when empty", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));
    const result = await getUsers();
    expect(result).toContain("No users found");
  });
});
