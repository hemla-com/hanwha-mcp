# Hanwha Vision Camera MCP Server

[![npm](https://img.shields.io/npm/v/@hemla/hanwha-mcp)](https://www.npmjs.com/package/@hemla/hanwha-mcp)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)

MCP server for configuring [Hanwha Vision](https://hanwhavision.com) (Wisenet) IP cameras. Connects via SUNAPI and exposes tools for device info, live snapshots, image tuning, overlays, OSD, NTP, network, and system management.

## Install

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "hanwha-camera": {
      "command": "npx",
      "args": ["-y", "@hemla/hanwha-mcp"]
    }
  }
}
```

### VS Code / Cursor

Add to `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "hanwha-camera": {
      "command": "npx",
      "args": ["-y", "@hemla/hanwha-mcp"]
    }
  }
}
```

Restart the application after adding.

## Usage

Once installed, ask your AI assistant to connect to a camera:

> "Connect to my Hanwha camera at 192.168.1.100 with username admin and password mypass"

Then interact naturally:

> "Take a snapshot"
>
> "Set the title overlay to Building A - Lobby"
>
> "What are the current image settings?"
>
> "Configure NTP to use pool.ntp.org"

## Tools

### Connection

| Tool | Description | Parameters |
|---|---|---|
| `connect_camera` | Connect to a camera (required first) | `host` (string), `username` (string), `password` (string), `port?` (number, default 80) |

### Device & Snapshots

| Tool | Description | Parameters |
|---|---|---|
| `get_device_info` | Model, serial, firmware, video profiles | — |
| `get_snapshot` | Live JPEG snapshot (auto-resized) | `channel?` (number), `profile?` (number), `maxWidth?` (number, default 1280) |

### Image Settings

| Tool | Description | Parameters |
|---|---|---|
| `get_image_settings` | Brightness, sharpness, white balance, exposure, SSDR, flip, IR | `channel?` (number) |
| `set_image_settings` | Adjust brightness, sharpness, gamma, saturation | `channel?` (number), `brightness?` (0-100), `sharpness?`, `gamma?`, `saturation?` (0-100) |
| `set_flip` | Image flip and rotation | `channel?` (number), `horizontalFlip?` (bool), `verticalFlip?` (bool), `rotate?` (Off/90/180/270) |
| `set_ir_led` | IR LED mode | `channel?` (number), `mode` (Auto/Off/On) |
| `set_focus` | Focus mode | `channel?` (number), `mode` (SimpleAutoFocus/ManualFocus) |

### Overlays & OSD

| Tool | Description | Parameters |
|---|---|---|
| `get_overlay` | Title and time overlay settings | `channel?` (number) |
| `set_overlay` | Configure title text, time format, font | `channel?`, `titleEnable?` (bool), `title?` (string), `titlePositionX?` (0-9), `titlePositionY?` (0-9), `timeEnable?` (bool), `timeFormat?`, `weekdayEnable?` (bool), `fontSize?` (Small/Medium/Large) |
| `get_osd_list` | List multiline OSD entries | `channel?` (number) |
| `set_osd` | Add/update OSD entry | `channel?`, `index` (1-8), `enable?` (bool), `osdType?` (Text/Date/Time), `text?`, `positionX?` (0-9), `positionY?` (0-9), `fontSize?`, `osdColor?`, `transparency?` |
| `remove_osd` | Delete an OSD entry | `channel?` (number), `index` (number) |

### Date, Time & NTP

| Tool | Description | Parameters |
|---|---|---|
| `get_datetime` | Time, timezone, DST, NTP config | — |
| `set_ntp` | Configure NTP servers | `servers` (comma-separated, e.g. "pool.ntp.org,time.nist.gov") |
| `set_datetime` | Set time manually (disables NTP) | `year`, `month` (1-12), `day` (1-31), `hour` (0-23), `minute` (0-59), `second?` (0-59) |

### Network & System

| Tool | Description | Parameters |
|---|---|---|
| `get_network_info` | MAC, link status, DNS | — |
| `get_logs` | System, access, or event logs | `type` (system/access/event) |
| `reboot_camera` | Reboot the camera | — |

All read-only tools are annotated for automatic approval. Write tools are marked as non-destructive and idempotent. Only `reboot_camera` and `remove_osd` require confirmation.

## Compatibility

Works with Hanwha Vision cameras that expose SUNAPI (`/stw-cgi/`) endpoints, including Wisenet X, P, Q, A, and L series.

## Development

```bash
git clone https://github.com/hemla-com/hanwha-mcp.git
cd hanwha-mcp
npm install
npm run dev
```

## License

Copyright (c) 2026 [Hemla](https://hemla.com). Licensed under [GPL-3.0](LICENSE).

Derivative works must use the same license and acknowledge Hemla as the original author.
