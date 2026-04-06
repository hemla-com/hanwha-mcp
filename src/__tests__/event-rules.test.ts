import { vi, describe, it, expect } from "vitest";
import { setActiveClient } from "../tools/connect.js";
import { getEventRules, setEventRule } from "../tools/event-rules.js";

function createMockClient(requestFn?: Function) {
  return {
    request: requestFn ?? vi.fn().mockResolvedValue({}),
    requestRaw: vi.fn().mockResolvedValue(Buffer.from([])),
  } as any;
}

describe("getEventRules", () => {
  it("returns formatted event rules", async () => {
    const mockRequest = vi.fn().mockResolvedValue({
      "Rule.1.RuleName": "MotionDetection",
      "Rule.1.EventSource": "MotionDetection",
      "Rule.1.Enable": "True",
      "Rule.1.ScheduleType": "Always",
      "Rule.2.RuleName": "TamperingDetection",
      "Rule.2.EventSource": "TamperingDetection",
      "Rule.2.Enable": "False",
      "Rule.2.ScheduleType": "Schedule",
    });

    setActiveClient(createMockClient(mockRequest));
    const result = await getEventRules();

    expect(result).toContain("MotionDetection");
    expect(result).toContain("True");
    expect(result).toContain("Always");
    expect(result).toContain("TamperingDetection");
    expect(result).toContain("Rule 1");
    expect(result).toContain("Rule 2");
    expect(mockRequest).toHaveBeenCalledWith("eventrules.cgi", "rules", "view");
  });

  it("returns no rules message when empty", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));
    const result = await getEventRules();
    expect(result).toContain("No event rules configured");
  });
});

describe("setEventRule", () => {
  it("calls request with correct params to enable", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    const result = await setEventRule({ ruleIndex: 1, enable: true });

    expect(mockRequest).toHaveBeenCalledWith("eventrules.cgi", "rules", "update", {
      "Rule.1.Enable": "True",
    });
    expect(result).toContain("enabled");
  });

  it("calls request with correct params to disable", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    const result = await setEventRule({ ruleIndex: 2, enable: false });

    expect(mockRequest).toHaveBeenCalledWith("eventrules.cgi", "rules", "update", {
      "Rule.2.Enable": "False",
    });
    expect(result).toContain("disabled");
  });
});
