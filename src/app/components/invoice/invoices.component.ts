import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { UnsavedChangesService } from '../../services/unsaved-changes.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="animate-fade-in h-100">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold m-0">Sales & Invoices</h4>
          <p class="text-muted m-0">View invoices, track sales records, and review price audit logs</p>
        </div>
      </div>

      <!-- Tab selection -->
      <ul class="nav nav-pills mb-4" id="pills-tab" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link px-4 py-2" [class.active]="activeTab() === 'sales'" (click)="setTab('sales')">
            <i class="fas fa-receipt me-2"></i>Sales Invoices
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link px-4 py-2" [class.active]="activeTab() === 'audits'" (click)="setTab('audits')">
            <i class="fas fa-shield-halved me-2"></i>Price Audits Log
          </button>
        </li>
      </ul>

      <div class="alert alert-danger border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
        <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
      </div>
      
      <div class="alert alert-success border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="successMessage()">
        <i class="fas fa-check-circle me-2"></i>{{ successMessage() }}
      </div>

      <!-- Tab: Sales Invoices -->
      <div class="card glass-card border-0 shadow-sm overflow-hidden" *ngIf="activeTab() === 'sales'">
        <!-- Filters Row -->
        <div class="p-3 bg-light-subtle border-bottom no-print">
          <div class="row g-3 align-items-center">
            <!-- Search query -->
            <div class="col-md-4">
              <div class="search-box position-relative">
                <i class="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                <input type="text" class="form-control form-control-sm ps-5 py-2" style="padding-left: 40px !important;"
                       placeholder="Search by invoice number, customer..." [ngModel]="searchQuery()" (ngModelChange)="onSearchChange($event)">
              </div>
            </div>
            <!-- Payment Status filter -->
            <div class="col-md-4">
              <select class="form-select form-select-sm py-2" [ngModel]="paymentStatusFilter()" (ngModelChange)="onPaymentStatusChange($event)">
                <option value="">All Payment Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
            <!-- Invoice Status filter -->
            <div class="col-md-4">
              <select class="form-select form-select-sm py-2" [ngModel]="invoiceStatusFilter()" (ngModelChange)="onInvoiceStatusChange($event)">
                <option value="">All Invoice Statuses</option>
                <option value="Generated">Generated</option>
                <option value="Sent">Sent</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Revised">Revised</option>
                <option value="Superseded">Superseded</option>
              </select>
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="custom-table m-0">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Customer</th>
                <th>Subtotal</th>
                <th>Discount</th>
                <th>Taxes (GST)</th>
                <th>Grand Total</th>
                <th>Sales Date</th>
                <th>Payment Status</th>
                <th>Status</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let sale of filteredSales()">
                <td class="fw-bold">
                  <a [routerLink]="['/invoices/view', sale.id]" class="text-primary text-decoration-none">
                    {{ sale.invoice_number }}
                  </a>
                </td>
                <td>{{ sale.customer_name }} <br><span class="text-muted" style="font-size: 0.72rem;">{{ sale.customer_mobile }}</span></td>
                <td>₹{{ sale.subtotal | number:'1.2-2' }}</td>
                <td class="text-danger">-₹{{ sale.discount | number:'1.2-2' }}</td>
                <td>₹{{ sale.gst_amount | number:'1.2-2' }}</td>
                <td class="fw-extrabold text-success" style="font-size: 0.95rem;">₹{{ sale.grand_total | number:'1.2-2' }}</td>
                <td>{{ sale.sale_date }}</td>
                <td>
                  <span class="badge" 
                        [class.bg-warning]="sale.payment_status === 'Pending' || !sale.payment_status" 
                        [class.text-dark]="sale.payment_status === 'Pending' || !sale.payment_status"
                        [class.bg-success]="sale.payment_status === 'Paid'"
                        [style.cursor]="(sale.payment_status === 'Pending' || !sale.payment_status || auth.currentUser()?.role === 'Owner' || auth.currentUser()?.role === 'Admin') ? 'pointer' : 'default'"
                        (click)="onPaymentBadgeClick(sale)"
                        [title]="(sale.payment_status === 'Pending' || !sale.payment_status) ? 'Click to mark as Paid' : ((auth.currentUser()?.role === 'Owner' || auth.currentUser()?.role === 'Admin') ? 'Click to edit payment status' : 'Payment completed')">
                    <i class="fas fa-hourglass-half me-1 small" style="font-size: 0.7rem;" *ngIf="sale.payment_status === 'Pending' || !sale.payment_status"></i>
                    <i class="fas fa-check-circle me-1 small" style="font-size: 0.7rem;" *ngIf="sale.payment_status === 'Paid'"></i>
                    {{ sale.payment_status || 'Pending' }}
                  </span>
                  <div class="text-muted mt-1 font-monospace" style="font-size: 0.68rem; line-height: 1.3;" *ngIf="sale.payment_status === 'Paid'">
                    <span class="d-block fw-semibold text-secondary"><i class="fas fa-wallet me-1"></i>{{ sale.payment_method || 'Cash' }}</span>
                    <span class="d-block" *ngIf="sale.paid_at">{{ sale.paid_at | date:'dd-MM-yyyy' }}</span>
                  </div>
                </td>
                <td>
                  <span class="badge" 
                        [class.bg-warning]="sale.status === 'Generated' || !sale.status" 
                        [class.bg-success]="sale.status === 'Sent'"
                        [class.bg-danger]="sale.status === 'Cancelled'"
                        [class.bg-secondary]="sale.status === 'Revised'"
                        [class.bg-info]="sale.status === 'Superseded'">
                    {{ sale.status || 'Generated' }}
                  </span>
                </td>
                <td class="text-end">
                  <a [routerLink]="['/invoices/view', sale.id]" class="btn btn-sm btn-outline-info me-2">
                    <i class="fas fa-print"></i>
                  </a>
                  <a [routerLink]="['/invoices/edit', sale.id]" class="btn btn-sm btn-outline-warning me-2" *ngIf="(auth.currentUser()?.role === 'Owner' || auth.currentUser()?.role === 'Admin') && (sale.status === 'Generated' || sale.status === 'Sent' || !sale.status) && sale.payment_status !== 'Paid'">
                    <i class="fas fa-edit"></i>
                  </a>
                  <button class="btn btn-sm btn-outline-danger" (click)="deleteInvoice(sale.id)">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="filteredSales().length === 0">
                <td colspan="10" class="text-center text-muted py-4">No sales records found matching the filters.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab: Price Audits -->
      <div class="card glass-card border-0 shadow-sm overflow-hidden" *ngIf="activeTab() === 'audits'">
        <div class="table-responsive">
          <table class="custom-table m-0" style="font-size: 0.85rem;">
            <thead>
              <tr>
                <th>Audit Time</th>
                <th>Admin Name</th>
                <th>Product SKU</th>
                <th>Product Name</th>
                <th>Type</th>
                <th>Ref Invoice</th>
                <th>Catalog Price</th>
                <th>Transaction Price</th>
                <th>Deviation</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let aud of audits()">
                <td>{{ aud.created_at }}</td>
                <td class="fw-semibold">{{ aud.username }}</td>
                <td><span class="badge bg-light text-dark border">{{ aud.product_code }}</span></td>
                <td>{{ aud.product_name }}</td>
                <td>
                  <span class="badge" [class.bg-success]="aud.transaction_type === 'sale'" [class.bg-danger]="aud.transaction_type === 'purchase'">
                    {{ aud.transaction_type }}
                  </span>
                </td>
                <td class="fw-bold">{{ aud.reference_number }}</td>
                <td>₹{{ aud.original_price | number:'1.2-2' }}</td>
                <td class="fw-bold">₹{{ aud.edited_price | number:'1.2-2' }}</td>
                <td class="fw-extrabold" [class.text-danger]="aud.edited_price < aud.original_price" [class.text-success]="aud.edited_price > aud.original_price">
                  {{ aud.edited_price - aud.original_price > 0 ? '+' : '' }}₹{{ (aud.edited_price - aud.original_price) | number:'1.2-2' }}
                </td>
              </tr>
              <tr *ngIf="audits().length === 0">
                <td colspan="9" class="text-center text-muted py-4">No price deviation audits recorded. All transactions matched catalog prices perfectly.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Confirm Payment Modal -->
      <div class="modal fade" id="paymentModal" tabindex="-1" aria-hidden="true" [class.show]="showPaymentModal()" [style.display]="showPaymentModal() ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5); z-index: 1050;">
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; background-color: var(--bg-sidebar);">
            <div class="modal-header bg-light-subtle py-3 border-bottom-0">
              <h6 class="modal-title fw-bold text-main"><i class="fas fa-wallet text-success me-2"></i>{{ selectedSale()?.payment_status === 'Paid' ? 'Edit Payment Info' : 'Confirm Payment' }}</h6>
              <button type="button" class="btn-close" (click)="closePaymentModal()"></button>
            </div>
            <div class="modal-body p-4 text-main">
              <p class="small text-muted mb-3" *ngIf="selectedSale()">
                Invoice <strong>{{ selectedSale().invoice_number }}</strong> grand total: <strong>₹{{ selectedSale().grand_total | number:'1.2-2' }}</strong>.
              </p>
              
              <!-- Payment Status Select (Only for Owner/Admin) -->
              <div class="mb-3" *ngIf="auth.currentUser()?.role === 'Owner' || auth.currentUser()?.role === 'Admin'">
                <label class="form-label small fw-semibold text-muted">Payment Status</label>
                <select class="form-select form-select-sm" [(ngModel)]="newPaymentStatus">
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div class="mb-3" *ngIf="newPaymentStatus === 'Paid'">
                <label class="form-label small fw-semibold text-muted">Payment Method</label>
                <select class="form-select form-select-sm" [(ngModel)]="paymentMethod">
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Online">Online</option>
                </select>
              </div>
            </div>
            <div class="modal-footer bg-light-subtle border-top-0 py-3">
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="closePaymentModal()">Cancel</button>
              <button type="button" class="btn btn-success btn-sm fw-bold" [disabled]="updatingPayment()" (click)="confirmPayment()">
                <span class="spinner-border spinner-border-sm me-1" *ngIf="updatingPayment()"></span>
                {{ newPaymentStatus === 'Paid' ? 'Confirm Payment' : 'Update Status' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class InvoicesComponent implements OnInit {
  private api = inject(ApiService);
  private unsavedChangesService = inject(UnsavedChangesService);
  auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  sales = signal<any[]>([]);
  audits = signal<any[]>([]);
  activeTab = signal<string>('sales');

  // Filters state
  searchQuery = signal<string>('');
  paymentStatusFilter = signal<string>('');
  invoiceStatusFilter = signal<string>('');

  // Payment confirmation modal state
  showPaymentModal = signal<boolean>(false);
  selectedSale = signal<any>(null);
  paymentMethod = 'Cash';
  newPaymentStatus = 'Paid';
  updatingPayment = signal<boolean>(false);

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Computed filtered list
  filteredSales = computed(() => {
    let list = this.sales();
    const query = this.searchQuery().toLowerCase().trim();
    const payStatus = this.paymentStatusFilter();
    const invStatus = this.invoiceStatusFilter();

    if (query) {
      list = list.filter(sale => 
        sale.invoice_number.toLowerCase().includes(query) ||
        (sale.customer_name && sale.customer_name.toLowerCase().includes(query)) ||
        (sale.customer_mobile && sale.customer_mobile.includes(query))
      );
    }

    if (payStatus) {
      list = list.filter(sale => {
        const status = sale.payment_status || 'Pending';
        return status === payStatus;
      });
    }

    if (invStatus) {
      list = list.filter(sale => {
        const status = sale.status || 'Generated';
        return status === invStatus;
      });
    }

    return list;
  });

  ngOnInit() {
    this.loadSales();
    this.loadAudits();

    // Check query params to pre-apply filters (e.g. from Dashboard click)
    this.route.queryParams.subscribe(params => {
      if (params['paymentStatus']) {
        this.paymentStatusFilter.set(params['paymentStatus']);
      }
    });
  }

  loadSales() {
    this.api.get('sales').subscribe({
      next: (res) => {
        if (res.success) this.sales.set(res.sales);
      },
      error: (err) => console.error('Failed to load sales list:', err)
    });
  }

  loadAudits() {
    this.api.get('sales/price-audits').subscribe({
      next: (res) => {
        if (res.success) this.audits.set(res.audits);
      },
      error: (err) => console.error('Failed to load audits list:', err)
    });
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  deleteInvoice(id: number) {
    this.unsavedChangesService.confirmAction({
      message: 'Are you sure you want to delete this sales invoice? Reverting this invoice will add items back into catalog stock.',
      title: 'Confirm Deletion',
      confirmBtnText: 'Delete',
      type: 'danger'
    }).subscribe(confirmed => {
      if (!confirmed) return;

      this.errorMessage.set(null);
      this.successMessage.set(null);

      this.api.delete(`sales/${id}`).subscribe({
        next: (res) => {
          this.successMessage.set(res.message);
          this.loadSales();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.error || 'Failed to delete sales record.');
        }
      });
    });
  }

  // Filter change handlers
  onSearchChange(val: string) {
    this.searchQuery.set(val);
  }

  onPaymentStatusChange(val: string) {
    this.paymentStatusFilter.set(val);
  }

  onInvoiceStatusChange(val: string) {
    this.invoiceStatusFilter.set(val);
  }

  // Payment modal actions
  onPaymentBadgeClick(sale: any) {
    const isAuth = ['Owner', 'Admin'].includes(this.auth.currentUser()?.role || '');
    if (sale.payment_status === 'Paid' && !isAuth) return; // Locked

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.selectedSale.set(sale);
    this.newPaymentStatus = sale.payment_status || 'Pending';
    this.paymentMethod = sale.payment_method || 'Cash';
    if (!isAuth) {
      this.newPaymentStatus = 'Paid';
    }
    this.showPaymentModal.set(true);
  }

  closePaymentModal() {
    this.showPaymentModal.set(false);
    this.selectedSale.set(null);
  }

  confirmPayment() {
    if (!this.selectedSale()) return;

    this.updatingPayment.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const saleId = this.selectedSale().id;
    this.api.put(`sales/${saleId}/payment-status`, {
      payment_status: this.newPaymentStatus,
      payment_method: this.newPaymentStatus === 'Paid' ? this.paymentMethod : null
    }).subscribe({
      next: (res) => {
        this.updatingPayment.set(false);
        this.showPaymentModal.set(false);
        this.selectedSale.set(null);
        this.successMessage.set(res.message);
        this.loadSales();
      },
      error: (err) => {
        this.updatingPayment.set(false);
        this.errorMessage.set(err.error?.error || 'Failed to update payment status.');
      }
    });
  }
}
