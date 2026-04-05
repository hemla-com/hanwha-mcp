# Hanwha Vision Camera MCP Server

Node.js server implementing [Model Context Protocol (MCP)](https://modelcontextprotocol.io) for Hanwha Vision (Wisenet) IP camera configuration via SUNAPI.

## Features

- Connect to any Hanwha Vision IP camera via HTTP Digest authentication
- Read device info, video profiles, and network configuration
- Capture live JPEG snapshots (auto-resized for LLM context windows)
- Configure image settings: brightness, sharpness, gamma, saturation
- Manage overlays: title text, timestamps, multiline OSD entries
- Set date/time and NTP synchronization
- Control flip/rotation, IR LED mode, and focus
- View system, access, and event logs
- Reboot cameras remotely

## Prerequisites

- Node.js 18+
- A Hanwha Vision (Wisenet) IP camera accessible on the network
- Camera admin credentials

## API

### Tools

#### Connection

- **connect_camera**
  - Connect to a camera. Must be called before any other tool.
  - Inputs: `host` (string), `username` (string), `password` (string), `port` (number, default 80)

#### Device Info

- **get_device_info**
  - Get model, serial, firmware, MAC address, and all video profiles with resolution/codec/FPS/bitrate.

- **get_snapshot**
  - Capture a live JPEG snapshot.
  - Inputs: `channel` (number, default 0), `profile` (number), `maxWidth` (number, default 1280; 0 for original)
  - Returns base64 JPEG image via MCP image content type.

#### Image Settings

- **get_image_settings**
  - Read all image settings: brightness, sharpness, white balance, exposure, SSDR, flip, IR LED.
  - Inputs: `channel` (number, default 0)

- **set_image_settings**
  - Adjust image enhancements.
  - Inputs: `channel`, `brightness` (0-100), `sharpness`, `gamma`, `saturation` (0-100) — all optional

- **set_flip**
  - Set image orientation.
  - Inputs: `channel`, `horizontalFlip` (boolean), `verticalFlip` (boolean), `rotate` (Off/90/180/270)

- **set_ir_led**
  - Set IR LED mode.
  - Inputs: `channel`, `mode` (Auto/Off/On)

- **set_focus**
  - Set camera focus mode.
  - Inputs: `channel`, `mode` (SimpleAutoFocus/ManualFocus)

#### Overlays & OSD

- **get_overlay**
  - Get overlay settings (title, time, font).
  - Inputs: `channel`

- **set_overlay**
  - Configure title text, time display, weekday, font size.
  - Inputs: `channel`, `titleEnable`, `title`, `titlePositionX`, `titlePositionY`, `timeEnable`, `timeFormat`, `weekdayEnable`, `fontSize`

- **get_osd_list**
  - List all multiline OSD entries.
  - Inputs: `channel`

- **set_osd**
  - Add or update a multiline OSD entry.
  - Inputs: `channel`, `index` (1-8), `enable`, `osdType` (Text/Date/Time), `text`, `positionX`, `positionY`, `fontSize`, `osdColor`, `transparency`

- **remove_osd**
  - Remove a multiline OSD entry.
  - Inputs: `channel`, `index`

#### Date & Time

- **get_datetime**
  - Get current time, timezone, DST, and NTP configuration.

- **set_ntp**
  - Configure NTP time sync.
  - Inputs: `servers` (comma-separated list, e.g. `pool.ntp.org,time.nist.gov`)

- **set_datetime**
  - Manually set date/time (disables NTP).
  - Inputs: `year`, `month`, `day`, `hour`, `minute`, `second`

#### Network

- **get_network_info**
  - Get MAC address, link status, interface type, broadcast address, DNS settings.

#### System

- **reboot_camera**
  - Reboot the connected camera.

- **get_logs**
  - Retrieve camera logs.
  - Inputs: `type` (system/access/event)

### Tool Annotations

This server sets [MCP ToolAnnotations](https://modelcontextprotocol.io/specification/2025-03-26/server/tools#toolannotations) on each tool so clients can auto-approve safe operations.

| Tool | readOnlyHint | idempotentHint | destructiveHint |
|----------------------|--------------|----------------|-----------------|
| `connect_camera` | `false` | `true` | `false` |
| `get_device_info` | `true` | `true` | `false` |
| `get_snapshot` | `true` | `true` | `false` |
| `get_image_settings` | `true` | `true` | `false` |
| `set_image_settings` | `false` | `true` | `false` |
| `set_flip` | `false` | `true` | `false` |
| `set_ir_led` | `false` | `true` | `false` |
| `set_focus` | `false` | `true` | `false` |
| `get_overlay` | `true` | `true` | `false` |
| `set_overlay` | `false` | `true` | `false` |
| `get_osd_list` | `true` | `true` | `false` |
| `set_osd` | `false` | `true` | `false` |
| `remove_osd` | `false` | `false` | `true` |
| `get_datetime` | `true` | `true` | `false` |
| `set_ntp` | `false` | `true` | `false` |
| `set_datetime` | `false` | `true` | `false` |
| `get_network_info` | `true` | `true` | `false` |
| `reboot_camera` | `false` | `false` | `true` |
| `get_logs` | `true` | `true` | `false` |

## Usage with Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

### NPX

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

### Local development

```json
{
  "mcpServers": {
    "hanwha-camera": {
      "command": "node",
      "args": ["/path/to/hanwha-mcp/node_modules/.bin/tsx", "/path/to/hanwha-mcp/src/index.ts"]
    }
  }
}
```

> **Note:** If using nvm, use the full path to `node` (e.g. `~/.nvm/versions/node/v22.x.x/bin/node`) to avoid Claude Desktop resolving the wrong Node version.

## Usage with VS Code / Cursor

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

## Build

```bash
npm install
npm run build
```

## Development

```bash
npm install
npm run dev
```

## Supported Cameras

Tested on Hanwha Vision Wisenet cameras using SUNAPI (HTTP CGI). Should work with any Hanwha Vision camera that exposes `/stw-cgi/` endpoints, including:

- Wisenet X series (XNV, XND, XNO, XNB, XNP)
- Wisenet P series (PNV, PND, PNO, PNB)
- Wisenet Q series (QNV, QND, QNO, QNB)
- Wisenet A series (ANV, AND, ANO)
- Wisenet L series (LNV, LND, LNO)

## How It Works

The server communicates with Hanwha cameras over HTTP using the **SUNAPI** (Surveillance Network API) protocol:

1. All requests go to `http://{host}/stw-cgi/{module}.cgi?msubmenu={submenu}&action={action}`
2. Authentication uses **HTTP Digest Auth**
3. Responses are `text/plain` with `Key=Value` pairs (parsed automatically)
4. Snapshots return raw JPEG bytes (resized via `sharp` before encoding to base64)

## License

MIT
