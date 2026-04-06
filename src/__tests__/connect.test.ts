import { vi, describe, it, expect, beforeEach } from "vitest";
import { getActiveClient, setActiveClient } from "../tools/connect.js";

function createMockClient() {
  return {
    request: vi.fn().mockResolvedValue({}),
    requestRaw: vi.fn().mockResolvedValue(Buffer.from([])),
  } as any;
}

describe("connect", () => {
  beforeEach(() => {
    setActiveClient(null as any);
  });

  it("getActiveClient throws when no client is set", () => {
    expect(() => getActiveClient()).toThrow("No camera connected");
  });

  it("returns client after setActiveClient", () => {
    const mock = createMockClient();
    setActiveClient(mock);
    expect(getActiveClient()).toBe(mock);
  });
});
