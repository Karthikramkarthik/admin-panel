import { Component, Input, Output, EventEmitter, signal, inject, OnChanges, SimpleChanges, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-customer-history-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Customer Purchase History Modal -->
    <div class="modal fade" id="customerHistoryModal" tabindex="-1" aria-hidden="true" [class.show]="isOpen" [style.display]="isOpen ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5); z-index: 1055;">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; background-color: #fff; max-height: 90vh; display: flex; flex-direction: column;">
          <div class="modal-header bg-light py-3 border-bottom">
            <div *ngIf="activeCustomer()">
              <h5 class="modal-title fw-bold text-dark m-0">Customer Profile & History: {{ activeCustomer()?.name }}</h5>
              <p class="text-muted small m-0">
                <i class="fas fa-phone me-1"></i>{{ activeCustomer()?.mobile }} &nbsp;|&nbsp; 
                <i class="fas fa-envelope me-1"></i>{{ activeCustomer()?.email || 'No email' }} &nbsp;|&nbsp;
                <i class="fas fa-map-marker-alt me-1"></i>{{ activeCustomer()?.address || 'No address' }} &nbsp;|&nbsp;
                <span class="badge bg-light text-dark border ms-1">Source: {{ activeCustomer()?.source || 'Admin Panel' }}</span>
              </p>
            </div>
            <div *ngIf="!activeCustomer() && !historyLoading()">
              <h5 class="modal-title fw-bold text-dark m-0">Customer Profile & History</h5>
              <p class="text-muted small m-0">Loading customer profile information...</p>
            </div>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          
          <div class="modal-body p-4 overflow-y-auto" style="flex: 1;">
            <div *ngIf="historyLoading()" class="text-center py-5">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="text-muted mt-2">Fetching customer transaction logs...</p>
            </div>

            <div *ngIf="!historyLoading() && customerHistory().length === 0" class="text-center py-5 text-muted">
              <i class="fas fa-shopping-bag fs-2 mb-2 d-block"></i>
              No transaction logs recorded for this customer.
            </div>

            <div *ngIf="!historyLoading() && customerHistory().length > 0">
              <div class="card border border-light shadow-xs mb-3" *ngFor="let order of customerHistory()">
                <div class="card-header bg-light d-flex justify-content-between align-items-center py-2 border-bottom-0">
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge" [ngClass]="order.channel === 'POS' ? 'bg-success text-white' : 'bg-info bg-opacity-10 text-info'">
                      {{ order.channel }}
                    </span>
                    <strong class="text-dark font-monospace">{{ order.invoice_number }}</strong>
                    <span class="text-muted small">{{ order.date | date:'dd MMM yyyy' }}</span>
                  </div>
                  <div class="d-flex align-items-center gap-3">
                    <span class="text-muted small">Paid via: <strong >{{ order.payment_method }}</strong></span>
                    <span class="badge bg-success" [ngClass]="{
                      'bg-warning bg-opacity-10 text-warning': order.status === 'Pending' || order.status === 'Processing',
                      'bg-info bg-opacity-10 text-info': order.status === 'Shipped',
                      'bg-success text-white': order.status === 'Delivered' || order.status === 'Completed' || order.status === 'Generated',
                      'bg-danger text-white': order.status === 'Cancelled' || order.status === 'Returned'
                    }">
                      {{ order.status }}
                    </span>
                    <!-- View Invoice Link for completed/POS sales -->
                    <button *ngIf="order.channel === 'POS' || order.status === 'Completed'" 
                            (click)="viewInvoice(order.id)" 
                            class="btn btn-xs btn-primary py-0 px-2 fw-bold" 
                            style="font-size: 0.72rem;  line-height: 20px;">
                      <i class="fas fa-eye me-1"></i>View Invoice
                    </button>
                  </div>
                </div>
                <div class="card-body p-3">
                  <div class="table-responsive">
                    <table class="table table-sm table-striped align-middle mb-0" style="font-size: 0.82rem;">
                      <thead>
                        <tr class="table-light">
                          <th>Product Code / Name</th>
                          <th class="text-center">Size / Color</th>
                          <th class="text-center">Quantity</th>
                          <th class="text-end">Selling Price</th>
                          <th *ngIf="isAdminOrOwner()" class="text-end">Cost Price</th>
                          <th class="text-end pe-3">Subtotal</th>
                          <th *ngIf="isAdminOrOwner()" class="text-end pe-3">Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let item of order.items">
                          <td>
                            <code>{{ item.product_code }}</code> - <span class="fw-semibold text-dark">{{ item.product_name }}</span>
                          </td>
                          <td class="text-center text-muted">
                            Size: {{ item.size || 'N/A' }} <span *ngIf="item.color">/ Color: {{ item.color }}</span>
                          </td>
                          <td class="text-center fw-bold text-dark">{{ item.quantity }}</td>
                          <td class="text-end text-muted">₹{{ item.price | number:'1.2-2' }}</td>
                          <td *ngIf="isAdminOrOwner()" class="text-end text-muted">₹{{ (item.cost_price || 0) | number:'1.2-2' }}</td>
                          <td class="text-end fw-bold text-dark pe-3">₹{{ item.total | number:'1.2-2' }}</td>
                          <td *ngIf="isAdminOrOwner()" class="text-end fw-bold pe-3" [ngClass]="(item.profit || 0) >= 0 ? 'text-success' : 'text-danger'">
                            ₹{{ (item.profit || 0) | number:'1.2-2' }}
                            <span class="small font-monospace">({{ (item.profit_percent || 0) | number:'1.2-2' }}%)</span>
                          </td>
                        </tr>
                      </tbody>
                      <tfoot *ngIf="isAdminOrOwner()">
                        <tr class="fw-bold" style="border-top: 1px solid #eee;">
                          <td colspan="5"></td>
                          <td class="text-end fw-bold text-dark pe-3">Total Amount: ₹{{ (order.subtotal || 0) | number:'1.2-2' }}</td>
                          <td class="text-end pe-3" [ngClass]="(order.total_profit || 0) >= 0 ? 'text-success' : 'text-danger'">
                         Total Profit: ₹{{ (order.total_profit || 0) | number:'1.2-2' }}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer bg-light border-top py-2">
            <button type="button" class="btn btn-secondary btn-sm" (click)="closeModal()">Close</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CustomerHistoryModalComponent implements OnChanges {
  private api = inject(ApiService);
  private router = inject(Router);
  private authService = inject(AuthService);

  @Input() isOpen = false;
  @Input() customerMobile: string | null = null;
  @Output() close = new EventEmitter<void>();

  historyLoading = signal<boolean>(false);
  activeCustomer = signal<any | null>(null);
  customerHistory = signal<any[]>([]);

  isAdminOrOwner = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'Admin' || role === 'Owner';
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      if (this.customerMobile) {
        this.loadHistory(this.customerMobile);
      }
    }
  }

  loadHistory(mobile: string) {
    this.historyLoading.set(true);
    this.activeCustomer.set(null);
    this.customerHistory.set([]);

    this.api.get(`reports/customer-purchase-history/${mobile}`).subscribe({
      next: (res: any) => {
        this.historyLoading.set(false);
        if (res.success) {
          this.activeCustomer.set(res.customer);
          this.customerHistory.set(res.history || []);
        }
      },
      error: (err) => {
        this.historyLoading.set(false);
        console.error('Failed to load customer purchase history:', err);
      }
    });
  }

  closeModal() {
    this.close.emit();
  }

  viewInvoice(id: number) {
    this.closeModal();
    this.router.navigate([`/invoices/view/${id}`]);
  }
}
