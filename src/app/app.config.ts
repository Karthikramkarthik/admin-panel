import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { connectionInterceptor } from './services/connection.interceptor';
import { authInterceptor } from './services/auth.interceptor';
import { cacheInterceptor } from './services/cache.interceptor';
import { loaderInterceptor } from './services/loader.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([connectionInterceptor, authInterceptor, cacheInterceptor, loaderInterceptor]))
  ]
};
