import { vi, describe, it, expect } from "vitest";
import { setActiveClient } from "../tools/connect.js";
import { getWhiteBalance, setWhiteBalance } from "../tools/white-balance.js";

function createMockClient(requestFn?: Function) {
  return {
    request: requestFn ?? vi.fn().mockResolvedValue({}),
    requestRaw: vi.fn().mockResolvedValue(Buffer.from([])),
  } as any;
}

describe("getWhiteBalance", () => {
  it("returns formatted white balance settings", async () => {
    const mockRequest = vi.fn().mockResolvedValue({
      "Channel.0.WhiteBalanceMode": "Outdoor",
      "Channel.0.WhiteBalanceManualRedLevel": "604",
      "Channel.0.WhiteBalanceManualBlueLevel": "512",
    });

    setActiveClient(createMockClient(mockRequest));
    const result = await getWhiteBalance({ channel: 0 });

    expect(result).toContain("Outdoor");
    expect(result).toContain("604");
    expect(result).toContain("512");
  });
});

describe("setWhiteBalance", () => {
  it("calls request with correct params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    const result = await setWhiteBalance({
      channel: 0,
      mode: "Manual",
      manualRedLevel: 700,
      manualBlueLevel: 600,
    });

    expect(mockRequest).toHaveBeenCalledWith("image.cgi", "whitebalance", "set", {
      Channel: "0",
      WhiteBalanceMode: "Manual",
      WhiteBalanceManualRedLevel: "700",
      WhiteBalanceManualBlueLevel: "600",
    });
    expect(result).toContain("White balance updated");
  });

  it("only includes provided params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    await setWhiteBalance({ channel: 1, mode: "ATW" });

    expect(mockRequest).toHaveBeenCalledWith("image.cgi", "whitebalance", "set", {
      Channel: "1",
      WhiteBalanceMode: "ATW",
    });
  });
});
