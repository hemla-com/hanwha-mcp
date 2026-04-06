import { vi, describe, it, expect } from "vitest";
import { setActiveClient } from "../tools/connect.js";
import {
  getVideoProfiles,
  setVideoProfile,
  addVideoProfile,
  removeVideoProfile,
} from "../tools/video-profile.js";

function createMockClient(requestFn?: Function) {
  return {
    request: requestFn ?? vi.fn().mockResolvedValue({}),
    requestRaw: vi.fn().mockResolvedValue(Buffer.from([])),
  } as any;
}

describe("getVideoProfiles", () => {
  it("returns formatted video profiles", async () => {
    const mockRequest = vi.fn().mockResolvedValue({
      "Channel.0.Profile.1.Name": "MJPEG",
      "Channel.0.Profile.1.EncodingType": "MJPEG",
      "Channel.0.Profile.1.Resolution": "2560x1440",
      "Channel.0.Profile.1.FrameRate": "1",
      "Channel.0.Profile.1.Bitrate": "4096",
    });

    setActiveClient(createMockClient(mockRequest));
    const result = await getVideoProfiles({ channel: 0 });

    expect(result).toContain("MJPEG");
    expect(result).toContain("2560x1440");
    expect(result).toContain("4096");
    expect(result).toContain("1");
  });

  it("returns no profiles message when empty", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));
    const result = await getVideoProfiles({ channel: 0 });
    expect(result).toContain("No video profiles found");
  });
});

describe("setVideoProfile", () => {
  it("calls request with correct params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    const result = await setVideoProfile({
      channel: 0,
      profile: 1,
      name: "Main",
      resolution: "1920x1080",
      frameRate: 30,
    });

    expect(mockRequest).toHaveBeenCalledWith("media.cgi", "videoprofile", "update", {
      "Channel.0.Profile.1.Name": "Main",
      "Channel.0.Profile.1.Resolution": "1920x1080",
      "Channel.0.Profile.1.FrameRate": "30",
    });
    expect(result).toContain("Video profile 1 updated");
  });

  it("looks up codec for bitrateControlType", async () => {
    const mockRequest = vi
      .fn()
      .mockResolvedValueOnce({ "Channel.0.Profile.2.EncodingType": "H265" })
      .mockResolvedValueOnce({});

    setActiveClient(createMockClient(mockRequest));

    const result = await setVideoProfile({
      channel: 0,
      profile: 2,
      bitrateControlType: "VBR",
    });

    expect(mockRequest).toHaveBeenCalledWith("media.cgi", "videoprofile", "update", {
      "Channel.0.Profile.2.H265.BitrateControlType": "VBR",
    });
    expect(result).toContain("Video profile 2 updated");
  });
});

describe("addVideoProfile", () => {
  it("calls request with correct params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    const result = await addVideoProfile({
      channel: 0,
      name: "NewProfile",
      encodingType: "H264",
      resolution: "1920x1080",
      frameRate: 15,
      bitrate: 2048,
    });

    expect(mockRequest).toHaveBeenCalledWith("media.cgi", "videoprofile", "add", {
      Channel: "0",
      Name: "NewProfile",
      EncodingType: "H264",
      Resolution: "1920x1080",
      FrameRate: "15",
      Bitrate: "2048",
    });
    expect(result).toContain("NewProfile");
    expect(result).toContain("added");
  });
});

describe("removeVideoProfile", () => {
  it("calls request with correct params", async () => {
    const mockRequest = vi.fn().mockResolvedValue({});
    setActiveClient(createMockClient(mockRequest));

    const result = await removeVideoProfile({ channel: 0, profile: 3 });

    expect(mockRequest).toHaveBeenCalledWith("media.cgi", "videoprofile", "remove", {
      Channel: "0",
      Profile: "3",
    });
    expect(result).toContain("profile 3 removed");
  });
});
