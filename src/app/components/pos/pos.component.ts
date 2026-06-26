import { Component, OnInit, signal, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { UnsavedChangesService } from '../../services/unsaved-changes.service';
import { environment } from '../../../environments/environment';
import { LoaderComponent } from '../loader/loader.component';
import { finalize } from 'rxjs';
interface CartItem {
  id: number;
  code: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
  size: string;
  maxStock: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoaderComponent],
  template: `
    <div class="animate-fade-in POS-grid-layout">
      <!-- Mobile POS Tab Switcher -->
      <div class="d-flex d-md-none bg-light p-2 border rounded mb-3 gap-2">
        <button class="btn btn-sm flex-grow-1 py-2 fw-bold" 
                [class.btn-primary]="activeMobileTab() === 'products'" 
                [class.btn-outline-secondary]="activeMobileTab() !== 'products'" 
                (click)="activeMobileTab.set('products')">
          <i class="fas fa-th-large me-2"></i>Products
        </button>
        <button class="btn btn-sm flex-grow-1 py-2 fw-bold position-relative" 
                [class.btn-primary]="activeMobileTab() === 'cart'" 
                [class.btn-outline-secondary]="activeMobileTab() !== 'cart'" 
                (click)="activeMobileTab.set('cart')">
          <i class="fas fa-shopping-cart me-2"></i>Cart
          <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" *ngIf="cart().length > 0">
            {{ cart().length }}
          </span>
        </button>
      </div>

      <div class="row g-4">
        <!-- Products Grid Panel (Left) -->
        <div class="col-lg-8 col-md-7 d-flex flex-column" 
             [class.d-none]="isMobileView() && activeMobileTab() !== 'products'" 
             [style.height]="isMobileView() ? 'auto' : 'calc(100vh - 120px)'">
          <!-- Search and Category Filters -->
          <div class="card glass-card border-0 p-3 mb-3">
            <div class="row g-2">
              <div class="col-md-6 col-sm-12">
                <div class="input-group input-group-sm position-relative">
                  <!-- <span class="input-group-text bg-white border-end-0"><i class="fas fa-search text-muted"></i></span> -->
                  <input type="text" class="form-control border-start-0" placeholder="Search product code or title..." [ngModel]="searchQuery()" (ngModelChange)="onSearchChange($event)">
                  <span class="position-absolute top-50 end-0 translate-middle-y me-3">
                    <i class="fas fa-search text-muted"></i>
                  </span>
                </div>
              </div>
              <div class="col-md-4 col-sm-8 col-8">
                <select class="form-select form-select-sm" [ngModel]="selectedCategory()" (ngModelChange)="onCategoryChange($event)">
                  <option value="0">All Categories</option>
                  <option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.name }}</option>
                </select>
              </div>
              <div class="col-md-2 col-sm-4 col-4 d-flex justify-content-end ">
                <div class="btn-group btn-group-sm w-100 gap-2 switchBtn"  role="group" aria-label="Layout mode switcher">
                  <button type="button" class="btn btn-outline-primary py-1 px-2 d-flex align-items-center justify-content-center"
                          [class.active]="layoutMode() === 'sw-layout-3'"
                          (click)="setLayoutMode('sw-layout-3')"
                          title="Grid View">
                    <i class="fas fa-th-large"></i>
                  </button>
                  <button type="button" class="btn btn-outline-primary py-1 px-2 d-flex align-items-center justify-content-center"
                          [class.active]="layoutMode() === 'list-layout'"
                          (click)="setLayoutMode('list-layout')"
                          title="List View">
                    <i class="fas fa-list"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Products Listing -->
          <div class="flex-grow-1 overflow-y-auto px-1 overflow-x-hidden position-relative" style="min-height: 200px;">
            <div class="row g-3" *ngIf="products().length > 0">
              <!-- Grid view (sw-layout-3) -->
              <ng-container *ngIf="layoutMode() === 'sw-layout-3'">
                <div class="col-lg-4 col-md-4 col-sm-6 col-12 layout-transition-item" *ngFor="let prod of products()">
                  <div class="card glass-card border-0 h-100 overflow-hidden d-flex flex-column justify-content-between p-3 compact-card transition-all cursor-pointer"
                       (click)="addToCart(prod)"
                       style="border-radius: 12px;">
                    <div>
                      <!-- Product image -->
                      <img [src]="prod.image ? imageBaseUrl + prod.image : 'https://placehold.co/150x120/e2e8f0/64748b?text=Box'" 
                           class="w-100 object-fit-cover rounded mb-2 border" 
                           style="height: 100px;">
                      
                      <div class="fw-bold text-main" style="font-size: 0.88rem; line-height: 1.3;">{{ prod.name }}</div>
                      <div class="text-muted mb-2" style="font-size: 0.72rem;">
                        SKU: {{ prod.code }} | Stock: {{ prod.stock_quantity }}
                      </div>
                    </div>

                    <div>
                      <!-- Sizes Selector if variants exist -->
                      <div class="mb-2" *ngIf="prod.variants && prod.variants.length > 0">
                        <select class="form-select form-select-xs py-1" style="font-size: 0.75rem;" 
                                (change)="onSizeSelect(prod, $event)"
                                (click)="$event.stopPropagation()">
                          <option value="">Select Size</option>
                          <option *ngFor="let v of prod.variants" [value]="v.size" [disabled]="v.stock_quantity <= 0">
                            {{ v.size }} (Stock: {{ v.stock_quantity }})
                          </option>
                        </select>
                      </div>

                      <div class="d-flex justify-content-between align-items-center mt-2">
                        <span class="fw-extrabold text-primary" style="font-size: 0.95rem;">₹{{ prod.sales_price | number:'1.2-2' }}</span>
                        <button class="btn btn-xs btn-primary py-1 px-2 text-white rounded" 
                                (click)="addToCart(prod); $event.stopPropagation()" 
                                [disabled]="prod.stock_quantity <= 0">
                          <i class="fas fa-cart-plus"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </ng-container>

              <!-- List view (list-layout) -->
              <ng-container *ngIf="layoutMode() === 'list-layout'">
                <div class="col-12 layout-transition-item" *ngFor="let prod of products()">
                  <div class="card glass-card border-0 mb-2 p-2 list-item-card transition-all cursor-pointer"
                       (click)="addToCart(prod)"
                       style="border-radius: 10px;">
                    <div class="d-flex align-items-center gap-3 w-100">
                      <!-- Product Image -->
                      <img [src]="prod.image ? imageBaseUrl + prod.image : 'https://placehold.co/150x120/e2e8f0/64748b?text=Box'" 
                           class="object-fit-cover rounded border" style="width: 70px; height: 70px; flex-shrink: 0;">
                      
                      <!-- Product Info -->
                      <div class="flex-grow-1 min-w-0">
                        <div class="fw-bold text-main text-truncate" style="font-size: 0.9rem; line-height: 1.2;">{{ prod.name }}</div>
                        <div class="text-muted" style="font-size: 0.75rem;">
                          SKU: {{ prod.code }} | Stock: <span class="fw-semibold">{{ prod.stock_quantity }}</span>
                        </div>
                      </div>
                      
                      <!-- Variant selector / Price & Action -->
                      <div class="d-flex align-items-center gap-3 ms-auto flex-shrink-0">
                        <!-- Variant Select if exists -->
                        <div *ngIf="prod.variants && prod.variants.length > 0" style="width: 120px;">
                          <select class="form-select form-select-xs py-1" style="font-size: 0.75rem;" 
                                  (change)="onSizeSelect(prod, $event)"
                                  (click)="$event.stopPropagation()">
                            <option value="">Select Size</option>
                            <option *ngFor="let v of prod.variants" [value]="v.size" [disabled]="v.stock_quantity <= 0">
                              {{ v.size }} ({{ v.stock_quantity }})
                            </option>
                          </select>
                        </div>
                        
                        <span class="fw-extrabold text-primary" style="font-size: 0.95rem; min-width: 70px; text-align: right;">
                          ₹{{ prod.sales_price | number:'1.2-2' }}
                        </span>
                        
                        <button class="btn btn-sm btn-primary text-white rounded px-3 d-flex align-items-center gap-1 py-1.5" 
                                (click)="addToCart(prod); $event.stopPropagation()" 
                                [disabled]="prod.stock_quantity <= 0">
                          <i class="fas fa-cart-plus"></i> Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </ng-container>
            </div>

            <app-loader 
              [loading]="loadingProducts()" 
              [isEmpty]="!loadingProducts() && !productsError() && products().length === 0" 
              [error]="productsError()" 
              (retry)="loadProducts()"
              emptyMessage="No active products found matching filters.">
            </app-loader>
          </div>
        </div>

        <!-- Checkout Billing Panel (Right) -->
        <div class="col-lg-4 col-md-5" 
             [class.d-none]="isMobileView() && activeMobileTab() !== 'cart'">
          <div class="card glass-card border-0 p-4 d-flex flex-column justify-content-between" 
               [style.height]="isMobileView() ? 'auto' : 'calc(100vh - 120px)'">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold m-0"><i class="fas fa-shopping-cart text-primary me-2"></i>Checkout Cart</h5>
                <span class="badge bg-primary rounded-pill">{{ cart().length }} Items</span>
              </div>

              <!-- Customer Select and Quick Add Button -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted mb-1" style="font-size: 0.75rem;">Customer Details</label>
                <div class="d-flex gap-2">
                  <select class="form-select form-select-sm" [(ngModel)]="selectedCustomerId">
                    <option value="0">Choose Customer</option>
                    <option *ngFor="let c of customers()" [value]="c.id">{{ c.name }} ({{ c.mobile }})</option>
                  </select>
                  <button class="btn btn-sm btn-outline-primary" type="button" (click)="openAddCustomerModal()">
                    <i class="fas fa-user-plus"></i>
                  </button>
                </div>
              </div>

              <!-- Cart Item List -->
              <div class="cart-items-container overflow-y-auto mb-3 border rounded p-2 bg-light-subtle" 
                   [style.height]="isMobileView() ? '180px' : '220px'">
                <div class="cart-row-item border-bottom py-2" *ngFor="let item of cart(); let idx = index">
                  <div class="d-flex justify-content-between align-items-start">
                    <div style="width: 60%;">
                      <div class="fw-bold text-truncate" style="font-size: 0.82rem; line-height: 1.2;">{{ item.name }}</div>
                      <div class="text-muted d-flex flex-column" style="font-size: 0.7rem; gap: 2px;">
                        <span>SKU: {{ item.code }} <span *ngIf="item.size" class="badge bg-light text-primary border ms-1">{{ item.size }}</span></span>
                        <span [class.text-success]="(item.price - item.cost) >= 0" [class.text-danger]="(item.price - item.cost) < 0" class="fw-semibold">
                          Profit: ₹{{ ((item.price - item.cost) * item.quantity) | number:'1.2-2' }} ({{ (item.cost > 0 ? ((item.price - item.cost) / item.cost * 100) : 100) | number:'1.1-1' }}%)
                        </span>
                      </div>
                    </div>
                    
                    <!-- Sizing Quantities actions -->
                    <div class="d-flex align-items-center gap-1">
                      <button class="btn btn-xs btn-outline-secondary px-1 py-0 rounded" (click)="updateQty(idx, -1)"><i class="fas fa-minus fs-7"></i></button>
                      <span class="fw-semibold px-1" style="font-size: 0.85rem;">{{ item.quantity }}</span>
                      <button class="btn btn-xs btn-outline-secondary px-1 py-0 rounded" (click)="updateQty(idx, 1)"><i class="fas fa-plus fs-7"></i></button>
                    </div>
                  </div>
                  
                  <div class="d-flex justify-content-between align-items-center mt-2">
                    <!-- Rate edit (allow catalog deviations) -->
                    <div class="d-flex align-items-center gap-1">
                      <span style="font-size: 0.72rem;" class="text-muted">Rate: ₹</span>
                      <input type="number" class="form-control form-control-xs py-0 px-1 border" style="width: 68px; font-size: 0.75rem;" [(ngModel)]="item.price" (ngModelChange)="calculateTotals()">
                    </div>
                    
                    <span class="fw-bold text-success" style="font-size: 0.85rem;">₹{{ (item.quantity * item.price) | number:'1.2-2' }}</span>
                  </div>
                </div>
                
                <div class="text-center text-muted py-5" *ngIf="cart().length === 0">
                  Cart is empty. Click items to add.
                </div>
              </div>
            </div>

            <!-- Billing Calculations -->
            <div class="border-top pt-3">
              <div class="d-flex justify-content-between mb-1" style="font-size: 0.85rem;">
                <span class="text-muted">Subtotal:</span>
                <span class="fw-semibold">₹{{ subtotal() | number:'1.2-2' }}</span>
              </div>
              
              <!-- Discounts Custom Input -->
              <div class="d-flex justify-content-between align-items-center mb-1" style="font-size: 0.85rem;">
                <span class="text-muted">Discount (₹):</span>
                <input type="number" class="form-control form-control-xs py-0 px-1 text-end border" style="width: 80px; font-size: 0.78rem;" [(ngModel)]="discountAmount" (ngModelChange)="calculateTotals()">
              </div>
              
              <!-- GST / Taxes Custom Input -->
              <div class="d-flex justify-content-between align-items-center mb-1" style="font-size: 0.85rem;">
                <span class="text-muted">GST / Taxes ({{ gstPercentage }}%):</span>
                <input type="number" class="form-control form-control-xs py-0 px-1 text-end border" style="width: 80px; font-size: 0.78rem;" [ngModel]="taxAmount" (ngModelChange)="onTaxChange($event)">
              </div>
              
              <!-- Shipping Custom Input -->
              <div class="d-flex justify-content-between align-items-center mb-2" style="font-size: 0.85rem;">
                <span class="text-muted">Shipping (₹):</span>
                <input type="number" class="form-control form-control-xs py-0 px-1 text-end border" style="width: 80px; font-size: 0.78rem;" [ngModel]="shippingAmount" (ngModelChange)="onShippingChange($event)">
              </div>

              <!-- Est. Profit dynamic display -->
              <div class="d-flex justify-content-between mb-3 align-items-center pt-2 border-top border-secondary border-opacity-10">
                <span class="text-success fw-bold">Est. Profit:</span>
                <span class="fw-bold" [class.text-success]="totalProfit() >= 0" [class.text-danger]="totalProfit() < 0" style="font-size: 1.15rem;">
                  ₹{{ totalProfit() | number:'1.2-2' }} ({{ totalProfitPercent() | number:'1.1-1' }}%)
                </span>
              </div>

              <div class="d-flex justify-content-between align-items-center border-top py-2 mb-3">
                <span class="fw-bold">Grand Total:</span>
                <span class="fw-extrabold text-success fs-4">₹{{ grandTotal() | number:'1.2-2' }}</span>
              </div>

              <div class="alert alert-danger border-0 p-2 mb-2 rounded" style="font-size: 0.78rem;" *ngIf="checkoutError()">
                <i class="fas fa-exclamation-circle me-1"></i>{{ checkoutError() }}
              </div>

              <button class="btn btn-success w-100 py-2 rounded" [disabled]="cart().length === 0 || selectedCustomerId === 0 || loadingCheckout()" (click)="onCheckout()">
                <i class="fas fa-check-circle me-2"></i>Complete Checkout
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Checkout Confirmation Modal -->
      <div class="modal fade" id="checkoutConfirmModal" tabindex="-1" aria-hidden="true" [class.show]="confirmModalOpen()" [style.display]="confirmModalOpen() ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5); z-index: 1060;">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; background-color: var(--bg-sidebar);">
            <div class="modal-header bg-light-subtle py-3 border-bottom-0">
              <h5 class="modal-title fw-bold text-main"><i class="fas fa-receipt text-primary me-2"></i>Confirm Checkout</h5>
              <button type="button" class="btn-close" (click)="closeConfirmModal()"></button>
            </div>
            
            <div class="modal-body p-4 text-main">
              <!-- Customer details -->
              <div class="card bg-light-subtle border-0 p-3 mb-3" *ngIf="getSelectedCustomer() as cust">
                <h6 class="fw-bold mb-2 text-muted" style="font-size: 0.75rem; letter-spacing: 0.5px; text-transform: uppercase;">
                  <i class="fas fa-user text-primary me-1"></i> Customer Confirmation
                </h6>
                <div class="fw-bold" style="font-size: 0.95rem;">{{ cust.name }}</div>
                <div class="text-muted small mt-1"><i class="fas fa-phone-alt me-1"></i>{{ cust.mobile }}</div>
                <div class="text-muted small" *ngIf="cust.email"><i class="fas fa-envelope me-1"></i>{{ cust.email }}</div>
                <div class="text-muted small" *ngIf="cust.address"><i class="fas fa-map-marker-alt me-1"></i>{{ cust.address }}</div>
              </div>

              <!-- Order Summary List -->
              <div class="mb-3">
                <h6 class="fw-bold mb-2 text-muted" style="font-size: 0.75rem; letter-spacing: 0.5px; text-transform: uppercase;">
                  <i class="fas fa-list-ul text-primary me-1"></i> Order Summary
                </h6>
                <div class="border rounded bg-white overflow-hidden" style="max-height: 180px; overflow-y: auto;">
                  <table class="table table-hover table-striped align-middle m-0" style="font-size: 0.8rem;">
                    <thead>
                      <tr class="table-light">
                        <th class="ps-3 py-2">Item</th>
                        <th class="text-center py-2">Qty</th>
                        <th class="text-end pe-3 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let item of cart()">
                        <td class="ps-3 text-truncate" style="max-width: 180px;">
                          <div class="fw-semibold">{{ item.name }}</div>
                          <small class="text-muted" *ngIf="item.size">Size: {{ item.size }}</small>
                        </td>
                        <td class="text-center">{{ item.quantity }}</td>
                        <td class="text-end pe-3 fw-bold text-success">₹{{ (item.quantity * item.price) | number:'1.2-2' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Checkout Financial Details -->
              <div class="card bg-light-subtle border-0 p-3 mb-4" style="font-size: 0.85rem;">
                <div class="d-flex justify-content-between mb-1">
                  <span class="text-muted">Subtotal:</span>
                  <span class="fw-semibold">₹{{ subtotal() | number:'1.2-2' }}</span>
                </div>
                <div class="d-flex justify-content-between mb-1 text-danger" *ngIf="discountAmount > 0">
                  <span>Discount:</span>
                  <span>-₹{{ discountAmount | number:'1.2-2' }}</span>
                </div>
                <div class="d-flex justify-content-between mb-1" *ngIf="taxAmount > 0">
                  <span>GST / Tax:</span>
                  <span class="fw-semibold">₹{{ taxAmount | number:'1.2-2' }}</span>
                </div>
                <div class="d-flex justify-content-between mb-1" *ngIf="shippingAmount > 0">
                  <span>Shipping:</span>
                  <span class="fw-semibold">₹{{ shippingAmount | number:'1.2-2' }}</span>
                </div>
                <hr class="my-2 border-secondary border-opacity-10">
                <div class="d-flex justify-content-between align-items-center text-success fw-bold" style="font-size: 1.2rem;">
                  <span>Grand Total:</span>
                  <span>₹{{ grandTotal() | number:'1.2-2' }}</span>
                </div>
              </div>

              <!-- Payment Method Selection -->
              <div>
                <h6 class="fw-bold mb-2 text-muted" style="font-size: 0.75rem; letter-spacing: 0.5px; text-transform: uppercase;">
                  <i class="fas fa-wallet text-primary me-1"></i> Payment Method Selection
                </h6>
                <div class="row g-2">
                  <div class="col-6">
                    <div class="border rounded p-3 d-flex flex-column align-items-center justify-content-center cursor-pointer"
                         [style.border]="selectedPaymentMethod === 'Cash' ? '2.5px solid var(--accent-success) !important' : '1px solid var(--border-color)'"
                         [style.background-color]="selectedPaymentMethod === 'Cash' ? 'rgba(16, 185, 129, 0.08)' : ''"
                         (click)="selectedPaymentMethod = 'Cash'"
                         style="transition: var(--transition-smooth); cursor: pointer; border-radius: 10px;">
                      <i class="fas fa-money-bill-wave text-success fs-3 mb-2"></i>
                      <span class="fw-bold text-main" style="font-size: 0.82rem;">Cash</span>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="border rounded p-3 d-flex flex-column align-items-center justify-content-center cursor-pointer"
                         [style.border]="selectedPaymentMethod === 'GPay' ? '2.5px solid var(--accent-primary) !important' : '1px solid var(--border-color)'"
                         [style.background-color]="selectedPaymentMethod === 'GPay' ? 'rgba(99, 102, 241, 0.08)' : ''"
                         (click)="selectedPaymentMethod = 'GPay'"
                         style="transition: var(--transition-smooth); cursor: pointer; border-radius: 10px;">
                      <i class="fab fa-google-pay text-primary mb-2" style="font-size: 2.2rem; line-height: 1; height: 33px;"></i>
                      <span class="fw-bold text-main" style="font-size: 0.82rem;">GPay</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer bg-light-subtle border-top-0 py-3">
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="closeConfirmModal()">Cancel</button>
              <button type="button" class="btn btn-success btn-sm px-4" (click)="confirmCheckout()" [disabled]="loadingCheckout()">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loadingCheckout()"></span>
                Confirm Checkout
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Add Customer Modal -->
      <div class="modal fade" id="customerPosModal" tabindex="-1" aria-hidden="true" [class.show]="customerModalOpen()" [style.display]="customerModalOpen() ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5); z-index: 1050;">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; background-color: var(--bg-sidebar);">
            <div class="modal-header bg-light-subtle py-3 border-bottom-0">
              <h5 class="modal-title fw-bold">Quick Register Customer</h5>
              <button type="button" class="btn-close" (click)="closeAddCustomerModal()"></button>
            </div>
            
            <form [formGroup]="customerForm" (ngSubmit)="onCustomerSubmit()">
              <div class="modal-body p-4">
                <!-- Name -->
                <div class="mb-3">
                  <label class="form-label fw-semibold text-muted">Customer Name</label>
                  <input type="text" class="form-control" formControlName="name" placeholder="Customer Name">
                  <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="customerForm.get('name')?.touched && customerForm.get('name')?.invalid">
                    Name is required.
                  </div>
                </div>

                <!-- Mobile -->
                <div class="mb-3">
                  <label class="form-label fw-semibold text-muted">Mobile Number</label>
                  <input type="text" class="form-control" formControlName="mobile" placeholder="Mobile">
                  <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="customerForm.get('mobile')?.touched && customerForm.get('mobile')?.invalid">
                    Valid mobile is required.
                  </div>
                </div>
              </div>
              
              <div class="modal-footer bg-light-subtle border-top-0 py-3">
                <button type="button" class="btn btn-outline-secondary btn-sm" (click)="closeAddCustomerModal()">Cancel</button>
                <button type="submit" class="btn btn-primary btn-sm" [disabled]="customerForm.invalid || loadingCustomer()">
                  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loadingCustomer()"></span>
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-control-xs {
      height: 24px;
      padding: 0 4px !important;
      border-radius: 4px !important;
    }
    .form-select-xs {
      height: 26px;
      padding: 0 8px !important;
      border-radius: 4px !important;
    }
    .fs-7 {
      font-size: 0.72rem;
    }
    .cursor-pointer {
      cursor: pointer;
    }
    .compact-card {
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .compact-card:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: var(--shadow-lg);
    }
    .list-item-card {
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .list-item-card:hover {
      transform: translateX(3px) scale(1.005);
      box-shadow: var(--shadow-md);
    }
    .layout-transition-item {
      animation: layoutFadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    .btn-group .btn {
      transition: all 0.2s ease-in-out;
    }
    .btn-group .btn.active {
      background-color: var(--accent-primary) !important;
      color: #fff !important;
    }
    @keyframes layoutFadeIn {
      from {
        opacity: 0;
        transform: translateY(6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class PosComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private unsavedChangesService = inject(UnsavedChangesService);
imageBaseUrl = environment.imageBaseUrl;

  activeMobileTab = signal<'products' | 'cart'>('products');
  isMobileView = signal<boolean>(false);

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (typeof window !== 'undefined') {
      this.isMobileView.set(window.innerWidth <= 768);
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.cart().length > 0 || (this.customerModalOpen() && this.customerForm.dirty)) {
      $event.returnValue = true;
    }
  }

  canDeactivate(): boolean | import('rxjs').Observable<boolean> {
    if (this.cart().length > 0 || (this.customerModalOpen() && this.customerForm.dirty)) {
      return this.unsavedChangesService.confirm();
    }
    return true;
  }

  products = signal<any[]>([]);
  categories = signal<any[]>([]);
  customers = signal<any[]>([]);
  cart = signal<CartItem[]>([]);

  // Layout preference mode
  layoutMode = signal<'sw-layout-3' | 'list-layout'>('sw-layout-3');

  // Filters
  searchQuery = signal<string>('');
  selectedCategory = signal<number>(0);

  // checkout state
  selectedCustomerId = 0;
  discountAmount = 0;
  taxAmount = 0;
  shippingAmount = 0;
  subtotal = signal<number>(0);

  // Dynamic Settings
  gstPercentage = 5;
  shippingFixed = 100;
  shippingThreshold = 1500;
  hasUserEditedTax = false;
  hasUserEditedShipping = false;
  totalCost = signal<number>(0);
  totalProfit = signal<number>(0);
  totalProfitPercent = signal<number>(0);
  grandTotal = signal<number>(0);
  checkoutError = signal<string | null>(null);

  // Confirmation Modal & Payment
  confirmModalOpen = signal<boolean>(false);
  selectedPaymentMethod = 'Cash';

  // loadings
  loadingCheckout = signal<boolean>(false);
  loadingCustomer = signal<boolean>(false);
  customerModalOpen = signal<boolean>(false);
  loadingProducts = signal<boolean>(false);
  productsError = signal<string | null>(null);

  customerForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
  });

  // Local sizing choice map
  tempSelectedSizes: { [prodId: number]: string } = {};

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.isMobileView.set(window.innerWidth <= 768);
    }
    this.loadSettings();
    this.loadLayoutPreference();
    this.loadProducts();
    this.loadCategories();
    this.loadCustomers();
  }

  loadLayoutPreference() {
    const saved = localStorage.getItem('pos-layout-preference');
    if (saved === 'list-layout' || saved === 'sw-layout-3') {
      this.layoutMode.set(saved);
    } else {
      this.layoutMode.set('sw-layout-3');
    }
  }

  setLayoutMode(mode: 'sw-layout-3' | 'list-layout') {
    this.layoutMode.set(mode);
    localStorage.setItem('pos-layout-preference', mode);
  }

  loadProducts() {
    this.loadingProducts.set(true);
    this.productsError.set(null);
    const params = {
      q: this.searchQuery(),
      category: this.selectedCategory()
    };
    this.api.get('products', params)
      .pipe(
        finalize(() => this.loadingProducts.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            console.log(res.products);
            // Filter to active stock only or let POS render all
            this.products.set(res.products.filter((p: any) => p.status === 'active'));
          } else {
            this.productsError.set(res.message || 'Failed to load products.');
          }
        },
        error: (err) => {
          console.error('Failed to load products:', err);
          this.productsError.set(err.error?.error || 'Failed to load products.');
        }
      });
  }

  loadCategories() {
    this.api.get('categories').subscribe({
      next: (res) => {
        if (res.success) this.categories.set(res.categories.filter((c: any) => c.status === 'active'));
      }
    });
  }

  loadCustomers() {
    this.api.get('customers').subscribe({
      next: (res) => {
        if (res.success) this.customers.set(res.customers.filter((c: any) => c.status === 'active'));
      }
    });
  }

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.loadProducts();
  }

  onCategoryChange(val: number) {
    this.selectedCategory.set(Number(val));
    this.loadProducts();
  }

  onSizeSelect(product: any, event: any) {
    const size = event.target.value;
    if (size) {
      this.tempSelectedSizes[product.id] = size;
    } else {
      delete this.tempSelectedSizes[product.id];
    }
  }

  addToCart(product: any) {
    const selectedSize = this.tempSelectedSizes[product.id] || '';
    
    // If the product has variants, require size selection
    if (product.variants && product.variants.length > 0 && !selectedSize) {
      this.unsavedChangesService.alert(`Please select a size for ${product.name} before adding to cart.`, 'Size Required');
      return;
    }

    const cartList = [...this.cart()];
    
    // Check if item already exists in cart with the SAME size
    const existing = cartList.find(item => item.id === product.id && item.size === selectedSize);
    
    let maxStockLimit = product.stock_quantity;
    if (selectedSize && product.variants) {
      const v = product.variants.find((variant: any) => variant.size.toLowerCase() === selectedSize.toLowerCase());
      if (v) maxStockLimit = v.stock_quantity;
    }

    if (existing) {
      if (existing.quantity + 1 > maxStockLimit) {
        this.unsavedChangesService.alert(`Cannot add more. Stock limit for size ${selectedSize} is ${maxStockLimit}.`, 'Stock Limit Exceeded');
        return;
      }
      existing.quantity += 1;
    } else {
      cartList.push({
        id: product.id,
        code: product.code,
        name: product.name,
        price: Number(product.sales_price),
        cost: Number(product.purchase_price),
        quantity: 1,
        size: selectedSize,
        maxStock: maxStockLimit
      });
    }

    this.cart.set(cartList);
    this.calculateTotals();
  }

  updateQty(index: number, change: number) {
    const cartList = [...this.cart()];
    const item = cartList[index];

    if (item.quantity + change <= 0) {
      cartList.splice(index, 1);
    } else {
      if (item.quantity + change > item.maxStock) {
        this.unsavedChangesService.alert(`Cannot add more. Only ${item.maxStock} items available in stock.`, 'Stock Limit Exceeded');
        return;
      }
      item.quantity += change;
    }
    
    this.cart.set(cartList);
    this.calculateTotals();
  }

  calculateTotals() {
    let sub = 0;
    let cost = 0;
    this.cart().forEach(item => {
      sub += (item.quantity * item.price);
      cost += (item.quantity * item.cost);
    });

    this.subtotal.set(sub);
    this.totalCost.set(cost);

    if (!this.hasUserEditedTax) {
      const taxable = Math.max(0, sub - (this.discountAmount || 0));
      this.taxAmount = parseFloat((taxable * (this.gstPercentage / 100)).toFixed(2));
    }

    if (!this.hasUserEditedShipping) {
      this.shippingAmount = sub === 0 ? 0 : (sub >= this.shippingThreshold ? 0 : this.shippingFixed);
    }
    
    const profit = (sub - (this.discountAmount || 0)) - cost;
    this.totalProfit.set(profit);
    this.totalProfitPercent.set(cost > 0 ? (profit / cost * 100) : 100);

    const grand = sub - (this.discountAmount || 0) + (this.taxAmount || 0) + (this.shippingAmount || 0);
    this.grandTotal.set(grand > 0 ? grand : 0);
  }

  loadSettings() {
    this.api.get('settings').subscribe({
      next: (res) => {
        if (res.success && res.settings) {
          const gst = res.settings.find((s: any) => s.key_name === 'gst_percentage');
          const shipFixed = res.settings.find((s: any) => s.key_name === 'shipping_fixed');
          const shipThreshold = res.settings.find((s: any) => s.key_name === 'shipping_threshold');

          if (gst) this.gstPercentage = parseFloat(gst.value);
          if (shipFixed) this.shippingFixed = parseFloat(shipFixed.value);
          if (shipThreshold) this.shippingThreshold = parseFloat(shipThreshold.value);

          this.calculateTotals();
        }
      }
    });
  }

  onTaxChange(val: any) {
    const parsed = parseFloat(val);
    this.taxAmount = isNaN(parsed) ? 0 : parsed;
    this.hasUserEditedTax = true;
    this.calculateTotals();
  }

  onShippingChange(val: any) {
    const parsed = parseFloat(val);
    this.shippingAmount = isNaN(parsed) ? 0 : parsed;
    this.hasUserEditedShipping = true;
    this.calculateTotals();
  }

  openAddCustomerModal() {
    this.customerForm.reset();
    this.loadingCustomer.set(false);
    this.customerModalOpen.set(true);
  }

  closeAddCustomerModal() {
    this.customerModalOpen.set(false);
  }

  onCustomerSubmit() {
    if (this.customerForm.invalid) return;

    this.loadingCustomer.set(true);
    this.api.post('customers', { ...this.customerForm.value, source: 'POS' }).subscribe({
      next: (res) => {
        this.loadingCustomer.set(false);
        this.customerModalOpen.set(false);
        this.loadCustomers();
        
        // Auto select newly registered customer
        this.selectedCustomerId = res.customerId;
      },
      error: (err) => {
        this.loadingCustomer.set(false);
        this.unsavedChangesService.alert(err.error?.error || 'Failed to save customer.', 'Error');
      }
    });
  }

  getSelectedCustomer() {
    return this.customers().find(c => Number(c.id) === Number(this.selectedCustomerId));
  }

  onCheckout() {
    if (this.cart().length === 0) return;
    if (this.selectedCustomerId === 0) {
      this.checkoutError.set('Please select a customer for checkout.');
      return;
    }
    this.checkoutError.set(null);
    this.selectedPaymentMethod = 'Cash'; // Default selection
    this.confirmModalOpen.set(true);
  }

  closeConfirmModal() {
    this.confirmModalOpen.set(false);
  }

  confirmCheckout() {
    this.loadingCheckout.set(true);
    this.checkoutError.set(null);

    const payload = {
      customer_id: this.selectedCustomerId,
      subtotal: this.subtotal(),
      discount: this.discountAmount,
      tax: this.taxAmount,
      shipping: this.shippingAmount,
      grand_total: this.grandTotal(),
      items: this.cart(),
      payment_method: this.selectedPaymentMethod
    };

    this.api.post('sales', payload).subscribe({
      next: (res) => {
        this.loadingCheckout.set(false);
        this.confirmModalOpen.set(false);
        this.cart.set([]);
        this.discountAmount = 0;
        this.taxAmount = 0;
        this.shippingAmount = 0;
        this.subtotal.set(0);
        this.grandTotal.set(0);
        this.selectedPaymentMethod = 'Cash';
        this.hasUserEditedTax = false;
        this.hasUserEditedShipping = false;
        
        // Route to invoice viewer page!
        this.router.navigate([`/invoices/view/${res.invoiceId}`]);
      },
      error: (err) => {
        this.loadingCheckout.set(false);
        this.confirmModalOpen.set(false);
        this.checkoutError.set(err.error?.error || 'Checkout transaction failed.');
      }
    });
  }
}
