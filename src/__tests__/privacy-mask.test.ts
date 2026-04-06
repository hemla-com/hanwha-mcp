import { vi, describe, it, expect } from "vitest";
import { setActiveClient } from "../tools/connect.js";
import { getPrivacyMask, setPrivacyMask } from "../tools/privacy-mask.js";

function createMockClient(requestFn?: Function) {
  return {
    request: requestFn ?? vi.fn().mockResolvedValue({}),
    requestRaw: vi.fn().mockResolvedValue(Buffer.from([])),
  } as any;
}

describe("getPrivacyMask", () => {
  it("returns formatted privacy mask settings", async () => {
    const mockRequest = vi.fn().mockResolvedValue({
      "Channel.0.Enable": "False",
      "Channel.0.CommonMaskColor": "Gray",
    });

    setActiveClient(createMockClient(mockRequest));
    const result = await getPrivacyMask({ channel: 0 });

    expect(result).toContain("False");
    expect(result).toContain("Gray");
  });
});

describe("setPrivacyMask", () => {
  it("calls request with correct params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    const result = await setPrivacyMask({
      channel: 0,
      enable: true,
      maskColor: "Black",
    });

    expect(mockRequest).toHaveBeenCalledWith("image.cgi", "privacy", "set", {
      Channel: "0",
      Enable: "true",
      CommonMaskColor: "Black",
    });
    expect(result).toContain("Privacy mask updated");
  });

  it("only includes provided params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    await setPrivacyMask({ channel: 1, enable: false });

    expect(mockRequest).toHaveBeenCalledWith("image.cgi", "privacy", "set", {
      Channel: "1",
      Enable: "false",
    });
  });
});
