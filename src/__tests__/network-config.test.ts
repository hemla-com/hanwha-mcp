import { vi, describe, it, expect } from "vitest";
import { setActiveClient } from "../tools/connect.js";
import { getNetworkConfig, setNetworkConfig } from "../tools/network-config.js";

function createMockClient(requestFn?: Function) {
  return {
    request: requestFn ?? vi.fn().mockResolvedValue({}),
    requestRaw: vi.fn().mockResolvedValue(Buffer.from([])),
  } as any;
}

describe("getNetworkConfig", () => {
  it("returns formatted network config from 4 parallel requests", async () => {
    const mockRequest = vi.fn()
      .mockResolvedValueOnce({
        IPv4Type: "DHCP",
        IPv4Address: "192.168.1.100",
        IPv4SubnetMask: "255.255.255.0",
        IPv4Gateway: "192.168.1.1",
        HostName: "camera-01",
        MTUSize: "1500",
        MACAddress: "00:09:18:AB:CD:EF",
      })
      .mockResolvedValueOnce({ Port: "80" })
      .mockResolvedValueOnce({ Port: "443" })
      .mockResolvedValueOnce({ Port: "554", Timeout: "60" });

    setActiveClient(createMockClient(mockRequest));
    const result = await getNetworkConfig();

    expect(result).toContain("192.168.1.100");
    expect(result).toContain("255.255.255.0");
    expect(result).toContain("192.168.1.1");
    expect(result).toContain("camera-01");
    expect(result).toContain("00:09:18:AB:CD:EF");
    expect(result).toContain("HTTP: 80");
    expect(result).toContain("HTTPS: 443");
    expect(result).toContain("RTSP: 554");
    expect(result).toContain("60");
    expect(mockRequest).toHaveBeenCalledTimes(4);
  });
});

describe("setNetworkConfig", () => {
  it("calls request with correct params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    const result = await setNetworkConfig({
      ipv4Type: "Static",
      ipv4Address: "192.168.1.200",
      ipv4SubnetMask: "255.255.255.0",
      ipv4Gateway: "192.168.1.1",
      hostname: "camera-02",
    });

    expect(mockRequest).toHaveBeenCalledWith("network.cgi", "interface", "set", {
      IPv4Type: "Static",
      IPv4Address: "192.168.1.200",
      IPv4SubnetMask: "255.255.255.0",
      IPv4Gateway: "192.168.1.1",
      HostName: "camera-02",
    });
    expect(result).toContain("Network config updated");
  });

  it("only includes provided params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    await setNetworkConfig({ hostname: "new-name" });

    expect(mockRequest).toHaveBeenCalledWith("network.cgi", "interface", "set", {
      HostName: "new-name",
    });
  });
});
