import { Component, OnInit, signal, computed, inject, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { UnsavedChangesService } from '../../services/unsaved-changes.service';
import { SupplierModalService } from '../../services/supplier-modal.service';
import { PurchaseModalService } from '../../services/purchase-modal.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <div class="animate-fade-in h-100">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold m-0">Suppliers</h4>
          <p class="text-muted m-0">Manage suppliers, contacts, and billing info</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()" *appHasPermission="['Suppliers', 'Create']">
          <i class="fas fa-plus me-2"></i>Add Supplier
        </button>
      </div>

      <div class="alert alert-danger border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
        <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
      </div>
      
      <div class="alert alert-success border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="successMessage()">
        <i class="fas fa-check-circle me-2"></i>{{ successMessage() }}
      </div>

      <!-- Audit Filter Row (Only for Authorized Users) -->
      <div class="row g-3 mb-4" *ngIf="isAuthorizedForAudit()">
        <div class="col-md-12">
          <div class="card glass-card border-0 shadow-sm p-3">
            <div class="d-flex justify-content-between align-items-center cursor-pointer" (click)="toggleAuditFilters()">
              <div class="fw-bold text-secondary d-flex align-items-center">
                <i class="fas fa-history me-2 text-primary"></i>
                <span>Audit Information Filters</span>
              </div>
              <i class="fas" [ngClass]="showAuditFilters() ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
            </div>
            <div class="row g-3 mt-2" *ngIf="showAuditFilters()">
              <div class="col-md-4">
                <label class="form-label small text-muted mb-1">Created By User</label>
                <select class="form-select form-select-sm" [ngModel]="auditUserFilter()" (ngModelChange)="onAuditUserChange($event)">
                  <option value="">All Users</option>
                  <option *ngFor="let user of uniqueUsers()" [value]="user">{{ user }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label small text-muted mb-1">Created By Role</label>
                <select class="form-select form-select-sm" [ngModel]="auditRoleFilter()" (ngModelChange)="onAuditRoleChange($event)">
                  <option value="">All Roles</option>
                  <option *ngFor="let role of uniqueRoles()" [value]="role">{{ role }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label small text-muted mb-1">Created Date</label>
                <input type="date" class="form-control form-control-sm" [ngModel]="auditDateFilter()" (ngModelChange)="onAuditDateChange($event)">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Suppliers Grid -->
      <div class="card glass-card border-0 shadow-sm overflow-hidden">
        <div class="table-responsive">
          <table class="custom-table m-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>GST Number</th>
                <th>Address</th>
                <th *ngIf="isAuthorizedForAudit()">Created By</th>
                <th *ngIf="isAuthorizedForAudit()">Role</th>
                <th *ngIf="isAuthorizedForAudit()">Created At</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let sup of suppliers()">
                <td class="fw-semibold">{{ sup.name }}</td>
                <td>{{ sup.mobile }}</td>
                <td><span class="badge bg-light text-dark border">{{ sup.gst_number || '-' }}</span></td>
                <td>{{ sup.address || '-' }}</td>
                <td *ngIf="isAuthorizedForAudit()">{{ sup.created_by_name || '-' }}</td>
                <td *ngIf="isAuthorizedForAudit()">{{ sup.created_by_role || '-' }}</td>
                <td *ngIf="isAuthorizedForAudit()">{{ (sup.created_at | date: 'dd-MM-yyyy') || '-' }}</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-info me-2" (click)="viewSupplierDetails(sup)" title="Supplier History">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-primary me-2" (click)="openEditModal(sup)" title="Edit Supplier" *appHasPermission="['Suppliers', 'Edit']">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" (click)="deleteSupplier(sup.id)" title="Delete Supplier" *appHasPermission="['Suppliers', 'Delete']">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="suppliers().length === 0">
                <td [attr.colspan]="isAuthorizedForAudit() ? 8 : 5" class="text-center text-muted py-4">No suppliers found. Click Add Supplier to create one.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Supplier Details & History Modal -->
      <div class="modal fade" id="supplierDetailsModal" tabindex="-1" aria-hidden="true" [class.show]="detailsModalOpen()" [style.display]="detailsModalOpen() ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5); overflow-y: auto;">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; background-color: var(--bg-sidebar);">
            <div class="modal-header bg-light-subtle py-3 border-bottom-0">
              <h5 class="modal-title fw-bold"><i class="fas fa-history text-warning me-2"></i>Supplier Profile & Purchase History</h5>
              <button type="button" class="btn-close" (click)="closeDetailsModal()"></button>
            </div>
            
            <div class="modal-body p-4" *ngIf="selectedSupplier()">
              <!-- Supplier Profile Header -->
              <div class="row g-3 mb-4 p-3 bg-light-subtle rounded border">
                <div class="col-md-3">
                  <div class="text-muted text-uppercase fw-bold" style="font-size: 0.7rem;">Supplier Name</div>
                  <h5 class="fw-bold text-main m-0 mt-1">{{ selectedSupplier().name }}</h5>
                </div>
                <div class="col-md-3">
                  <div class="text-muted text-uppercase fw-bold" style="font-size: 0.7rem;">Contact Number</div>
                  <h6 class="fw-semibold text-main m-0 mt-1">{{ selectedSupplier().mobile }}</h6>
                </div>
                <div class="col-md-3">
                  <div class="text-muted text-uppercase fw-bold" style="font-size: 0.7rem;">GST Number</div>
                  <span class="badge bg-light text-dark border m-0 mt-1">{{ selectedSupplier().gst_number || '-' }}</span>
                </div>
                <div class="col-md-3">
                  <div class="text-muted text-uppercase fw-bold" style="font-size: 0.7rem;">Total Purchase Volume</div>
                  <h5 class="fw-extrabold text-danger m-0 mt-1">₹{{ totalPurchasedAmount() | number:'1.2-2' }}</h5>
                </div>
                <div class="col-12 mt-2" *ngIf="selectedSupplier().address">
                  <div class="text-muted text-uppercase fw-bold" style="font-size: 0.7rem;">Billing Address</div>
                  <div class="text-muted mt-1" style="font-size: 0.82rem;">{{ selectedSupplier().address }}</div>
                </div>
              </div>

              <!-- Tab Navigation -->
              <ul class="nav nav-tabs nav-pills mb-3 border-0 gap-1 bg-transparent" role="tablist">
                <li class="nav-item" role="presentation">
                  <button class="nav-link px-3 py-1.5 fw-semibold border bg-transparent text-secondary" 
                          [class.active]="activeHistoryTab() === 'invoices'" 
                          (click)="activeHistoryTab.set('invoices')">
                    <i class="fas fa-file-invoice me-1"></i> Invoice Logs
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link px-3 py-1.5 fw-semibold border bg-transparent text-secondary" 
                          [class.active]="activeHistoryTab() === 'products'" 
                          (click)="activeHistoryTab.set('products')">
                    <i class="fas fa-box me-1"></i> Product Purchase History
                  </button>
                </li>
              </ul>

              <!-- Filter Tools -->
              <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h6 class="fw-bold text-main m-0">
                  <i class="fas" [ngClass]="activeHistoryTab() === 'invoices' ? 'fa-list' : 'fa-box'"></i>
                  {{ activeHistoryTab() === 'invoices' ? 'Procured Invoices' : 'Procured Products' }}
                </h6>
                
                <div class="d-flex align-items-center gap-2">
                  <!-- Product Search input (Only for Products Tab) -->
                  <div class="input-group input-group-sm" style="max-width: 200px;" *ngIf="activeHistoryTab() === 'products'">
                    <span class="input-group-text"><i class="fas fa-search"></i></span>
                    <input type="text" class="form-control" placeholder="Search product..." 
                           [ngModel]="productSearchQuery()" (ngModelChange)="productSearchQuery.set($event)">
                  </div>

                  <div class="input-group input-group-sm" style="max-width: 150px;">
                    <span class="input-group-text" style="font-size: 0.72rem;">From</span>
                    <input type="date" class="form-control" [(ngModel)]="filterStartDate" (change)="loadSupplierHistory()">
                  </div>
                  <div class="input-group input-group-sm" style="max-width: 150px;">
                    <span class="input-group-text" style="font-size: 0.72rem;">To</span>
                    <input type="date" class="form-control" [(ngModel)]="filterEndDate" (change)="loadSupplierHistory()">
                  </div>
                  <button class="btn btn-xs btn-outline-secondary py-1" (click)="clearFilters()" title="Clear Filters">
                    <i class="fas fa-rotate-left"></i>
                  </button>
                </div>
              </div>

              <!-- Invoice Logs Table -->
              <div class="table-responsive border rounded" style="max-height: 280px; overflow-y: auto;" *ngIf="activeHistoryTab() === 'invoices'">
                <table class="table table-sm align-middle m-0 text-center">
                  <thead class="bg-light sticky-top">
                    <tr style="font-size: 0.8rem;">
                      <th class="text-start ps-3">Invoice Ref</th>
                      <th>Purchase Date</th>
                      <th>Total Amount</th>
                      <th>Receipt Bill</th>
                      <th class="text-end pe-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let p of purchaseHistory()">
                      <td class="text-start ps-3 fw-bold text-primary">{{ p.invoice_number }}</td>
                      <td>{{ p.purchase_date }}</td>
                      <td class="fw-semibold text-danger">₹{{ p.total_amount | number:'1.2-2' }}</td>
                      <td>
                        <a *ngIf="p.thumbnail_image" [href]="imageBaseUrl + p.thumbnail_image" target="_blank" class="badge bg-light text-primary border text-decoration-none">
                          <i class="fas fa-paperclip me-1"></i>View Bill
                        </a>
                        <span class="text-muted" *ngIf="!p.thumbnail_image">-</span>
                      </td>
                      <td class="text-end pe-3">
                        <button class="btn btn-xs btn-outline-primary" (click)="viewPurchaseDetails(p.id)" title="View Details">
                          <i class="fas fa-eye"></i>
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="purchaseHistory().length === 0">
                      <td colspan="5" class="text-center text-muted py-4">No purchases found for the selected criteria.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Product Procurement History Table -->
              <div class="table-responsive border rounded" style="max-height: 280px; overflow-y: auto;" *ngIf="activeHistoryTab() === 'products'">
                <table class="table table-sm align-middle m-0 text-center">
                  <thead class="bg-light sticky-top">
                    <tr style="font-size: 0.8rem;">
                      <th class="text-start ps-3">Product Name</th>
                      <th>SKU / Code</th>
                      <th>Size</th>
                      <th>Quantity</th>
                      <th>Cost Price</th>
                      <th>Subtotal</th>
                      <th>Invoice Ref</th>
                      <th class="text-end pe-3">Purchase Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of filteredProductPurchases()">
                      <td class="text-start ps-3 fw-bold text-main">{{ item.product_name }}</td>
                      <td><span class="badge bg-light text-muted border">{{ item.product_code }}</span></td>
                      <td><span class="badge bg-info-subtle text-info">{{ item.size || 'Default' }}</span></td>
                      <td class="fw-semibold">{{ item.quantity }}</td>
                      <td>₹{{ item.cost_price | number:'1.2-2' }}</td>
                      <td class="fw-semibold text-danger">₹{{ item.subtotal | number:'1.2-2' }}</td>
                      <td><span class="fw-bold text-primary">{{ item.invoice_number }}</span></td>
                      <td class="text-end pe-3 text-muted">{{ item.purchase_date }}</td>
                    </tr>
                    <tr *ngIf="filteredProductPurchases().length === 0">
                      <td colspan="8" class="text-center text-muted py-4">No product procurements found for the selected criteria.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="modal-footer bg-light-subtle border-top-0 py-3">
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="closeDetailsModal()">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SuppliersComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private unsavedChangesService = inject(UnsavedChangesService);
  supplierModalService = inject(SupplierModalService);
  purchaseModalService = inject(PurchaseModalService);
imageBaseUrl = environment.imageBaseUrl;
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.supplierModalService.isOpen() && this.supplierModalService.isDirty()) {
      $event.returnValue = true;
    }
  }

  canDeactivate(): boolean | import('rxjs').Observable<boolean> {
    if (this.supplierModalService.isOpen() && this.supplierModalService.isDirty()) {
      return this.unsavedChangesService.confirm();
    }
    return true;
  }

  authService = inject(AuthService);
  rawSuppliers = signal<any[]>([]);
  showAuditFilters = signal<boolean>(false);
  auditUserFilter = signal<string>('');
  auditRoleFilter = signal<string>('');
  auditDateFilter = signal<string>('');

  isAuthorizedForAudit = computed(() => {
    const user = this.authService.currentUser();
    return user && (user.role === 'Owner' || user.role === 'Admin');
  });

  uniqueUsers = computed(() => {
    const creators = this.rawSuppliers().map(item => item.created_by_name).filter(Boolean);
    return Array.from(new Set(creators));
  });

  uniqueRoles = computed(() => {
    const roles = this.rawSuppliers().map(item => item.created_by_role).filter(Boolean);
    return Array.from(new Set(roles));
  });

  suppliers = computed(() => {
    let list = this.rawSuppliers();
    
    if (this.isAuthorizedForAudit()) {
      const user = this.auditUserFilter();
      const role = this.auditRoleFilter();
      const date = this.auditDateFilter();
      
      if (user) {
        list = list.filter(item => item.created_by_name === user);
      }
      if (role) {
        list = list.filter(item => item.created_by_role === role);
      }
      if (date) {
        list = list.filter(item => {
          if (!item.created_at) return false;
          const itemDate = new Date(item.created_at).toISOString().slice(0, 10);
          return itemDate === date;
        });
      }
    }
    return list;
  });

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Supplier Details History States
  detailsModalOpen = signal<boolean>(false);
  selectedSupplier = signal<any | null>(null);
  purchaseHistory = signal<any[]>([]);
  productPurchases = signal<any[]>([]);
  totalPurchasedAmount = signal<number>(0);
  activeHistoryTab = signal<'invoices' | 'products'>('invoices');
  productSearchQuery = signal<string>('');

  filteredProductPurchases = computed(() => {
    const query = this.productSearchQuery().toLowerCase().trim();
    const list = this.productPurchases();
    if (!query) return list;
    return list.filter(item => 
      (item.product_name || '').toLowerCase().includes(query) ||
      (item.product_code || '').toLowerCase().includes(query)
    );
  });

  // Filters
  filterStartDate = '';
  filterEndDate = '';

  private sub: Subscription | null = null;

  ngOnInit() {
    this.loadSuppliers();

    this.sub = this.supplierModalService.supplierSaved.subscribe((msg: string) => {
      this.successMessage.set(msg);
      this.errorMessage.set(null);
      this.loadSuppliers();
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  loadSuppliers() {
    this.api.get('suppliers').subscribe({
      next: (res) => {
        if (res.success) {
          this.rawSuppliers.set(res.suppliers);
        }
      },
      error: (err) => console.error('Failed to load suppliers:', err)
    });
  }

  toggleAuditFilters() {
    this.showAuditFilters.set(!this.showAuditFilters());
  }

  onAuditUserChange(val: string) {
    this.auditUserFilter.set(val);
  }

  onAuditRoleChange(val: string) {
    this.auditRoleFilter.set(val);
  }

  onAuditDateChange(val: string) {
    this.auditDateFilter.set(val);
  }

  openAddModal() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.supplierModalService.openAdd();
  }

  openEditModal(supplier: any) {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.supplierModalService.openEdit(supplier);
  }

  viewSupplierDetails(supplier: any) {
    this.selectedSupplier.set(supplier);
    this.activeHistoryTab.set('invoices');
    this.productSearchQuery.set('');
    this.clearFilters(false);
    this.detailsModalOpen.set(true);
    this.loadSupplierHistory();
  }

  loadSupplierHistory() {
    if (!this.selectedSupplier()) return;
    const supplierId = this.selectedSupplier().id;
    
    const params: any = {};
    if (this.filterStartDate) params.startDate = this.filterStartDate;
    if (this.filterEndDate) params.endDate = this.filterEndDate;

    this.api.get(`suppliers/${supplierId}/purchases`, params).subscribe({
      next: (res) => {
        if (res.success) {
          this.purchaseHistory.set(res.purchases);
          this.productPurchases.set(res.productPurchases || []);
          this.totalPurchasedAmount.set(res.totalAmount);
        }
      },
      error: (err) => {
        console.error('Failed to load supplier purchases:', err);
      }
    });
  }

  clearFilters(reload = true) {
    this.filterStartDate = '';
    this.filterEndDate = '';
    if (reload) {
      this.loadSupplierHistory();
    }
  }

  closeDetailsModal() {
    this.detailsModalOpen.set(false);
  }

  viewPurchaseDetails(purchaseId: number) {
    this.purchaseModalService.openView(purchaseId);
  }

  deleteSupplier(id: number) {
    this.unsavedChangesService.confirmAction({
      message: 'Are you sure you want to delete this supplier?',
      title: 'Confirm Deletion',
      confirmBtnText: 'Delete',
      type: 'danger'
    }).subscribe(confirmed => {
      if (!confirmed) return;

      this.errorMessage.set(null);
      this.successMessage.set(null);

      this.api.delete(`suppliers/${id}`).subscribe({
        next: (res) => {
          this.successMessage.set(res.message);
          this.loadSuppliers();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.error || 'Failed to delete supplier.');
        }
      });
    });
  }
}
