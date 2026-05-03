import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import locals from '@/locals';

type ErrorResponseBody = {
  success: false;
  statusCode: number;
  message: string | string[];
  data: null;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException ? exception.getResponse() : null;
    const message =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
        ? (exceptionResponse.message as string | string[])
        : isHttpException
          ? exception.message
          : locals.error.internal_server_error;

    const body: ErrorResponseBody = {
      success: false,
      statusCode,
      message,
      data: null,
    };

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
    } else {
      const warningMessage = locals.logging.warning_log_format
        .replace('{method}', request.method)
        .replace('{url}', request.url)
        .replace('{statusCode}', String(statusCode))
        .replace(
          '{message}',
          Array.isArray(message) ? message.join(', ') : message,
        );
      this.logger.warn(
        warningMessage,
      );
    }

    response.status(statusCode).json(body);
  }
}
