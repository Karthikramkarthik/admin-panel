import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { LoaderComponent } from '../loader/loader.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HasPermissionDirective, LoaderComponent],
  template: `
    <div class="animate-fade-in h-100">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold m-0">E-Commerce Orders</h4>
          <p class="text-muted m-0">Fulfill e-commerce shipments, track statuses, and reverse cancellations/returns</p>
        </div>
      </div>

      <div class="alert alert-danger border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
        <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
      </div>
      
      <div class="alert alert-success border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="successMessage()">
        <i class="fas fa-check-circle me-2"></i>{{ successMessage() }}
      </div>

      <!-- Stat Cards / Order Dashboard -->
      <div class="row g-4 mb-4">
        <!-- Total Orders -->
        <div class="col-lg-2 col-md-4 col-sm-6" (click)="selectStatusFilter('')" style="cursor: pointer;">
          <div class="card glass-card border-0 p-3 h-100 d-flex flex-column justify-content-between" 
               [style.border]="statusFilter === '' ? '2px solid var(--accent-primary) !important' : '1px solid var(--glass-border)'">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <span class="text-uppercase text-muted fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Total Orders</span>
                <h3 class="fw-extrabold m-0 mt-1">{{ summaryStats().total }}</h3>
              </div>
              <div class="icon-shape bg-primary bg-opacity-10 text-primary rounded-circle p-2" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-shopping-bag"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Pending Orders -->
        <div class="col-lg-2 col-md-4 col-sm-6" (click)="selectStatusFilter('Pending')" style="cursor: pointer;">
          <div class="card glass-card border-0 p-3 h-100 d-flex flex-column justify-content-between" 
               [style.border]="statusFilter === 'Pending' ? '2px solid var(--accent-warning) !important' : '1px solid var(--glass-border)'">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <span class="text-uppercase text-muted fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Pending</span>
                <h3 class="fw-extrabold m-0 mt-1 text-warning">{{ summaryStats().pending }}</h3>
              </div>
              <div class="icon-shape bg-warning bg-opacity-10 text-warning rounded-circle p-2" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-clock"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Processing Orders -->
        <div class="col-lg-2 col-md-4 col-sm-6" (click)="selectStatusFilter('Processing')" style="cursor: pointer;">
          <div class="card glass-card border-0 p-3 h-100 d-flex flex-column justify-content-between" 
               [style.border]="statusFilter === 'Processing' ? '2px solid var(--accent-primary) !important' : '1px solid var(--glass-border)'">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <span class="text-uppercase text-muted fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Processing</span>
                <h3 class="fw-extrabold m-0 mt-1 text-primary">{{ summaryStats().processing }}</h3>
              </div>
              <div class="icon-shape bg-primary bg-opacity-10 text-primary rounded-circle p-2" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-cog"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Completed Orders -->
        <div class="col-lg-2 col-md-4 col-sm-6" (click)="selectStatusFilter('Delivered')" style="cursor: pointer;">
          <div class="card glass-card border-0 p-3 h-100 d-flex flex-column justify-content-between" 
               [style.border]="statusFilter === 'Delivered' ? '2px solid var(--accent-success) !important' : '1px solid var(--glass-border)'">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <span class="text-uppercase text-muted fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Completed</span>
                <h3 class="fw-extrabold m-0 mt-1 text-success">{{ summaryStats().completed }}</h3>
              </div>
              <div class="icon-shape bg-success bg-opacity-10 text-success rounded-circle p-2" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-check-circle"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Cancelled Orders -->
        <div class="col-lg-2 col-md-4 col-sm-6" (click)="selectStatusFilter('Cancelled')" style="cursor: pointer;">
          <div class="card glass-card border-0 p-3 h-100 d-flex flex-column justify-content-between" 
               [style.border]="statusFilter === 'Cancelled' ? '2px solid var(--accent-danger) !important' : '1px solid var(--glass-border)'">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <span class="text-uppercase text-muted fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Cancelled</span>
                <h3 class="fw-extrabold m-0 mt-1 text-danger">{{ summaryStats().cancelled }}</h3>
              </div>
              <div class="icon-shape bg-danger bg-opacity-10 text-danger rounded-circle p-2" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-times-circle"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Returned Orders -->
        <div class="col-lg-2 col-md-4 col-sm-6" (click)="selectStatusFilter('Returned')" style="cursor: pointer;">
          <div class="card glass-card border-0 p-3 h-100 d-flex flex-column justify-content-between" 
               [style.border]="statusFilter === 'Returned' ? '2px solid var(--text-muted) !important' : '1px solid var(--glass-border)'">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <span class="text-uppercase text-muted fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Returned</span>
                <h3 class="fw-extrabold m-0 mt-1 text-secondary">{{ summaryStats().returned }}</h3>
              </div>
              <div class="icon-shape bg-secondary bg-opacity-10 text-secondary rounded-circle p-2" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-undo"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="card glass-card border-0 p-4 mb-4 shadow-sm">
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="form-label fw-semibold text-muted" style="font-size: 0.8rem;">Search Orders</label>
            <div class="input-group">
              <span class="input-group-text bg-light border-end-0"><i class="fas fa-search text-muted"></i></span>
              <input type="text" class="form-control border-start-0 ps-0" [(ngModel)]="searchQuery" (ngModelChange)="onFilterChange()" placeholder="Order ID, Customer Mobile, Name...">
            </div>
          </div>
          
          <div class="col-md-3">
            <label class="form-label fw-semibold text-muted" style="font-size: 0.8rem;">Status</label>
            <select class="form-select" [(ngModel)]="statusFilter" (change)="onFilterChange()">
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Returned">Returned</option>
            </select>
          </div>

          <div class="col-md-2">
            <label class="form-label fw-semibold text-muted" style="font-size: 0.8rem;">Start Date</label>
            <input type="date" class="form-control" [(ngModel)]="startDate" (change)="onFilterChange()">
          </div>

          <div class="col-md-2">
            <label class="form-label fw-semibold text-muted" style="font-size: 0.8rem;">End Date</label>
            <input type="date" class="form-control" [(ngModel)]="endDate" (change)="onFilterChange()">
          </div>

          <div class="col-md-1">
            <button class="btn btn-outline-secondary w-100" (click)="resetFilters()" title="Reset Filters">
              <i class="fas fa-undo"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Orders Grid -->
      <div class="card glass-card border-0 shadow-sm overflow-hidden position-relative" style="min-height: 200px;">
        <div class="table-responsive">
          <table class="custom-table m-0">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Payment</th>
                <th>Grand Total</th>
                <th>Date</th>
                <th>Status</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody *ngIf="orders().length > 0">
              <tr *ngFor="let order of orders()">
                <td class="fw-bold text-primary">{{ order.order_number }}</td>
                <td>
                  <div class="fw-semibold text-main">{{ order.customer_name }}</div>
                  <small class="text-muted" style="font-size: 0.72rem;">{{ order.customer_mobile }}</small>
                </td>
                <td><span class="badge bg-light text-muted border">{{ order.payment_method }}</span></td>
                <td class="fw-semibold text-success">₹{{ order.grand_total | number:'1.2-2' }}</td>
                <td>{{ order.order_date }}</td>
                <td>
                  <span class="badge rounded-pill fw-semibold" [ngClass]="getStatusBadgeClass(order.status)" style="font-size: 0.72rem; padding: 0.35em 0.8em;">
                    {{ order.status }}
                  </span>
                </td>
                <td class="text-end">
                  <button class="btn btn-sm btn-primary me-2" (click)="viewDetails(order.id)" title="View Details / Invoice">
                    <i class="fas fa-file-invoice-dollar me-1"></i>Details
                  </button>
                  <button class="btn btn-sm btn-outline-danger" (click)="deleteOrder(order)" title="Delete Order" *appHasPermission="['Orders', 'Delete']">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <app-loader 
          [loading]="loading()" 
          [isEmpty]="!loading() && !errorMessage() && orders().length === 0" 
          [error]="errorMessage()" 
          (retry)="loadOrders()"
          emptyMessage="No e-commerce orders found matching the filter criteria.">
        </app-loader>
      </div>

      <!-- Details Drawer/Modal -->
      <div class="modal fade" id="orderDetailsModal" tabindex="-1" aria-hidden="true" [class.show]="modalOpen()" [style.display]="modalOpen() ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; background-color: var(--bg-sidebar);">
            <div class="modal-header bg-light-subtle py-3 border-bottom-0">
              <h5 class="modal-title fw-bold">Order Details: {{ activeOrder()?.order_number }}</h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            
            <div class="modal-body p-4 overflow-y-auto" style="max-height: 70vh;" *ngIf="activeOrder()">
              <!-- Customer & Shipping Header -->
              <div class="row g-4 mb-4">
                <div class="col-md-6">
                  <div class="card bg-light-subtle border-0 p-3 h-100">
                    <h6 class="fw-bold mb-2"><i class="fas fa-user text-primary me-2"></i>Customer Information</h6>
                    <div class="fw-semibold text-main">{{ activeOrder()?.customer_name }}</div>
                    <div class="text-muted style-small mt-1"><i class="fas fa-phone me-1"></i>{{ activeOrder()?.customer_mobile }}</div>
                    <div class="text-muted style-small" *ngIf="activeOrder()?.customer_email"><i class="fas fa-envelope me-1"></i>{{ activeOrder()?.customer_email }}</div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="card bg-light-subtle border-0 p-3 h-100">
                    <h6 class="fw-bold mb-2"><i class="fas fa-map-marker-alt text-primary me-2"></i>Shipping Address</h6>
                    <p class="text-muted m-0" style="font-size: 0.8rem; line-height: 1.4;">{{ activeOrder()?.shipping_address }}</p>
                  </div>
                </div>
              </div>

              <!-- Product list -->
              <div class="mb-4">
                <h6 class="fw-bold mb-2"><i class="fas fa-box text-primary me-2"></i>Products Ordered</h6>
                <div class="table-responsive border rounded bg-white">
                  <table class="table table-hover table-striped align-middle m-0" style="font-size: 0.85rem;">
                    <thead>
                      <tr class="table-light">
                        <th>Product</th>
                        <th>Code</th>
                        <th class="text-end">Price</th>
                        <th class="text-center">Qty</th>
                        <th class="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let item of activeOrder()?.items">
                        <td class="fw-semibold">
                          <div>{{ item.product_name }}</div>
                          <div class="text-muted small" style="font-size: 0.75rem;">
                            Size: <strong>{{ item.size || 'General' }}</strong>
                            <span *ngIf="item.color"> • Color: <strong>{{ item.color }}</strong></span>
                          </div>
                        </td>
                        <td><span class="badge bg-light text-muted border">{{ item.product_code }}</span></td>
                        <td class="text-end">₹{{ item.price | number:'1.2-2' }}</td>
                        <td class="text-center">{{ item.quantity }}</td>
                        <td class="text-end fw-semibold">₹{{ item.total | number:'1.2-2' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Calculation grid -->
              <div class="row g-3 justify-content-end mb-4">
                <div class="col-md-5">
                  <div class="card bg-light-subtle border-0 p-3" style="font-size: 0.85rem;">
                    <div class="d-flex justify-content-between mb-2">
                      <span class="text-muted">Subtotal:</span>
                      <span class="fw-semibold">₹{{ activeOrder()?.subtotal | number:'1.2-2' }}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2 text-danger" *ngIf="activeOrder()?.discount > 0">
                      <span>Discount:</span>
                      <span>-₹{{ activeOrder()?.discount | number:'1.2-2' }}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                      <span class="text-muted">GST (5%):</span>
                      <span class="fw-semibold">₹{{ activeOrder()?.gst_amount | number:'1.2-2' }}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                      <span class="text-muted">Shipping Charge:</span>
                      <span class="fw-semibold">₹{{ activeOrder()?.shipping_charge | number:'1.2-2' }}</span>
                    </div>
                    <hr class="my-2">
                    <div class="d-flex justify-content-between text-success fw-bold" style="font-size: 1rem;">
                      <span>Grand Total:</span>
                      <span>₹{{ activeOrder()?.grand_total | number:'1.2-2' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Status Action Flow -->
              <div class="border-top pt-4">
                <h6 class="fw-bold mb-3"><i class="fas fa-route text-primary me-2"></i>Update Order Status</h6>
                
                <!-- Display status badge -->
                <div class="d-flex align-items-center gap-3 mb-3">
                  <span class="text-muted">Current status:</span>
                  <span class="badge rounded-pill fw-semibold" [ngClass]="getStatusBadgeClass(activeOrder()?.status)" style="font-size: 0.85rem; padding: 0.35em 0.8em;">
                    {{ activeOrder()?.status }}
                  </span>
                </div>

                <!-- Action buttons -->
                <div class="d-flex flex-wrap gap-2">
                  <button class="btn btn-sm btn-outline-primary" [disabled]="activeOrder()?.status !== 'Pending'" (click)="updateStatus('Processing')">
                    <i class="fas fa-cog me-1"></i>Accept & Process
                  </button>
                  <button class="btn btn-sm btn-outline-info" [disabled]="activeOrder()?.status !== 'Processing'" (click)="updateStatus('Shipped')">
                    <i class="fas fa-truck-moving me-1"></i>Ship Order
                  </button>
                  <button class="btn btn-sm btn-outline-success" [disabled]="activeOrder()?.status !== 'Shipped'" (click)="updateStatus('Delivered')">
                    <i class="fas fa-check-circle me-1"></i>Deliver Order
                  </button>
                  <button class="btn btn-sm btn-outline-danger" [disabled]="activeOrder()?.status === 'Delivered' || activeOrder()?.status === 'Cancelled' || activeOrder()?.status === 'Returned'" (click)="updateStatus('Cancelled')">
                    <i class="fas fa-ban me-1"></i>Cancel Order
                  </button>
                  <button class="btn btn-sm btn-outline-secondary" [disabled]="activeOrder()?.status !== 'Delivered'" (click)="updateStatus('Returned')">
                    <i class="fas fa-undo me-1"></i>Return Order
                  </button>
                </div>
                
                <div class="alert alert-info border-0 p-3 mt-3 rounded" style="font-size: 0.8rem;" *ngIf="activeOrder()?.status === 'Cancelled'">
                  <i class="fas fa-info-circle me-2"></i>Note: This order has been **Cancelled**. The stock quantities for all its variant items have been successfully returned to inventory logs.
                </div>

                <div class="alert alert-secondary border-0 p-3 mt-3 rounded" style="font-size: 0.8rem;" *ngIf="activeOrder()?.status === 'Returned'">
                  <i class="fas fa-undo me-2"></i>Note: This order has been **Returned**. The stock quantities for all its variant items have been successfully returned to inventory logs.
                </div>
              </div>
            </div>
            
            <div class="modal-footer bg-light-subtle border-top-0 py-3">
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="closeModal()">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OrdersComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  orders = signal<any[]>([]);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  loading = signal<boolean>(false);
  modalOpen = signal<boolean>(false);
  activeOrder = signal<any | null>(null);

  // Stats Signal
  summaryStats = signal<any>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
    returned: 0
  });

  // Filters
  searchQuery = '';
  statusFilter = '';
  startDate = '';
  endDate = '';

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading.set(true);
    this.errorMessage.set(null);
    const params: any = {};
    if (this.searchQuery) params.q = this.searchQuery;
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.startDate) params.startDate = this.startDate;
    if (this.endDate) params.endDate = this.endDate;

    this.api.get('admin/orders', params)
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.orders.set(res.orders);
          } else {
            this.errorMessage.set(res.message || 'Failed to retrieve e-commerce orders.');
          }
        },
        error: (err) => {
          console.error('Failed to load orders:', err);
          this.errorMessage.set(err.error?.error || 'Failed to retrieve e-commerce orders.');
        }
      });

    this.loadSummary();
  }

  loadSummary() {
    this.api.get('admin/orders/summary').subscribe({
      next: (res) => {
        if (res.success) {
          this.summaryStats.set(res.summary);
        }
      },
      error: (err) => {
        console.error('Failed to load order summary:', err);
      }
    });
  }

  selectStatusFilter(status: string) {
    // If completed card is clicked, we set status filter to 'Delivered'
    this.statusFilter = status;
    this.onFilterChange();
  }

  onFilterChange() {
    this.loadOrders();
  }

  resetFilters() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.startDate = '';
    this.endDate = '';
    this.loadOrders();
  }

  viewDetails(id: number) {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.api.post(`admin/orders/${id}/invoice`, {}).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.router.navigate(['/invoices/view', res.saleId]);
        }
      },
      error: (err: any) => {
        this.errorMessage.set(err.error?.error || 'Failed to generate or retrieve invoice.');
      }
    });
  }

  deleteOrder(order: any) {
    if (order.status === 'Delivered') {
      alert('Cannot delete a completed (Delivered) order. Please cancel or return it first if needed.');
      return;
    }

    if (!confirm(`Are you sure you want to delete e-commerce order ${order.order_number}?`)) {
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.api.delete(`admin/orders/${order.id}`).subscribe({
      next: (res: any) => {
        this.successMessage.set(res.message);
        this.loadOrders();
      },
      error: (err: any) => {
        this.errorMessage.set(err.error?.error || 'Failed to delete order.');
      }
    });
  }

  updateStatus(status: string) {
    if (!this.activeOrder()) return;
    
    if (status === 'Cancelled' && !confirm('Are you sure you want to Cancel this order? This action will reverse stock deductions.')) {
      return;
    }

    if (status === 'Returned' && !confirm('Are you sure you want to mark this order as Returned? This action will restore items back to inventory.')) {
      return;
    }

    const orderId = this.activeOrder().id;
    this.api.put(`admin/orders/${orderId}/status`, { status }).subscribe({
      next: (res) => {
        if (res.success) {
          this.successMessage.set(res.message);
          this.closeModal();
          this.loadOrders();
        }
      },
      error: (err) => {
        this.errorMessage.set(err.error?.error || 'Failed to update order status.');
        this.closeModal();
      }
    });
  }

  closeModal() {
    this.modalOpen.set(false);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Pending': return 'bg-warning text-dark';
      case 'Processing': return 'bg-primary text-white';
      case 'Shipped': return 'bg-info text-white';
      case 'Delivered': return 'bg-success text-white';
      case 'Cancelled': return 'bg-danger text-white';
      case 'Returned': return 'bg-secondary text-white';
      default: return 'bg-secondary text-white';
    }
  }
}
