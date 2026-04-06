import { vi, describe, it, expect } from "vitest";
import { setActiveClient } from "../tools/connect.js";
import { getStorageConfig, setStorageConfig } from "../tools/storage.js";

function createMockClient(requestFn?: Function) {
  return {
    request: requestFn ?? vi.fn().mockResolvedValue({}),
    requestRaw: vi.fn().mockResolvedValue(Buffer.from([])),
  } as any;
}

describe("getStorageConfig", () => {
  it("returns formatted storage configuration", async () => {
    const mockRequest = vi.fn().mockResolvedValue({
      Enable: "False",
      OverWrite: "False",
      AutoDeleteEnable: "False",
      AutoDeleteDays: "180",
    });

    setActiveClient(createMockClient(mockRequest));
    const result = await getStorageConfig();

    expect(result).toContain("False");
    expect(result).toContain("180");
    expect(result).toContain("Storage Configuration");
    expect(mockRequest).toHaveBeenCalledWith("recording.cgi", "storage", "view");
  });
});

describe("setStorageConfig", () => {
  it("calls request with correct params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    const result = await setStorageConfig({
      enable: true,
      overwrite: true,
      autoDeleteEnable: true,
      autoDeleteDays: 90,
    });

    expect(mockRequest).toHaveBeenCalledWith("recording.cgi", "storage", "set", {
      Enable: "true",
      OverWrite: "true",
      AutoDeleteEnable: "true",
      AutoDeleteDays: "90",
    });
    expect(result).toContain("Storage config updated");
  });

  it("only includes provided params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    await setStorageConfig({ enable: false });

    expect(mockRequest).toHaveBeenCalledWith("recording.cgi", "storage", "set", {
      Enable: "false",
    });
  });
});
