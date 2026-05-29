import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import axiosRetry, { isNetworkOrIdempotentRequestError } from 'axios-retry';
import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { firstValueFrom, Observable } from 'rxjs';

import { mapAxiosError } from './helpers/axios-error.mapper';

// Attach per-request timing metadata to the Axios config without resorting to `any`.
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: { startedAt: number };
  }
}

/**
 * Single public surface for all outbound external-API calls.
 *
 * Feature code injects this service and uses the verb helpers, which return
 * the response body directly and never leak a raw AxiosError — every failure
 * is translated into a domain {@link AppException} via {@link mapAxiosError}.
 *
 * Logging, intelligent retries (exponential backoff) and error mapping are
 * configured once on the underlying Axios instance (`httpService.axiosRef`).
 */
@Injectable()
export class HttpClientService implements OnModuleInit {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(HttpClientService.name);
  }

  onModuleInit(): void {
    this.setupRetry();
    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.unwrap(this.httpService.get<T>(url, config));
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.unwrap(this.httpService.post<T>(url, data, config));
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.unwrap(this.httpService.put<T>(url, data, config));
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.unwrap(this.httpService.patch<T>(url, data, config));
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.unwrap(this.httpService.delete<T>(url, config));
  }

  private async unwrap<T>(source: Observable<AxiosResponse<T>>): Promise<T> {
    try {
      const response = await firstValueFrom(source);
      return response.data;
    } catch (error) {
      // The response interceptor already rejects with an AppException; this is
      // a safety net for any non-Axios throw that slips through.
      throw mapAxiosError(error);
    }
  }

  private setupRetry(): void {
    const retries = this.configService.get<number>('httpRetryAttempts') ?? 0;
    const baseDelay =
      this.configService.get<number>('httpRetryBaseDelay') ?? 300;

    axiosRetry(this.httpService.axiosRef, {
      retries,
      retryDelay: (retryCount, error) =>
        axiosRetry.exponentialDelay(retryCount, error, baseDelay),
      retryCondition: (error) =>
        isNetworkOrIdempotentRequestError(error) ||
        error.response?.status === HttpStatus.TOO_MANY_REQUESTS,
      onRetry: (retryCount, error, requestConfig) => {
        this.logger.warn(
          {
            attempt: retryCount,
            method: requestConfig.method?.toUpperCase(),
            url: requestConfig.url,
            code: error.code,
            status: error.response?.status,
          },
          'Retrying outbound HTTP request',
        );
      },
    });
  }

  private setupRequestInterceptor(): void {
    this.httpService.axiosRef.interceptors.request.use((config) => {
      config.metadata = { startedAt: Date.now() };

      this.logger.debug(
        { method: config.method?.toUpperCase(), url: config.url },
        'Outbound HTTP request',
      );

      // Auth seam: attach an Authorization header here once a TokenProvider is
      // introduced. Token refresh is intentionally omitted in this base project.

      return config;
    });
  }

  private setupResponseInterceptor(): void {
    this.httpService.axiosRef.interceptors.response.use(
      (response) => {
        this.logger.info(
          {
            method: response.config.method?.toUpperCase(),
            url: response.config.url,
            status: response.status,
            durationMs: this.elapsed(response.config),
          },
          'Outbound HTTP response',
        );
        return response;
      },
      (error: unknown) => {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const meta = {
            method: error.config?.method?.toUpperCase(),
            url: error.config?.url,
            status,
            code: error.code,
            durationMs: this.elapsed(error.config),
          };

          if (!status || status >= 500) {
            this.logger.error(meta, 'Outbound HTTP request failed');
          } else {
            this.logger.warn(meta, 'Outbound HTTP request failed');
          }
        }

        // Never expose raw Axios errors to callers.
        return Promise.reject(mapAxiosError(error));
      },
    );
  }

  private elapsed(config?: InternalAxiosRequestConfig): number | undefined {
    const startedAt = config?.metadata?.startedAt;
    return startedAt ? Date.now() - startedAt : undefined;
  }
}
