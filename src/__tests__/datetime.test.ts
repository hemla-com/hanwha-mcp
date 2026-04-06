import { vi, describe, it, expect, beforeEach } from "vitest";
import { setActiveClient } from "../tools/connect.js";
import { getDateTime, setNtp, setDateTime } from "../tools/datetime.js";

function createMockClient(requestFn?: Function) {
  return {
    request: requestFn ?? vi.fn().mockResolvedValue({}),
    requestRaw: vi.fn().mockResolvedValue(Buffer.from([])),
  } as any;
}

describe("getDateTime", () => {
  it("returns formatted date/time info", async () => {
    const mockRequest = vi.fn().mockResolvedValue({
      LocalTime: "2025-07-15 14:30:00",
      UTCTime: "2025-07-15 05:30:00",
      SyncType: "NTP",
      DSTEnable: "False",
      TimeZoneIndex: "61",
      POSIXTimeZone: "KST-9",
      NTPURLList: "pool.ntp.org",
    });

    setActiveClient(createMockClient(mockRequest));
    const result = await getDateTime();

    expect(result).toContain("2025-07-15 14:30:00");
    expect(result).toContain("NTP");
    expect(result).toContain("pool.ntp.org");
  });
});

describe("setNtp", () => {
  it("sets NTP servers", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    const result = await setNtp({ servers: "pool.ntp.org,time.nist.gov" });

    expect(result).toContain("pool.ntp.org,time.nist.gov");
    expect(mockRequest).toHaveBeenCalledWith("system.cgi", "date", "set", {
      SyncType: "NTP",
      NTPURLList: "pool.ntp.org,time.nist.gov",
    });
  });
});

describe("setDateTime", () => {
  it("sets manual date/time and returns formatted string", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    const result = await setDateTime({
      year: 2025,
      month: 3,
      day: 5,
      hour: 9,
      minute: 7,
      second: 0,
    });

    expect(result).toContain("2025-03-05 09:07:00");
    expect(mockRequest).toHaveBeenCalledWith("system.cgi", "date", "set", {
      SyncType: "Manual",
      Year: "2025",
      Month: "3",
      Day: "5",
      Hour: "9",
      Minute: "7",
      Second: "0",
    });
  });
});
