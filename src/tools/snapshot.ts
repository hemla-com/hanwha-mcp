import { z } from "zod";
import sharp from "sharp";
import { getActiveClient } from "./connect.js";

const DEFAULT_MAX_WIDTH = 1280;

export const getSnapshotSchema = z.object({
  channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  profile: z.number().optional().describe("Video profile number"),
  maxWidth: z.number().optional().default(DEFAULT_MAX_WIDTH).describe("Max image width in pixels (default 1280). Set to 0 for original size."),
});

export type GetSnapshotInput = z.infer<typeof getSnapshotSchema>;

export async function getSnapshot(input: GetSnapshotInput): Promise<{
  base64: string;
  mimeType: string;
}> {
  const client = getActiveClient();

  const params: Record<string, string> = {
    Channel: String(input.channel),
  };
  if (input.profile !== undefined) {
    params["Profile"] = String(input.profile);
  }

  const buffer = await client.requestRaw("video.cgi", "snapshot", "view", params);

  const text = buffer.toString("utf-8").trim();
  if (text.startsWith("NG")) {
    throw new Error(`Camera returned error: ${text}`);
  }

  const jpegMagic = buffer[0] === 0xff && buffer[1] === 0xd8;
  if (!jpegMagic) {
    throw new Error(`Unexpected response (not JPEG): ${text.slice(0, 200)}`);
  }

  let output = buffer;
  const maxWidth = input.maxWidth ?? DEFAULT_MAX_WIDTH;

  if (maxWidth > 0) {
    const meta = await sharp(buffer).metadata();
    if (meta.width && meta.width > maxWidth) {
      output = await sharp(buffer)
        .resize({ width: maxWidth, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
    }
  }

  return {
    base64: output.toString("base64"),
    mimeType: "image/jpeg",
  };
}
