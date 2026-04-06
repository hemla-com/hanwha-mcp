import { vi, describe, it, expect } from "vitest";
import { setActiveClient } from "../tools/connect.js";
import { getSsdr, setSsdr } from "../tools/ssdr.js";

function createMockClient(requestFn?: Function) {
  return {
    request: requestFn ?? vi.fn().mockResolvedValue({}),
    requestRaw: vi.fn().mockResolvedValue(Buffer.from([])),
  } as any;
}

describe("getSsdr", () => {
  it("returns formatted SSDR settings", async () => {
    const mockRequest = vi.fn().mockResolvedValue({
      "Channel.0.Enable": "True",
      "Channel.0.Level": "12",
      "Channel.0.DynamicRange": "Narrow",
    });

    setActiveClient(createMockClient(mockRequest));
    const result = await getSsdr({ channel: 0 });

    expect(result).toContain("True");
    expect(result).toContain("12");
    expect(result).toContain("Narrow");
  });
});

describe("setSsdr", () => {
  it("calls request with correct params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    const result = await setSsdr({
      channel: 0,
      enable: true,
      level: 15,
      dynamicRange: "Wide",
    });

    expect(mockRequest).toHaveBeenCalledWith("image.cgi", "ssdr", "set", {
      Channel: "0",
      Enable: "true",
      Level: "15",
      DynamicRange: "Wide",
    });
    expect(result).toContain("SSDR updated");
  });

  it("only includes provided params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    await setSsdr({ channel: 1, enable: false });

    expect(mockRequest).toHaveBeenCalledWith("image.cgi", "ssdr", "set", {
      Channel: "1",
      Enable: "false",
    });
  });
});
