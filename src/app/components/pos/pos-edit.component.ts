import { Component, OnInit, signal, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { UnsavedChangesService } from '../../services/unsaved-changes.service';
import { ToastService } from '../../services/toast.service';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

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
  selector: 'app-pos-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="animate-fade-in no-print" style="max-width: 1200px; margin: 0 auto 20px auto;">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold m-0"><i class="fas fa-edit text-warning me-2"></i>Edit Completed Invoice</h4>
          <p class="text-muted m-0" *ngIf="originalInvoiceNumber()">Revising order: <strong>{{ originalInvoiceNumber() }}</strong></p>
        </div>
        <a routerLink="/invoices" class="btn btn-outline-secondary btn-sm"><i class="fas fa-arrow-left me-2"></i>Back to Ledger</a>
      </div>

      <div class="alert alert-danger border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
        <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
      </div>
    </div>

    <div class="animate-fade-in POS-grid-layout" *ngIf="invoiceLoaded()">
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
             [style.height]="isMobileView() ? 'auto' : 'calc(100vh - 180px)'">
          <!-- Search and Category Filters -->
          <div class="card glass-card border-0 p-3 mb-3">
            <div class="row g-2">
              <div class="col-md-6 col-sm-12">
                <div class="input-group input-group-sm position-relative">
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
                <div class="btn-group btn-group-sm w-100 gap-2 switchBtn" role="group" aria-label="Layout mode switcher">
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
          <div class="flex-grow-1 overflow-y-auto px-1 overflow-x-hidden">
            <div class="row g-3">
              <!-- Grid view -->
              <ng-container *ngIf="layoutMode() === 'sw-layout-3'">
                <div class="col-lg-4 col-md-4 col-sm-6 col-12 layout-transition-item" *ngFor="let prod of products()">
                  <div class="card glass-card border-0 h-100 overflow-hidden d-flex flex-column justify-content-between p-3 compact-card transition-all cursor-pointer"
                       (click)="addToCart(prod)"
                       style="border-radius: 12px;">
                    <div>
                      <img [src]="prod.image ? imageBaseUrl + prod.image : 'assets/placeholder.png'" 
                           (error)="handleImgError($event)"
                           class="w-100 object-fit-cover rounded mb-2 border" 
                           style="height: 100px;">
                      
                      <div class="fw-bold text-main" style="font-size: 0.88rem; line-height: 1.3;">{{ prod.name }}</div>
                      <div class="text-muted mb-2" style="font-size: 0.72rem;">
                        SKU: {{ prod.code }} | Available: {{ getDisplayStock(prod) }}
                      </div>
                    </div>

                    <div>
                      <!-- Sizes Selector -->
                      <div class="mb-2" *ngIf="prod.variants && prod.variants.length > 0">
                        <select class="form-select form-select-xs py-1" style="font-size: 0.75rem;" 
                                (change)="onSizeSelect(prod, $event)"
                                (click)="$event.stopPropagation()">
                          <option value="">Select Size</option>
                          <option *ngFor="let v of prod.variants" [value]="v.size" [disabled]="getDisplayVariantStock(prod, v) <= 0">
                            {{ v.size }} (Stock: {{ getDisplayVariantStock(prod, v) }})
                          </option>
                        </select>
                      </div>

                      <div class="d-flex justify-content-between align-items-center mt-2">
                        <span class="fw-extrabold text-primary" style="font-size: 0.95rem;">₹{{ prod.sales_price | number:'1.2-2' }}</span>
                        <button class="btn btn-xs btn-primary py-1 px-2 text-white rounded" 
                                (click)="addToCart(prod); $event.stopPropagation()" 
                                [disabled]="getDisplayStock(prod) <= 0">
                          <i class="fas fa-cart-plus"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </ng-container>

              <!-- List view -->
              <ng-container *ngIf="layoutMode() === 'list-layout'">
                <div class="col-12 layout-transition-item" *ngFor="let prod of products()">
                  <div class="card glass-card border-0 mb-2 p-2 list-item-card transition-all cursor-pointer"
                       (click)="addToCart(prod)"
                       style="border-radius: 10px;">
                    <div class="d-flex align-items-center gap-3 w-100">
                      <img [src]="prod.image ? imageBaseUrl + prod.image : 'assets/placeholder.png'" 
                           (error)="handleImgError($event)"
                           class="object-fit-cover rounded border" style="width: 70px; height: 70px; flex-shrink: 0;">
                      
                      <div class="flex-grow-1 min-w-0">
                        <div class="fw-bold text-main text-truncate" style="font-size: 0.9rem; line-height: 1.2;">{{ prod.name }}</div>
                        <div class="text-muted" style="font-size: 0.75rem;">
                          SKU: {{ prod.code }} | Available: <span class="fw-semibold">{{ getDisplayStock(prod) }}</span>
                        </div>
                      </div>
                      
                      <div class="d-flex align-items-center gap-3 ms-auto flex-shrink-0">
                        <div *ngIf="prod.variants && prod.variants.length > 0" style="width: 120px;">
                          <select class="form-select form-select-xs py-1" style="font-size: 0.75rem;" 
                                  (change)="onSizeSelect(prod, $event)"
                                  (click)="$event.stopPropagation()">
                            <option value="">Select Size</option>
                            <option *ngFor="let v of prod.variants" [value]="v.size" [disabled]="getDisplayVariantStock(prod, v) <= 0">
                              {{ v.size }} ({{ getDisplayVariantStock(prod, v) }})
                            </option>
                          </select>
                        </div>
                        
                        <span class="fw-extrabold text-primary" style="font-size: 0.95rem; min-width: 70px; text-align: right;">
                          ₹{{ prod.sales_price | number:'1.2-2' }}
                        </span>
                        
                        <button class="btn btn-sm btn-primary text-white rounded px-3 d-flex align-items-center gap-1 py-1.5" 
                                (click)="addToCart(prod); $event.stopPropagation()" 
                                [disabled]="getDisplayStock(prod) <= 0">
                          <i class="fas fa-cart-plus"></i> Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </ng-container>

              <div class="col-12 text-center text-muted py-5" *ngIf="products().length === 0">
                No active products matching criteria.
              </div>
            </div>
          </div>
        </div>

        <!-- Checkout Billing Panel (Right) -->
        <div class="col-lg-4 col-md-5" 
             [class.d-none]="isMobileView() && activeMobileTab() !== 'cart'">
          <div class="card glass-card border-0 p-4 d-flex flex-column justify-content-between" 
               [style.height]="isMobileView() ? 'auto' : 'calc(100vh - 180px)'">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold m-0"><i class="fas fa-shopping-cart text-primary me-2"></i>Edit Cart</h5>
                <span class="badge bg-warning text-dark rounded-pill">{{ cart().length }} Items</span>
              </div>

              <!-- Customer Select Details -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted mb-1" style="font-size: 0.75rem;">Customer Details</label>
                <select class="form-select form-select-sm" [(ngModel)]="selectedCustomerId">
                  <option value="0">Choose Customer</option>
                  <option *ngFor="let c of customers()" [value]="c.id">{{ c.name }} ({{ c.mobile }})</option>
                </select>
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
                          Profit: ₹{{ ((item.price - item.cost) * item.quantity) | number:'1.2-2' }}
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
                    <div class="d-flex align-items-center gap-1">
                      <span style="font-size: 0.72rem;" class="text-muted">Rate: ₹</span>
                      <input type="number" class="form-control form-control-xs py-0 px-1 border" style="width: 68px; font-size: 0.75rem;" [(ngModel)]="item.price" (ngModelChange)="calculateTotals()">
                    </div>
                    
                    <span class="fw-bold text-success" style="font-size: 0.85rem;">₹{{ (item.quantity * item.price) | number:'1.2-2' }}</span>
                  </div>
                </div>
                
                <div class="text-center text-muted py-5" *ngIf="cart().length === 0">
                  Cart is empty. Select products on the left.
                </div>
              </div>
            </div>

            <!-- Billing Calculations -->
            <div class="border-top pt-3">
              <div class="d-flex justify-content-between mb-1" style="font-size: 0.85rem;">
                <span class="text-muted">Subtotal:</span>
                <span class="fw-semibold">₹{{ subtotal() | number:'1.2-2' }}</span>
              </div>
              
              <div class="d-flex justify-content-between align-items-center mb-1" style="font-size: 0.85rem;">
                <span class="text-muted">Discount (₹):</span>
                <input type="number" class="form-control form-control-xs py-0 px-1 text-end border" style="width: 80px; font-size: 0.78rem;" [(ngModel)]="discountAmount" (ngModelChange)="calculateTotals()">
              </div>
              
              <div class="d-flex justify-content-between align-items-center mb-1" style="font-size: 0.85rem;">
                <span class="text-muted">GST / Taxes ({{ gstPercentage }}%):</span>
                <input type="number" class="form-control form-control-xs py-0 px-1 text-end border" style="width: 80px; font-size: 0.78rem;" [ngModel]="taxAmount" (ngModelChange)="onTaxChange($event)">
              </div>
              
              <div class="d-flex justify-content-between align-items-center mb-2" style="font-size: 0.85rem;">
                <span class="text-muted">Shipping (₹):</span>
                <input type="number" class="form-control form-control-xs py-0 px-1 text-end border" style="width: 80px; font-size: 0.78rem;" [ngModel]="shippingAmount" (ngModelChange)="onShippingChange($event)">
              </div>

              <div class="d-flex justify-content-between mb-3 align-items-center pt-2 border-top border-secondary border-opacity-10">
                <span class="text-success fw-bold">Est. Profit:</span>
                <span class="fw-bold" [class.text-success]="totalProfit() >= 0" [class.text-danger]="totalProfit() < 0" style="font-size: 1.15rem;">
                  ₹{{ totalProfit() | number:'1.2-2' }}
                </span>
              </div>

              <div class="d-flex justify-content-between align-items-center border-top py-2 mb-3">
                <span class="fw-bold">Grand Total:</span>
                <span class="fw-extrabold text-success fs-4">₹{{ grandTotal() | number:'1.2-2' }}</span>
              </div>

              <div class="alert alert-danger border-0 p-2 mb-2 rounded" style="font-size: 0.78rem;" *ngIf="checkoutError()">
                <i class="fas fa-exclamation-circle me-1"></i>{{ checkoutError() }}
              </div>

              <button class="btn btn-warning w-100 py-2 rounded text-dark fw-bold" [disabled]="cart().length === 0 || selectedCustomerId === 0 || loadingCheckout()" (click)="openConfirmModal()">
                <i class="fas fa-check-circle me-2"></i>Save Revised Order
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Revision Edit Confirmation Modal -->
      <div class="modal fade" id="revisionConfirmModal" tabindex="-1" aria-hidden="true" [class.show]="confirmModalOpen()" [style.display]="confirmModalOpen() ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5); z-index: 1060;">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; background-color: var(--bg-sidebar);">
            <div class="modal-header bg-light-subtle py-3 border-bottom-0">
              <h5 class="modal-title fw-bold text-main"><i class="fas fa-receipt text-warning me-2"></i>Confirm Invoice Revision</h5>
              <button type="button" class="btn-close" (click)="closeConfirmModal()"></button>
            </div>
            
            <div class="modal-body p-4 text-main">
              <!-- Summary box -->
              <div class="card bg-light-subtle border-0 p-3 mb-3">
                <div class="d-flex justify-content-between align-items-center text-success fw-bold mb-1" style="font-size: 1.15rem;">
                  <span>New Grand Total:</span>
                  <span>₹{{ grandTotal() | number:'1.2-2' }}</span>
                </div>
                <div class="text-muted small">This action will reverse previous inventory deductions, calculate new quantities, update reports, and generate a revised suffix invoice (e.g. {{ originalInvoiceNumber() }}-REV).</div>
              </div>

              <!-- Reason Input -->
              <div class="mb-3">
                <label class="form-label fw-bold text-muted mb-1" style="font-size: 0.75rem;">REASON FOR EDIT (REQUIRED)</label>
                <textarea class="form-control" rows="3" [(ngModel)]="editReason" placeholder="Enter reason for modifying this completed POS order..."></textarea>
                <div class="text-danger small mt-1" *ngIf="showReasonError()">Reason for edit is required.</div>
              </div>

              <!-- Payment Method Selector -->
              <div class="mb-3">
                <h6 class="fw-bold mb-2 text-muted" style="font-size: 0.75rem; letter-spacing: 0.5px; text-transform: uppercase;">
                  Payment Method
                </h6>
                <div class="row g-2">
                  <div class="col-6">
                    <div class="border rounded p-3 d-flex flex-column align-items-center justify-content-center cursor-pointer"
                         [style.border]="selectedPaymentMethod === 'Cash' ? '2.5px solid var(--accent-success) !important' : '1px solid var(--border-color)'"
                         [style.background-color]="selectedPaymentMethod === 'Cash' ? 'rgba(16, 185, 129, 0.08)' : ''"
                         (click)="selectedPaymentMethod = 'Cash'"
                         style="transition: var(--transition-smooth); cursor: pointer; border-radius: 10px;">
                      <i class="fas fa-money-bill-wave text-success fs-4 mb-2"></i>
                      <span class="fw-bold text-main" style="font-size: 0.82rem;">Cash</span>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="border rounded p-3 d-flex flex-column align-items-center justify-content-center cursor-pointer"
                         [style.border]="selectedPaymentMethod === 'GPay' ? '2.5px solid var(--accent-primary) !important' : '1px solid var(--border-color)'"
                         [style.background-color]="selectedPaymentMethod === 'GPay' ? 'rgba(99, 102, 241, 0.08)' : ''"
                         (click)="selectedPaymentMethod = 'GPay'"
                         style="transition: var(--transition-smooth); cursor: pointer; border-radius: 10px;">
                      <i class="fab fa-google-pay text-primary mb-1" style="font-size: 2.2rem; line-height: 1; height: 26px;"></i>
                      <span class="fw-bold text-main" style="font-size: 0.82rem;">GPay</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer bg-light-subtle border-top-0 py-3">
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="closeConfirmModal()">Cancel</button>
              <button type="button" class="btn btn-warning btn-sm text-dark fw-bold px-4" (click)="submitRevision()" [disabled]="loadingCheckout()">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loadingCheckout()"></span>
                Submit Revision
              </button>
            </div>
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
export class PosEditComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private unsavedChangesService = inject(UnsavedChangesService);
  private toastService = inject(ToastService);
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
    if (this.isFormDirty()) {
      $event.returnValue = true;
    }
  }

  canDeactivate(): boolean | Observable<boolean> {
    if (this.isFormDirty()) {
      return this.unsavedChangesService.confirm();
    }
    return true;
  }

  invoiceId: number | null = null;
  invoiceLoaded = signal<boolean>(false);
  originalInvoiceNumber = signal<string>('');
  errorMessage = signal<string | null>(null);

  products = signal<any[]>([]);
  categories = signal<any[]>([]);
  customers = signal<any[]>([]);
  cart = signal<CartItem[]>([]);
  originalCartItems: any[] = []; // To compute dirty state and stock recalculations

  layoutMode = signal<'sw-layout-3' | 'list-layout'>('sw-layout-3');

  searchQuery = signal<string>('');
  selectedCategory = signal<number>(0);

  selectedCustomerId = 0;
  discountAmount = 0;
  taxAmount = 0;
  shippingAmount = 0;
  subtotal = signal<number>(0);

  gstPercentage = 5;
  shippingFixed = 100;
  shippingThreshold = 1500;
  hasUserEditedTax = false;
  hasUserEditedShipping = false;
  totalCost = signal<number>(0);
  totalProfit = signal<number>(0);
  grandTotal = signal<number>(0);
  checkoutError = signal<string | null>(null);

  confirmModalOpen = signal<boolean>(false);
  selectedPaymentMethod = 'Cash';
  editReason = '';
  showReasonError = signal<boolean>(false);

  loadingCheckout = signal<boolean>(false);

  tempSelectedSizes: { [prodId: number]: string } = {};
  posEditLockHours = 24;
  saleCreatedAt: string | null = null;

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.isMobileView.set(window.innerWidth <= 768);
    }
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.invoiceId = Number(id);
        this.loadSettings();
        this.loadLayoutPreference();
        this.loadCategories();
        this.loadCustomers();
      }
    });
  }

  isFormDirty(): boolean {
    if (this.loadingCheckout()) return false;
    // Compare cart changes to original cart items
    const current = this.cart();
    if (current.length !== this.originalCartItems.length) return true;
    for (const item of current) {
      const orig = this.originalCartItems.find(o => o.product_id === item.id && o.size === item.size);
      if (!orig) return true;
      if (orig.quantity !== item.quantity || orig.rate !== item.price) return true;
    }
    return false;
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
    const params = {
      q: this.searchQuery(),
      category: this.selectedCategory()
    };
    this.api.get('products', params).subscribe({
      next: (res) => {
        if (res.success) {
          this.products.set(res.products.filter((p: any) => p.status === 'active'));
        }
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
        if (res.success) {
          this.customers.set(res.customers.filter((c: any) => c.status === 'active'));
          // Once customer catalog loaded, load the invoice
          if (this.invoiceId) {
            this.loadInvoice(this.invoiceId);
          }
        }
      }
    });
  }

  loadInvoice(id: number) {
    this.api.get(`sales/${id}`).subscribe({
      next: (res) => {
        if (res.success && res.sale) {
          const sale = res.sale;
          if (['Cancelled', 'Revised', 'Superseded'].includes(sale.status)) {
            this.errorMessage.set(`This invoice status is already '${sale.status}' and cannot be edited.`);
            return;
          }
          this.saleCreatedAt = sale.created_at;
          this.checkLockDuration();
          if (this.errorMessage()) {
            return;
          }
          this.originalInvoiceNumber.set(sale.invoice_number);
          this.selectedCustomerId = sale.customer_id;
          this.discountAmount = Number(sale.discount || 0);
          this.taxAmount = Number(sale.gst_amount || 0);
          this.shippingAmount = Number(sale.shipping_charge || 0);
          this.selectedPaymentMethod = sale.payment_method || 'Cash';
          
          this.hasUserEditedTax = true; // Keep tax amount as saved
          this.hasUserEditedShipping = true; // Keep shipping charge as saved
          
          this.originalCartItems = sale.items || [];
          
          // Map loaded items to cart structure
          const mappedItems: CartItem[] = (sale.items || []).map((item: any) => {
            return {
              id: item.product_id,
              code: item.product_code,
              name: item.product_name,
              price: Number(item.rate),
              cost: Number(item.purchase_price || item.cost_price || 0),
              quantity: Number(item.quantity),
              size: item.size || '',
              maxStock: 99999 // Overridden once catalog products load
            };
          });
          
          this.cart.set(mappedItems);
          
          // Load catalog products to resolve exact stocks
          this.loadProducts();
          this.invoiceLoaded.set(true);
          
          setTimeout(() => {
            this.resolveCartMaxStocks();
          }, 600);
        }
      },
      error: (err) => {
        this.errorMessage.set(err.error?.error || 'Failed to load completed invoice.');
      }
    });
  }

  resolveCartMaxStocks() {
    const cartList = [...this.cart()];
    this.products().forEach(p => {
      cartList.forEach(item => {
        if (item.id === p.id) {
          // Find if there's variant sizing
          let stock = p.stock_quantity;
          if (item.size && p.variants) {
            const v = p.variants.find((variant: any) => variant.size.toLowerCase() === item.size.toLowerCase());
            if (v) stock = v.stock_quantity;
          }
          // Max stock includes what was already purchased in the original invoice
          const originalItem = this.originalCartItems.find(o => o.product_id === item.id && o.size === item.size);
          const originalQty = originalItem ? Number(originalItem.quantity) : 0;
          
          item.maxStock = stock + originalQty;
          item.cost = Number(p.purchase_price);
        }
      });
    });
    this.cart.set(cartList);
    this.calculateTotals();
  }

  // Adjust display stock in search grid to include original purchased quantities
  getDisplayStock(prod: any): number {
    let stock = prod.stock_quantity;
    const itemsInOriginal = this.originalCartItems.filter(o => o.product_id === prod.id);
    const sumQty = itemsInOriginal.reduce((acc, curr) => acc + Number(curr.quantity), 0);
    return stock + sumQty;
  }

  getDisplayVariantStock(prod: any, variant: any): number {
    let stock = variant.stock_quantity;
    const originalItem = this.originalCartItems.find(o => o.product_id === prod.id && o.size.toLowerCase() === variant.size.toLowerCase());
    const originalQty = originalItem ? Number(originalItem.quantity) : 0;
    return stock + originalQty;
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
    
    if (product.variants && product.variants.length > 0 && !selectedSize) {
      this.unsavedChangesService.alert(`Please select a size for ${product.name} before adding.`, 'Size Required');
      return;
    }

    const cartList = [...this.cart()];
    const existing = cartList.find(item => item.id === product.id && item.size === selectedSize);
    
    // Resolve stock limit
    let availableStock = product.stock_quantity;
    if (selectedSize && product.variants) {
      const v = product.variants.find((variant: any) => variant.size.toLowerCase() === selectedSize.toLowerCase());
      if (v) availableStock = v.stock_quantity;
    }
    const originalItem = this.originalCartItems.find(o => o.product_id === product.id && o.size === selectedSize);
    const originalQty = originalItem ? Number(originalItem.quantity) : 0;
    const maxStockLimit = availableStock + originalQty;

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
        this.unsavedChangesService.alert(`Cannot add more. Only ${item.maxStock} items available.`, 'Stock Limit Exceeded');
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
          const lockHoursSetting = res.settings.find((s: any) => s.key_name === 'pos_edit_lock_hours');

          if (gst) this.gstPercentage = parseFloat(gst.value);
          if (shipFixed) this.shippingFixed = parseFloat(shipFixed.value);
          if (shipThreshold) this.shippingThreshold = parseFloat(shipThreshold.value);
          if (lockHoursSetting) this.posEditLockHours = parseFloat(lockHoursSetting.value);

          this.calculateTotals();
          this.checkLockDuration();
        }
      }
    });
  }

  checkLockDuration() {
    if (!this.saleCreatedAt) return;
    const originalTime = new Date(this.saleCreatedAt).getTime();
    const nowTime = Date.now();
    const diffHours = (nowTime - originalTime) / (1000 * 60 * 60);
    if (diffHours > this.posEditLockHours) {
      this.errorMessage.set(`Editing is locked for this invoice because it was created more than ${this.posEditLockHours} hours ago.`);
    }
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

  openConfirmModal() {
    this.editReason = '';
    this.showReasonError.set(false);
    this.confirmModalOpen.set(true);
  }

  closeConfirmModal() {
    this.confirmModalOpen.set(false);
  }

  submitRevision() {
    if (!this.editReason.trim()) {
      this.showReasonError.set(true);
      return;
    }
    this.showReasonError.set(false);
    this.loadingCheckout.set(true);
    this.checkoutError.set(null);

    const payload = {
      customer_id: this.selectedCustomerId,
      subtotal: this.subtotal(),
      discount: this.discountAmount,
      tax: this.taxAmount,
      shipping: this.shippingAmount,
      grand_total: this.grandTotal(),
      payment_method: this.selectedPaymentMethod,
      reason: this.editReason,
      items: this.cart()
    };

    this.api.post(`sales/${this.invoiceId}/edit`, payload).subscribe({
      next: (res: any) => {
        this.loadingCheckout.set(false);
        this.confirmModalOpen.set(false);
        if (res.success) {
          this.toastService.show(res.message || 'Invoice revised successfully!', 'success');
          // Navigate to new invoice view
          this.router.navigate([`/invoices/view/${res.invoiceId}`]);
        }
      },
      error: (err) => {
        this.loadingCheckout.set(false);
        this.checkoutError.set(err.error?.error || 'Failed to submit revised order.');
      }
    });
  }

  handleImgError(event: any) {
    event.target.src = 'assets/placeholder.png';
  }
}
