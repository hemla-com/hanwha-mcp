import { vi, describe, it, expect } from "vitest";
import { setActiveClient } from "../tools/connect.js";
import { getNetworkInfo } from "../tools/network.js";

function createMockClient(requestFn?: Function) {
  return {
    request: requestFn ?? vi.fn().mockResolvedValue({}),
    requestRaw: vi.fn().mockResolvedValue(Buffer.from([])),
  } as any;
}

describe("getNetworkInfo", () => {
  it("returns formatted network info with interface and DNS data", async () => {
    const mockRequest = vi.fn()
      .mockResolvedValueOnce({
        MACAddress: "00:09:18:AA:BB:CC",
        LinkStatus: "Connected",
        InterfaceType: "Auto",
        BroadcastAddress: "192.168.1.255",
        IPv6DefaultAddress: "fe80::1",
      })
      .mockResolvedValueOnce({
        Type: "Static",
        PrimaryDNS: "8.8.8.8",
        SecondaryDNS: "8.8.4.4",
      });

    setActiveClient(createMockClient(mockRequest));
    const result = await getNetworkInfo();

    expect(result).toContain("00:09:18:AA:BB:CC");
    expect(result).toContain("Connected");
    expect(result).toContain("8.8.8.8");
    expect(result).toContain("8.8.4.4");
    expect(result).toContain("Static");
  });

  it("shows N/A for missing fields", async () => {
    const mockRequest = vi.fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    setActiveClient(createMockClient(mockRequest));
    const result = await getNetworkInfo();

    expect(result).toContain("N/A");
  });
});
