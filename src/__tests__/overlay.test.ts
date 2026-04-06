import { vi, describe, it, expect } from "vitest";
import { setActiveClient } from "../tools/connect.js";
import { getOverlay, setOverlay } from "../tools/overlay.js";

function createMockClient(requestFn?: Function) {
  return {
    request: requestFn ?? vi.fn().mockResolvedValue({}),
    requestRaw: vi.fn().mockResolvedValue(Buffer.from([])),
  } as any;
}

describe("getOverlay", () => {
  it("returns formatted overlay settings", async () => {
    const mockRequest = vi.fn().mockResolvedValue({
      "Channel.0.TitleEnable": "True",
      "Channel.0.Title": "Front Entrance",
      "Channel.0.TitlePositionX": "0",
      "Channel.0.TitlePositionY": "0",
      "Channel.0.TimeEnable": "True",
      "Channel.0.TimeFormat": "YYYY-MM-DD",
      "Channel.0.TimePositionX": "0",
      "Channel.0.TimePositionY": "9",
      "Channel.0.WeekdayEnable": "True",
      "Channel.0.FontSize": "Medium",
    });

    setActiveClient(createMockClient(mockRequest));
    const result = await getOverlay({ channel: 0 });

    expect(result).toContain("Front Entrance");
    expect(result).toContain("True");
    expect(result).toContain("YYYY-MM-DD");
    expect(result).toContain("Medium");
  });
});

describe("setOverlay", () => {
  it("passes correct params to request", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    const result = await setOverlay({
      channel: 0,
      titleEnable: true,
      title: "Lobby",
      fontSize: "Large",
    });

    expect(mockRequest).toHaveBeenCalledWith("image.cgi", "overlay", "set", {
      Channel: "0",
      TitleEnable: "True",
      Title: "Lobby",
      FontSize: "Large",
    });
    expect(result).toContain("Overlay updated");
  });

  it("only includes provided params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    await setOverlay({ channel: 1, timeEnable: false });

    expect(mockRequest).toHaveBeenCalledWith("image.cgi", "overlay", "set", {
      Channel: "1",
      TimeEnable: "False",
    });
  });
});
