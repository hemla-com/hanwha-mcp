# Hanwha Vision Camera MCP Server

[![npm](https://img.shields.io/npm/v/@hemla/hanwha-mcp)](https://www.npmjs.com/package/@hemla/hanwha-mcp)
[![CI](https://github.com/hemla-com/hanwha-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/hemla-com/hanwha-mcp/actions/workflows/ci.yml)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)

MCP server for configuring [Hanwha Vision](https://hanwhavision.com) (Wisenet) IP cameras. Connects via SUNAPI and exposes 30+ tools for device info, live snapshots, video profiles, image tuning, overlays, OSD, NTP, network, events, security, and storage management.

## Install

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "Hanwha": {
      "command": "npx",
      "args": ["-y", "@hemla/hanwha-mcp@0.3.1"]
    }
  }
}
```

Restart Claude Desktop after adding.

## Usage

Once installed, ask your AI assistant to connect to a camera:

> "Connect to my Hanwha camera at 192.168.1.100 with username admin and password mypass"

Then interact naturally:

> "Take a snapshot"
>
> "Show me all video profiles"
>
> "Set the title overlay to Building A - Lobby"
>
> "What are the current image settings?"
>
> "Configure NTP to use pool.ntp.org"
>
> "Enable tampering detection with 80% sensitivity"

## Tools

### Connection

| Tool | Description | Parameters |
|---|---|---|
| `connect_camera` | Connect to a camera (required first) | `host`, `username`, `password`, `port?` (default 80) |

### Device & Snapshots

| Tool | Description | Parameters |
|---|---|---|
| `get_device_info` | Model, serial, firmware, video profiles | — |
| `get_snapshot` | Live JPEG snapshot (auto-resized) | `channel?`, `profile?`, `maxWidth?` (default 1280) |

### Video Profiles

| Tool | Description | Parameters |
|---|---|---|
| `get_video_profiles` | List all profiles with encoding, resolution, FPS, bitrate | `channel?` |
| `set_video_profile` | Update profile encoding, resolution, FPS, bitrate, codec settings | `channel?`, `profile`, `name?`, `encodingType?`, `resolution?`, `frameRate?`, `bitrate?`, `bitrateControlType?`, `govLength?` |
| `add_video_profile` | Add a new video profile | `channel?`, `name`, `encodingType`, `resolution`, `frameRate`, `bitrate` |
| `remove_video_profile` | Remove a video profile | `channel?`, `profile` |

### Image Settings

| Tool | Description | Parameters |
|---|---|---|
| `get_image_settings` | Brightness, sharpness, white balance, exposure, SSDR, flip, IR | `channel?` |
| `set_image_settings` | Adjust brightness, sharpness, gamma, saturation | `channel?`, `brightness?` (0-100), `sharpness?`, `gamma?`, `saturation?` (0-100) |
| `set_flip` | Image flip and rotation | `channel?`, `horizontalFlip?`, `verticalFlip?`, `rotate?` (Off/90/180/270) |
| `set_ir_led` | IR LED mode | `channel?`, `mode` (Auto/Off/On) |
| `set_focus` | Focus mode | `channel?`, `mode` (SimpleAutoFocus/ManualFocus) |

### White Balance & SSDR

| Tool | Description | Parameters |
|---|---|---|
| `get_white_balance` | White balance mode and manual levels | `channel?` |
| `set_white_balance` | Set mode and optional manual red/blue levels | `channel?`, `mode` (ATW/Indoor/Outdoor/Manual), `manualRedLevel?`, `manualBlueLevel?` |
| `get_ssdr` | SSDR enable, level, dynamic range | `channel?` |
| `set_ssdr` | Configure SSDR | `channel?`, `enable?`, `level?`, `dynamicRange?` (Narrow/Wide) |

### Privacy Mask

| Tool | Description | Parameters |
|---|---|---|
| `get_privacy_mask` | Privacy mask status and color | `channel?` |
| `set_privacy_mask` | Enable/disable and set color | `channel?`, `enable?`, `maskColor?` (Gray/White/Black/Red/Blue/Green) |

### Overlays & OSD

| Tool | Description | Parameters |
|---|---|---|
| `get_overlay` | Title and time overlay settings | `channel?` |
| `set_overlay` | Configure title text, time format, font | `channel?`, `titleEnable?`, `title?`, `titlePositionX?`, `titlePositionY?`, `timeEnable?`, `timeFormat?`, `weekdayEnable?`, `fontSize?` |
| `get_osd_list` | List multiline OSD entries | `channel?` |
| `set_osd` | Add/update OSD entry | `channel?`, `index` (1-8), `enable?`, `osdType?`, `text?`, `positionX?`, `positionY?`, `fontSize?`, `osdColor?`, `transparency?` |
| `remove_osd` | Delete an OSD entry | `channel?`, `index` |

### Date, Time & NTP

| Tool | Description | Parameters |
|---|---|---|
| `get_datetime` | Time, timezone, DST, NTP config | — |
| `set_ntp` | Configure NTP servers | `servers` (comma-separated) |
| `set_datetime` | Set time manually (disables NTP) | `year`, `month`, `day`, `hour`, `minute`, `second?` |

### Event Detection

| Tool | Description | Parameters |
|---|---|---|
| `get_tampering_detection` | Tampering detection settings | `channel?` |
| `set_tampering_detection` | Configure tampering detection | `channel?`, `enable?`, `sensitivityLevel?`, `thresholdLevel?`, `duration?`, `darknessDetection?` |
| `get_defocus_detection` | Defocus detection settings | `channel?` |
| `set_defocus_detection` | Configure defocus detection | `channel?`, `enable?`, `sensitivity?`, `thresholdLevel?`, `duration?` |

### Event Rules

| Tool | Description | Parameters |
|---|---|---|
| `get_event_rules` | List all event rules | — |
| `set_event_rule` | Enable/disable an event rule | `ruleIndex`, `enable?` |

### Network

| Tool | Description | Parameters |
|---|---|---|
| `get_network_info` | MAC, link status, DNS | — |
| `get_network_config` | Full config: IP, gateway, hostname, ports | — |
| `set_network_config` | Update interface settings | `ipv4Type?` (DHCP/Static), `ipv4Address?`, `ipv4SubnetMask?`, `ipv4Gateway?`, `hostname?` |

### Security & Users

| Tool | Description | Parameters |
|---|---|---|
| `get_users` | List camera users with admin/enabled status | — |
| `create_user` | Create a new user account (fixed slot system, max 10 users) | `username`, `password`, `enabled?` (default true) |
| `update_user` | Update a user's password or enabled status | `username`, `password?`, `enabled?` |
| `remove_user` | Remove a user account | `username` |

### Storage & Recording

| Tool | Description | Parameters |
|---|---|---|
| `get_storage_config` | Storage enable, overwrite, auto-delete | — |
| `set_storage_config` | Configure storage settings | `enable?`, `overwrite?`, `autoDeleteEnable?`, `autoDeleteDays?` |

### System

| Tool | Description | Parameters |
|---|---|---|
| `get_logs` | System, access, or event logs | `type` (system/access/event) |
| `reboot_camera` | Reboot the camera | — |

All read-only tools are annotated for automatic approval. Write tools are marked as non-destructive and idempotent. Only `reboot_camera`, `remove_osd`, `remove_video_profile`, and `remove_user` require confirmation.

## Compatibility

Works with Hanwha Vision cameras that expose SUNAPI (`/stw-cgi/`) endpoints, including Wisenet X, P, Q, A, and L series.

## Development

```bash
git clone https://github.com/hemla-com/hanwha-mcp.git
cd hanwha-mcp
npm install
npm run dev

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## License

Copyright (c) 2026 [Hemla](https://hemla.com). Licensed under [GPL-3.0](LICENSE).

Derivative works must use the same license and acknowledge Hemla as the original author.
