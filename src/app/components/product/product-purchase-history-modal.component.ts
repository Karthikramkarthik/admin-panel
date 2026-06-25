import { Component, Input, Output, EventEmitter, signal, inject, OnChanges, SimpleChanges, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { CustomerHistoryModalService } from '../../services/customer-history-modal.service';
import { ProductPurchaseHistoryModalService } from '../../services/product-purchase-history-modal.service';

@Component({
  selector: 'app-product-purchase-history-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Product Purchase History Modal -->
    <div class="modal fade" id="productPurchaseHistoryModal" tabindex="-1" aria-hidden="true" [class.show]="isOpen" [style.display]="isOpen ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5); z-index: 1055;">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; background-color: #fff; max-height: 90vh; display: flex; flex-direction: column;">
          
          <!-- Modal Header -->
          <div class="modal-header bg-light py-3 border-bottom d-flex justify-content-between align-items-center">
            <div>
              <h5 class="modal-title fw-bold text-dark m-0">Product Purchase History: {{ productName }}</h5>
              <p class="text-muted small m-0">
                <i class="fas fa-barcode me-1"></i>Code: <code class="fw-bold">{{ productCode }}</code> &nbsp;|&nbsp;
                <span class="badge bg-light text-dark border">Catalog Analytics</span>
              </p>
            </div>
            <div class="d-flex align-items-center gap-2 me-4">
              <button class="btn btn-outline-success btn-xs py-1 px-2.5 fw-semibold d-flex align-items-center gap-1" (click)="exportCSV()" [disabled]="loading() || history().length === 0" style="font-size: 0.75rem;">
                <i class="fas fa-file-excel"></i><span>CSV</span>
              </button>
              <button class="btn btn-outline-danger btn-xs py-1 px-2.5 fw-semibold d-flex align-items-center gap-1" (click)="exportPDF()" [disabled]="loading() || history().length === 0" style="font-size: 0.75rem;">
                <i class="fas fa-file-pdf"></i><span>PDF</span>
              </button>
            </div>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>

          <!-- Modal Body with Scrollable Area -->
          <div class="modal-body p-4 overflow-y-auto" style="flex: 1;">
            
            <!-- Filters Panel -->
            <div class="card bg-light border-0 p-3 mb-4">
              <div class="row g-2.5 align-items-end">
                <div class="col-md-3 col-sm-6">
                  <label class="form-label fw-bold text-muted small mb-1">Customer Search</label>
                  <input type="text" class="form-control form-control-sm" placeholder="Name or mobile..." [(ngModel)]="filterCustomer" (input)="onFilterChange()">
                </div>
                <div class="col-md-2 col-sm-6">
                  <label class="form-label fw-bold text-muted small mb-1">Invoice/Order No</label>
                  <input type="text" class="form-control form-control-sm" placeholder="INV- or ORD-..." [(ngModel)]="filterInvoice" (input)="onFilterChange()">
                </div>
                <div class="col-md-2 col-sm-4">
                  <label class="form-label fw-bold text-muted small mb-1">Source</label>
                  <select class="form-select form-select-sm" [(ngModel)]="filterSource" (change)="onFilterChange()">
                    <option value="all">All Sources</option>
                    <option value="pos">POS Sales</option>
                    <option value="website">Website Orders</option>
                  </select>
                </div>
                <div class="col-md-2.5 col-sm-4">
                  <label class="form-label fw-bold text-muted small mb-1">Start Date</label>
                  <input type="date" class="form-control form-control-sm" [(ngModel)]="filterStartDate" (change)="onFilterChange()">
                </div>
                <div class="col-md-2.5 col-sm-4">
                  <label class="form-label fw-bold text-muted small mb-1">End Date</label>
                  <input type="date" class="form-control form-control-sm" [(ngModel)]="filterEndDate" (change)="onFilterChange()">
                </div>
              </div>
            </div>

            <!-- Printable wrapper for PDF export -->
            <div id="product-purchase-printable">
              
              <!-- Metrics Cards Row -->
              <div class="row g-3 mb-4" *ngIf="!loading() || history().length > 0">
                <div class="col-6">
                  <div class="card border border-light p-3 shadow-xs bg-light bg-opacity-50">
                    <div class="d-flex align-items-center gap-2">
                      <div class="rounded-circle bg-primary bg-opacity-10 text-primary p-2.5 d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
                        <i class="fas fa-users" style="font-size: 0.95rem;"></i>
                      </div>
                      <div>
                        <span class="text-muted small fw-semibold d-block">Unique Customers Count</span>
                        <h4 class="fw-bold m-0 text-primary">{{ summary().total_customers }}</h4>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="card border border-light p-3 shadow-xs bg-light bg-opacity-50">
                    <div class="d-flex align-items-center gap-2">
                      <div class="rounded-circle bg-success bg-opacity-10 text-success p-2.5 d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
                        <i class="fas fa-boxes" style="font-size: 0.95rem;"></i>
                      </div>
                      <div>
                        <span class="text-muted small fw-semibold d-block">Total Quantity Sold</span>
                        <h4 class="fw-bold m-0 text-success">{{ summary().total_quantity_sold }} units</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Loading spinner -->
              <div *ngIf="loading() && history().length === 0" class="text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="text-muted mt-2">Loading customer purchase records...</p>
              </div>

              <!-- Empty state -->
              <div *ngIf="!loading() && history().length === 0" class="text-center py-5 text-muted">
                <i class="fas fa-history fs-2 mb-2 d-block"></i>
                No customer purchase transactions logged for this product.
              </div>

              <!-- Table list -->
              <div class="table-responsive rounded border" *ngIf="history().length > 0">
                <table class="table table-hover table-striped align-middle mb-0" style="font-size: 0.85rem;">
                  <thead class="table-light text-uppercase fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">
                    <tr>
                      <th class="ps-3 py-2.5">Customer Name</th>
                      <th>Mobile Number</th>
                      <th>Order Number</th>
                      <th>Invoice Number</th>
                      <th>Purchase Date</th>
                      <th class="text-center">Qty Purchased</th>
                      <th class="text-end">Selling Price</th>
                      <th>Payment Status</th>
                      <th class="pe-3">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let row of history()">
                      <td class="ps-3 py-2.5">
                        <button class="btn btn-link text-primary fw-bold p-0 border-0 bg-transparent text-decoration-underline text-start" 
                                (click)="openCustomerHistory(row.customer_mobile)" style="font-size: 0.85rem;">
                          {{ row.customer_name }}
                        </button>
                      </td>
                      <td class="font-monospace text-muted">{{ row.customer_mobile }}</td>
                      <td class="font-monospace text-dark">{{ row.order_number || '-' }}</td>
                      <td class="font-monospace">
                        <button *ngIf="row.sale_id" class="btn btn-link text-primary fw-bold p-0 border-0 bg-transparent text-decoration-underline" 
                                (click)="viewInvoice(row.sale_id)">
                          {{ row.invoice_number || 'View Invoice' }}
                        </button>
                        <span *ngIf="!row.sale_id" class="text-muted">-</span>
                      </td>
                      <td>{{ row.purchase_date | date:'dd MMM yyyy' }}</td>
                      <td class="text-center fw-bold">{{ row.quantity_purchased }}</td>
                      <td class="text-end fw-semibold">₹{{ row.selling_price | number:'1.2-2' }}</td>
                      <td>
                        <span class="badge" [ngClass]="{
                          'bg-warning-subtle text-warning-emphasis': row.payment_status === 'Pending' || row.payment_status === 'Processing',
                          'bg-info-subtle text-info-emphasis': row.payment_status === 'Shipped',
                          'bg-success-subtle text-success-emphasis': row.payment_status === 'Paid' || row.payment_status === 'Completed' || row.payment_status === 'Delivered' || row.payment_status === 'Generated',
                          'bg-danger-subtle text-danger-emphasis': row.payment_status === 'Cancelled' || row.payment_status === 'Returned'
                        }" style="font-size: 0.7rem;">
                          {{ row.payment_status }}
                        </span>
                      </td>
                      <td class="pe-3">
                        <span class="badge border" [ngClass]="row.order_source === 'POS' ? 'bg-success-subtle text-success border-success-subtle' : 'bg-primary-subtle text-primary border-primary-subtle'">
                          {{ row.order_source }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            <!-- Pagination controls -->
            <div class="d-flex justify-content-between align-items-center mt-3 no-print" *ngIf="history().length > 0">
              <span class="text-muted small">
                Showing {{ (pagination().page - 1) * pagination().limit + 1 }} to 
                {{ Math.min(pagination().page * pagination().limit, pagination().total) }} 
                of {{ pagination().total }} entries
              </span>
              <div class="d-flex gap-1">
                <button class="btn btn-outline-secondary btn-xs px-2.5 py-1" (click)="onPageChange(pagination().page - 1)" [disabled]="pagination().page <= 1">
                  <i class="fas fa-chevron-left me-1"></i>Previous
                </button>
                <button class="btn btn-outline-secondary btn-xs px-2.5 py-1" (click)="onPageChange(pagination().page + 1)" [disabled]="pagination().page * pagination().limit >= pagination().total">
                  Next<i class="fas fa-chevron-right ms-1"></i>
                </button>
              </div>
            </div>

          </div>

          <!-- Modal Footer -->
          <div class="modal-footer bg-light border-top py-2">
            <button type="button" class="btn btn-secondary btn-sm" (click)="closeModal()">Close</button>
          </div>
          
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal.show {
      display: block;
    }
  `]
})
export class ProductPurchaseHistoryModalComponent implements OnChanges {
  private api = inject(ApiService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private customerHistoryModalService = inject(CustomerHistoryModalService);
  private productHistoryModalService = inject(ProductPurchaseHistoryModalService);

  @Input() isOpen = false;
  @Input() productId: number | null = null;
  @Input() productName: string | null = null;
  @Input() productCode: string | null = null;
  @Output() close = new EventEmitter<void>();

  loading = signal<boolean>(false);
  history = signal<any[]>([]);
  summary = signal<any>({
    total_records: 0,
    total_customers: 0,
    total_quantity_sold: 0
  });
  pagination = signal<any>({
    page: 1,
    limit: 10,
    total: 0
  });

  filterCustomer = '';
  filterInvoice = '';
  filterSource = 'all';
  filterStartDate = '';
  filterEndDate = '';

  Math = Math;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.resetFilters();
      if (this.productId) {
        this.loadHistory();
      }
    }
  }

  resetFilters() {
    this.filterCustomer = '';
    this.filterInvoice = '';
    this.filterSource = 'all';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.pagination.set({ page: 1, limit: 10, total: 0 });
  }

  loadHistory() {
    if (!this.productId) return;
    this.loading.set(true);

    const params: any = {
      page: this.pagination().page,
      limit: this.pagination().limit,
      startDate: this.filterStartDate,
      endDate: this.filterEndDate,
      customer: this.filterCustomer,
      invoice: this.filterInvoice,
      source: this.filterSource
    };

    this.api.get(`reports/product-purchase-history/${this.productId}`, params).subscribe({
      next: (res: any) => {
        console.log('Product Purchase History:', res);
        this.loading.set(false);
        if (res.success) {
          this.history.set(res.history || []);
          this.summary.set(res.summary);
          this.pagination.update(p => ({ ...p, total: res.pagination.total }));
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.show(err.error?.error || 'Failed to load product purchase history.', 'error');
        console.error('Failed to load product purchase history:', err);
      }
    });
  }

  onFilterChange() {
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadHistory();
  }

  onPageChange(newPage: number) {
    this.pagination.update(p => ({ ...p, page: newPage }));
    this.loadHistory();
  }

  closeModal() {
    this.close.emit();
  }

  openCustomerHistory(mobile: string) {
    this.closeModal();
    // Tiny delay to let animations complete cleanly before triggering the second modal
    setTimeout(() => {
      this.customerHistoryModalService.open(mobile);
    }, 150);
  }

  viewInvoice(saleId: number) {
    this.closeModal();
    this.router.navigate([`/invoices/view/${saleId}`]);
  }

  exportCSV() {
    const list = this.history();
    if (list.length === 0) return;

    let csvContent = 'Customer Name,Mobile Number,Order Number,Invoice Number,Purchase Date,Qty Purchased,Selling Price,Payment Status,Source\n';
    list.forEach(row => {
      csvContent += `"${row.customer_name}",="${row.customer_mobile}","${row.order_number || ''}","${row.invoice_number || ''}","${row.purchase_date}",${row.quantity_purchased},${row.selling_price},"${row.payment_status}","${row.order_source}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Product_Purchases_${this.productName?.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toastService.show('CSV report exported successfully!', 'success');
  }

  exportPDF() {
    const element = document.getElementById('product-purchase-printable');
    if (!element) return;

    this.toastService.show('Preparing PDF document export...', 'success');

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Product_Purchases_${this.productName?.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      }
    };

    const runExport = (html2pdfLib: any) => {
      html2pdfLib().from(element).set(opt).save();
    };

    if (typeof (window as any).html2pdf === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => {
        runExport((window as any).html2pdf);
      };
      document.head.appendChild(script);
    } else {
      runExport((window as any).html2pdf);
    }
  }
}
