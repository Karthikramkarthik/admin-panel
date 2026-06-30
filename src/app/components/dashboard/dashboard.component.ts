import { Component, OnInit, OnDestroy, signal, inject, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { LoaderService } from '../../services/loader.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';
import { ProductPurchaseHistoryModalService } from '../../services/product-purchase-history-modal.service';
declare var anychart: any; // Use global AnyChart from CDN to avoid bundler issues

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-fade-in h-100">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold m-0">Dashboard Overview</h4>
          <p class="text-muted m-0">Real-time statistics & business analytics summaries</p>
        </div>
      </div>

      <!-- Dashboard Skeleton Loader -->
      <div class="animate-fade-in" *ngIf="loaderService.dashboardLoading()">
        <div class="row g-3 mb-4">
          <div class="col-xl-3 col-md-6 col-6" *ngFor="let item of [1,2,3,4,5,6,7,8,9,10,11,12,13]">
            <div class="card glass-card stat-card border-0 p-3">
              <div class="d-flex align-items-center gap-2 mb-2">
                <div class="skeleton-loader skeleton-circle" style="width: 32px; height: 32px; flex-shrink: 0;"></div>
                <div class="skeleton-loader skeleton-text" style="width: 50%; height: 12px;"></div>
              </div>
              <div class="stat-value-container">
                <div class="skeleton-loader skeleton-text" style="width: 70%; height: 24px; margin-top: 6px;"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="row mb-4">
          <div class="col-12">
            <div class="card glass-card border-0 p-4" style="height: 380px;">
              <div class="skeleton-loader skeleton-title" style="width: 40%;"></div>
              <div class="skeleton-loader w-100 flex-grow-1" style="height: 280px; border-radius: 8px;"></div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="!loaderService.dashboardLoading()" class="animate-fade-in">
        <!-- Stat Cards -->
        <div class="row g-3 mb-4 mobile-card-grid">
          <!-- Store Invoices -->
          <div class="col-xl-3 col-md-6 col-6">
            <div class="card glass-card stat-card border-0 p-3"
                 [class.clickable]="canNavigate('Invoices', 'View', '/invoices')"
                 (click)="navigate('Invoices', 'View', '/invoices')">
              <div class="d-block d-md-flex align-items-center gap-2 mb-2">
                <div class="stat-icon-wrapper bg-primary bg-opacity-10 text-primary">
                  <i class="fas fa-file-invoice-dollar"></i>
                </div>
                <div>
                   <span class="stat-label fw-bold"><span class="d-none d-sm-inline">Store </span>Invoices</span>
                       <h3 class="stat-value m-0">{{ counts().invoices }}</h3>
                </div>
               
              </div>
             <a (click)="$event.stopPropagation(); navigate('Invoices', 'View', '/invoices')" class="link-default">View All
              <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.2328 16.4569C12.9328 16.7426 12.9212 17.2173 13.2069 17.5172C13.4926 17.8172 13.9673 17.8288 14.2672 17.5431L13.2328 16.4569ZM19.5172 12.5431C19.8172 12.2574 19.8288 11.7827 19.5431 11.4828C19.2574 11.1828 18.7827 11.1712 18.4828 11.4569L19.5172 12.5431ZM18.4828 12.5431C18.7827 12.8288 19.2574 12.8172 19.5431 12.5172C19.8288 12.2173 19.8172 11.7426 19.5172 11.4569L18.4828 12.5431ZM14.2672 6.4569C13.9673 6.17123 13.4926 6.18281 13.2069 6.48276C12.9212 6.78271 12.9328 7.25744 13.2328 7.5431L14.2672 6.4569ZM19 12.75C19.4142 12.75 19.75 12.4142 19.75 12C19.75 11.5858 19.4142 11.25 19 11.25V12.75ZM5 11.25C4.58579 11.25 4.25 11.5858 4.25 12C4.25 12.4142 4.58579 12.75 5 12.75V11.25ZM14.2672 17.5431L19.5172 12.5431L18.4828 11.4569L13.2328 16.4569L14.2672 17.5431ZM19.5172 11.4569L14.2672 6.4569L13.2328 7.5431L18.4828 12.5431L19.5172 11.4569ZM19 11.25L5 11.25V12.75L19 12.75V11.25Z" fill="#0d6efd"/>
</svg>
             </a>
            </div>
          </div>

          <!-- Ecom Orders -->
          <div class="col-xl-3 col-md-6 col-6">
            <div class="card glass-card stat-card border-0 p-3"
                 [class.clickable]="canNavigate('Orders', 'View', '/orders')"
                 (click)="navigate('Orders', 'View', '/orders')">
              <div class="d-block d-md-flex align-items-center gap-2 mb-2">
                <div class="stat-icon-wrapper bg-primary bg-opacity-10 text-primary">
                  <i class="fas fa-shopping-bag"></i>
                </div>
                <div>
                       <span class="stat-label fw-bold"><span class="d-none d-sm-inline">E-Com </span>Orders</span>
                          <div class="stat-value-container">
                <h3 class="stat-value m-0">{{ counts().total_orders }}</h3>
                <!-- <small class="text-warning fw-semibold d-block mt-1" style="font-size: 0.65rem; line-height: 1.2;">{{ counts().pending_orders }} Pending</small> -->
              </div>
                </div>
           
              </div>
            <a (click)="$event.stopPropagation(); navigate('Orders', 'View', '/orders')" class="link-default">View All
              <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.2328 16.4569C12.9328 16.7426 12.9212 17.2173 13.2069 17.5172C13.4926 17.8172 13.9673 17.8288 14.2672 17.5431L13.2328 16.4569ZM19.5172 12.5431C19.8172 12.2574 19.8288 11.7827 19.5431 11.4828C19.2574 11.1828 18.7827 11.1712 18.4828 11.4569L19.5172 12.5431ZM18.4828 12.5431C18.7827 12.8288 19.2574 12.8172 19.5431 12.5172C19.8288 12.2173 19.8172 11.7426 19.5172 11.4569L18.4828 12.5431ZM14.2672 6.4569C13.9673 6.17123 13.4926 6.18281 13.2069 6.48276C12.9212 6.78271 12.9328 7.25744 13.2328 7.5431L14.2672 6.4569ZM19 12.75C19.4142 12.75 19.75 12.4142 19.75 12C19.75 11.5858 19.4142 11.25 19 11.25V12.75ZM5 11.25C4.58579 11.25 4.25 11.5858 4.25 12C4.25 12.4142 4.58579 12.75 5 12.75V11.25ZM14.2672 17.5431L19.5172 12.5431L18.4828 11.4569L13.2328 16.4569L14.2672 17.5431ZM19.5172 11.4569L14.2672 6.4569L13.2328 7.5431L18.4828 12.5431L19.5172 11.4569ZM19 11.25L5 11.25V12.75L19 12.75V11.25Z" fill="#0d6efd"/>
</svg>
             </a>
            </div>
          </div>

          <!-- Customers -->
          <div class="col-xl-3 col-md-6 col-6">
            <div class="card glass-card stat-card border-0 p-3"
                 [class.clickable]="canNavigate('Customers', 'View', '/customers')"
                 (click)="navigate('Customers', 'View', '/customers')">
              <div class="d-block d-md-flex align-items-center gap-2 mb-2">
                <div class="stat-icon-wrapper bg-success bg-opacity-10 text-success">
                  <i class="fas fa-users"></i>
                </div>
                <div>
                    <span class="stat-label fw-bold">Customers</span>
                     <h3 class="stat-value m-0 text-success">{{ counts().customers }}</h3>
                </div>
              
              </div>
             <a (click)="$event.stopPropagation(); navigate('Customers', 'View', '/customers')" class="link-default">View All
              <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.2328 16.4569C12.9328 16.7426 12.9212 17.2173 13.2069 17.5172C13.4926 17.8172 13.9673 17.8288 14.2672 17.5431L13.2328 16.4569ZM19.5172 12.5431C19.8172 12.2574 19.8288 11.7827 19.5431 11.4828C19.2574 11.1828 18.7827 11.1712 18.4828 11.4569L19.5172 12.5431ZM18.4828 12.5431C18.7827 12.8288 19.2574 12.8172 19.5431 12.5172C19.8288 12.2173 19.8172 11.7426 19.5172 11.4569L18.4828 12.5431ZM14.2672 6.4569C13.9673 6.17123 13.4926 6.18281 13.2069 6.48276C12.9212 6.78271 12.9328 7.25744 13.2328 7.5431L14.2672 6.4569ZM19 12.75C19.4142 12.75 19.75 12.4142 19.75 12C19.75 11.5858 19.4142 11.25 19 11.25V12.75ZM5 11.25C4.58579 11.25 4.25 11.5858 4.25 12C4.25 12.4142 4.58579 12.75 5 12.75V11.25ZM14.2672 17.5431L19.5172 12.5431L18.4828 11.4569L13.2328 16.4569L14.2672 17.5431ZM19.5172 11.4569L14.2672 6.4569L13.2328 7.5431L18.4828 12.5431L19.5172 11.4569ZM19 11.25L5 11.25V12.75L19 12.75V11.25Z" fill="#0d6efd"/>
</svg>
             </a>
            </div>
          </div>

          <!-- Products -->
          <div class="col-xl-3 col-md-6 col-6">
            <div class="card glass-card stat-card border-0 p-3"
                 [class.clickable]="canNavigate('Products', 'View', '/products')"
                 (click)="navigate('Products', 'View', '/products')">
              <div class="d-block d-md-flex align-items-center gap-2 mb-2">
                <div class="stat-icon-wrapper bg-warning bg-opacity-10 text-warning">
                  <i class="fas fa-box"></i>
                </div>
                <div>
                   <span class="stat-label fw-bold">Products<span class="d-none d-sm-inline"> Catalog</span></span>
                                   <h3 class="stat-value m-0 text-warning">{{ counts().products }}</h3>
                </div>
               
              </div>
              <a (click)="$event.stopPropagation(); navigate('Products', 'View', '/products')" class="link-default">View All
              <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.2328 16.4569C12.9328 16.7426 12.9212 17.2173 13.2069 17.5172C13.4926 17.8172 13.9673 17.8288 14.2672 17.5431L13.2328 16.4569ZM19.5172 12.5431C19.8172 12.2574 19.8288 11.7827 19.5431 11.4828C19.2574 11.1828 18.7827 11.1712 18.4828 11.4569L19.5172 12.5431ZM18.4828 12.5431C18.7827 12.8288 19.2574 12.8172 19.5431 12.5172C19.8288 12.2173 19.8172 11.7426 19.5172 11.4569L18.4828 12.5431ZM14.2672 6.4569C13.9673 6.17123 13.4926 6.18281 13.2069 6.48276C12.9212 6.78271 12.9328 7.25744 13.2328 7.5431L14.2672 6.4569ZM19 12.75C19.4142 12.75 19.75 12.4142 19.75 12C19.75 11.5858 19.4142 11.25 19 11.25V12.75ZM5 11.25C4.58579 11.25 4.25 11.5858 4.25 12C4.25 12.4142 4.58579 12.75 5 12.75V11.25ZM14.2672 17.5431L19.5172 12.5431L18.4828 11.4569L13.2328 16.4569L14.2672 17.5431ZM19.5172 11.4569L14.2672 6.4569L13.2328 7.5431L18.4828 12.5431L19.5172 11.4569ZM19 11.25L5 11.25V12.75L19 12.75V11.25Z" fill="#0d6efd"/>
</svg>
             </a>
            </div>
          </div>

          <!-- Low Stock Alert -->
          <div class="col-xl-3 col-md-6 col-6">
            <div class="card glass-card stat-card border-0 p-3"
                 [class.clickable]="canNavigate('Products', 'View', '/products')"
                 (click)="navigate('Products', 'View', '/products')">
              <div class="d-block d-md-flex align-items-center gap-2 mb-2">
                <div class="stat-icon-wrapper bg-danger bg-opacity-10 text-danger">
                  <i class="fas fa-exclamation-triangle"></i>
                </div>
                 <div class="stat-value-container">
                      <span class="stat-label fw-bold">Low Stock<span class="d-none d-sm-inline"> Items</span></span>
                <h3 class="stat-value m-0 text-danger">{{ counts().low_stock }}</h3>
              </div>
            
              </div>
               <a (click)="$event.stopPropagation(); navigate('Products', 'View', '/products')" class="link-default">View All
              <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.2328 16.4569C12.9328 16.7426 12.9212 17.2173 13.2069 17.5172C13.4926 17.8172 13.9673 17.8288 14.2672 17.5431L13.2328 16.4569ZM19.5172 12.5431C19.8172 12.2574 19.8288 11.7827 19.5431 11.4828C19.2574 11.1828 18.7827 11.1712 18.4828 11.4569L19.5172 12.5431ZM18.4828 12.5431C18.7827 12.8288 19.2574 12.8172 19.5431 12.5172C19.8288 12.2173 19.8172 11.7426 19.5172 11.4569L18.4828 12.5431ZM14.2672 6.4569C13.9673 6.17123 13.4926 6.18281 13.2069 6.48276C12.9212 6.78271 12.9328 7.25744 13.2328 7.5431L14.2672 6.4569ZM19 12.75C19.4142 12.75 19.75 12.4142 19.75 12C19.75 11.5858 19.4142 11.25 19 11.25V12.75ZM5 11.25C4.58579 11.25 4.25 11.5858 4.25 12C4.25 12.4142 4.58579 12.75 5 12.75V11.25ZM14.2672 17.5431L19.5172 12.5431L18.4828 11.4569L13.2328 16.4569L14.2672 17.5431ZM19.5172 11.4569L14.2672 6.4569L13.2328 7.5431L18.4828 12.5431L19.5172 11.4569ZM19 11.25L5 11.25V12.75L19 12.75V11.25Z" fill="#0d6efd"/>
</svg>
             </a>
             
            </div>
          </div>

          <!-- Total Revenue -->
          <div class="col-xl-3 col-md-6 col-6">
            <div class="card glass-card stat-card border-0 p-3"
                 [class.clickable]="canNavigate('Reports', 'View', '/reports')"
                 (click)="navigate('Reports', 'View', '/reports', { tab: 'products' })">
              <div class="d-block d-md-flex align-items-center gap-2 mb-2">
                <div class="stat-icon-wrapper bg-success bg-opacity-10 text-success">
                  <i class="fas fa-chart-line"></i>
                </div>
                  <div class="stat-value-container">
                          <span class="stat-label fw-bold"><span class="d-none d-sm-inline">Total </span>Revenue</span>
                <h3 class=" m-0 text-success" style="font-size: 1.15rem;">₹{{ (counts().total_revenue - counts().total_shipping) | number:'1.2-2' }}</h3>
                <small class="text-muted d-block mt-1" style="font-size: 0.62rem; line-height: 1.2;">
                  ₹{{ (counts().sales - counts().store_shipping) | number:'1.0-0' }} store / ₹{{ (counts().ecom_sales - counts().ecom_shipping) | number:'1.0-0' }} ecom
                </small>
              </div>
          
              </div>
             <a (click)="$event.stopPropagation(); navigate('Reports', 'View', '/reports')" class="link-default">View All
              <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.2328 16.4569C12.9328 16.7426 12.9212 17.2173 13.2069 17.5172C13.4926 17.8172 13.9673 17.8288 14.2672 17.5431L13.2328 16.4569ZM19.5172 12.5431C19.8172 12.2574 19.8288 11.7827 19.5431 11.4828C19.2574 11.1828 18.7827 11.1712 18.4828 11.4569L19.5172 12.5431ZM18.4828 12.5431C18.7827 12.8288 19.2574 12.8172 19.5431 12.5172C19.8288 12.2173 19.8172 11.7426 19.5172 11.4569L18.4828 12.5431ZM14.2672 6.4569C13.9673 6.17123 13.4926 6.18281 13.2069 6.48276C12.9212 6.78271 12.9328 7.25744 13.2328 7.5431L14.2672 6.4569ZM19 12.75C19.4142 12.75 19.75 12.4142 19.75 12C19.75 11.5858 19.4142 11.25 19 11.25V12.75ZM5 11.25C4.58579 11.25 4.25 11.5858 4.25 12C4.25 12.4142 4.58579 12.75 5 12.75V11.25ZM14.2672 17.5431L19.5172 12.5431L18.4828 11.4569L13.2328 16.4569L14.2672 17.5431ZM19.5172 11.4569L14.2672 6.4569L13.2328 7.5431L18.4828 12.5431L19.5172 11.4569ZM19 11.25L5 11.25V12.75L19 12.75V11.25Z" fill="#0d6efd"/>
</svg>
             </a>
            </div>
          </div>

          <!-- Procurements -->
          <div class="col-xl-3 col-md-6 col-6">
            <div class="card glass-card stat-card border-0 p-3"
                 [class.clickable]="canNavigate('Purchases', 'View', '/purchases')"
                 (click)="navigate('Purchases', 'View', '/purchases')">
              <div class="d-block d-md-flex align-items-center gap-2 mb-2">
                <div class="stat-icon-wrapper bg-secondary bg-opacity-10 text-secondary">
                  <i class="fas fa-truck-loading"></i>
                </div>
                 <div class="stat-value-container">
                            <span class="stat-label fw-bold"><span class="d-none d-sm-inline">Procurements</span><span class="d-inline d-sm-none">Purchases</span></span>
                <h3 class="stat-value m-0 text-secondary" style="font-size: 1.15rem;">₹{{ counts().purchases | number:'1.2-2' }}</h3>
              </div>
      
              </div>
               <a (click)="$event.stopPropagation(); navigate('Purchases', 'View', '/purchases')" class="link-default">View All
              <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.2328 16.4569C12.9328 16.7426 12.9212 17.2173 13.2069 17.5172C13.4926 17.8172 13.9673 17.8288 14.2672 17.5431L13.2328 16.4569ZM19.5172 12.5431C19.8172 12.2574 19.8288 11.7827 19.5431 11.4828C19.2574 11.1828 18.7827 11.1712 18.4828 11.4569L19.5172 12.5431ZM18.4828 12.5431C18.7827 12.8288 19.2574 12.8172 19.5431 12.5172C19.8288 12.2173 19.8172 11.7426 19.5172 11.4569L18.4828 12.5431ZM14.2672 6.4569C13.9673 6.17123 13.4926 6.18281 13.2069 6.48276C12.9212 6.78271 12.9328 7.25744 13.2328 7.5431L14.2672 6.4569ZM19 12.75C19.4142 12.75 19.75 12.4142 19.75 12C19.75 11.5858 19.4142 11.25 19 11.25V12.75ZM5 11.25C4.58579 11.25 4.25 11.5858 4.25 12C4.25 12.4142 4.58579 12.75 5 12.75V11.25ZM14.2672 17.5431L19.5172 12.5431L18.4828 11.4569L13.2328 16.4569L14.2672 17.5431ZM19.5172 11.4569L14.2672 6.4569L13.2328 7.5431L18.4828 12.5431L19.5172 11.4569ZM19 11.25L5 11.25V12.75L19 12.75V11.25Z" fill="#0d6efd"/>
</svg>
             </a>
             
            </div>
          </div>

          <!-- Shipping Charges -->
          <div class="col-xl-3 col-md-6 col-6">
            <div class="card glass-card stat-card border-0 p-3"
                 [class.clickable]="canNavigate('Reports', 'View', '/reports')"
                 style="border-left: 4px solid #0dcaf0 !important;"
                 (click)="navigate('Reports', 'View', '/reports', { tab: 'financials' })">
              <div class="d-block d-md-flex align-items-center gap-2 mb-2">
                <div class="stat-icon-wrapper bg-info bg-opacity-10 text-info">
                  <i class="fas fa-shipping-fast"></i>
                </div>
                 <div class="stat-value-container">
                    <span class="stat-label fw-bold">Shipping<span class="d-none d-sm-inline"> Charges</span></span>
                <h3 class="stat-value m-0 text-info" style="font-size: 1.15rem;">₹{{ counts().total_shipping | number:'1.2-2' }}</h3>
                <small class="text-muted d-block mt-1" style="font-size: 0.62rem; line-height: 1.2;">
                  ₹{{ counts().store_shipping | number:'1.0-0' }} store / ₹{{ counts().ecom_shipping | number:'1.0-0' }} ecom
                </small>
              </div>
              
              </div>
               <a (click)="$event.stopPropagation(); navigate('Reports', 'View', '/reports')" class="link-default">View All
              <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.2328 16.4569C12.9328 16.7426 12.9212 17.2173 13.2069 17.5172C13.4926 17.8172 13.9673 17.8288 14.2672 17.5431L13.2328 16.4569ZM19.5172 12.5431C19.8172 12.2574 19.8288 11.7827 19.5431 11.4828C19.2574 11.1828 18.7827 11.1712 18.4828 11.4569L19.5172 12.5431ZM18.4828 12.5431C18.7827 12.8288 19.2574 12.8172 19.5431 12.5172C19.8288 12.2173 19.8172 11.7426 19.5172 11.4569L18.4828 12.5431ZM14.2672 6.4569C13.9673 6.17123 13.4926 6.18281 13.2069 6.48276C12.9212 6.78271 12.9328 7.25744 13.2328 7.5431L14.2672 6.4569ZM19 12.75C19.4142 12.75 19.75 12.4142 19.75 12C19.75 11.5858 19.4142 11.25 19 11.25V12.75ZM5 11.25C4.58579 11.25 4.25 11.5858 4.25 12C4.25 12.4142 4.58579 12.75 5 12.75V11.25ZM14.2672 17.5431L19.5172 12.5431L18.4828 11.4569L13.2328 16.4569L14.2672 17.5431ZM19.5172 11.4569L14.2672 6.4569L13.2328 7.5431L18.4828 12.5431L19.5172 11.4569ZM19 11.25L5 11.25V12.75L19 12.75V11.25Z" fill="#0d6efd"/>
</svg>
             </a>
            </div>
          </div>

          <!-- Combined Profit -->
          <div class="col-xl-3 col-md-6 col-6">
            <div class="card glass-card stat-card border-0 p-3"
                 [class.clickable]="canNavigate('Reports', 'View', '/reports')"
                 [style.borderLeft]="counts().profit >= 0 ? '4px solid #198754 !important' : '4px solid #dc3545 !important'"
                 (click)="navigate('Reports', 'View', '/reports', { tab: 'financials' })">
              <div class="d-block d-md-flex align-items-center gap-2 mb-2">
                <div class="stat-icon-wrapper bg-opacity-10" [ngClass]="counts().profit >= 0 ? 'bg-success text-success' : 'bg-danger text-danger'">
                  <i class="fas fa-coins"></i>
                </div>
                   <div class="stat-value-container">
                       <span class="stat-label fw-bold"><span class="d-none d-sm-inline">Combined </span>Profit</span>
                <h3 class=" m-0" [class.text-success]="counts().profit >= 0" [class.text-danger]="counts().profit < 0" style="font-size: 1.15rem;">
                  ₹{{ counts().profit | number:'1.2-2' }}
                </h3>
              </div>
             
              </div>
              <a (click)="$event.stopPropagation(); navigate('Reports', 'View', '/reports')" class="link-default">View All
                <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.2328 16.4569C12.9328 16.7426 12.9212 17.2173 13.2069 17.5172C13.4926 17.8172 13.9673 17.8288 14.2672 17.5431L13.2328 16.4569ZM19.5172 12.5431C19.8172 12.2574 19.8288 11.7827 19.5431 11.4828C19.2574 11.1828 18.7827 11.1712 18.4828 11.4569L19.5172 12.5431ZM18.4828 12.5431C18.7827 12.8288 19.2574 12.8172 19.5431 12.5172C19.8288 12.2173 19.8172 11.7426 19.5172 11.4569L18.4828 12.5431ZM14.2672 6.4569C13.9673 6.17123 13.4926 6.18281 13.2069 6.48276C12.9212 6.78271 12.9328 7.25744 13.2328 7.5431L14.2672 6.4569ZM19 12.75C19.4142 12.75 19.75 12.4142 19.75 12C19.75 11.5858 19.4142 11.25 19 11.25V12.75ZM5 11.25C4.58579 11.25 4.25 11.5858 4.25 12C4.25 12.4142 4.58579 12.75 5 12.75V11.25ZM14.2672 17.5431L19.5172 12.5431L18.4828 11.4569L13.2328 16.4569L14.2672 17.5431ZM19.5172 11.4569L14.2672 6.4569L13.2328 7.5431L18.4828 12.5431L19.5172 11.4569ZM19 11.25L5 11.25V12.75L19 12.75V11.25Z" fill="#0d6efd"/>
                </svg>
              </a>
            </div>
          </div>
          <!-- Personal Usage Cost -->
          <div class="col-xl-3 col-md-6 col-6" *ngIf="counts().personal_usage_cost !== undefined">
            <div class="card glass-card stat-card border-0 p-3"
                 [class.clickable]="canNavigate('', '', '/internal-consumption')"
                 style="border-left: 4px solid #fd7e14 !important;"
                 (click)="navigate('', '', '/internal-consumption')">
              <div class="d-block d-md-flex align-items-center gap-2 mb-2">
                <div class="stat-icon-wrapper bg-opacity-10" style="background-color: rgba(253, 126, 20, 0.1) !important; color: #fd7e14 !important;">
                  <i class="fas fa-hand-holding-heart"></i>
                </div>
                    <div class="stat-value-container">
                         <span class="stat-label fw-bold"><span class="d-none d-sm-inline">Personal Use</span><span class="d-inline d-sm-none">Internal Use</span></span>
                <h3 class="stat-value m-0" style="color: #fd7e14 !important; font-size: 1.15rem;">₹{{ counts().personal_usage_cost | number:'1.2-2' }}</h3>
                <small class="text-muted d-block mt-1" style="font-size: 0.62rem; line-height: 1.2;">Stock consumed</small>
              </div>
             
              </div>
               <a (click)="$event.stopPropagation(); navigate('', '', '/internal-consumption')" class="link-default">View All
              <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.2328 16.4569C12.9328 16.7426 12.9212 17.2173 13.2069 17.5172C13.4926 17.8172 13.9673 17.8288 14.2672 17.5431L13.2328 16.4569ZM19.5172 12.5431C19.8172 12.2574 19.8288 11.7827 19.5431 11.4828C19.2574 11.1828 18.7827 11.1712 18.4828 11.4569L19.5172 12.5431ZM18.4828 12.5431C18.7827 12.8288 19.2574 12.8172 19.5431 12.5172C19.8288 12.2173 19.8172 11.7426 19.5172 11.4569L18.4828 12.5431ZM14.2672 6.4569C13.9673 6.17123 13.4926 6.18281 13.2069 6.48276C12.9212 6.78271 12.9328 7.25744 13.2328 7.5431L14.2672 6.4569ZM19 12.75C19.4142 12.75 19.75 12.4142 19.75 12C19.75 11.5858 19.4142 11.25 19 11.25V12.75ZM5 11.25C4.58579 11.25 4.25 11.5858 4.25 12C4.25 12.4142 4.58579 12.75 5 12.75V11.25ZM14.2672 17.5431L19.5172 12.5431L18.4828 11.4569L13.2328 16.4569L14.2672 17.5431ZM19.5172 11.4569L14.2672 6.4569L13.2328 7.5431L18.4828 12.5431L19.5172 11.4569ZM19 11.25L5 11.25V12.75L19 12.75V11.25Z" fill="#0d6efd"/>
</svg>
             </a>
          
            </div>
          </div>

          <!-- Pending Payments Card -->
          <div class="col-xl-3 col-md-6 col-6" *ngIf="counts().pending_payments_count !== undefined">
            <div class="card glass-card stat-card border-0 p-3 clickable"
                 style="border-left: 4px solid #ffc107 !important;"
                 (click)="navigate('Sales', 'View', '/invoices', { paymentStatus: 'Pending' })">
              <div class="d-block d-md-flex align-items-center gap-2 mb-2">
                <div class="stat-icon-wrapper bg-warning bg-opacity-10 text-warning" style="background-color: rgba(255, 193, 7, 0.1) !important; color: #ffc107 !important;">
                  <i class="fas fa-hourglass-half"></i>
                </div>
                <div class="stat-value-container">
                  <span class="stat-label fw-bold">Pending Payments</span>
                  <h3 class="stat-value m-0 text-warning">₹{{ counts().pending_payments_amount | number:'1.2-2' }}</h3>
                  <small class="text-muted d-block mt-1" style="font-size: 0.62rem; line-height: 1.2;">
                    {{ counts().pending_payments_count }} invoices pending
                  </small>
                </div>
              </div>
              <a (click)="$event.stopPropagation(); navigate('Sales', 'View', '/invoices', { paymentStatus: 'Pending' })" class="link-default">View Details
                <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.2328 16.4569C12.9328 16.7426 12.9212 17.2173 13.2069 17.5172C13.4926 17.8172 13.9673 17.8288 14.2672 17.5431L13.2328 16.4569ZM19.5172 12.5431C19.8172 12.2574 19.8288 11.7827 19.5431 11.4828C19.2574 11.1828 18.7827 11.1712 18.4828 11.4569L19.5172 12.5431ZM18.4828 12.5431C18.7827 12.8288 19.2574 12.8172 19.5431 12.5172C19.8288 12.2173 19.8172 11.7426 19.5172 11.4569L18.4828 12.5431ZM14.2672 6.4569C13.9673 6.17123 13.4926 6.18281 13.2069 6.48276C12.9212 6.78271 12.9328 7.25744 13.2328 7.5431L14.2672 6.4569ZM19 12.75C19.4142 12.75 19.75 12.4142 19.75 12C19.75 11.5858 19.4142 11.25 19 11.25V12.75ZM5 11.25C4.58579 11.25 4.25 11.5858 4.25 12C4.25 12.4142 4.58579 12.75 5 12.75V11.25ZM14.2672 17.5431L19.5172 12.5431L18.4828 11.4569L13.2328 16.4569L14.2672 17.5431ZM19.5172 11.4569L14.2672 6.4569L13.2328 7.5431L18.4828 12.5431L19.5172 11.4569ZM19 11.25L5 11.25V12.75L19 12.75V11.25Z" fill="#0d6efd"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Paid Revenue Card -->
          <div class="col-xl-3 col-md-6 col-6" *ngIf="counts().paid_revenue !== undefined">
            <div class="card glass-card stat-card border-0 p-3 clickable"
                 style="border-left: 4px solid #198754 !important;"
                 (click)="navigate('Sales', 'View', '/invoices', { paymentStatus: 'Paid' })">
              <div class="d-block d-md-flex align-items-center gap-2 mb-2">
                <div class="stat-icon-wrapper bg-success bg-opacity-10 text-success" style="background-color: rgba(25, 135, 84, 0.1) !important; color: #198754 !important;">
                  <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-value-container">
                  <span class="stat-label fw-bold">Paid Revenue</span>
                  <h3 class="stat-value m-0 text-success">₹{{ counts().paid_revenue | number:'1.2-2' }}</h3>
                  <small class="text-muted d-block mt-1" style="font-size: 0.62rem; line-height: 1.2;">
                    Total completed collections
                  </small>
                </div>
              </div>
              <a (click)="$event.stopPropagation(); navigate('Sales', 'View', '/invoices', { paymentStatus: 'Paid' })" class="link-default">View Details
                <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.2328 16.4569C12.9328 16.7426 12.9212 17.2173 13.2069 17.5172C13.4926 17.8172 13.9673 17.8288 14.2672 17.5431L13.2328 16.4569ZM19.5172 12.5431C19.8172 12.2574 19.8288 11.7827 19.5431 11.4828C19.2574 11.1828 18.7827 11.1712 18.4828 11.4569L19.5172 12.5431ZM18.4828 12.5431C18.7827 12.8288 19.2574 12.8172 19.5431 12.5172C19.8288 12.2173 19.8172 11.7426 19.5172 11.4569L18.4828 12.5431ZM14.2672 6.4569C13.9673 6.17123 13.4926 6.18281 13.2069 6.48276C12.9212 6.78271 12.9328 7.25744 13.2328 7.5431L14.2672 6.4569ZM19 12.75C19.4142 12.75 19.75 12.4142 19.75 12C19.75 11.5858 19.4142 11.25 19 11.25V12.75ZM5 11.25C4.58579 11.25 4.25 11.5858 4.25 12C4.25 12.4142 4.58579 12.75 5 12.75V11.25ZM14.2672 17.5431L19.5172 12.5431L18.4828 11.4569L13.2328 16.4569L14.2672 17.5431ZM19.5172 11.4569L14.2672 6.4569L13.2328 7.5431L18.4828 12.5431L19.5172 11.4569ZM19 11.25L5 11.25V12.75L19 12.75V11.25Z" fill="#0d6efd"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Revenue History Card -->
          <div class="col-xl-3 col-md-6 col-6" *ngIf="canNavigate('Reports', 'View', '/revenue-history')">
            <div class="card glass-card stat-card border-0 p-3 clickable"
                 style="border-left: 4px solid #6f42c1 !important;"
                 (click)="navigate('Reports', 'View', '/revenue-history')">
              <div class="d-block d-md-flex align-items-center gap-2 mb-2">
                <div class="stat-icon-wrapper text-white" style="background-color: rgba(111, 66, 193, 0.1) !important; color: #6f42c1 !important;">
                  <i class="fas fa-history"></i>
                </div>
                <div class="stat-value-container">
                  <span class="stat-label fw-bold">Revenue History</span>
                  <h3 class="stat-value m-0" style="color: #6f42c1 !important; font-size: 1.15rem;">View Growth</h3>
                  <small class="text-muted d-block mt-1" style="font-size: 0.62rem; line-height: 1.2;">
                    Timeline & breakdowns
                  </small>
                </div>
              </div>
              <a (click)="$event.stopPropagation(); navigate('Reports', 'View', '/revenue-history')" class="link-default" style="color: #6f42c1 !important;">Open History
                <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.2328 16.4569C12.9328 16.7426 12.9212 17.2173 13.2069 17.5172C13.4926 17.8172 13.9673 17.8288 14.2672 17.5431L13.2328 16.4569ZM19.5172 12.5431C19.8172 12.2574 19.8288 11.7827 19.5431 11.4828C19.2574 11.1828 18.7827 11.1712 18.4828 11.4569L19.5172 12.5431ZM18.4828 12.5431C18.7827 12.8288 19.2574 12.8172 19.5431 12.5172C19.8288 12.2173 19.8172 11.7426 19.5172 11.4569L18.4828 12.5431ZM14.2672 6.4569C13.9673 6.17123 13.4926 6.18281 13.2069 6.48276C12.9212 6.78271 12.9328 7.25744 13.2328 7.5431L14.2672 6.4569ZM19 12.75C19.4142 12.75 19.75 12.4142 19.75 12C19.75 11.5858 19.4142 11.25 19 11.25V12.75ZM5 11.25C4.58579 11.25 4.25 11.5858 4.25 12C4.25 12.4142 4.58579 12.75 5 12.75V11.25ZM14.2672 17.5431L19.5172 12.5431L18.4828 11.4569L13.2328 16.4569L14.2672 17.5431ZM19.5172 11.4569L14.2672 6.4569L13.2328 7.5431L18.4828 12.5431L19.5172 11.4569ZM19 11.25L5 11.25V12.75L19 12.75V11.25Z" fill="#6f42c1"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

      <!-- Trend Chart -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card glass-card border-0 p-4">
            <h5 class="fw-bold mb-3"><i class="fas fa-chart-area text-primary me-2"></i>Sales & Profit Trends (Last 30 Days Combined)</h5>
            <div class="chart-container" style="position: relative; height: 320px; width: 100%;">
              <div #salesChartContainer style="width: 100%; height: 100%;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Tables -->
      <div class="row g-4 mb-4">
        <!-- Recent E-Commerce Orders -->
        <div class="col-md-6">
          <div class="card glass-card border-0 p-4 h-100 shadow-sm">
            <h5 class="fw-bold mb-3"><i class="fas fa-shopping-bag text-primary me-2"></i>Recent E-Com Orders</h5>
            <div class="table-responsive">
              <table class="table table-hover table-striped align-middle m-0" style="font-size: 0.85rem;">
                <thead>
                  <tr class="table-light">
                    <th>Order No</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let order of recentOrders()" style="cursor: pointer;" (click)="navigateToOrders()">
                    <td class="fw-bold text-primary">{{ order.order_number }}</td>
                    <td>{{ order.customer }}</td>
                    <td class="fw-semibold text-success">₹{{ order.grand_total | number:'1.2-2' }}</td>
                    <td>
                      <span class="badge rounded-pill fw-semibold" [ngClass]="getStatusBadgeClass(order.status)" style="font-size: 0.65rem; padding: 0.3em 0.6em;">
                        {{ order.status }}
                      </span>
                    </td>
                  </tr>
                  <tr *ngIf="recentOrders().length === 0">
                    <td colspan="4" class="text-center text-muted py-3">No recent e-commerce orders recorded.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Top Selling Products -->
        <div class="col-md-6">
          <div class="card glass-card border-0 p-4 h-100 shadow-sm">
            <h5 class="fw-bold mb-3"><i class="fas fa-fire text-danger me-2"></i>Top Selling Products</h5>
            <div class="table-responsive">
              <table class="table table-hover table-striped align-middle m-0" style="font-size: 0.85rem;">
                <thead>
                  <tr class="table-light">
                    <th>Product</th>
                    <th>Code</th>
                    <th class="text-center">Sold Qty</th>
                    <th class="text-end">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of topSellingProducts()">
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <img *ngIf="p.image" [src]="imageBaseUrl + p.image" (error)="handleImgError($event)" class="rounded border" style="width: 32px; height: 32px; object-fit: cover;">
                        <div class="rounded bg-light border d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;" *ngIf="!p.image">
                          <i class="fas fa-box text-muted" style="font-size: 0.8rem;"></i>
                        </div>
                        <div class="fw-semibold text-primary cursor-pointer text-decoration-underline text-truncate" (click)="openProductHistory(p)" style="max-width: 140px;">{{ p.name }}</div>
                      </div>
                    </td>
                    <td><span class="badge bg-light text-muted border">{{ p.code }}</span></td>
                    <td class="text-center fw-bold">{{ p.total_qty }}</td>
                    <td class="text-end fw-semibold text-success">₹{{ p.total_revenue | number:'1.2-2' }}</td>
                  </tr>
                  <tr *ngIf="topSellingProducts().length === 0">
                    <td colspan="4" class="text-center text-muted py-3">No sales transactions logged yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Procurements & Retail Sales -->
      <div class="row g-4">
        <!-- Recent Purchases -->
        <div class="col-md-6">
          <div class="card glass-card border-0 p-4 h-100 shadow-sm">
            <h5 class="fw-bold mb-3">Recent Procurements</h5>
            <div class="table-responsive">
              <table class="table table-hover table-striped align-middle m-0" style="font-size: 0.85rem;">
                <thead>
                  <tr class="table-light">
                    <th>Invoice</th>
                    <th>Supplier</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let purchase of recentPurchases()">
                    <td class="fw-semibold">{{ purchase.invoice_number }}</td>
                    <td>{{ purchase.supplier }}</td>
                    <td class="fw-semibold">₹{{ purchase.total_amount | number:'1.2-2' }}</td>
                    <td>{{ purchase.purchase_date }}</td>
                  </tr>
                  <tr *ngIf="recentPurchases().length === 0">
                    <td colspan="4" class="text-center text-muted py-3">No recent purchases recorded.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Recent Sales -->
        <div class="col-md-6">
          <div class="card glass-card border-0 p-4 h-100 shadow-sm">
            <h5 class="fw-bold mb-3">Recent Retail Sales</h5>
            <div class="table-responsive">
              <table class="table table-hover table-striped align-middle m-0" style="font-size: 0.85rem;">
                <thead>
                  <tr class="table-light">
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let sale of recentSales()">
                    <td>
                      <button (click)="openInvoice(sale.id)" class="btn btn-link text-primary fw-bold p-0 text-decoration-none border-0 bg-transparent" style="font-size: 0.85rem;">
                        {{ sale.invoice_number }}
                      </button>
                    </td>
                    <td>{{ sale.customer }}</td>
                    <td class="fw-semibold text-success">₹{{ sale.grand_total | number:'1.2-2' }}</td>
                    <td>{{ sale.sale_date }}</td>
                  </tr>
                  <tr *ngIf="recentSales().length === 0">
                    <td colspan="4" class="text-center text-muted py-3">No recent sales recorded.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  `,
  styles: [`
    .icon-shape {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private router = inject(Router);
  loaderService = inject(LoaderService);
  auth = inject(AuthService);
  toastService = inject(ToastService);
  productHistoryModalService = inject(ProductPurchaseHistoryModalService);
  imageBaseUrl = environment.imageBaseUrl;

  @ViewChild('salesChartContainer') salesChartContainer!: ElementRef;

  navigate(module: string, action: string, routePath: string, queryParams?: any) {
    if (this.canNavigate(module, action, routePath)) {
      this.router.navigate([routePath], { queryParams });
    } else {
      const moduleName = module || (routePath === '/internal-consumption' ? 'Personal Use' : 'this module');
      this.toastService.show(`Access denied for module ${moduleName}`, 'error');
    }
  }

  canNavigate(module: string, action: string, routePath: string): boolean {
    if (routePath === '/internal-consumption') {
      const user = this.auth.currentUser();
      return !!(user && (user.role === 'Owner' || user.role === 'Admin'));
    }
    return this.auth.hasPermission(module, action);
  }

  counts = signal<any>({
    invoices: 0,
    customers: 0,
    suppliers: 0,
    products: 0,
    purchases: 0,
    sales: 0,
    low_stock: 0,
    total_orders: 0,
    pending_orders: 0,
    ecom_sales: 0,
    total_revenue: 0,
    profit: 0,
    store_shipping: 0,
    ecom_shipping: 0,
    total_shipping: 0,
    personal_usage_cost: 0,
    pending_payments_count: 0,
    pending_payments_amount: 0,
    paid_revenue: 0
  });

  recentPurchases = signal<any[]>([]);
  recentSales = signal<any[]>([]);
  recentOrders = signal<any[]>([]);
  topSellingProducts = signal<any[]>([]);
  chartInstance: any = null;

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    if (this.chartInstance) {
      try {
        this.chartInstance.dispose();
      } catch (e) {
        console.error('Error disposing AnyChart instance:', e);
      }
    }
  }

  loadData() {
    this.api.get('dashboard/metrics').subscribe({
      next: (res) => {
        if (res.success) {
          console.log(res);
          this.counts.set(res.counts);
          this.recentPurchases.set(res.recentPurchases);
          this.recentSales.set(res.recentSales);
          this.recentOrders.set(res.recentOrders || []);
          this.topSellingProducts.set(res.topSellingProducts || []);

          this.initChart(res.chart);
        }
      },
      error: (err) => {
        console.error('Failed to load dashboard data:', err);
      }
    });
  }

  lastChartData: any = null;

  @HostListener('window:theme-change')
  onThemeChange() {
    if (this.lastChartData) {
      this.buildChart(this.lastChartData);
    }
  }

  initChart(chartData: any) {
    this.lastChartData = chartData;
    if (typeof (window as any).anychart === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.anychart.com/releases/8.11.0/js/anychart-base.min.js';
      script.onload = () => {
        const exportsScript = document.createElement('script');
        exportsScript.src = 'https://cdn.anychart.com/releases/8.11.0/js/anychart-exports.min.js';
        exportsScript.onload = () => {
          this.buildChart(chartData);
        };
        document.head.appendChild(exportsScript);
      };
      document.head.appendChild(script);
    } else {
      setTimeout(() => this.buildChart(chartData), 100);
    }
  }

  buildChart(chartData: any) {
    if (!this.salesChartContainer) return;
    const container = this.salesChartContainer.nativeElement;
    container.innerHTML = '';

    if (this.chartInstance) {
      try {
        this.chartInstance.dispose();
      } catch (e) {
        console.error('Error disposing AnyChart instance:', e);
      }
      this.chartInstance = null;
    }

    if (!chartData || !chartData.labels || chartData.labels.length === 0) {
      container.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
          <i class="fas fa-chart-line fs-1 mb-2 opacity-50"></i>
          <span>No trend data available for the last 30 days.</span>
        </div>
      `;
      return;
    }

    const isDarkMode = document.body.classList.contains('dark-mode');

    // Create Cartesian chart
    const chart = anychart.column();

    // Prepare data
    const data = [];
    for (let i = 0; i < chartData.labels.length; i++) {
      data.push({
        x: chartData.labels[i],
        sales: chartData.revenue[i] || 0,
        profit: chartData.profit[i] || 0
      });
    }

    const dataSet = anychart.data.set(data);
    const salesMapping = dataSet.mapAs({ x: 'x', value: 'sales' });
    const profitMapping = dataSet.mapAs({ x: 'x', value: 'profit' });

    // Create Column series for Sales
    const salesSeries = chart.column(salesMapping);
    salesSeries.name('Daily Sales');
    salesSeries.color('#6366f1'); // modern indigo
    salesSeries.tooltip().format('Sales: ₹{%value}{groupsSeparator:\\,}');

    // Create Spline series for Profit
    const profitSeries = chart.spline(profitMapping);
    profitSeries.name('Daily Profit');
    profitSeries.color('#10b981'); // modern emerald/green
    profitSeries.stroke({ color: '#10b981', width: 3 });
    profitSeries.tooltip().format('Profit: ₹{%value}{groupsSeparator:\\,}');

    // Configure Axes
    // Left Y-Axis (Index 0) -> Sales
    const leftAxis = chart.yAxis(0);
    leftAxis.title('Sales Amount (₹)');
    leftAxis.labels().format(function (this: any) {
      return '₹' + this.value.toLocaleString();
    });

    // Create secondary scale for Profit
    const profitScale = anychart.scales.linear();

    // Right Y-Axis (Index 1) -> Profit
    const rightAxis = chart.yAxis(1);
    rightAxis.orientation('right');
    rightAxis.title('Profit Amount (₹)');
    rightAxis.scale(profitScale);
    rightAxis.labels().format(function (this: any) {
      return '₹' + this.value.toLocaleString();
    });

    // Bind Spline series to the secondary scale
    profitSeries.yScale(profitScale);

    // X-Axis
    const xAxis = chart.xAxis(0);
    xAxis.labels().padding([5, 0, 0, 0]).rotation(0);
    xAxis.staggerMode(true);
    xAxis.staggerLines(1);

    // Legend
    const legend = chart.legend();
    legend.enabled(true);
    legend.position('top');
    legend.align('center');
    legend.padding([0, 0, 15, 0]);

    // Tooltip union mode
    chart.tooltip().displayMode('union');
    chart.tooltip().titleFormat('Date: {%x}');

    // Styling and theme styling based on dark mode status
    chart.background().fill('none'); // Transparent container for glassmorphism

    const textColor = isDarkMode ? '#cbd5e1' : '#475569';
    const gridColor = isDarkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.5)';
    const axisColor = isDarkMode ? '#475569' : '#cbd5e1';

    // Apply text styling to titles and labels
    chart.title().fontColor(textColor).fontFamily('Nunito');
    leftAxis.title().fontColor(textColor).fontFamily('Nunito').fontSize(12);
    leftAxis.labels().fontColor(textColor).fontFamily('Nunito');
    leftAxis.stroke(axisColor);

    rightAxis.title().fontColor(textColor).fontFamily('Nunito').fontSize(12);
    rightAxis.labels().fontColor(textColor).fontFamily('Nunito');
    rightAxis.stroke(axisColor);

    xAxis.labels().fontColor(textColor).fontFamily('Nunito');
    xAxis.stroke(axisColor);

    // Grids
    const yGrid = chart.yGrid(0);
    yGrid.enabled(true);
    yGrid.stroke(gridColor);

    const xGrid = chart.xGrid(0);
    xGrid.enabled(false);

    // Interactive Features: Zoom and Scroll (Scroller)
    chart.xScroller().enabled(true);
    chart.xZoom().setToPointsCount(15, true); // Show 15 points at a time
    chart.xScroller().fill(isDarkMode ? 'rgba(51, 65, 85, 0.2)' : 'rgba(226, 232, 240, 0.2)');
    chart.xScroller().selectedFill(isDarkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)');

    // Only enable scroller if labels length > 15
    if (chartData.labels.length <= 15) {
      chart.xScroller().enabled(false);
    }

    // Animation
    chart.animation(true, 1000);

    // Render
    chart.container(container);
    chart.draw();

    // Save instance for cleanup
    this.chartInstance = chart;
  }

  openInvoice(id: number) {
    this.router.navigate([`/invoices/view/${id}`]);
  }

  navigateToOrders() {
    this.router.navigate(['/orders']);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Pending': return 'bg-warning text-dark';
      case 'Processing': return 'bg-primary text-white';
      case 'Shipped': return 'bg-info text-white';
      case 'Delivered': return 'bg-success text-white';
      case 'Cancelled': return 'bg-danger text-white';
      default: return 'bg-secondary text-white';
    }
  }

  openProductHistory(prod: any) {
    this.productHistoryModalService.open(prod.id || prod.product_id, prod.name, prod.code);
  }

  handleImgError(event: any) {
    event.target.src = 'assets/placeholder.png';
  }
}
