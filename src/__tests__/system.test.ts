import { vi, describe, it, expect } from "vitest";
import { setActiveClient } from "../tools/connect.js";
import { getLogs, setFocus } from "../tools/system.js";

function createMockClient(requestFn?: Function) {
  return {
    request: requestFn ?? vi.fn().mockResolvedValue({}),
    requestRaw: vi.fn().mockResolvedValue(Buffer.from([])),
  } as any;
}

describe("getLogs", () => {
  it("returns formatted system log", async () => {
    const mockRequest = vi.fn().mockResolvedValue({
      "Log.0": "2025-07-15 Boot completed",
      "Log.1": "2025-07-15 NTP sync ok",
    });

    setActiveClient(createMockClient(mockRequest));
    const result = await getLogs({ type: "system" });

    expect(result).toContain("System Log");
    expect(result).toContain("Boot completed");
    expect(result).toContain("NTP sync ok");
    expect(mockRequest).toHaveBeenCalledWith("system.cgi", "systemlog", "view");
  });

  it("maps access type to accesslog submenu", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    await getLogs({ type: "access" });

    expect(mockRequest).toHaveBeenCalledWith("system.cgi", "accesslog", "view");
  });

  it("maps event type to eventlog submenu", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    await getLogs({ type: "event" });

    expect(mockRequest).toHaveBeenCalledWith("system.cgi", "eventlog", "view");
  });

  it("shows (empty) for empty logs", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    const result = await getLogs({ type: "system" });

    expect(result).toContain("(empty)");
  });
});

describe("setFocus", () => {
  it("sets focus mode and returns confirmation", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    const result = await setFocus({ channel: 0, mode: "SimpleAutoFocus" });

    expect(result).toContain("SimpleAutoFocus");
    expect(mockRequest).toHaveBeenCalledWith("image.cgi", "camera", "set", {
      Channel: "0",
      FocusMode: "SimpleAutoFocus",
    });
  });
});
