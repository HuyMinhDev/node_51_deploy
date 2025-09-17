import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MESSAGE_RESPONSE } from '../decorators/message-response.decorator';

@Injectable()
export class ResponseSuccesInterceptor implements NestInterceptor {
  // private logger = new Logger('API');
  constructor(private reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // const now = Date.now();

    const { statusCode } = context.switchToHttp().getResponse<Response>();

    // tap: chạm, ko thay đổi data trả về, lỗi sẽ ko bắt đc
    // finally: ko thay đổi data trả về, bắt đc cả lỗi
    // map: thay đổi data trả về, format
    return next.handle().pipe(
      map((data) => {
        const message = this.reflector.get(
          MESSAGE_RESPONSE,
          context.getHandler(),
        );
        // console.log({ data });
        return {
          success: `success`,
          statusCode: statusCode,
          message: message,
          data: data,
        };
      }),
    );
  }
}
