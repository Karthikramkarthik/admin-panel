import { Component, OnInit, signal, computed, inject, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { UnsavedChangesService } from '../../services/unsaved-changes.service';
import { CategoryModalService } from '../../services/category-modal.service';
import { AuthService } from '../../services/auth.service';
import { Subscription, finalize } from 'rxjs';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { LoaderComponent } from '../loader/loader.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, LoaderComponent],
  template: `
    <div class="animate-fade-in h-100">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold m-0">Product Categories</h4>
          <p class="text-muted m-0">Manage classifications for catalog organizational structures</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()" *appHasPermission="['Categories', 'Create']">
          <i class="fas fa-plus me-2"></i>Add Category
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

      <!-- Categories Table Card -->
      <div class="card glass-card border-0 shadow-sm overflow-hidden position-relative" style="min-height: 200px;">
        <div class="table-responsive">
          <table class="custom-table m-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Details</th>
                <th *ngIf="isAuthorizedForAudit()">Created By</th>
                <th *ngIf="isAuthorizedForAudit()">Role</th>
                <th *ngIf="isAuthorizedForAudit()">Created At</th>
                <th>Status</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody *ngIf="categories().length > 0">
              <tr *ngFor="let cat of categories()">
                <td class="fw-semibold">{{ cat.name }}</td>
                <td><span class="badge bg-light text-muted border">{{ cat.slug }}</span></td>
                <td>{{ cat.details || '-' }}</td>
               <td *ngIf="isAuthorizedForAudit()">

  <span
    *ngIf="cat.created_by_name"
    class="badge bg-indigo text-dark border border-indigo-subtle"
  >
    {{ cat.created_by_name }}
  </span>

  <ng-container *ngIf="!cat.created_by_name">
    -
  </ng-container>

</td>
               <td *ngIf="isAuthorizedForAudit()">

  <span
    *ngIf="cat.created_by_role"
    class="badge bg-indigo text-dark border border-indigo-subtle"
  >
    {{ cat.created_by_role }}
  </span>

  <ng-container *ngIf="!cat.created_by_role">
    -
  </ng-container>

</td>
                <td *ngIf="isAuthorizedForAudit()">
                  <span class="badge bg-indigo text-dark border border-indigo-subtle">{{ (cat.created_at | date: 'dd-MM-yyyy') || '-' }}</span>
                </td>
                <td>
                  <span class="badge" [class.bg-success]="cat.status === 'active'" [class.bg-secondary]="cat.status === 'inactive'">
                    {{ cat.status }}
                  </span>
                </td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-2" (click)="openEditModal(cat)" *appHasPermission="['Categories', 'Edit']">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" (click)="deleteCategory(cat.id)" *appHasPermission="['Categories', 'Delete']">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <app-loader 
          [loading]="loading()" 
          [isEmpty]="!loading() && !errorMessage() && categories().length === 0" 
          [error]="errorMessage()" 
          (retry)="loadCategories()"
          emptyMessage="No categories found. Click Add Category to create one.">
        </app-loader>
      </div>
    </div>
  `
})
export class CategoriesComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private unsavedChangesService = inject(UnsavedChangesService);
  categoryModalService = inject(CategoryModalService);
  authService = inject(AuthService);

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.categoryModalService.isOpen() && this.categoryModalService.isDirty()) {
      $event.returnValue = true;
    }
  }

  canDeactivate(): boolean | import('rxjs').Observable<boolean> {
    if (this.categoryModalService.isOpen() && this.categoryModalService.isDirty()) {
      return this.unsavedChangesService.confirm();
    }
    return true;
  }

  rawCategories = signal<any[]>([]);
  loading = signal<boolean>(false);
  showAuditFilters = signal<boolean>(false);
  auditUserFilter = signal<string>('');
  auditRoleFilter = signal<string>('');
  auditDateFilter = signal<string>('');

  isAuthorizedForAudit = computed(() => {
    const user = this.authService.currentUser();
    return user && (user.role === 'Owner' || user.role === 'Admin');
  });

  uniqueUsers = computed(() => {
    const creators = this.rawCategories().map(item => item.created_by_name).filter(Boolean);
    return Array.from(new Set(creators));
  });

  uniqueRoles = computed(() => {
    const roles = this.rawCategories().map(item => item.created_by_role).filter(Boolean);
    return Array.from(new Set(roles));
  });

  categories = computed(() => {
    let list = this.rawCategories();

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
    this.loadCategories();
    this.sub = this.categoryModalService.categorySaved.subscribe((msg: string) => {
      this.successMessage.set(msg);
      this.errorMessage.set(null);
      this.loadCategories();
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  loadCategories() {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api.get('categories')
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.rawCategories.set(res.categories);
          } else {
            this.errorMessage.set(res.message || 'Failed to load categories.');
          }
        },
        error: (err) => {
          console.error('Failed to load categories:', err);
          this.errorMessage.set(err.error?.error || 'Failed to load categories.');
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
    this.categoryModalService.openAdd();
  }

  openEditModal(category: any) {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.categoryModalService.openEdit(category);
  }

  deleteCategory(id: number) {
    this.unsavedChangesService.confirmAction({
      message: 'Are you sure you want to delete this category?',
      title: 'Confirm Deletion',
      confirmBtnText: 'Delete',
      type: 'danger'
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.errorMessage.set(null);
      this.successMessage.set(null);

      this.api.delete(`categories/${id}`).subscribe({
        next: (res) => {
          this.successMessage.set(res.message);
          this.loadCategories();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.error || 'Failed to delete category.');
        }
      });
    });
  }
}
