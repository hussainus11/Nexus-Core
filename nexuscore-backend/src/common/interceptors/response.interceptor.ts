import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  meta?: Record<string, any>;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((payload) => {
        if (payload && typeof payload === 'object' && !Array.isArray(payload) && 'success' in payload) {
          return payload;
        }
        if (Array.isArray(payload)) {
          return { success: true, data: payload, message: 'OK' };
        }
        const { data, message, meta, ...rest } =
          payload && typeof payload === 'object' ? payload : { data: payload };

        return {
          success: true,
          data: data !== undefined ? data : rest,
          message: message || 'OK',
          ...(meta ? { meta } : {}),
        };
      }),
    );
  }
}
