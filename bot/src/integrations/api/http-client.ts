import { botConfig } from '../../config';

const defaultHeaders = {
  Accept: 'application/json',
  'X-Bot-Secret': botConfig.botApiSecret,
} as const;

export class BotApiError extends Error {
  public readonly statusCode?: number;
  public readonly responseBody?: string;

  constructor(message: string, statusCode?: number, responseBody?: string) {
    super(message);
    this.name = 'BotApiError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

const buildUrl = (path: string, query?: Record<string, string | undefined>): string => {
  if (!botConfig.backendApiUrl) {
    throw new BotApiError('BACKEND_API_URL is not configured');
  }

  const normalizedBaseUrl = botConfig.backendApiUrl.endsWith('/')
    ? botConfig.backendApiUrl
    : `${botConfig.backendApiUrl}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = new URL(normalizedPath, normalizedBaseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value) {
        url.searchParams.set(key, value);
      }
    }
  }

  return url.toString();
};

export const apiGet = async <T>(
  path: string,
  query?: Record<string, string | undefined>,
  headers?: HeadersInit,
): Promise<T> => {
  const response = await fetch(buildUrl(path, query), {
    method: 'GET',
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  });

  if (!response.ok) {
    const responseBody = await response.text().catch(() => undefined);
    throw new BotApiError(`API request failed for ${path}`, response.status, responseBody);
  }

  const payload = (await response.json()) as { data: T };
  return payload.data;
};

export const apiPost = async <T>(
  path: string,
  body?: unknown,
  query?: Record<string, string | undefined>,
): Promise<T> => {
  const response = await fetch(buildUrl(path, query), {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const responseBody = await response.text().catch(() => undefined);
    throw new BotApiError(`API request failed for ${path}`, response.status, responseBody);
  }

  const payload = (await response.json()) as { data: T };
  return payload.data;
};
