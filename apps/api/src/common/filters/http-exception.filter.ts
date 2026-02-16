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

    res.status(status).json({
      error: {
        code: isHttp ? 'HTTP_ERROR' : 'UNHANDLED_ERROR',
        message,
        details: response ?? undefined,
        requestId: (req as any).requestId,
        path: req.url,
      },
    });
  }
}
