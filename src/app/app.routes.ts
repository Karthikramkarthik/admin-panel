import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { unsavedChangesGuard } from './guards/unsaved-changes.guard';
import { hasPermissionGuard } from './guards/auth-permission.guard';

// Functional route guards
const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/auth/login']);
};

const loginGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return !auth.isAuthenticated() ? true : router.createUrlTree(['/dashboard']);
};

const adminOrOwnerGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser();
  return (user && (user.role === 'Owner' || user.role === 'Admin')) ? true : router.createUrlTree(['/dashboard']);
};

export const routes: Routes = [
  // Public auth routes
  {
    path: 'auth/login',
    loadComponent: () => import('./components/auth/login.component').then(m => m.LoginComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./components/auth/register.component').then(m => m.RegisterComponent),
    canActivate: [loginGuard]
  },

  // Protected shell layout nested routes
  {
    path: '',
    loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [hasPermissionGuard('Dashboard', 'View')]
      },
      {
        path: 'pos',
        loadComponent: () => import('./components/pos/pos.component').then(m => m.PosComponent),
        canActivate: [hasPermissionGuard('POS', 'Create')],
        canDeactivate: [unsavedChangesGuard]
      },
      {
        path: 'categories',
        loadComponent: () => import('./components/category/categories.component').then(m => m.CategoriesComponent),
        canActivate: [hasPermissionGuard('Categories', 'View')],
        canDeactivate: [unsavedChangesGuard]
      },
      {
        path: 'products',
        loadComponent: () => import('./components/product/products.component').then(m => m.ProductsComponent),
        canActivate: [hasPermissionGuard('Products', 'View')],
        canDeactivate: [unsavedChangesGuard]
      },
      {
        path: 'products/import',
        loadComponent: () => import('./components/product/product-import.component').then(m => m.ProductImportComponent),
        canActivate: [hasPermissionGuard('Products', 'Create')],
        canDeactivate: [unsavedChangesGuard]
      },
      {
        path: 'internal-consumption',
        loadComponent: () => import('./components/internal-consumption/internal-consumption.component').then(m => m.InternalConsumptionComponent),
        canActivate: [authGuard, adminOrOwnerGuard]
      },
      {
        path: 'suppliers',
        loadComponent: () => import('./components/supplier/suppliers.component').then(m => m.SuppliersComponent),
        canActivate: [hasPermissionGuard('Suppliers', 'View')],
        canDeactivate: [unsavedChangesGuard]
      },
      {
        path: 'purchases',
        loadComponent: () => import('./components/purchase/purchases.component').then(m => m.PurchasesComponent),
        canActivate: [hasPermissionGuard('Purchases', 'View')],
        canDeactivate: [unsavedChangesGuard]
      },
      {
        path: 'expenses',
        loadComponent: () => import('./components/expense/expenses.component').then(m => m.ExpensesComponent),
        canActivate: [hasPermissionGuard('Expenses', 'View')],
        canDeactivate: [unsavedChangesGuard]
      },
      {
        path: 'customers',
        loadComponent: () => import('./components/customer/customers.component').then(m => m.CustomersComponent),
        canActivate: [hasPermissionGuard('Customers', 'View')],
        canDeactivate: [unsavedChangesGuard]
      },
      {
        path: 'invoices',
        loadComponent: () => import('./components/invoice/invoices.component').then(m => m.InvoicesComponent),
        canActivate: [hasPermissionGuard('Invoices', 'View')]
      },
      {
        path: 'invoices/view/:id',
        loadComponent: () => import('./components/invoice/invoice-view.component').then(m => m.InvoiceViewComponent),
        canActivate: [hasPermissionGuard('Invoices', 'View')]
      },
      {
        path: 'invoices/edit/:id',
        loadComponent: () => import('./components/pos/pos-edit.component').then(m => m.PosEditComponent),
        canActivate: [authGuard, adminOrOwnerGuard]
      },
      {
        path: 'orders',
        loadComponent: () => import('./components/orders/orders.component').then(m => m.OrdersComponent),
        canActivate: [hasPermissionGuard('Orders', 'View')],
        canDeactivate: [unsavedChangesGuard]
      },
      {
        path: 'coupons',
        loadComponent: () => import('./components/coupons/coupons.component').then(m => m.CouponsComponent),
        canActivate: [hasPermissionGuard('Coupons', 'View')]
      },
      {
        path: 'banners',
        loadComponent: () => import('./components/banners/banners.component').then(m => m.BannersComponent),
        canActivate: [hasPermissionGuard('Settings', 'View')]
      },
      {
        path: 'reviews',
        loadComponent: () => import('./components/reviews/reviews.component').then(m => m.ReviewsComponent),
        canActivate: [hasPermissionGuard('Products', 'View')]
      },
      {
        path: 'reports',
        loadComponent: () => import('./components/report/reports.component').then(m => m.ReportsComponent),
        canActivate: [hasPermissionGuard('Reports', 'View')]
      },
      {
        path: 'revenue-history',
        loadComponent: () => import('./components/report/revenue-history.component').then(m => m.RevenueHistoryComponent),
        canActivate: [hasPermissionGuard('Reports', 'View')]
      },
      {
        path: 'file-manager',
        loadComponent: () => import('./components/file-manager/file-manager.component').then(m => m.FileManagerComponent),
        canActivate: [hasPermissionGuard('File Manager', 'View')]
      },
      {
        path: 'instagram-settings',
        loadComponent: () => import('./components/instagram-settings/instagram-settings.component').then(m => m.InstagramSettingsComponent),
        canActivate: [hasPermissionGuard('Settings', 'View')]
      },
      {
        path: 'system-settings',
        loadComponent: () => import('./components/system-settings/system-settings.component').then(m => m.SystemSettingsComponent),
        canActivate: [hasPermissionGuard('Settings', 'View')],
        canDeactivate: [unsavedChangesGuard]
      },
      {
        path: 'roles',
        loadComponent: () => import('./components/roles/roles.component').then(m => m.RolesComponent),
        canActivate: [hasPermissionGuard('Settings', 'View')],
        canDeactivate: [unsavedChangesGuard]
      },
      {
        path: 'users',
        loadComponent: () => import('./components/users/users.component').then(m => m.UsersComponent),
        canActivate: [hasPermissionGuard('Users', 'View')],
        canDeactivate: [unsavedChangesGuard]
      },
      {
        path: 'auth/change-password',
        loadComponent: () => import('./components/auth/change-password.component').then(m => m.ChangePasswordComponent)
      }
    ]
  },

  // Fallback wildcards
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
