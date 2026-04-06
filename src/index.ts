#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { connectCamera } from "./tools/connect.js";
import { getDeviceInfo } from "./tools/device-info.js";
import { getSnapshot } from "./tools/snapshot.js";
import { getImageSettings, setImageSettings, setFlip, setIrLed } from "./tools/image-settings.js";
import { getOverlay, setOverlay, getOsdList, setOsd, removeOsd } from "./tools/overlay.js";
import { getDateTime, setNtp, setDateTime } from "./tools/datetime.js";
import { getNetworkInfo } from "./tools/network.js";
import { rebootCamera, getLogs, setFocus } from "./tools/system.js";
import { getVideoProfiles, setVideoProfile, addVideoProfile, removeVideoProfile } from "./tools/video-profile.js";
import { getWhiteBalance, setWhiteBalance } from "./tools/white-balance.js";
import { getSsdr, setSsdr } from "./tools/ssdr.js";
import { getPrivacyMask, setPrivacyMask } from "./tools/privacy-mask.js";
import { getTamperingDetection, setTamperingDetection, getDefocusDetection, setDefocusDetection } from "./tools/event-detection.js";
import { getEventRules, setEventRule } from "./tools/event-rules.js";
import { getUsers, createUser, updateUser, removeUser } from "./tools/users.js";
import { getStorageConfig, setStorageConfig } from "./tools/storage.js";
import { getNetworkConfig, setNetworkConfig } from "./tools/network-config.js";

const server = new McpServer({
  name: "hanwha-camera",
  version: "0.3.0",
});

function toolError(err: unknown) {
  return {
    content: [{ type: "text" as const, text: `Error: ${(err as Error).message}` }],
    isError: true as const,
  };
}

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true } as const;
const SAFE_WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true } as const;
const DESTRUCTIVE = { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true } as const;

// ── Connection ──────────────────────────────────────────────────

server.registerTool("connect_camera", {
  description: "Connect to a Hanwha Vision IP camera via SUNAPI. Must be called before other tools.",
  inputSchema: {
    host: z.string().describe("Camera IP address or hostname"),
    username: z.string().describe("Camera username"),
    password: z.string().describe("Camera password"),
    port: z.number().optional().default(80).describe("HTTP port (default 80)"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try {
    const result = await connectCamera(args);
    return { content: [{ type: "text", text: result }] };
  } catch (err) { return toolError(err); }
});

// ── Device Info ─────────────────────────────────────────────────

server.registerTool("get_device_info", {
  description: "Get device info and video profiles from the connected camera.",
  annotations: READ_ONLY,
}, async () => {
  try {
    const result = await getDeviceInfo();
    return { content: [{ type: "text", text: result }] };
  } catch (err) { return toolError(err); }
});

// ── Snapshot ────────────────────────────────────────────────────

server.registerTool("get_snapshot", {
  description: "Capture a live JPEG snapshot from the connected camera.",
  inputSchema: {
    channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
    profile: z.number().optional().describe("Video profile number"),
    maxWidth: z.number().optional().default(1280).describe("Max image width in pixels (default 1280). Set to 0 for original size."),
  },
  annotations: READ_ONLY,
}, async (args) => {
  try {
    const { base64, mimeType } = await getSnapshot(args);
    return {
      content: [
        { type: "image" as const, data: base64, mimeType },
        { type: "text", text: "Snapshot captured." },
      ],
    };
  } catch (err) { return toolError(err); }
});

// ── Image Settings ──────────────────────────────────────────────

server.registerTool("get_image_settings", {
  description: "Get all image settings: brightness, sharpness, white balance, exposure, SSDR, flip, IR LED.",
  inputSchema: {
    channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  },
  annotations: READ_ONLY,
}, async (args) => {
  try {
    const result = await getImageSettings(args);
    return { content: [{ type: "text", text: result }] };
  } catch (err) { return toolError(err); }
});

server.registerTool("set_image_settings", {
  description: "Adjust image enhancements: brightness, sharpness, gamma, saturation.",
  inputSchema: {
    channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
    brightness: z.number().min(0).max(100).optional().describe("Brightness (0-100)"),
    sharpness: z.number().optional().describe("Sharpness level"),
    gamma: z.number().optional().describe("Gamma level"),
    saturation: z.number().min(0).max(100).optional().describe("Color saturation (0-100)"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try {
    const result = await setImageSettings(args);
    return { content: [{ type: "text", text: result }] };
  } catch (err) { return toolError(err); }
});

server.registerTool("set_flip", {
  description: "Set image flip and rotation.",
  inputSchema: {
    channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
    horizontalFlip: z.boolean().optional().describe("Enable horizontal flip"),
    verticalFlip: z.boolean().optional().describe("Enable vertical flip"),
    rotate: z.string().optional().describe("Rotation: Off, 90, 180, 270"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try {
    const result = await setFlip(args);
    return { content: [{ type: "text", text: result }] };
  } catch (err) { return toolError(err); }
});

server.registerTool("set_ir_led", {
  description: "Set IR LED mode.",
  inputSchema: {
    channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
    mode: z.string().describe("IR LED mode: Auto, Off, On"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try {
    const result = await setIrLed(args);
    return { content: [{ type: "text", text: result }] };
  } catch (err) { return toolError(err); }
});

// ── Overlay & OSD ───────────────────────────────────────────────

server.registerTool("get_overlay", {
  description: "Get overlay settings (title, time, font).",
  inputSchema: {
    channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  },
  annotations: READ_ONLY,
}, async (args) => {
  try {
    const result = await getOverlay(args);
    return { content: [{ type: "text", text: result }] };
  } catch (err) { return toolError(err); }
});

server.registerTool("set_overlay", {
  description: "Configure overlay: title text, time display, font size.",
  inputSchema: {
    channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
    titleEnable: z.boolean().optional().describe("Show title overlay"),
    title: z.string().optional().describe("Title text to display"),
    titlePositionX: z.number().optional().describe("Title X position (0-9)"),
    titlePositionY: z.number().optional().describe("Title Y position (0-9)"),
    timeEnable: z.boolean().optional().describe("Show time overlay"),
    timeFormat: z.string().optional().describe("Time format: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY"),
    weekdayEnable: z.boolean().optional().describe("Show weekday in overlay"),
    fontSize: z.string().optional().describe("Font size: Small, Medium, Large"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try {
    const result = await setOverlay(args);
    return { content: [{ type: "text", text: result }] };
  } catch (err) { return toolError(err); }
});

server.registerTool("get_osd_list", {
  description: "List all multiline OSD entries on the camera.",
  inputSchema: {
    channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
  },
  annotations: READ_ONLY,
}, async (args) => {
  try {
    const result = await getOsdList(args);
    return { content: [{ type: "text", text: result }] };
  } catch (err) { return toolError(err); }
});

server.registerTool("set_osd", {
  description: "Add or update a multiline OSD entry.",
  inputSchema: {
    channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
    index: z.number().describe("OSD index (1-8)"),
    enable: z.boolean().optional().describe("Enable this OSD entry"),
    osdType: z.string().optional().describe("OSD type: Text, Date, Time"),
    text: z.string().optional().describe("OSD text content (when type is Text)"),
    positionX: z.number().optional().describe("X position (0-9)"),
    positionY: z.number().optional().describe("Y position (0-9)"),
    fontSize: z.string().optional().describe("Font size: Small, Medium, Large"),
    osdColor: z.string().optional().describe("Color: White, Red, Blue, Green, Yellow, Cyan, Magenta, Black"),
    transparency: z.string().optional().describe("Transparency: Off, Low, Medium, High"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try {
    const result = await setOsd(args);
    return { content: [{ type: "text", text: result }] };
  } catch (err) { return toolError(err); }
});

server.registerTool("remove_osd", {
  description: "Remove a multiline OSD entry.",
  inputSchema: {
    channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
    index: z.number().describe("OSD index to remove"),
  },
  annotations: DESTRUCTIVE,
}, async (args) => {
  try {
    const result = await removeOsd(args);
    return { content: [{ type: "text", text: result }] };
  } catch (err) { return toolError(err); }
});

// ── Date & Time / NTP ───────────────────────────────────────────

server.registerTool("get_datetime", {
  description: "Get current date/time, timezone, DST, and NTP configuration.",
  annotations: READ_ONLY,
}, async () => {
  try {
    const result = await getDateTime();
    return { content: [{ type: "text", text: result }] };
  } catch (err) { return toolError(err); }
});

server.registerTool("set_ntp", {
  description: "Configure NTP time synchronization.",
  inputSchema: {
    servers: z.string().describe("Comma-separated NTP server list (e.g. pool.ntp.org,time.nist.gov)"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try {
    const result = await setNtp(args);
    return { content: [{ type: "text", text: result }] };
  } catch (err) { return toolError(err); }
});

server.registerTool("set_datetime", {
  description: "Manually set camera date and time (disables NTP).",
  inputSchema: {
    year: z.number().describe("Year"),
    month: z.number().min(1).max(12).describe("Month (1-12)"),
    day: z.number().min(1).max(31).describe("Day (1-31)"),
    hour: z.number().min(0).max(23).describe("Hour (0-23)"),
    minute: z.number().min(0).max(59).describe("Minute (0-59)"),
    second: z.number().min(0).max(59).optional().default(0).describe("Second (0-59)"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try {
    const result = await setDateTime(args);
    return { content: [{ type: "text", text: result }] };
  } catch (err) { return toolError(err); }
});

// ── Network ─────────────────────────────────────────────────────

server.registerTool("get_network_info", {
  description: "Get network configuration: IP, MAC, DNS.",
  annotations: READ_ONLY,
}, async () => {
  try {
    const result = await getNetworkInfo();
    return { content: [{ type: "text", text: result }] };
  } catch (err) { return toolError(err); }
});

// ── System ──────────────────────────────────────────────────────

server.registerTool("reboot_camera", {
  description: "Reboot the connected camera.",
  annotations: DESTRUCTIVE,
}, async () => {
  try {
    const result = await rebootCamera();
    return { content: [{ type: "text", text: result }] };
  } catch (err) { return toolError(err); }
});

server.registerTool("get_logs", {
  description: "Retrieve camera logs.",
  inputSchema: {
    type: z.enum(["system", "access", "event"]).describe("Log type: system, access, or event"),
  },
  annotations: READ_ONLY,
}, async (args) => {
  try {
    const result = await getLogs(args);
    return { content: [{ type: "text", text: result }] };
  } catch (err) { return toolError(err); }
});

server.registerTool("set_focus", {
  description: "Set camera focus mode.",
  inputSchema: {
    channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
    mode: z.string().describe("Focus mode: SimpleAutoFocus, ManualFocus"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try {
    const result = await setFocus(args);
    return { content: [{ type: "text", text: result }] };
  } catch (err) { return toolError(err); }
});

// ── Video Profiles ──────────────────────────────────────────────

server.registerTool("get_video_profiles", {
  description: "Get all video profiles with encoding, resolution, FPS, bitrate, and codec settings.",
  inputSchema: { channel: z.number().optional().default(0).describe("Camera channel (default 0)") },
  annotations: READ_ONLY,
}, async (args) => {
  try { return { content: [{ type: "text", text: await getVideoProfiles(args) }] }; }
  catch (err) { return toolError(err); }
});

server.registerTool("set_video_profile", {
  description: "Update a video profile's encoding, resolution, FPS, bitrate, or codec settings.",
  inputSchema: {
    channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
    profile: z.number().describe("Profile number to update"),
    name: z.string().optional().describe("Profile name"),
    encodingType: z.string().optional().describe("Encoding type (H264, H265, MJPEG)"),
    resolution: z.string().optional().describe("Resolution (e.g. 2560x1440)"),
    frameRate: z.number().optional().describe("Frame rate"),
    bitrate: z.number().optional().describe("Bitrate in kbps"),
    bitrateControlType: z.string().optional().describe("Bitrate control (CBR, VBR)"),
    govLength: z.number().optional().describe("GOV length"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try { return { content: [{ type: "text", text: await setVideoProfile(args) }] }; }
  catch (err) { return toolError(err); }
});

server.registerTool("add_video_profile", {
  description: "Add a new video profile.",
  inputSchema: {
    channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
    name: z.string().describe("Profile name"),
    encodingType: z.string().describe("Encoding type (H264, H265, MJPEG)"),
    resolution: z.string().describe("Resolution (e.g. 1920x1080)"),
    frameRate: z.number().describe("Frame rate"),
    bitrate: z.number().describe("Bitrate in kbps"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try { return { content: [{ type: "text", text: await addVideoProfile(args) }] }; }
  catch (err) { return toolError(err); }
});

server.registerTool("remove_video_profile", {
  description: "Remove a video profile.",
  inputSchema: {
    channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
    profile: z.number().describe("Profile number to remove"),
  },
  annotations: DESTRUCTIVE,
}, async (args) => {
  try { return { content: [{ type: "text", text: await removeVideoProfile(args) }] }; }
  catch (err) { return toolError(err); }
});

// ── White Balance ───────────────────────────────────────────────

server.registerTool("get_white_balance", {
  description: "Get white balance mode and manual red/blue levels.",
  inputSchema: { channel: z.number().optional().default(0).describe("Camera channel (default 0)") },
  annotations: READ_ONLY,
}, async (args) => {
  try { return { content: [{ type: "text", text: await getWhiteBalance(args) }] }; }
  catch (err) { return toolError(err); }
});

server.registerTool("set_white_balance", {
  description: "Set white balance mode and optional manual red/blue levels.",
  inputSchema: {
    channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
    mode: z.string().describe("White balance mode (ATW, Indoor, Outdoor, Manual)"),
    manualRedLevel: z.number().optional().describe("Manual red level (0-2048)"),
    manualBlueLevel: z.number().optional().describe("Manual blue level (0-2048)"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try { return { content: [{ type: "text", text: await setWhiteBalance(args) }] }; }
  catch (err) { return toolError(err); }
});

// ── SSDR ────────────────────────────────────────────────────────

server.registerTool("get_ssdr", {
  description: "Get SSDR (Samsung Super Dynamic Range) settings.",
  inputSchema: { channel: z.number().optional().default(0).describe("Camera channel (default 0)") },
  annotations: READ_ONLY,
}, async (args) => {
  try { return { content: [{ type: "text", text: await getSsdr(args) }] }; }
  catch (err) { return toolError(err); }
});

server.registerTool("set_ssdr", {
  description: "Configure SSDR enable/disable, level, and dynamic range.",
  inputSchema: {
    channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
    enable: z.boolean().optional().describe("Enable/disable SSDR"),
    level: z.number().optional().describe("SSDR level"),
    dynamicRange: z.string().optional().describe("Dynamic range (Narrow, Wide)"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try { return { content: [{ type: "text", text: await setSsdr(args) }] }; }
  catch (err) { return toolError(err); }
});

// ── Privacy Mask ────────────────────────────────────────────────

server.registerTool("get_privacy_mask", {
  description: "Get privacy mask status and color.",
  inputSchema: { channel: z.number().optional().default(0).describe("Camera channel (default 0)") },
  annotations: READ_ONLY,
}, async (args) => {
  try { return { content: [{ type: "text", text: await getPrivacyMask(args) }] }; }
  catch (err) { return toolError(err); }
});

server.registerTool("set_privacy_mask", {
  description: "Enable/disable privacy mask and set color.",
  inputSchema: {
    channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
    enable: z.boolean().optional().describe("Enable/disable privacy mask"),
    maskColor: z.string().optional().describe("Mask color (Gray, White, Black, Red, Blue, Green)"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try { return { content: [{ type: "text", text: await setPrivacyMask(args) }] }; }
  catch (err) { return toolError(err); }
});

// ── Event Detection ─────────────────────────────────────────────

server.registerTool("get_tampering_detection", {
  description: "Get tampering detection settings.",
  inputSchema: { channel: z.number().optional().default(0).describe("Camera channel (default 0)") },
  annotations: READ_ONLY,
}, async (args) => {
  try { return { content: [{ type: "text", text: await getTamperingDetection(args) }] }; }
  catch (err) { return toolError(err); }
});

server.registerTool("set_tampering_detection", {
  description: "Configure tampering detection enable, sensitivity, threshold, duration.",
  inputSchema: {
    channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
    enable: z.boolean().optional().describe("Enable/disable tampering detection"),
    sensitivityLevel: z.number().optional().describe("Sensitivity level (0-100)"),
    thresholdLevel: z.number().optional().describe("Threshold level (0-100)"),
    duration: z.number().optional().describe("Duration in seconds"),
    darknessDetection: z.boolean().optional().describe("Enable darkness detection"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try { return { content: [{ type: "text", text: await setTamperingDetection(args) }] }; }
  catch (err) { return toolError(err); }
});

server.registerTool("get_defocus_detection", {
  description: "Get defocus detection settings.",
  inputSchema: { channel: z.number().optional().default(0).describe("Camera channel (default 0)") },
  annotations: READ_ONLY,
}, async (args) => {
  try { return { content: [{ type: "text", text: await getDefocusDetection(args) }] }; }
  catch (err) { return toolError(err); }
});

server.registerTool("set_defocus_detection", {
  description: "Configure defocus detection enable, sensitivity, threshold, duration.",
  inputSchema: {
    channel: z.number().optional().default(0).describe("Camera channel (default 0)"),
    enable: z.boolean().optional().describe("Enable/disable defocus detection"),
    sensitivity: z.number().optional().describe("Sensitivity level (0-100)"),
    thresholdLevel: z.number().optional().describe("Threshold level (0-100)"),
    duration: z.number().optional().describe("Duration in seconds"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try { return { content: [{ type: "text", text: await setDefocusDetection(args) }] }; }
  catch (err) { return toolError(err); }
});

// ── Event Rules ─────────────────────────────────────────────────

server.registerTool("get_event_rules", {
  description: "List all event rules with name, source, enabled status, and schedule.",
  annotations: READ_ONLY,
}, async () => {
  try { return { content: [{ type: "text", text: await getEventRules() }] }; }
  catch (err) { return toolError(err); }
});

server.registerTool("set_event_rule", {
  description: "Enable or disable an event rule.",
  inputSchema: {
    ruleIndex: z.number().describe("Rule index number"),
    enable: z.boolean().optional().describe("Enable/disable the rule"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try { return { content: [{ type: "text", text: await setEventRule(args) }] }; }
  catch (err) { return toolError(err); }
});

// ── Users / Security ────────────────────────────────────────────

server.registerTool("get_users", {
  description: "List camera users with admin and enabled status.",
  annotations: READ_ONLY,
}, async () => {
  try { return { content: [{ type: "text", text: await getUsers() }] }; }
  catch (err) { return toolError(err); }
});

server.registerTool("create_user", {
  description: "Create a new user account on the camera.",
  inputSchema: {
    username: z.string().describe("Username for the new account"),
    password: z.string().describe("Password for the new account"),
    role: z.enum(["admin", "user", "viewer"]).optional().default("viewer").describe("User role (admin, user, viewer)"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try { return { content: [{ type: "text", text: await createUser(args) }] }; }
  catch (err) { return toolError(err); }
});

server.registerTool("update_user", {
  description: "Update an existing user's password or role.",
  inputSchema: {
    username: z.string().describe("Username to update"),
    password: z.string().optional().describe("New password"),
    role: z.enum(["admin", "user", "viewer"]).optional().describe("New role"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try { return { content: [{ type: "text", text: await updateUser(args) }] }; }
  catch (err) { return toolError(err); }
});

server.registerTool("remove_user", {
  description: "Remove a user account from the camera.",
  inputSchema: {
    username: z.string().describe("Username to remove"),
  },
  annotations: DESTRUCTIVE,
}, async (args) => {
  try { return { content: [{ type: "text", text: await removeUser(args) }] }; }
  catch (err) { return toolError(err); }
});

// ── Storage / Recording ─────────────────────────────────────────

server.registerTool("get_storage_config", {
  description: "Get storage/recording configuration (enable, overwrite, auto-delete).",
  annotations: READ_ONLY,
}, async () => {
  try { return { content: [{ type: "text", text: await getStorageConfig() }] }; }
  catch (err) { return toolError(err); }
});

server.registerTool("set_storage_config", {
  description: "Configure storage settings: enable, overwrite, auto-delete.",
  inputSchema: {
    enable: z.boolean().optional().describe("Enable/disable storage"),
    overwrite: z.boolean().optional().describe("Enable overwrite when full"),
    autoDeleteEnable: z.boolean().optional().describe("Enable auto delete"),
    autoDeleteDays: z.number().optional().describe("Auto delete after N days"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try { return { content: [{ type: "text", text: await setStorageConfig(args) }] }; }
  catch (err) { return toolError(err); }
});

// ── Network Config ──────────────────────────────────────────────

server.registerTool("get_network_config", {
  description: "Get comprehensive network config: IP, gateway, hostname, ports.",
  annotations: READ_ONLY,
}, async () => {
  try { return { content: [{ type: "text", text: await getNetworkConfig() }] }; }
  catch (err) { return toolError(err); }
});

server.registerTool("set_network_config", {
  description: "Update network interface: IPv4 type, address, subnet, gateway, hostname.",
  inputSchema: {
    ipv4Type: z.string().optional().describe("IPv4 type (DHCP, Static)"),
    ipv4Address: z.string().optional().describe("IPv4 address"),
    ipv4SubnetMask: z.string().optional().describe("Subnet mask"),
    ipv4Gateway: z.string().optional().describe("Default gateway"),
    hostname: z.string().optional().describe("Hostname"),
  },
  annotations: SAFE_WRITE,
}, async (args) => {
  try { return { content: [{ type: "text", text: await setNetworkConfig(args) }] }; }
  catch (err) { return toolError(err); }
});

// ── Start ───────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Hanwha MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
