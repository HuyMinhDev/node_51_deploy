import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger('API');
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();

    const { method, url } = context.switchToHttp().getRequest<Request>();

    // tap: chạm, ko thay đổi data trả về, lỗi sẽ ko bắt đc
    // finally: ko thay đổi data trả về, bắt đc cả lỗi
    // map: thay đổi data trả về, format
    return next
      .handle()
      .pipe(
        finalize(() =>
          this.logger.log(`${method} ${url}... ${Date.now() - now}ms`),
        ),
      );
  }
}
