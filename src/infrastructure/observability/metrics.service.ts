import { Injectable } from '@nestjs/common';
import {
  metrics,
  type Attributes,
  type Counter,
  type Histogram,
  type Meter,
  type MetricOptions,
  type UpDownCounter,
} from '@opentelemetry/api';
import {
  serviceName,
  serviceVersion,
} from '@/infrastructure/observability/service-identity';

/**
 * Thin Nest wrapper around the OTel Meter API.
 *
 * - Pre-creates the three instruments required by every HTTP service
 *   (http_requests_total, http_errors_total, http_request_duration_ms) so
 *   the metrics interceptor can record without ceremony.
 * - Exposes `counter()` / `histogram()` / `upDownCounter()` factories so
 *   feature modules can declare custom business metrics (orders_placed,
 *   queue_depth, payment_failed, etc.) by injecting this service.
 *
 * Note: the global MeterProvider is registered by tracing.bootstrap.ts at
 * process boot (imported as the first line of main.ts). If that file is not
 * imported first, this service falls back to the no-op meter and metrics
 * silently disappear.
 */
@Injectable()
export class MetricsService {
  private readonly meter: Meter;

  readonly httpRequestsTotal: Counter;
  readonly httpErrorsTotal: Counter;
  readonly httpRequestDurationMs: Histogram;

  constructor() {
    this.meter = metrics.getMeter(serviceName, serviceVersion);

    this.httpRequestsTotal = this.meter.createCounter('http_requests_total', {
      description: 'Total number of HTTP requests',
      unit: '1',
    });

    this.httpErrorsTotal = this.meter.createCounter('http_errors_total', {
      description: 'Total number of HTTP responses with status >= 400',
      unit: '1',
    });

    this.httpRequestDurationMs = this.meter.createHistogram(
      'http_request_duration_ms',
      {
        description: 'HTTP request duration',
        unit: 'ms',
      },
    );
  }

  counter(name: string, options?: MetricOptions): Counter {
    return this.meter.createCounter(name, options);
  }

  upDownCounter(name: string, options?: MetricOptions): UpDownCounter {
    return this.meter.createUpDownCounter(name, options);
  }

  histogram(name: string, options?: MetricOptions): Histogram {
    return this.meter.createHistogram(name, options);
  }

  recordHttpRequest(attrs: Attributes, durationMs: number): void {
    this.httpRequestsTotal.add(1, attrs);
    this.httpRequestDurationMs.record(durationMs, attrs);
    const status = Number(attrs['http.response.status_code']);
    if (Number.isFinite(status) && status >= 400) {
      this.httpErrorsTotal.add(1, attrs);
    }
  }
}
