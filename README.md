# Hanwha Vision Camera MCP Server

MCP server for configuring [Hanwha Vision](https://hanwhavision.com) (Wisenet) IP cameras. Connects via SUNAPI and exposes 20 tools for device info, live snapshots, image tuning, overlays, OSD, NTP, network, and more.

## Install

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "hanwha-camera": {
      "command": "npx",
      "args": ["-y", "hanwha-mcp"]
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
      "args": ["-y", "hanwha-mcp"]
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

| Tool | Description |
|---|---|
| `connect_camera` | Connect to a camera (required first) |
| `get_device_info` | Model, serial, firmware, video profiles |
| `get_snapshot` | Live JPEG snapshot (auto-resized) |
| `get_image_settings` | Brightness, sharpness, white balance, exposure, SSDR, flip, IR |
| `set_image_settings` | Adjust brightness, sharpness, gamma, saturation |
| `set_flip` | Horizontal/vertical flip, rotation |
| `set_ir_led` | IR LED mode (Auto/Off/On) |
| `set_focus` | Focus mode (Auto/Manual) |
| `get_overlay` | Title and time overlay settings |
| `set_overlay` | Configure title text, time format, font |
| `get_osd_list` | List multiline OSD entries |
| `set_osd` | Add/update OSD entry (text, color, position) |
| `remove_osd` | Delete an OSD entry |
| `get_datetime` | Time, timezone, DST, NTP config |
| `set_ntp` | Configure NTP servers |
| `set_datetime` | Set time manually |
| `get_network_info` | MAC, link status, DNS |
| `get_logs` | System, access, or event logs |
| `reboot_camera` | Reboot the camera |

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
