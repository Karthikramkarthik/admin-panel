import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs/operators';
import { ToastService } from '../services/toast.service';

/**
 * Functional route guard factory to protect page routes by module permission
 * @param {string} module - Name of the module (e.g. Products, Sales)
 * @param {string} action - Action capability required (default is 'View')
 */
export const hasPermissionGuard = (module: string, action: string = 'View'): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const toastService = inject(ToastService);
    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/auth/login']);
    }

    // Wait until permissions are loaded before checking
    return authService.permissionsLoaded$.pipe(
      filter(loaded => loaded === true),
      take(1),
      map(() => {
        // Owner role and wildcard check are handled internally in hasPermission
        if (authService.hasPermission(module, action)) {
          return true;
        }

        toastService.show(`Access denied for module ${module} (${action})`, 'error');
        // console.warn(`Access denied for module ${module} (${action}) - redirecting to fallback`);

        // Find fallback route
        const fallbacks = [
          { module: 'Dashboard', action: 'View', route: '/dashboard' },
          { module: 'POS', action: 'Create', route: '/pos' },
          { module: 'Products', action: 'View', route: '/products' },
          { module: 'Categories', action: 'View', route: '/categories' },
          { module: 'Invoices', action: 'View', route: '/invoices' },
          { module: 'Customers', action: 'View', route: '/customers' },
          { module: 'Purchases', action: 'View', route: '/purchases' },
          { module: 'Expenses', action: 'View', route: '/expenses' },
          { module: 'Orders', action: 'View', route: '/orders' },
          { module: 'Suppliers', action: 'View', route: '/suppliers' },
          { module: 'Reports', action: 'View', route: '/reports' },
          { module: 'Coupons', action: 'View', route: '/coupons' },
          { module: 'File Manager', action: 'View', route: '/file-manager' },
          { module: 'Users', action: 'View', route: '/users' },
          { module: 'Settings', action: 'View', route: '/system-settings' }
        ];

        for (const fb of fallbacks) {
          if (authService.hasPermission(fb.module, fb.action)) {
            console.log(`Redirecting to fallback route: ${fb.route}`);
            // toastService.show(`Redirecting to fallback route:${fb.route}`, 'error');
            return router.createUrlTree([fb.route]);
          }
        }

        // If no fallback is found, logout
        console.warn('No modules available for user. Logging out.');
        toastService.show(`No modules available for user. Logging out.`, 'error');
        authService.logout();
        return router.createUrlTree(['/auth/login']);
      })
    );
  };
};
