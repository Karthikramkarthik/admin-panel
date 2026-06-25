import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, tap } from 'rxjs';

const cache = new Map<string, { response: HttpResponse<any>, timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds Cache TTL

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    // Clear cache patterns when writing or deleting data
    const url = req.url;
    if (url.includes('/api/products')) {
      clearCachePattern('/api/products');
      clearCachePattern('/api/dashboard');
      clearCachePattern('/api/reports');
    } else if (url.includes('/api/categories')) {
      clearCachePattern('/api/categories');
    } else if (url.includes('/api/suppliers')) {
      clearCachePattern('/api/suppliers');
    } else if (url.includes('/api/customers')) {
      clearCachePattern('/api/customers');
      clearCachePattern('/api/dashboard');
      clearCachePattern('/api/reports');
    } else if (url.includes('/api/expenses')) {
      clearCachePattern('/api/expenses');
      clearCachePattern('/api/dashboard');
      clearCachePattern('/api/reports');
    } else if (url.includes('/api/purchases')) {
      clearCachePattern('/api/purchases');
      clearCachePattern('/api/dashboard');
      clearCachePattern('/api/reports');
    } else if (url.includes('/api/sales')) {
      clearCachePattern('/api/sales');
      clearCachePattern('/api/dashboard');
      clearCachePattern('/api/reports');
    } else if (url.includes('/api/orders')) {
      clearCachePattern('/api/orders');
      clearCachePattern('/api/dashboard');
      clearCachePattern('/api/reports');
    } else if (url.includes('/api/coupons')) {
      clearCachePattern('/api/coupons');
    } else if (url.includes('/api/banners')) {
      clearCachePattern('/api/banners');
    } else if (url.includes('/api/reviews')) {
      clearCachePattern('/api/reviews');
      clearCachePattern('/api/dashboard');
    } else if (url.includes('/api/settings')) {
      clearCachePattern('/api/settings');
    } else if (url.includes('/api/users')) {
      clearCachePattern('/api/users');
      clearCachePattern('/api/roles');
    } else if (url.includes('/api/roles')) {
      clearCachePattern('/api/roles');
      clearCachePattern('/api/users');
    } else if (url.includes('/api/instagram')) {
      clearCachePattern('/api/instagram');
    } else if (url.includes('/api/internal-consumption')) {
      clearCachePattern('/api/internal-consumption');
    } else if (url.includes('/api/admin/notifications')) {
      clearCachePattern('/api/admin/notifications');
    } else if (url.includes('/api/file-manager')) {
      clearCachePattern('/api/file-manager');
    }
    return next(req);
  }

  // Skip caching for auth and tracker endpoints
  if (req.url.includes('/api/auth/') || req.url.includes('/track-viewer')) {
    return next(req);
  }

  const cacheKey = req.urlWithParams;
  const cached = cache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return of(cached.response.clone());
  }

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        cache.set(cacheKey, {
          response: event.clone(),
          timestamp: Date.now()
        });
      }
    })
  );
};

function clearCachePattern(pattern: string) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}
