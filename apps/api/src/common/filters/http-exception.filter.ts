import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const response = isHttp ? exception.getResponse() : null;
    const baseMessage = isHttp ? (response as any)?.message ?? exception.message : 'Internal Server Error';
    const message = Array.isArray(baseMessage) ? baseMessage.join('; ') : baseMessage;
    const details = this.toDetails(response);

    res.status(status).json({
      error: {
        code: this.resolveErrorCode(status, details),
        message,
        details: details ?? undefined,
        requestId: (req as any).requestId,
        path: req.url,
      },
    });
  }

  private resolveErrorCode(status: number, details: unknown): string {
    if (status === HttpStatus.BAD_REQUEST && this.isValidationDetails(details)) return 'VALIDATION_ERROR';
    if (status === HttpStatus.BAD_REQUEST) return 'BAD_REQUEST';
    if (status === HttpStatus.UNAUTHORIZED) return 'AUTH_UNAUTHORIZED';
    if (status === HttpStatus.FORBIDDEN) return 'AUTH_FORBIDDEN';
    if (status === HttpStatus.NOT_FOUND) return 'RESOURCE_NOT_FOUND';
    if (status === HttpStatus.CONFLICT) return 'CONFLICT';
    return status >= 500 ? 'UNHANDLED_ERROR' : 'HTTP_ERROR';
  }

  private toDetails(response: unknown): Record<string, unknown> | undefined {
    if (!response || typeof response !== 'object') return undefined;
    const obj = response as Record<string, unknown>;
    const details: Record<string, unknown> = {};

    if (obj.error !== undefined) details.error = obj.error;
    if (obj.message !== undefined) details.message = obj.message;
    if (obj.statusCode !== undefined) details.statusCode = obj.statusCode;

    return Object.keys(details).length === 0 ? undefined : details;
  }

  private isValidationDetails(details: unknown): boolean {
    if (!details || typeof details !== 'object') return false;
    const message = (details as any).message;
    return Array.isArray(message);
  }
}
