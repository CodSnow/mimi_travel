import type {
  CaregiverMatchRequest,
  CaregiverMatchResponse,
  DriverMatchRequest,
  DriverMatchResponse,
} from '../internal-dto/matching.js';
import type { OrderSnapshotRequest, OrderSnapshotResponse } from '../internal-dto/orders.js';
import type { PricingQuoteRequest, PricingQuoteResponse } from '../internal-dto/pricing.js';
import type {
  ProviderReviewSummaryRequest,
  ProviderReviewSummaryResponse,
} from '../internal-dto/reviews.js';
import type {
  PrepayRiskCheckRequest,
  PrepayRiskCheckResponse,
} from '../internal-dto/risk.js';

export class PythonClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export class PythonClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  async matchCaregivers(payload: CaregiverMatchRequest): Promise<CaregiverMatchResponse> {
    return this.post('/internal/matching/caregivers', payload);
  }

  async matchDrivers(payload: DriverMatchRequest): Promise<DriverMatchResponse> {
    return this.post('/internal/matching/drivers', payload);
  }

  async providerReviewSummary(
    payload: ProviderReviewSummaryRequest,
  ): Promise<ProviderReviewSummaryResponse> {
    return this.post('/internal/reviews/provider-summary', payload);
  }

  async quote(payload: PricingQuoteRequest): Promise<PricingQuoteResponse> {
    return this.post('/internal/pricing/quote', payload);
  }

  async prepayCheck(payload: PrepayRiskCheckRequest): Promise<PrepayRiskCheckResponse> {
    return this.post('/internal/risk/prepay-check', payload);
  }

  async orderSnapshot(payload: OrderSnapshotRequest): Promise<OrderSnapshotResponse> {
    return this.post('/internal/orders/snapshot', payload);
  }

  private async post<TRequest, TResponse>(path: string, payload: TRequest): Promise<TResponse> {
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': this.token,
        },
        body: JSON.stringify(toSnakeCaseKeys(payload)),
      });
    } catch (error) {
      throw new PythonClientError('Python 服务不可用', 503, error);
    }

    const raw = await response.text();
    const parsed = raw ? safeJsonParse(raw) : null;

    if (!response.ok) {
      throw new PythonClientError(
        'Python 服务调用失败',
        response.status,
        parsed ?? raw,
      );
    }

    return toCamelCaseKeys(parsed) as TResponse;
  }
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function toSnakeCaseKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toSnakeCaseKeys);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
        toSnakeCaseKeys(nestedValue),
      ]),
    );
  }
  return value;
}

function toCamelCaseKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toCamelCaseKeys);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
        toCamelCaseKeys(nestedValue),
      ]),
    );
  }
  return value;
}
