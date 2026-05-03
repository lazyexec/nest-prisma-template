import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { Request, Response } from 'express';
import locals from '@/locals';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          this.formatLog(
            request.method,
            request.originalUrl,
            response.statusCode,
            Date.now() - startedAt,
          ),
        );
      }),
      catchError((error: unknown) => {
        this.logger.error(
          this.formatLog(
            request.method,
            request.originalUrl,
            response.statusCode || 500,
            Date.now() - startedAt,
          ),
          error instanceof Error ? error.stack : undefined,
        );

        return throwError(() => error);
      }),
    );
  }

  private formatLog(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
  ): string {
    return locals.logging.request_log_format
      .replace('{method}', method)
      .replace('{url}', url)
      .replace('{statusCode}', String(statusCode))
      .replace('{duration}', String(duration));
  }
}
