import { vi, describe, it, expect, beforeEach } from "vitest";
import { setActiveClient } from "../tools/connect.js";

vi.mock("sharp", () => {
  const mockSharp = vi.fn(() => ({
    metadata: vi.fn().mockResolvedValue({ width: 800, height: 600 }),
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from([0xff, 0xd8, 0xff, 0xe0])),
  }));
  return { default: mockSharp };
});

import { getSnapshot } from "../tools/snapshot.js";

function createMockClient(requestRawFn?: Function) {
  return {
    request: vi.fn().mockResolvedValue({}),
    requestRaw: requestRawFn ?? vi.fn().mockResolvedValue(Buffer.from([])),
  } as any;
}

describe("getSnapshot", () => {
  it("returns base64 JPEG for valid snapshot", async () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const mockRaw = vi.fn().mockResolvedValue(jpegBuffer);
    setActiveClient(createMockClient(mockRaw));

    const result = await getSnapshot({ channel: 0, maxWidth: 0 });

    expect(result.mimeType).toBe("image/jpeg");
    expect(result.base64).toBe(jpegBuffer.toString("base64"));
  });

  it("throws on NG error response", async () => {
    const ngBuffer = Buffer.from("NG:InvalidParameter");
    const mockRaw = vi.fn().mockResolvedValue(ngBuffer);
    setActiveClient(createMockClient(mockRaw));

    await expect(getSnapshot({ channel: 0, maxWidth: 0 })).rejects.toThrow("Camera returned error");
  });

  it("throws on non-JPEG response", async () => {
    const htmlBuffer = Buffer.from("<html>error</html>");
    const mockRaw = vi.fn().mockResolvedValue(htmlBuffer);
    setActiveClient(createMockClient(mockRaw));

    await expect(getSnapshot({ channel: 0, maxWidth: 0 })).rejects.toThrow("not JPEG");
  });

  it("resizes when image exceeds maxWidth", async () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const mockRaw = vi.fn().mockResolvedValue(jpegBuffer);
    setActiveClient(createMockClient(mockRaw));

    const result = await getSnapshot({ channel: 0, maxWidth: 640 });

    expect(result.mimeType).toBe("image/jpeg");
    expect(result.base64).toBeTruthy();
  });
});
