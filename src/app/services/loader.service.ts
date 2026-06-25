import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private activeRequests = new Map<string, number>();

  dashboardLoading = signal(false);
  reportsLoading = signal(false);
  productsLoading = signal(false);
  tableLoading = signal(false);
  globalLoading = signal(false);

  startRequest(url: string) {
    const key = this.getCategoryKey(url);
    const count = this.activeRequests.get(key) || 0;
    this.activeRequests.set(key, count + 1);
    this.updateSignals();
  }

  stopRequest(url: string) {
    const key = this.getCategoryKey(url);
    const count = this.activeRequests.get(key) || 0;
    if (count > 1) {
      this.activeRequests.set(key, count - 1);
    } else {
      this.activeRequests.delete(key);
    }
    this.updateSignals();
  }

  private getCategoryKey(url: string): string {
    if (url.includes('/api/dashboard')) return 'dashboard';
    if (url.includes('/api/reports')) return 'reports';
    if (url.includes('/api/products') && !url.includes('/track-viewer')) return 'products';
    if (
      url.includes('/api/categories') || 
      url.includes('/api/suppliers') || 
      url.includes('/api/customers') || 
      url.includes('/api/expenses') || 
      url.includes('/api/purchases') || 
      url.includes('/api/sales') || 
      url.includes('/api/orders') || 
      url.includes('/api/coupons') || 
      url.includes('/api/banners') || 
      url.includes('/api/reviews')
    ) {
      return 'table';
    }
    return 'other';
  }

  private updateSignals() {
    this.dashboardLoading.set((this.activeRequests.get('dashboard') || 0) > 0);
    this.reportsLoading.set((this.activeRequests.get('reports') || 0) > 0);
    this.productsLoading.set((this.activeRequests.get('products') || 0) > 0);
    this.tableLoading.set((this.activeRequests.get('table') || 0) > 0);
    
    let totalActive = 0;
    this.activeRequests.forEach(count => totalActive += count);
    this.globalLoading.set(totalActive > 0);
  }
}
