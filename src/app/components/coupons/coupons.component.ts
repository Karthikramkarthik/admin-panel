import { Component, OnInit, signal, computed, inject, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { UnsavedChangesService } from '../../services/unsaved-changes.service';
import { CouponModalService } from '../../services/coupon-modal.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
  selector: 'app-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <div class="animate-fade-in h-100">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold m-0">Coupon Management</h4>
          <p class="text-muted m-0">Configure promotional shopping codes, fixed/percentage discounts, and usage boundaries</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()" *appHasPermission="['Coupons', 'Create']">
          <i class="fas fa-plus me-2"></i>Create Coupon
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

      <!-- Coupons Grid -->
      <div class="card glass-card border-0 shadow-sm overflow-hidden">
        <div class="table-responsive">
          <table class="custom-table m-0">
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min Purchase</th>
                <th>Expiry Date</th>
                <th>Usage Limit</th>
                <th>Used Count</th>
                <th *ngIf="isAuthorizedForAudit()">Created By</th>
                <th *ngIf="isAuthorizedForAudit()">Role</th>
                <th *ngIf="isAuthorizedForAudit()">Created At</th>
                <th>Status</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let coupon of coupons()">
                <td><strong class="text-primary fs-5" style="letter-spacing: 0.5px;">{{ coupon.code }}</strong></td>
                <td>
                  <span class="badge" [ngClass]="coupon.type === 'percentage' ? 'bg-primary' : 'bg-secondary'">
                    {{ coupon.type === 'percentage' ? '%' : 'Fixed' }}
                  </span>
                </td>
                <td class="fw-semibold">
                  {{ coupon.type === 'percentage' ? '' : '₹' }}{{ coupon.value }}{{ coupon.type === 'percentage' ? '%' : '' }}
                </td>
                <td>₹{{ coupon.min_order_amount | number:'1.2-2' }}</td>
                <td>{{ coupon.expiry_date }}</td>
                <td>{{ coupon.usage_limit === 0 ? 'Unlimited' : coupon.usage_limit }}</td>
                <td class="fw-bold text-success">{{ coupon.used_count }}</td>
                <td *ngIf="isAuthorizedForAudit()">{{ coupon.created_by_name || '-' }}</td>
                <td *ngIf="isAuthorizedForAudit()">{{ coupon.created_by_role || '-' }}</td>
                <td *ngIf="isAuthorizedForAudit()">{{ (coupon.created_at | date: 'dd-MM-yyyy') || '-' }}</td>
                <td>
                  <span class="badge rounded-pill fw-semibold" [ngClass]="coupon.status === 'active' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'" style="font-size: 0.72rem; padding: 0.35em 0.8em;">
                    {{ coupon.status === 'active' ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-2" (click)="openEditModal(coupon)" *appHasPermission="['Coupons', 'Edit']">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" (click)="deleteCoupon(coupon.id)" *appHasPermission="['Coupons', 'Delete']">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="coupons().length === 0">
                <td [attr.colspan]="isAuthorizedForAudit() ? 12 : 9" class="text-center text-muted py-4">No coupons configured. Click Create Coupon.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class CouponsComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private unsavedChangesService = inject(UnsavedChangesService);
  couponModalService = inject(CouponModalService);
  authService = inject(AuthService);

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.couponModalService.isOpen() && this.couponModalService.isDirty()) {
      $event.returnValue = true;
    }
  }

  canDeactivate(): boolean | import('rxjs').Observable<boolean> {
    if (this.couponModalService.isOpen() && this.couponModalService.isDirty()) {
      return this.unsavedChangesService.confirm();
    }
    return true;
  }

  rawCoupons = signal<any[]>([]);
  showAuditFilters = signal<boolean>(false);
  auditUserFilter = signal<string>('');
  auditRoleFilter = signal<string>('');
  auditDateFilter = signal<string>('');

  isAuthorizedForAudit = computed(() => {
    const user = this.authService.currentUser();
    return user && (user.role === 'Owner' || user.role === 'Admin');
  });

  uniqueUsers = computed(() => {
    const creators = this.rawCoupons().map(item => item.created_by_name).filter(Boolean);
    return Array.from(new Set(creators));
  });

  uniqueRoles = computed(() => {
    const roles = this.rawCoupons().map(item => item.created_by_role).filter(Boolean);
    return Array.from(new Set(roles));
  });

  coupons = computed(() => {
    let list = this.rawCoupons();

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

  private sub: Subscription | null = null;

  ngOnInit() {
    this.loadCoupons();

    this.sub = this.couponModalService.couponSaved.subscribe((msg: string) => {
      this.successMessage.set(msg);
      this.errorMessage.set(null);
      this.loadCoupons();
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  loadCoupons() {
    this.api.get('admin/coupons').subscribe({
      next: (res) => {
        if (res.success) {
          this.rawCoupons.set(res.coupons);
        }
      },
      error: (err) => console.error('Failed to load coupons:', err)
    });
  }

  openAddModal() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.couponModalService.openAdd();
  }

  openEditModal(coupon: any) {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.couponModalService.openEdit(coupon);
  }

  deleteCoupon(id: number) {
    this.unsavedChangesService.confirmAction({
      message: 'Are you sure you want to delete this coupon?',
      title: 'Confirm Deletion',
      confirmBtnText: 'Delete',
      type: 'danger'
    }).subscribe(confirmed => {
      if (!confirmed) return;

      this.errorMessage.set(null);
      this.successMessage.set(null);

      this.api.delete(`admin/coupons/${id}`).subscribe({
        next: (res) => {
          this.successMessage.set(res.message);
          this.loadCoupons();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.error || 'Failed to delete coupon.');
        }
      });
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
}
