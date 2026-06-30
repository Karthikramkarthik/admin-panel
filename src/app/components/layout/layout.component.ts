import { Component, signal, effect, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConnectionService } from '../../services/connection.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { CategoryModalComponent } from '../category/category-modal.component';
import { CategoryModalService } from '../../services/category-modal.service';
import { ProductModalComponent } from '../product/product-modal.component';
import { ProductModalService } from '../../services/product-modal.service';
import { SupplierModalComponent } from '../supplier/supplier-modal.component';
import { SupplierModalService } from '../../services/supplier-modal.service';
import { PurchaseModalComponent } from '../purchase/purchase-modal.component';
import { PurchaseModalService } from '../../services/purchase-modal.service';
import { ExpenseModalComponent } from '../expense/expense-modal.component';
import { ExpenseModalService } from '../../services/expense-modal.service';
import { CustomerModalComponent } from '../customer/customer-modal.component';
import { CustomerModalService } from '../../services/customer-modal.service';
import { CustomerHistoryModalComponent } from '../customer/customer-history-modal.component';
import { CustomerHistoryModalService } from '../../services/customer-history-modal.service';
import { CouponModalComponent } from '../coupons/coupon-modal.component';
import { CouponModalService } from '../../services/coupon-modal.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { ProductPurchaseHistoryModalComponent } from '../product/product-purchase-history-modal.component';
import { ProductPurchaseHistoryModalService } from '../../services/product-purchase-history-modal.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive, 
    CategoryModalComponent,
    ProductModalComponent,
    SupplierModalComponent,
    PurchaseModalComponent,
    ExpenseModalComponent,
    CustomerModalComponent,
    CustomerHistoryModalComponent,
    CouponModalComponent,
    HasPermissionDirective,
    ProductPurchaseHistoryModalComponent
  ],
  template: `
    <div class="d-flex" id="wrapper">
      <!-- Sidebar Backdrop for Mobile Drawer collapse -->
      <div class="sidebar-backdrop d-md-none" *ngIf="!sidebarCollapsed()" (click)="toggleSidebar()"></div>
      <!-- Sidebar -->
      <div class="border-end" id="sidebar-wrapper" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-heading bg-transparent fw-bold text-center fs-5 text-primary">
          <div class="d-flex align-items-center justify-content-center gap-2 px-3">
            <!-- <i class="fas fa-boxes-stacked fs-3 text-gradient"></i> -->
            <span class="brand-text" *ngIf="!sidebarCollapsed()">
                <img src="assets/logo.jpg" alt="" class="w-100">
            </span>
          </div>
        </div>
        
        <div class="list-group list-group-flush mt-0 px-2 flex-grow-1 overflow-y-auto">
          <h6 class="submenu-hdr" *appHasPermission="['Dashboard', 'View']">Main</h6>
          <a routerLink="/dashboard" routerLinkActive="active" class="list-group-item list-group-item-action" *appHasPermission="['Dashboard', 'View']">
            <i class="fas fa-tachometer-alt"></i>
            <span *ngIf="!sidebarCollapsed()">Dashboard</span>
          </a>
      
           <h6 class="submenu-hdr">Inventory</h6>
          <a routerLink="/categories" routerLinkActive="active" class="list-group-item list-group-item-action" *appHasPermission="['Categories', 'View']">
            <i class="fas fa-tags"></i>
            <span *ngIf="!sidebarCollapsed()">Categories</span>
          </a>
          <a routerLink="/products" routerLinkActive="active" class="list-group-item list-group-item-action" *appHasPermission="['Products', 'View']">
            <i class="fas fa-box"></i>
            <span *ngIf="!sidebarCollapsed()">Products</span>
          </a>
          <a routerLink="/internal-consumption" routerLinkActive="active" class="list-group-item list-group-item-action" *ngIf="auth.currentUser()?.role === 'Owner' || auth.currentUser()?.role === 'Admin'">
            <i class="fas fa-hand-holding-heart"></i>
            <span *ngIf="!sidebarCollapsed()">Personal Use</span>
          </a>
          <a routerLink="/suppliers" routerLinkActive="active" class="list-group-item list-group-item-action" *appHasPermission="['Suppliers', 'View']">
            <i class="fas fa-truck"></i>
            <span *ngIf="!sidebarCollapsed()">Suppliers</span>
          </a>
          <a routerLink="/purchases" routerLinkActive="active" class="list-group-item list-group-item-action" *appHasPermission="['Purchases', 'View']">
            <i class="fas fa-shopping-cart"></i>
            <span *ngIf="!sidebarCollapsed()">Purchases</span>
          </a>
          <a routerLink="/expenses" routerLinkActive="active" class="list-group-item list-group-item-action" *appHasPermission="['Expenses', 'View']">
            <i class="fas fa-wallet"></i>
            <span *ngIf="!sidebarCollapsed()">Expenses</span>
          </a>
          <a routerLink="/customers" routerLinkActive="active" class="list-group-item list-group-item-action" *appHasPermission="['Customers', 'View']">
            <i class="fas fa-users"></i>
            <span *ngIf="!sidebarCollapsed()">Customers</span>
          </a>
            <h6 class="submenu-hdr">Sales</h6>
                <a routerLink="/pos" routerLinkActive="active" class="list-group-item list-group-item-action" *appHasPermission="['POS', 'Create']">
            <i class="fas fa-cash-register"></i>
            <span *ngIf="!sidebarCollapsed()">POS Terminal</span>
          </a>
          <a routerLink="/invoices" routerLinkActive="active" class="list-group-item list-group-item-action" *appHasPermission="['Invoices', 'View']">
            <i class="fas fa-file-invoice-dollar"></i>
            <span *ngIf="!sidebarCollapsed()">Sales / Invoices</span>
          </a>
          <a routerLink="/orders" routerLinkActive="active" class="list-group-item list-group-item-action" *appHasPermission="['Orders', 'View']">
            <i class="fas fa-shopping-bag"></i>
            <span *ngIf="!sidebarCollapsed()">E-com Orders</span>
          </a>
          <a routerLink="/coupons" routerLinkActive="active" class="list-group-item list-group-item-action" *appHasPermission="['Coupons', 'View']">
            <i class="fas fa-ticket-alt"></i>
            <span *ngIf="!sidebarCollapsed()">Coupons</span>
          </a>
          <a routerLink="/banners" routerLinkActive="active" class="list-group-item list-group-item-action" *appHasPermission="['Settings', 'View']">
            <i class="fas fa-images"></i>
            <span *ngIf="!sidebarCollapsed()">Banners</span>
          </a>
          <a routerLink="/reviews" routerLinkActive="active" class="list-group-item list-group-item-action" *appHasPermission="['Products', 'View']">
            <i class="fas fa-star-half-alt"></i>
            <span *ngIf="!sidebarCollapsed()">Reviews</span>
          </a>
          <a routerLink="/reports" routerLinkActive="active" class="list-group-item list-group-item-action" *appHasPermission="['Reports', 'View']">
            <i class="fas fa-chart-line"></i>
            <span *ngIf="!sidebarCollapsed()">Reports</span>
          </a>
          <a routerLink="/revenue-history" routerLinkActive="active" class="list-group-item list-group-item-action" *appHasPermission="['Reports', 'View']">
            <i class="fas fa-history text-purple"></i>
            <span *ngIf="!sidebarCollapsed()">Revenue History</span>
          </a>
                  <h6 class="submenu-hdr">Media</h6>
          <a routerLink="/file-manager" routerLinkActive="active" class="list-group-item list-group-item-action" *appHasPermission="['File Manager', 'View']">
            <i class="fas fa-folder-open"></i>
            <span *ngIf="!sidebarCollapsed()">File Manager</span>
          </a>
          <a routerLink="/instagram-settings" routerLinkActive="active" class="list-group-item list-group-item-action" *appHasPermission="['Settings', 'View']">
            <i class="fab fa-instagram text-rose"></i>
            <span *ngIf="!sidebarCollapsed()">Instagram Settings</span>
          </a>
          <a routerLink="/system-settings" routerLinkActive="active" class="list-group-item list-group-item-action" *appHasPermission="['Settings', 'View']">
            <i class="fas fa-cog text-primary"></i>
            <span *ngIf="!sidebarCollapsed()">System Settings</span>
          </a>

          <h6 class="submenu-hdr" *appHasPermission="['Users', 'View']">Administration</h6>
          <a routerLink="/roles" routerLinkActive="active" class="list-group-item list-group-item-action" *appHasPermission="['Settings', 'View']">
            <i class="fas fa-user-shield text-info"></i>
            <span *ngIf="!sidebarCollapsed()">Roles & Permissions</span>
          </a>
          <a routerLink="/users" routerLinkActive="active" class="list-group-item list-group-item-action" *appHasPermission="['Users', 'View']">
            <i class="fas fa-users-cog text-warning"></i>
            <span *ngIf="!sidebarCollapsed()">User Management</span>
          </a>
        </div>
      </div>

      <!-- Page Content -->
      <div id="page-content-wrapper" class="w-100 d-flex flex-column" style="min-height: 100vh;">
        <!-- Connection Status Banner -->
        <div *ngIf="!connectionService.isOnline()" class="bg-danger text-white text-center py-2 px-3 fw-bold animate-fade-in offline-banner" style="z-index: 1060; font-size: 0.9rem;">
          <i class="fas fa-wifi-slash me-2 animate-bounce"></i>
          No Internet Connection. Please check your network and try again.
        </div>
        <div *ngIf="connectionService.isOnline() && connectionService.showRestoredMessage()" class="bg-success text-white text-center py-2 px-3 fw-bold animate-fade-in online-banner" style="z-index: 1060; font-size: 0.9rem;">
          <i class="fas fa-wifi me-2"></i>
          Internet connection restored. Data is syncing...
        </div>

        <!-- Top navbar -->
        <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom py-3 px-4 shadow-sm">
          <div class="container-fluid p-0">
            <button class="btn btn-outline-secondary btn-sm rounded-circle me-3" (click)="toggleSidebar()">
              <i class="fas" [class.fa-chevron-left]="!sidebarCollapsed()" [class.fa-chevron-right]="sidebarCollapsed()"></i>
            </button>
            
            <!-- Global Search Panel -->
            <div class="global-search-container position-relative flex-grow-1 mx-2" style="max-width: 320px;">
              <div class="input-group input-group-sm position-relative">
                <input type="text" 
                       class="form-control border-end-0 search-input py-2 px-3 ps-4 pl-6 globalSearch" 
                       placeholder="Global search (press Esc to close)..."
                       [value]="searchQuery()"
                       (input)="onSearchInput($event)"
                       (focus)="onSearchFocus()"
                       (blur)="onSearchBlur()"
                       (keydown)="onSearchKeyDown($event)"
                       style="border-radius: 20px 0 0 20px; font-size: 0.82rem;">
                <span class="position-absolute top-50 start-0 translate-middle-y ms-3" style="z-index: 10;">
                  <i class="fas fa-search text-muted"></i>
                </span>
                <span class="input-group-text bg-transparent border-start-0 py-2 px-3" style="border-radius: 0 20px 20px 0;">
                  <span class="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true" *ngIf="searchLoading()"></span>
                  <i class="fas fa-keyboard text-muted" *ngIf="!searchLoading()"></i>
                </span>
              </div>

              <!-- Search suggestions dropdown -->
              <div class="search-dropdown-menu glass-card p-2 shadow-lg w-100 position-absolute mt-2" 
                   *ngIf="searchFocused() && (searchResults().length > 0 || (searchQuery().trim() && !searchLoading()) || recentSearches().length > 0)"
                   style="z-index: 1050; border-radius: 12px; max-height: 380px; overflow-y: auto;">
                
                <!-- Recent searches state -->
                <div *ngIf="!searchQuery().trim() && recentSearches().length > 0">
                  <div class="d-flex justify-content-between align-items-center px-3 py-2 text-muted fw-bold border-bottom" style="font-size: 0.72rem;">
                    <span>RECENT SEARCHES</span>
                    <button class="btn btn-link btn-xs text-danger text-decoration-none p-0" (click)="clearRecentSearches($event)">Clear</button>
                  </div>
                  <div class="list-group list-group-flush mt-1">
                    <button type="button" 
                            *ngFor="let term of recentSearches(); let i = index"
                            class="list-group-item list-group-item-action d-flex align-items-center gap-2 py-2 border-0 rounded"
                            [class.active]="i === activeResultIndex()"
                            (mousedown)="handleRecentSearchClick(term)">
                      <i class="fas fa-history text-muted"></i>
                      <span class="text-main" style="font-size: 0.82rem;">{{ term }}</span>
                    </button>
                  </div>
                </div>

                <!-- Results suggestions -->
                <div *ngIf="searchQuery().trim() && searchResults().length > 0">
                  <div class="list-group list-group-flush">
                    <button type="button" 
                            *ngFor="let res of searchResults(); let i = index"
                            class="list-group-item list-group-item-action d-flex justify-content-between align-items-center gap-2 py-2 px-3 border-0 rounded mb-1"
                            [class.active]="i === activeResultIndex()"
                            (mousedown)="selectResult(res)">
                      <div class="d-flex flex-column min-w-0">
                        <div class="fw-bold text-main text-truncate" style="font-size: 0.85rem;" [innerHTML]="getHighlightedText(res.title, searchQuery())"></div>
                        <div class="text-muted text-truncate" style="font-size: 0.72rem;" [innerHTML]="getHighlightedText(res.subtitle, searchQuery())"></div>
                      </div>
                      <span class="badge rounded-pill px-2 py-1 text-uppercase" [ngClass]="getBadgeClass(res.type)" style="font-size: 0.65rem;">
                        {{ res.type }}
                      </span>
                    </button>
                  </div>
                </div>

                <!-- Empty state -->
                <div *ngIf="searchQuery().trim() && searchResults().length === 0 && !searchLoading()" class="p-4 text-center text-muted">
                  <i class="fas fa-search-minus d-block fs-3 mb-2 opacity-50 text-primary"></i>
                  No results found for "<span class="fw-semibold">{{ searchQuery() }}</span>"
                </div>
              </div>
            </div>
            
            <div class="ms-auto d-flex align-items-center gap-3">
              
              <!-- Notifications Bell Widget -->
              <div class="dropdown">
                <button class="btn btn-sm btn-outline-secondary rounded-circle position-relative" style="width: 38px; height: 38px;" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i class="fas fa-bell"></i>
                  <span *ngIf="unreadCount() > 0" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light" style="font-size: 0.65rem; padding: 0.25em 0.5em;">
                    {{ unreadCount() }}
                  </span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end border-0 shadow-lg mt-2 p-0 overflow-hidden dropdown-menu-dark-responsive" style="width: 340px; border-radius: 12px; font-size: 0.85rem; z-index: 1050;">
                  <li class="bg-primary text-white p-3 d-flex justify-content-between align-items-center">
                    <span class="fw-bold"><i class="fas fa-bell me-2"></i>Notifications</span>
                    <button *ngIf="unreadCount() > 0" class="btn btn-link text-white btn-sm p-0 text-decoration-none fw-semibold" (click)="markAllNotificationsRead($event)">Mark all read</button>
                  </li>
                  <div class="overflow-y-auto" style="max-height: 320px;">
                    <li *ngFor="let notification of notifications()">
                      <div class="dropdown-item p-3 border-bottom d-flex align-items-start gap-2" [class.bg-light]="!notification.is_read" [class.bg-dark-read]="notification.is_read" style="white-space: normal; cursor: pointer;" (click)="onNotificationClick(notification)">
                        <div class="rounded-circle p-2 d-flex align-items-center justify-content-center text-white" [ngClass]="getNotificationBg(notification.type)" style="width: 32px; height: 32px; flex-shrink: 0;">
                          <i class="fas" [ngClass]="getNotificationIcon(notification.type)" style="font-size: 0.8rem;"></i>
                        </div>
                        <div class="flex-grow-1">
                          <div class="fw-semibold text-main mb-1" style="font-size: 0.8rem; line-height: 1.25;">{{ notification.message }}</div>
                          <div class="text-muted" style="font-size: 0.7rem;">{{ notification.created_at | date:'short' }}</div>
                        </div>
                      </div>
                    </li>
                    <li *ngIf="notifications().length === 0" class="p-4 text-center text-muted">
                      <i class="fas fa-bell-slash d-block fs-3 mb-2 opacity-50 text-primary"></i>
                      No notifications yet
                    </li>
                  </div>
                </ul>
              </div>

              <!-- Dark Mode toggle -->
              <button 
                class="btn btn-sm btn-outline-secondary rounded-circle theme-toggle-btn" 
                style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; transition: var(--transition-smooth);" 
                (click)="toggleDarkMode()"
                title="Toggle Light/Dark Mode"
                type="button"
              >
                <i class="fas" [class.fa-sun]="darkMode()" [class.fa-moon]="!darkMode()" [class.text-warning]="darkMode()" [class.text-secondary]="!darkMode()" style="font-size: 1.1rem; transition: var(--transition-smooth);"></i>
              </button>
              
              <!-- User Dropdown -->
              <div class="dropdown">
                <button class="btn btn-light btn-sm dropdown-toggle border d-flex align-items-center gap-2 py-2 px-3 rounded-pill" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i class="fas fa-user-circle fs-5 text-primary"></i>
                  <span class="d-none d-md-inline fw-semibold text-main">{{ auth.currentUser()?.username }}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end border-0 shadow-lg mt-2 p-2" style="border-radius: 12px;">
                  <li>
                    <a class="dropdown-item py-2 px-3 rounded" routerLink="/auth/change-password">
                      <i class="fas fa-key me-2 text-muted"></i>Change Password
                    </a>
                  </li>
                  <li><hr class="dropdown-divider my-2"></li>
                  <li>
                    <button class="dropdown-item py-2 px-3 rounded text-danger" (click)="onLogout()">
                      <i class="fas fa-sign-out-alt me-2"></i>Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </nav>

        <div class="container-fluid p-4 flex-grow-1 overflow-auto bg-light-subtle">
          <router-outlet (activate)="onOutletActivate($event)"></router-outlet>
        </div>
      </div>
      
      <!-- Mobile Bottom Navigation Bar (PWA Navigation) -->
      <div class="mobile-bottom-nav d-md-none">
        <a routerLink="/dashboard" routerLinkActive="active" class="mobile-bottom-nav-item" *appHasPermission="['Dashboard', 'View']">
          <i class="fas fa-tachometer-alt"></i>
          <span>Dashboard</span>
        </a>
        <a routerLink="/pos" routerLinkActive="active" class="mobile-bottom-nav-item" *appHasPermission="['POS', 'Create']">
          <i class="fas fa-cash-register"></i>
          <span>POS</span>
        </a>
        <a routerLink="/products" routerLinkActive="active" class="mobile-bottom-nav-item" *appHasPermission="['Products', 'View']">
          <i class="fas fa-box"></i>
          <span>Catalog</span>
        </a>
        <a routerLink="/invoices" routerLinkActive="active" class="mobile-bottom-nav-item" *appHasPermission="['Invoices', 'View']">
          <i class="fas fa-file-invoice-dollar"></i>
          <span>Sales</span>
        </a>
        <button (click)="toggleSidebar()" class="mobile-bottom-nav-item">
          <i class="fas fa-bars"></i>
          <span>Menu</span>
        </button>
      </div>
    </div>

    <!-- Category Modal (Add / Edit) -->
    <app-category-modal
      [isOpen]="categoryModalService.isOpen()"
      [category]="categoryModalService.category()"
      (close)="categoryModalService.close()"
      (save)="onCategorySaved($event)">
    </app-category-modal>

    <!-- Product Modal (Add / Edit) -->
    <app-product-modal
      [isOpen]="productModalService.isOpen()"
      [product]="productModalService.product()"
      (close)="productModalService.close()"
      (save)="onProductSaved($event)">
    </app-product-modal>

    <!-- Supplier Modal (Add / Edit) -->
    <app-supplier-modal
      [isOpen]="supplierModalService.isOpen()"
      [supplier]="supplierModalService.supplier()"
      (close)="supplierModalService.close()"
      (save)="onSupplierSaved($event)">
    </app-supplier-modal>

    <!-- Purchase Modal (Log / Edit / View) -->
    <app-purchase-modal
      [isOpen]="purchaseModalService.isOpen()"
      [mode]="purchaseModalService.mode()"
      [purchaseId]="purchaseModalService.purchaseId()"
      (close)="purchaseModalService.close()"
      (save)="onPurchaseSaved($event)">
    </app-purchase-modal>

    <!-- Expense Modal (Log / Edit) -->
    <app-expense-modal
      [isOpen]="expenseModalService.isOpen()"
      [expense]="expenseModalService.expense()"
      (close)="expenseModalService.close()"
      (save)="onExpenseSaved($event)">
    </app-expense-modal>

    <!-- Customer Modal (Add / Edit) -->
    <app-customer-modal
      [isOpen]="customerModalService.isOpen()"
      [customer]="customerModalService.customer()"
      (close)="customerModalService.close()"
      (save)="onCustomerSaved($event)">
    </app-customer-modal>

    <!-- Customer History Modal (View) -->
    <app-customer-history-modal
      [isOpen]="customerHistoryModalService.isOpen()"
      [customerMobile]="customerHistoryModalService.customerMobile()"
      (close)="customerHistoryModalService.close()">
    </app-customer-history-modal>

    <!-- Coupon Modal (Create / Edit) -->
    <app-coupon-modal
      [isOpen]="couponModalService.isOpen()"
      [coupon]="couponModalService.coupon()"
      (close)="couponModalService.close()"
      (save)="onCouponSaved($event)">
    </app-coupon-modal>

    <!-- Product Purchase History Modal (View) -->
    <app-product-purchase-history-modal
      [isOpen]="productPurchaseHistoryModalService.isOpen()"
      [productId]="productPurchaseHistoryModalService.productId()"
      [productName]="productPurchaseHistoryModalService.productName()"
      [productCode]="productPurchaseHistoryModalService.productCode()"
      (close)="productPurchaseHistoryModalService.close()">
    </app-product-purchase-history-modal>
  `,
  styles: [`
    .text-gradient {
      background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    #sidebar-wrapper {
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    #sidebar-wrapper.collapsed {
      min-width: 80px;
      max-width: 80px;
    }
    
    #sidebar-wrapper.collapsed .brand-text,
    #sidebar-wrapper.collapsed span {
      display: none;
    }

    #sidebar-wrapper.collapsed .list-group-item {
      justify-content: center;
      padding: 14px;
      margin: 4px 8px;
    }

    #sidebar-wrapper.collapsed .list-group-item i {
      font-size: 1.3rem;
      margin: 0;
    }

    .bg-dark-read {
      background-color: transparent !important;
    }

    .dark-mode .bg-light {
      background-color: rgba(255, 255, 255, 0.05) !important;
    }
    
    .dropdown-menu-dark-responsive {
      background-color: #fff;
    }
    
    .dark-mode .dropdown-menu-dark-responsive {
      background-color: #1e1e2d;
      border: 1px solid #2f2f42 !important;
    }

    .global-search-container {
      transition: max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .search-input {
      background-color: var(--bg-primary) !important;
      border: 1px solid var(--border-color) !important;
      transition: var(--transition-smooth) !important;
    }
    .search-input:focus {
      background-color: #fff !important;
      box-shadow: 0 0 0 3px var(--accent-primary-light) !important;
      border-color: var(--accent-primary) !important;
    }
    .dark-mode .search-input:focus {
      background-color: var(--bg-sidebar) !important;
    }
    .search-dropdown-menu {
      background: var(--bg-sidebar);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-lg);
    }
    .list-group-item-action:hover, 
    .list-group-item-action.active {
      background-color: var(--accent-primary-light) !important;
      color: var(--text-main) !important;
    }
    .list-group-item-action.active .text-main,
    .list-group-item-action.active .text-muted {
      color: var(--accent-primary) !important;
    }
    mark.highlight {
      background-color: rgba(255, 193, 7, 0.3) !important;
      color: inherit !important;
      padding: 0 2px !important;
      font-weight: 600;
      border-radius: 2px;
    }
  `]
})
export class LayoutComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  router = inject(Router);
  api = inject(ApiService);
  categoryModalService = inject(CategoryModalService);
  productModalService = inject(ProductModalService);
  supplierModalService = inject(SupplierModalService);
  purchaseModalService = inject(PurchaseModalService);
  expenseModalService = inject(ExpenseModalService);
  customerModalService = inject(CustomerModalService);
  customerHistoryModalService = inject(CustomerHistoryModalService);
  couponModalService = inject(CouponModalService);
  productPurchaseHistoryModalService = inject(ProductPurchaseHistoryModalService);

  sidebarCollapsed = signal<boolean>(false);
  darkMode = signal<boolean>(false);
  connectionService = inject(ConnectionService);
  activeComponent: any = null;
  private connectionSubscription: Subscription | null = null;

  // Notifications signals
  notifications = signal<any[]>([]);
  unreadCount = signal<number>(0);
  private pollingIntervalId: any = null;

  // Global Search state signals
  searchQuery = signal<string>('');
  searchResults = signal<any[]>([]);
  recentSearches = signal<string[]>([]);
  searchFocused = signal<boolean>(false);
  activeResultIndex = signal<number>(-1);
  searchLoading = signal<boolean>(false);
  private searchTimeout: any = null;

  constructor() {
    // Effect to apply dark mode to document body dynamically and update localStorage
    effect(() => {
      const isDark = this.darkMode();
      if (typeof document !== 'undefined') {
        if (isDark) {
          document.body.classList.add('dark-mode');
          localStorage.setItem('theme', 'dark');
          localStorage.setItem('darkMode', 'true');
        } else {
          document.body.classList.remove('dark-mode');
          localStorage.setItem('theme', 'light');
          localStorage.setItem('darkMode', 'false');
        }
      }
    });

    // Check system and saved preference on init
    const savedTheme = localStorage.getItem('theme');
    const savedDark = localStorage.getItem('darkMode');
    let isDark = false;
    if (savedTheme) {
      isDark = savedTheme === 'dark';
    } else if (savedDark) {
      isDark = savedDark === 'true';
    } else if (typeof window !== 'undefined') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.darkMode.set(isDark);

    // Auto-collapse sidebar on mobile after navigation
    this.router.events.subscribe(() => {
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        this.sidebarCollapsed.set(true);
      }
    });
  }

  toggleDarkMode() {
    this.darkMode.update(val => !val);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('theme-change'));
    }
  }

  private tableObserver: MutationObserver | null = null;

  ngOnInit() {
    if (typeof window !== 'undefined') {
      if (window.innerWidth <= 768) {
        this.sidebarCollapsed.set(true);
      }
    }

    this.loadRecentSearches();
    this.setupTableObserver();

    this.connectionSubscription = this.connectionService.restored$.subscribe(() => {
      this.refreshActiveComponent();
    });

    if (this.auth.isAuthenticated()) {
      this.loadNotifications();
      // Polling every 10 seconds for real-time notifications bell widget
      this.pollingIntervalId = setInterval(() => {
        this.loadNotifications();
      }, 10000);
    }
  }

  setupTableObserver() {
    if (typeof document === 'undefined') return;

    const transformTables = () => {
      const tables = document.querySelectorAll('.custom-table');
      tables.forEach(table => {
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent?.trim() || '');
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          cells.forEach((cell, idx) => {
            const headerText = headers[idx] || '';
            if (headerText && !cell.hasAttribute('data-label')) {
              cell.setAttribute('data-label', headerText);
            }
          });
        });
      });
    };

    // Run once initially after small rendering delay
    setTimeout(transformTables, 300);

    const contentWrapper = document.getElementById('page-content-wrapper') || document.body;
    this.tableObserver = new MutationObserver(() => {
      transformTables();
    });

    this.tableObserver.observe(contentWrapper, {
      childList: true,
      subtree: true
    });
  }

  loadRecentSearches() {
    const saved = localStorage.getItem('admin-recent-searches');
    if (saved) {
      try {
        this.recentSearches.set(JSON.parse(saved));
      } catch (e) {
        this.recentSearches.set([]);
      }
    }
  }

  saveRecentSearch(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;
    const current = [...this.recentSearches()];
    const filtered = current.filter(q => q.toLowerCase() !== trimmed.toLowerCase());
    filtered.unshift(trimmed);
    const updated = filtered.slice(0, 5); // Keep last 5 searches
    this.recentSearches.set(updated);
    localStorage.setItem('admin-recent-searches', JSON.stringify(updated));
  }

  clearRecentSearches(event: Event) {
    event.stopPropagation();
    this.recentSearches.set([]);
    localStorage.removeItem('admin-recent-searches');
  }

  onSearchInput(event: any) {
    const val = event.target.value;
    this.searchQuery.set(val);
    this.activeResultIndex.set(-1);

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (!val.trim()) {
      this.searchResults.set([]);
      this.searchLoading.set(false);
      return;
    }

    this.searchLoading.set(true);
    this.searchTimeout = setTimeout(() => {
      this.executeSearch(val);
    }, 300);
  }

  executeSearch(val: string) {
    this.api.get('search', { q: val }).subscribe({
      next: (res) => {
        if (res.success) {
          this.searchResults.set(res.results);
        }
        this.searchLoading.set(false);
      },
      error: (err) => {
        console.error('Search failed:', err);
        this.searchLoading.set(false);
      }
    });
  }

  onSearchFocus() {
    this.searchFocused.set(true);
    this.loadRecentSearches();
  }

  onSearchBlur() {
    // Delay blur slightly to allow clicking suggestion list items
    setTimeout(() => {
      this.searchFocused.set(false);
    }, 200);
  }

  selectResult(result: any) {
    if (result.type !== 'Page') {
      // Save search term for recent searches
      this.saveRecentSearch(this.searchQuery());
    }
    
    // Clear search query and results
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.activeResultIndex.set(-1);

    // Route to page
    this.router.navigate([result.route]);
  }

  handleRecentSearchClick(term: string) {
    this.searchQuery.set(term);
    this.executeSearch(term);
  }

  onSearchKeyDown(event: KeyboardEvent) {
    const results = this.searchResults();
    const recent = this.recentSearches();
    const query = this.searchQuery().trim();
    
    // Determine the length of the list we are navigating
    let listLength = 0;
    if (query) {
      listLength = results.length;
    } else {
      listLength = recent.length;
    }

    if (listLength === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeResultIndex.update(idx => idx < listLength - 1 ? idx + 1 : idx);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeResultIndex.update(idx => idx > 0 ? idx - 1 : -1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const idx = this.activeResultIndex();
      if (idx >= 0 && idx < listLength) {
        if (query) {
          this.selectResult(results[idx]);
        } else {
          this.handleRecentSearchClick(recent[idx]);
        }
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.searchFocused.set(false);
      const inputEl = event.target as HTMLElement;
      if (inputEl) inputEl.blur();
    }
  }

  getHighlightedText(text: string, query: string): string {
    if (!query) return text;
    const re = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    return text.replace(re, '<mark class="highlight">$1</mark>');
  }

  getBadgeClass(type: string): string {
    switch (type) {
      case 'Product': return 'bg-info-subtle text-info border border-info-subtle';
      case 'Supplier': return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      case 'Customer': return 'bg-primary-subtle text-primary border border-primary-subtle';
      case 'Invoice': return 'bg-success-subtle text-success border border-success-subtle';
      case 'Order': return 'bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle';
      case 'Coupon': return 'bg-dark-subtle text-dark border border-dark-subtle';
      case 'Expense': return 'bg-danger-subtle text-danger border border-danger-subtle';
      default: return 'bg-light text-dark border';
    }
  }

  ngOnDestroy() {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
    }
    if (this.tableObserver) {
      this.tableObserver.disconnect();
    }
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
  }

  loadNotifications() {
    this.api.get('admin/notifications').subscribe({
      next: (res) => {
        if (res.success) {
          this.notifications.set(res.notifications);
          this.unreadCount.set(res.unreadCount);
        }
      },
      error: (err) => {
        console.error('Failed to load notifications:', err);
      }
    });
  }

  markAllNotificationsRead(event: Event) {
    event.stopPropagation();
    this.api.put('admin/notifications/read-all', {}).subscribe({
      next: (res) => {
        if (res.success) {
          this.unreadCount.set(0);
          this.notifications.update(list => list.map(n => ({ ...n, is_read: 1 })));
        }
      }
    });
  }

  onNotificationClick(notification: any) {
    // Mark as read
    if (!notification.is_read) {
      this.api.put(`admin/notifications/${notification.id}/read`, {}).subscribe({
        next: () => {
          this.loadNotifications();
        }
      });
    }

    // Navigate to the correct administration panel
    if (notification.type === 'new_order') {
      this.router.navigate(['/orders']);
    } else if (notification.type === 'low_stock') {
      this.router.navigate(['/products']);
    } else if (notification.type === 'review') {
      this.router.navigate(['/reviews']);
    } else if (notification.type === 'new_customer') {
      this.router.navigate(['/customers']);
    }
  }

  getNotificationBg(type: string): string {
    switch (type) {
      case 'new_order': return 'bg-success';
      case 'low_stock': return 'bg-danger';
      case 'review': return 'bg-warning text-dark';
      case 'new_customer': return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'new_order': return 'fa-shopping-bag';
      case 'low_stock': return 'fa-exclamation-triangle';
      case 'review': return 'fa-star';
      case 'new_customer': return 'fa-user-plus';
      default: return 'fa-bell';
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  onLogout() {
    this.auth.logout();
  }

  onCategorySaved(message: string) {
    this.categoryModalService.categorySaved.next(message);
  }

  onProductSaved(message: string) {
    this.productModalService.productSaved.next(message);
  }

  onSupplierSaved(message: string) {
    this.supplierModalService.supplierSaved.next(message);
  }

  onPurchaseSaved(message: string) {
    this.purchaseModalService.purchaseSaved.next(message);
  }

  onExpenseSaved(message: string) {
    this.expenseModalService.expenseSaved.next(message);
  }

  onCustomerSaved(message: string) {
    this.customerModalService.customerSaved.next(message);
  }

  onCouponSaved(message: string) {
    this.couponModalService.couponSaved.next(message);
  }

  onOutletActivate(component: any) {
    this.activeComponent = component;
  }

  refreshActiveComponent() {
    if (!this.activeComponent) return;

    const commonLoadMethods = [
      'loadData',
      'loadProducts',
      'loadCategories',
      'loadSuppliers',
      'loadExpenses',
      'loadCustomers',
      'loadOrders',
      'loadInvoices',
      'loadReports',
      'loadCoupons',
      'loadExplorer',
      'loadHistory',
      'ngOnInit'
    ];

    for (const methodName of commonLoadMethods) {
      if (typeof this.activeComponent[methodName] === 'function') {
        try {
          console.log(`Auto-refreshing component ${this.activeComponent.constructor.name} via ${methodName}()`);
          this.activeComponent[methodName]();
          return;
        } catch (e) {
          console.error(`Error auto-refreshing active component:`, e);
        }
      }
    }
  }
}
