import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoaderService } from './loader.service';
import { finalize } from 'rxjs';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);
  const url = req.url;

  // Track viewer checks should not trigger global overlays
  if (url.includes('/track-viewer')) {
    return next(req);
  }

  loaderService.startRequest(url);

  return next(req).pipe(
    finalize(() => {
      loaderService.stopRequest(url);
    })
  );
};
