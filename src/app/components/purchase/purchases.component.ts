import { Component, OnInit, signal, computed, inject, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { UnsavedChangesService } from '../../services/unsaved-changes.service';
import { PurchaseModalService } from '../../services/purchase-modal.service';
import { AuthService } from '../../services/auth.service';
import { Subscription, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { LoaderComponent } from '../loader/loader.component';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, LoaderComponent],
  template: `
    <div class="animate-fade-in h-100">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold m-0">Purchase Logs</h4>
          <p class="text-muted m-0">Log inventory procurement, upload invoices, and adjust stock counts</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()" *appHasPermission="['Purchases', 'Create']">
          <i class="fas fa-plus me-2"></i>Add Purchase
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

      <!-- Purchases List Grid -->
      <div class="card glass-card border-0 shadow-sm overflow-hidden mb-4 position-relative" style="min-height: 200px;">
        <div class="table-responsive">
          <table class="custom-table m-0">
            <thead>
              <tr>
                <th>Invoice Ref</th>
                <th>Supplier</th>
                <th>Purchased Date</th>
                <th>Total Amount</th>
                <th>Receipt Bill</th>
                <th *ngIf="isAuthorizedForAudit()">Created By</th>
                <th *ngIf="isAuthorizedForAudit()">Role</th>
                <th *ngIf="isAuthorizedForAudit()">Created At</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody *ngIf="purchases().length > 0">
              <tr *ngFor="let pur of purchases()">
                <td class="fw-bold text-primary">{{ pur.invoice_number }}</td>
                <td>{{ pur.supplier_name }}</td>
                <td>{{ pur.purchase_date }}</td>
                <td class="fw-semibold text-danger">₹{{ pur.total_amount | number:'1.2-2' }}</td>
                <td>
                  <a *ngIf="pur.thumbnail_image" [href]="imageBaseUrl + pur.thumbnail_image" target="_blank" class="badge bg-light text-primary border text-decoration-none">
                    <i class="fas fa-paperclip me-1"></i>View Bill
                  </a>
                  <span class="text-muted" *ngIf="!pur.thumbnail_image">-</span>
                </td>
                <td *ngIf="isAuthorizedForAudit()">{{ pur.created_by_name || '-' }}</td>
                <td *ngIf="isAuthorizedForAudit()">{{ pur.created_by_role || '-' }}</td>
                <td *ngIf="isAuthorizedForAudit()">{{ (pur.created_at | date: 'dd-MM-yyyy') || '-' }}</td>
                <td class="text-end text-nowrap">
                  <button class="btn btn-sm btn-outline-secondary me-1" (click)="viewInvoiceDetails(pur.id)" title="View Details">
                    <i class="fas fa-eye"></i> Details
                  </button>
                  <button class="btn btn-sm btn-outline-primary me-1" (click)="openEditModal(pur.id)" title="Edit Purchase" *appHasPermission="['Purchases', 'Edit']">
                    <i class="fas fa-edit"></i> Edit
                  </button>
                  <button class="btn btn-sm btn-outline-danger" (click)="deletePurchase(pur.id)" title="Delete Purchase" *appHasPermission="['Purchases', 'Delete']">
                    <i class="fas fa-trash"></i> Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <app-loader 
          [loading]="loading()" 
          [isEmpty]="!loading() && !errorMessage() && purchases().length === 0" 
          [error]="errorMessage()" 
          (retry)="loadPurchases()"
          emptyMessage="No logged purchases found. Click Add Purchase to add.">
        </app-loader>
      </div>
    </div>
  `
})
export class PurchasesComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private unsavedChangesService = inject(UnsavedChangesService);
  purchaseModalService = inject(PurchaseModalService);
  authService = inject(AuthService);
  imageBaseUrl = environment.imageBaseUrl;

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.purchaseModalService.isOpen() && this.purchaseModalService.isDirty()) {
      $event.returnValue = true;
    }
  }

  canDeactivate(): boolean | import('rxjs').Observable<boolean> {
    if (this.purchaseModalService.isOpen() && this.purchaseModalService.isDirty()) {
      return this.unsavedChangesService.confirm();
    }
    return true;
  }

  rawPurchases = signal<any[]>([]);
  showAuditFilters = signal<boolean>(false);
  auditUserFilter = signal<string>('');
  auditRoleFilter = signal<string>('');
  auditDateFilter = signal<string>('');

  isAuthorizedForAudit = computed(() => {
    const user = this.authService.currentUser();
    return user && (user.role === 'Owner' || user.role === 'Admin');
  });

  uniqueUsers = computed(() => {
    const creators = this.rawPurchases().map(item => item.created_by_name).filter(Boolean);
    return Array.from(new Set(creators));
  });

  uniqueRoles = computed(() => {
    const roles = this.rawPurchases().map(item => item.created_by_role).filter(Boolean);
    return Array.from(new Set(roles));
  });

  purchases = computed(() => {
    let list = this.rawPurchases();

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
  loading = signal<boolean>(false);

  private sub: Subscription | null = null;

  ngOnInit() {
    this.loadPurchases();

    this.sub = this.purchaseModalService.purchaseSaved.subscribe((msg: string) => {
      this.successMessage.set(msg);
      this.errorMessage.set(null);
      this.loadPurchases();
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  loadPurchases() {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api.get('purchases')
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.rawPurchases.set(res.purchases);
          } else {
            this.errorMessage.set(res.message || 'Failed to load purchases.');
          }
        },
        error: (err) => {
          console.error('Failed to load purchases:', err);
          this.errorMessage.set(err.error?.error || 'Failed to load purchases.');
        }
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
    this.purchaseModalService.openAdd();
  }

  openEditModal(id: number) {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.purchaseModalService.openEdit(id);
  }

  deletePurchase(id: number) {
    this.unsavedChangesService.confirmAction({
      message: 'Are you sure you want to delete this purchase record? This will reverse the stock impact for all products in this purchase and cannot be undone.',
      title: 'Confirm Deletion',
      confirmBtnText: 'Delete',
      type: 'danger'
    }).subscribe(confirm => {
      if (confirm) {
        this.errorMessage.set(null);
        this.successMessage.set(null);
        this.api.delete(`purchases/${id}`).subscribe({
          next: (res: any) => {
            this.successMessage.set(res.message || 'Purchase record deleted successfully.');
            this.loadPurchases();
          },
          error: (err: any) => {
            this.errorMessage.set(err.error?.error || 'Failed to delete purchase record.');
          }
        });
      }
    });
  }

  viewInvoiceDetails(id: number) {
    this.purchaseModalService.openView(id);
  }
}
