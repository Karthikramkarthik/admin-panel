import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ConnectionService } from './connection.service';
import { throwError, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export const connectionInterceptor: HttpInterceptorFn = (req, next) => {
  const connectionService = inject(ConnectionService);

  if (!connectionService.isOnline()) {
    return throwError(() => new HttpErrorResponse({
      error: { error: 'No Internet Connection. Please check your network and try again.' },
      status: 0,
      statusText: 'Unknown Error (Offline)',
      url: req.url
    }));
  }

  const offline$ = fromEvent(window, 'offline');

  return next(req).pipe(
    takeUntil(offline$)
  );
};
