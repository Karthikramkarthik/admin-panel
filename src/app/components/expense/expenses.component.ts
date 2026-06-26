import { Component, OnInit, signal, computed, inject, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { UnsavedChangesService } from '../../services/unsaved-changes.service';
import { ExpenseModalService } from '../../services/expense-modal.service';
import { AuthService } from '../../services/auth.service';
import { Subscription, finalize } from 'rxjs';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { LoaderComponent } from '../loader/loader.component';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, LoaderComponent],
  template: `
    <div class="animate-fade-in h-100">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold m-0">Expenses Log</h4>
          <p class="text-muted m-0">Track operating costs, utilities, rent, and overheads</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()" *appHasPermission="['Expenses', 'Create']">
          <i class="fas fa-plus me-2"></i>Record Expense
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

      <!-- Expenses Summary Cards -->
      <div class="row g-4 mb-4">
        <div class="col-md-6 col-lg-4">
          <div class="card glass-card border-0 p-4">
            <span class="text-uppercase text-muted fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Total Expenses Logged</span>
            <h3 class="fw-extrabold text-danger mt-2 mb-0">₹{{ totalExpenses() | number:'1.2-2' }}</h3>
          </div>
        </div>
        <div class="col-md-6 col-lg-4">
          <div class="card glass-card border-0 p-4">
            <span class="text-uppercase text-muted fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Transactions Count</span>
            <h3 class="fw-extrabold text-dark mt-2 mb-0">{{ expensesCount() }}</h3>
          </div>
        </div>
      </div>

      <!-- Expenses Grid -->
      <div class="card glass-card border-0 shadow-sm overflow-hidden position-relative" style="min-height: 200px;">
        <div class="table-responsive">
          <table class="custom-table m-0">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Note</th>
                <th *ngIf="isAuthorizedForAudit()">Created By</th>
                <th *ngIf="isAuthorizedForAudit()">Role</th>
                <th *ngIf="isAuthorizedForAudit()">Created At</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody *ngIf="expenses().length > 0">
              <tr *ngFor="let exp of expenses()">
                <td class="fw-semibold">{{ exp.title }}</td>
                <td><span class="badge bg-light text-muted border">{{ exp.category || 'Other' }}</span></td>
                <td class="fw-semibold text-danger">₹{{ exp.amount | number:'1.2-2' }}</td>
                <td>{{ exp.expense_date }}</td>
                <td style="max-width: 250px;" class="text-truncate">{{ exp.note || '-' }}</td>
                <td *ngIf="isAuthorizedForAudit()">{{ exp.created_by_name || '-' }}</td>
                <td *ngIf="isAuthorizedForAudit()">{{ exp.created_by_role || '-' }}</td>
                <td *ngIf="isAuthorizedForAudit()">{{ (exp.created_at | date: 'dd-MM-yyyy') || '-' }}</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-2" (click)="openEditModal(exp)" *appHasPermission="['Expenses', 'Edit']">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" (click)="deleteExpense(exp.id)" *appHasPermission="['Expenses', 'Delete']">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <app-loader 
          [loading]="loading()" 
          [isEmpty]="!loading() && !errorMessage() && expenses().length === 0" 
          [error]="errorMessage()" 
          (retry)="loadExpenses()"
          emptyMessage="No recorded expenses found. Click Record Expense.">
        </app-loader>
      </div>
    </div>
  `
})
export class ExpensesComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private unsavedChangesService = inject(UnsavedChangesService);
  expenseModalService = inject(ExpenseModalService);
  authService = inject(AuthService);

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.expenseModalService.isOpen() && this.expenseModalService.isDirty()) {
      $event.returnValue = true;
    }
  }

  canDeactivate(): boolean | import('rxjs').Observable<boolean> {
    if (this.expenseModalService.isOpen() && this.expenseModalService.isDirty()) {
      return this.unsavedChangesService.confirm();
    }
    return true;
  }

  rawExpenses = signal<any[]>([]);
  showAuditFilters = signal<boolean>(false);
  auditUserFilter = signal<string>('');
  auditRoleFilter = signal<string>('');
  auditDateFilter = signal<string>('');

  isAuthorizedForAudit = computed(() => {
    const user = this.authService.currentUser();
    return user && (user.role === 'Owner' || user.role === 'Admin');
  });

  uniqueUsers = computed(() => {
    const creators = this.rawExpenses().map(item => item.created_by_name).filter(Boolean);
    return Array.from(new Set(creators));
  });

  uniqueRoles = computed(() => {
    const roles = this.rawExpenses().map(item => item.created_by_role).filter(Boolean);
    return Array.from(new Set(roles));
  });

  expenses = computed(() => {
    let list = this.rawExpenses();

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

  totalExpenses = computed(() => this.expenses().reduce((acc: number, exp: any) => acc + Number(exp.amount), 0));
  expensesCount = computed(() => this.expenses().length);

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  loading = signal<boolean>(false);

  private sub: Subscription | null = null;

  ngOnInit() {
    this.loadExpenses();

    this.sub = this.expenseModalService.expenseSaved.subscribe((msg: string) => {
      this.successMessage.set(msg);
      this.errorMessage.set(null);
      this.loadExpenses();
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  loadExpenses() {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api.get('expenses')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.rawExpenses.set(res.expenses);
          } else {
            this.errorMessage.set(res.message || 'Failed to load expenses.');
          }
        },
        error: (err) => {
          console.error('Failed to load expenses:', err);
          this.errorMessage.set(err.error?.error || 'Failed to load expenses.');
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
    this.expenseModalService.openAdd();
  }

  openEditModal(expense: any) {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.expenseModalService.openEdit(expense);
  }

  deleteExpense(id: number) {
     this.unsavedChangesService.confirmAction({
      message: 'Are you sure you want to delete this expense?',
      title: 'Confirm Deletion',
      confirmBtnText: 'Delete',
      type: 'danger'
    }).subscribe(confirmed => {
    if (!confirmed) return;
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.api.delete(`expenses/${id}`).subscribe({
      next: (res) => {
        this.successMessage.set(res.message);
        this.loadExpenses();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.error || 'Failed to delete expense.');
      }
    });
    });
  

   
  }
}
