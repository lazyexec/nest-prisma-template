import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import locals from '@/locals';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startedAt;
        const logMessage = locals.logging.request_log_format
          .replace('{method}', request.method)
          .replace('{url}', request.originalUrl)
          .replace('{statusCode}', String(response.statusCode))
          .replace('{duration}', String(duration));

        this.logger.log(logMessage);
      }),
    );
  }
}
