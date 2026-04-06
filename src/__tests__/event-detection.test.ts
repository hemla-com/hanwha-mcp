import { vi, describe, it, expect } from "vitest";
import { setActiveClient } from "../tools/connect.js";
import {
  getTamperingDetection,
  setTamperingDetection,
  getDefocusDetection,
  setDefocusDetection,
} from "../tools/event-detection.js";

function createMockClient(requestFn?: Function) {
  return {
    request: requestFn ?? vi.fn().mockResolvedValue({}),
    requestRaw: vi.fn().mockResolvedValue(Buffer.from([])),
  } as any;
}

describe("getTamperingDetection", () => {
  it("returns formatted tampering detection settings", async () => {
    const mockRequest = vi.fn().mockResolvedValue({
      "Channel.0.Enable": "True",
      "Channel.0.Sensitivity": "High",
      "Channel.0.SensitivityLevel": "80",
      "Channel.0.ThresholdLevel": "50",
      "Channel.0.Duration": "5",
      "Channel.0.DarknessDetection": "True",
    });

    setActiveClient(createMockClient(mockRequest));
    const result = await getTamperingDetection({ channel: 0 });

    expect(result).toContain("True");
    expect(result).toContain("80");
    expect(result).toContain("50");
    expect(result).toContain("5");
    expect(mockRequest).toHaveBeenCalledWith("eventsources.cgi", "tamperingdetection", "view");
  });
});

describe("setTamperingDetection", () => {
  it("calls request with correct params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    const result = await setTamperingDetection({
      channel: 0,
      enable: true,
      sensitivityLevel: 80,
      thresholdLevel: 50,
      duration: 10,
      darknessDetection: true,
    });

    expect(mockRequest).toHaveBeenCalledWith("eventsources.cgi", "tamperingdetection", "set", {
      Channel: "0",
      Enable: "True",
      SensitivityLevel: "80",
      ThresholdLevel: "50",
      Duration: "10",
      DarknessDetection: "True",
    });
    expect(result).toContain("Tampering detection updated");
  });

  it("only includes provided params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    await setTamperingDetection({ channel: 1, enable: false });

    expect(mockRequest).toHaveBeenCalledWith("eventsources.cgi", "tamperingdetection", "set", {
      Channel: "1",
      Enable: "False",
    });
  });
});

describe("getDefocusDetection", () => {
  it("returns formatted defocus detection settings", async () => {
    const mockRequest = vi.fn().mockResolvedValue({
      "Channel.0.Enable": "True",
      "Channel.0.Sensitivity": "Medium",
      "Channel.0.ThresholdLevel": "60",
      "Channel.0.Duration": "3",
    });

    setActiveClient(createMockClient(mockRequest));
    const result = await getDefocusDetection({ channel: 0 });

    expect(result).toContain("True");
    expect(result).toContain("Medium");
    expect(result).toContain("60");
    expect(result).toContain("3");
    expect(mockRequest).toHaveBeenCalledWith("eventsources.cgi", "defocusdetection", "view");
  });
});

describe("setDefocusDetection", () => {
  it("calls request with correct params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    const result = await setDefocusDetection({
      channel: 0,
      enable: true,
      sensitivity: 75,
      thresholdLevel: 40,
      duration: 5,
    });

    expect(mockRequest).toHaveBeenCalledWith("eventsources.cgi", "defocusdetection", "set", {
      Channel: "0",
      Enable: "True",
      Sensitivity: "75",
      ThresholdLevel: "40",
      Duration: "5",
    });
    expect(result).toContain("Defocus detection updated");
  });

  it("only includes provided params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    await setDefocusDetection({ channel: 0, enable: false });

    expect(mockRequest).toHaveBeenCalledWith("eventsources.cgi", "defocusdetection", "set", {
      Channel: "0",
      Enable: "False",
    });
  });
});
