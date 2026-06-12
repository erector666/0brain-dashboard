export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export class Ob1Client {
  constructor(
    private readonly apiBase: string,
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  async get(path: string, params: QueryParams = {}) {
    const url = new URL(this.apiBase + path);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
    return this.request(url, { method: "GET" });
  }

  async post(path: string, body: unknown) {
    return this.request(new URL(this.apiBase + path), {
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  async patch(path: string, body: unknown) {
    return this.request(new URL(this.apiBase + path), {
      method: "PATCH",
      body: JSON.stringify(body)
    });
  }

  private async request(url: URL, init: RequestInit) {
    const response = await this.fetchImpl(url, {
      ...init,
      headers: {
        "content-type": "application/json",
        "x-brain-key": this.apiKey
      }
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
      return { error: data.error || data.error_body || response.statusText, status: response.status, details: data };
    }
    return data;
  }
}
