import { vi, describe, it, expect } from "vitest";
import { setActiveClient } from "../tools/connect.js";
import { getOSD, setOSD, removeOSD } from "../tools/osd.js";

function createMockClient(requestFn?: Function) {
  return {
    request: requestFn ?? vi.fn().mockResolvedValue({}),
    requestRaw: vi.fn().mockResolvedValue(Buffer.from([])),
  } as any;
}

describe("getOSD", () => {
  it("returns formatted OSD entries", async () => {
    const mockRequest = vi.fn().mockResolvedValue({
      "Channel.0.Index.1.Enable": "True",
      "Channel.0.Index.1.OSDType": "Custom",
      "Channel.0.Index.1.OSD": "Test",
      "Channel.0.Index.1.PositionX": "0",
      "Channel.0.Index.1.PositionY": "0",
      "Channel.0.Index.1.FontSize": "Medium",
      "Channel.0.Index.1.OSDColor": "White",
      "Channel.0.Index.2.Enable": "False",
      "Channel.0.Index.2.OSDType": "Date",
      "Channel.0.Index.2.PositionX": "1",
      "Channel.0.Index.2.PositionY": "2",
      "Channel.0.Index.2.FontSize": "Small",
      "Channel.0.Index.2.OSDColor": "Red",
    });

    setActiveClient(createMockClient(mockRequest));
    const result = await getOSD({ channel: 0 });

    expect(result).toContain("active");
    expect(result).toContain("Custom");
    expect(result).toContain('"Test"');
    expect(result).toContain("Medium");
    expect(result).toContain("Index 1");
    expect(result).toContain("Index 2");
    expect(result).toContain("disabled");
    expect(mockRequest).toHaveBeenCalledWith("image.cgi", "multilineosd", "view", {
      Channel: "0",
    });
  });

  it("returns no entries message when empty", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));
    const result = await getOSD({ channel: 0 });
    expect(result).toContain("No multiline OSD entries configured");
  });
});

describe("setOSD", () => {
  it("calls request with correct params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    const result = await setOSD({
      channel: 0,
      index: 1,
      enable: true,
      osdType: "Title",
      text: "Hello",
      positionX: 2,
      positionY: 3,
      fontSize: "Large",
      color: "White",
      transparency: "Off",
    });

    expect(mockRequest).toHaveBeenNthCalledWith(1, "image.cgi", "multilineosd", "add", {
      Channel: "0",
      Index: "1",
    });
    expect(mockRequest).toHaveBeenNthCalledWith(2, "image.cgi", "multilineosd", "update", {
      Channel: "0",
      Index: "1",
      Enable: "True",
      OSDType: "Title",
      OSD: "Hello",
      PositionX: "2",
      PositionY: "3",
      FontSize: "Large",
      OSDColor: "White",
      Transparency: "Off",
    });
    expect(result).toContain("OSD index 1 updated");
  });

  it("only includes provided params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    await setOSD({ channel: 0, index: 2, enable: false });

    expect(mockRequest).toHaveBeenNthCalledWith(1, "image.cgi", "multilineosd", "add", {
      Channel: "0",
      Index: "2",
    });
    expect(mockRequest).toHaveBeenNthCalledWith(2, "image.cgi", "multilineosd", "update", {
      Channel: "0",
      Index: "2",
      Enable: "False",
    });
  });
});

describe("removeOSD", () => {
  it("calls request with correct params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    const result = await removeOSD({ channel: 0, index: 3 });

    expect(mockRequest).toHaveBeenCalledWith("image.cgi", "multilineosd", "remove", {
      Channel: "0",
      Index: "3",
    });
    expect(result).toContain("OSD index 3 removed");
  });
});
