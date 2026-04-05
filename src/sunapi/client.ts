import DigestClient from "digest-fetch";

export interface SunapiClientOptions {
  host: string;
  username: string;
  password: string;
  port?: number;
}

export class SunapiClient {
  private client: DigestClient;
  private baseUrl: string;

  constructor(private options: SunapiClientOptions) {
    this.client = new DigestClient(options.username, options.password);
    const port = options.port ?? 80;
    this.baseUrl = `http://${options.host}:${port}/stw-cgi`;
  }

  async request(
    cgi: string,
    msubmenu: string,
    action: string,
    params?: Record<string, string>
  ): Promise<Record<string, string>> {
    const url = this.buildUrl(cgi, msubmenu, action, params);
    const res = await this.client.fetch(url);

    if (!res.ok) {
      throw new Error(`SUNAPI ${cgi}/${msubmenu}/${action} failed: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    return SunapiClient.parseKeyValue(text);
  }

  async requestRaw(
    cgi: string,
    msubmenu: string,
    action: string,
    params?: Record<string, string>
  ): Promise<Buffer> {
    const url = this.buildUrl(cgi, msubmenu, action, params);
    const res = await this.client.fetch(url);

    if (!res.ok) {
      throw new Error(`SUNAPI ${cgi}/${msubmenu}/${action} failed: ${res.status} ${res.statusText}`);
    }

    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }

  private buildUrl(
    cgi: string,
    msubmenu: string,
    action: string,
    params?: Record<string, string>
  ): string {
    const url = new URL(`${this.baseUrl}/${cgi}`);
    url.searchParams.set("msubmenu", msubmenu);
    url.searchParams.set("action", action);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }

  static parseKeyValue(text: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      result[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
    }
    return result;
  }
}
