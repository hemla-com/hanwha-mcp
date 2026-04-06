import { vi, describe, it, expect, beforeEach } from "vitest";
import { setActiveClient } from "../tools/connect.js";
import { getDeviceInfo } from "../tools/device-info.js";

function createMockClient(requestFn?: Function) {
  return {
    request: requestFn ?? vi.fn().mockResolvedValue({}),
    requestRaw: vi.fn().mockResolvedValue(Buffer.from([])),
  } as any;
}

describe("getDeviceInfo", () => {
  it("returns formatted device info and video profiles", async () => {
    const mockRequest = vi.fn()
      .mockResolvedValueOnce({
        Model: "XNV-6120R",
        SerialNumber: "SN-12345",
        FirmwareVersion: "2.21.01",
        ConnectedMACAddress: "00:09:18:AA:BB:CC",
        CGIVersion: "2.5",
      })
      .mockResolvedValueOnce({
        "Channel.0.Profile.1.Name": "H265",
        "Channel.0.Profile.1.Resolution": "2560x1920",
        "Channel.0.Profile.1.EncodingType": "H.265",
        "Channel.0.Profile.1.FrameRate": "30",
        "Channel.0.Profile.1.BitRate": "4096",
      });

    setActiveClient(createMockClient(mockRequest));

    const result = await getDeviceInfo();

    expect(result).toContain("XNV-6120R");
    expect(result).toContain("SN-12345");
    expect(result).toContain("2.21.01");
    expect(result).toContain("2560x1920");
    expect(result).toContain("H.265");
    expect(result).toContain("30");
  });

  it("handles missing fields gracefully", async () => {
    const mockRequest = vi.fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    setActiveClient(createMockClient(mockRequest));

    const result = await getDeviceInfo();

    expect(result).toContain("unknown");
  });
});
