import { vi, describe, it, expect } from "vitest";
import { setActiveClient } from "../tools/connect.js";
import { getImageSettings, setImageSettings } from "../tools/image-settings.js";

function createMockClient(requestFn?: Function) {
  return {
    request: requestFn ?? vi.fn().mockResolvedValue({}),
    requestRaw: vi.fn().mockResolvedValue(Buffer.from([])),
  } as any;
}

describe("getImageSettings", () => {
  it("returns formatted image settings from 6 parallel requests", async () => {
    const mockRequest = vi.fn()
      .mockResolvedValueOnce({
        "Channel.0.Brightness": "50",
        "Channel.0.SharpnessLevel": "5",
        "Channel.0.SharpnessEnable": "True",
        "Channel.0.Gamma": "0.45",
        "Channel.0.Saturation": "60",
        "Channel.0.LDCMode": "Off",
        "Channel.0.LDCLevel": "0",
      })
      .mockResolvedValueOnce({
        "Channel.0.WhiteBalanceMode": "ATW",
        "Channel.0.WhiteBalanceManualRedLevel": "128",
        "Channel.0.WhiteBalanceManualBlueLevel": "128",
      })
      .mockResolvedValueOnce({
        "Channel.0.Preset.1.CompensationMode": "BLC",
        "Channel.0.Preset.1.WDRLevel": "128",
        "Channel.0.Preset.1.AGCMode": "Normal",
        "Channel.0.Preset.1.SSNREnable": "True",
        "Channel.0.Preset.1.SSNRMode": "Auto",
        "Channel.0.Preset.1.SSNRLevel": "50",
      })
      .mockResolvedValueOnce({
        "Channel.0.Preset.1.Enable": "True",
        "Channel.0.Preset.1.Level": "128",
        "Channel.0.Preset.1.DynamicRange": "High",
      })
      .mockResolvedValueOnce({
        "Channel.0.HorizontalFlipEnable": "False",
        "Channel.0.VerticalFlipEnable": "False",
        "Channel.0.Rotate": "Off",
      })
      .mockResolvedValueOnce({
        "Channel.0.Preset.1.Mode": "Auto",
      });

    setActiveClient(createMockClient(mockRequest));
    const result = await getImageSettings({ channel: 0 });

    expect(result).toContain("Brightness: 50");
    expect(result).toContain("ATW");
    expect(result).toContain("BLC");
    expect(result).toContain("Auto");
    expect(mockRequest).toHaveBeenCalledTimes(6);
  });
});

describe("setImageSettings", () => {
  it("calls request with correct params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    const result = await setImageSettings({
      channel: 0,
      brightness: 75,
      sharpness: 10,
    });

    expect(mockRequest).toHaveBeenCalledWith("image.cgi", "imageenhancements", "set", {
      Channel: "0",
      Brightness: "75",
      SharpnessLevel: "10",
    });
    expect(result).toContain("Brightness=75");
    expect(result).toContain("SharpnessLevel=10");
  });

  it("only includes provided params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    await setImageSettings({ channel: 1, saturation: 50 });

    expect(mockRequest).toHaveBeenCalledWith("image.cgi", "imageenhancements", "set", {
      Channel: "1",
      Saturation: "50",
    });
  });
});
