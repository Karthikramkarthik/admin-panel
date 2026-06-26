import { Component, OnInit, signal, computed, inject, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { UnsavedChangesService } from '../../services/unsaved-changes.service';
import { CustomerModalService } from '../../services/customer-modal.service';
import { CustomerHistoryModalService } from '../../services/customer-history-modal.service';
import { AuthService } from '../../services/auth.service';
import { Subscription, finalize } from 'rxjs';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { LoaderComponent } from '../loader/loader.component';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, LoaderComponent],
  template: `
    <div class="animate-fade-in h-100">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold m-0">Customers</h4>
          <p class="text-muted m-0">Manage customer files, contact details, and logs</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()" *appHasPermission="['Customers', 'Create']">
          <i class="fas fa-plus me-2"></i>Add Customer
        </button>
      </div>

      <div class="alert alert-danger border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
        <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
      </div>
      
      <div class="alert alert-success border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="successMessage()">
        <i class="fas fa-check-circle me-2"></i>{{ successMessage() }}
      </div>

      <!-- Filters -->
      <div class="row g-3 mb-4 align-items-center">
        <!-- Search bar -->
        <div class="col-md-4">
          <div class="search-box position-relative">
            <i class="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
            <input type="text" class="form-control form-control-sm ps-5 py-2 animate-fade-in" style="padding-left: 40px !important;"
                   placeholder="Search by name, mobile, email..." [(ngModel)]="searchQuery" (input)="onFilterChange()">
          </div>
        </div>
        <!-- Source filter -->
        <div class="col-md-3">
          <select class="form-select form-select-sm py-2" [(ngModel)]="selectedSource" (change)="onFilterChange()">
            <option value="">All Sources</option>
            <option value="Website">Website</option>
            <option value="Admin Panel">Admin Panel</option>
            <option value="POS">POS</option>
            <option value="Import">Import</option>
          </select>
        </div>
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

      <!-- Customers List Grid -->
      <div class="card glass-card border-0 shadow-sm overflow-hidden position-relative" style="min-height: 200px;">
        <div class="table-responsive">
          <table class="custom-table m-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Address</th>
                <th>Source</th>
                <th>Status</th>
                <th *ngIf="isAuthorizedForAudit()">Created By</th>
                <th *ngIf="isAuthorizedForAudit()">Role</th>
                <th *ngIf="isAuthorizedForAudit()">Created At</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody *ngIf="customers().length > 0">
              <tr *ngFor="let cust of customers()">
                <td class="fw-semibold">
                  {{ cust.name }}
                  <span *ngIf="cust.source === 'Website'" class="badge bg-primary bg-opacity-10 text-primary ms-1" style="font-size: 0.72rem; vertical-align: middle;">Website</span>
                </td>
                <td>{{ cust.mobile }}</td>
                <td>{{ cust.email || '-' }}</td>
                <td>{{ cust.address || '-' }}</td>
                <td>
                  <span class="badge bg-light text-dark border fw-bold">{{ cust.source || 'Admin Panel' }}</span>
                </td>
                <td>
                  <span class="badge" [class.bg-success]="cust.status === 'active'" [class.bg-secondary]="cust.status === 'inactive'">
                    {{ cust.status }}
                  </span>
                </td>
                <td *ngIf="isAuthorizedForAudit()">{{ cust.created_by_name || '-' }}</td>
                <td *ngIf="isAuthorizedForAudit()">{{ cust.created_by_role || '-' }}</td>
                <td *ngIf="isAuthorizedForAudit()">{{ (cust.created_at | date: 'dd-MM-yyyy') || '-' }}</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-info me-2" (click)="openCustomerHistory(cust)" title="View Details & History">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-primary me-2" (click)="openEditModal(cust)" *appHasPermission="['Customers', 'Edit']">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" (click)="deleteCustomer(cust.id)" *appHasPermission="['Customers', 'Delete']">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <app-loader 
          [loading]="loading()" 
          [isEmpty]="!loading() && !errorMessage() && customers().length === 0" 
          [error]="errorMessage()" 
          (retry)="loadCustomers()"
          emptyMessage="No customers found. Click Add Customer to create one.">
        </app-loader>
      </div>
    </div>
  `
})
export class CustomersComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private unsavedChangesService = inject(UnsavedChangesService);
  customerModalService = inject(CustomerModalService);
  customerHistoryModalService = inject(CustomerHistoryModalService);
  authService = inject(AuthService);

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.customerModalService.isOpen() && this.customerModalService.isDirty()) {
      $event.returnValue = true;
    }
  }

  canDeactivate(): boolean | import('rxjs').Observable<boolean> {
    if (this.customerModalService.isOpen() && this.customerModalService.isDirty()) {
      return this.unsavedChangesService.confirm();
    }
    return true;
  }

  rawCustomers = signal<any[]>([]);
  showAuditFilters = signal<boolean>(false);
  auditUserFilter = signal<string>('');
  auditRoleFilter = signal<string>('');
  auditDateFilter = signal<string>('');

  isAuthorizedForAudit = computed(() => {
    const user = this.authService.currentUser();
    return user && (user.role === 'Owner' || user.role === 'Admin');
  });

  uniqueUsers = computed(() => {
    const creators = this.rawCustomers().map(item => item.created_by_name).filter(Boolean);
    return Array.from(new Set(creators));
  });

  uniqueRoles = computed(() => {
    const roles = this.rawCustomers().map(item => item.created_by_role).filter(Boolean);
    return Array.from(new Set(roles));
  });

  customers = computed(() => {
    let list = this.rawCustomers();

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

  searchQuery = '';
  selectedSource = '';

  private sub: Subscription | null = null;

  ngOnInit() {
    this.loadCustomers();

    this.sub = this.customerModalService.customerSaved.subscribe((msg: string) => {
      this.successMessage.set(msg);
      this.errorMessage.set(null);
      this.loadCustomers();
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  loadCustomers() {
    this.loading.set(true);
    this.errorMessage.set(null);
    const params: any = {};
    if (this.selectedSource) params.source = this.selectedSource;
    if (this.searchQuery) params.q = this.searchQuery;

    this.api.get('customers', params)
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.rawCustomers.set(res.customers);
          } else {
            this.errorMessage.set(res.message || 'Failed to load customers.');
          }
        },
        error: (err) => {
          console.error('Failed to load customers:', err);
          this.errorMessage.set(err.error?.error || 'Failed to load customers.');
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

  onFilterChange() {
    this.loadCustomers();
  }

  openAddModal() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.customerModalService.openAdd();
  }

  openEditModal(customer: any) {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.customerModalService.openEdit(customer);
  }

  deleteCustomer(id: number) {
    this.unsavedChangesService.confirmAction({
      message: 'Are you sure you want to delete this customer?',
      title: 'Confirm Deletion',
      confirmBtnText: 'Delete',
      type: 'danger'
    }).subscribe(confirmed => {
      if (!confirmed) return;

      this.errorMessage.set(null);
      this.successMessage.set(null);

      this.api.delete(`customers/${id}`).subscribe({
        next: (res) => {
          this.successMessage.set(res.message);
          this.loadCustomers();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.error || 'Failed to delete customer.');
        }
      });
    });
  }

  openCustomerHistory(customer: any) {
    this.customerHistoryModalService.open(customer.mobile);
  }
}
