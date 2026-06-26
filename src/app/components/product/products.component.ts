import { Component, OnInit, OnDestroy, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { UnsavedChangesService } from '../../services/unsaved-changes.service';
import { ProductModalService } from '../../services/product-modal.service';
import { LoaderService } from '../../services/loader.service';
import { AuthService } from '../../services/auth.service';
import { Subscription, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { ProductPurchaseHistoryModalService } from '../../services/product-purchase-history-modal.service';
import { LoaderComponent } from '../loader/loader.component';
@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, LoaderComponent],
  template: `
    <div class="animate-fade-in h-100">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold m-0">Product Catalog</h4>
          <p class="text-muted m-0">Manage inventory items, images, and sizing stock variants</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-primary" (click)="goToImport()" *appHasPermission="['Products', 'Create']">
            <i class="fas fa-file-import me-2"></i>Import Products
          </button>
          <button class="btn btn-primary" (click)="openAddModal()" *appHasPermission="['Products', 'Create']">
            <i class="fas fa-plus me-2"></i>Add Product
          </button>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="row g-3 mb-4">
        <div class="col-md-4 col-sm-12">
          <div class="input-group">
            <span class="input-group-text bg-white border-end-0"><i class="fas fa-search text-muted"></i></span>
            <input type="text" class="form-control border-start-0" placeholder="Search by name or code..." [ngModel]="searchQuery()" (ngModelChange)="onSearchChange($event)">
          </div>
        </div>
        
        <div class="col-md-4 col-sm-6">
          <select class="form-select" [ngModel]="selectedCategoryFilter()" (ngModelChange)="onCategoryFilterChange($event)">
            <option value="0">All Categories</option>
            <option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <div class="col-md-4 col-sm-6">
          <select class="form-select" [ngModel]="selectedSupplierFilter()" (ngModelChange)="onSupplierFilterChange($event)">
            <option value="0">All Suppliers</option>
            <option *ngFor="let supp of suppliers()" [value]="supp.id">{{ supp.name }}</option>
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

      <div class="alert alert-danger border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
        <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
      </div>
      
      <div class="alert alert-success border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="successMessage()">
        <i class="fas fa-check-circle me-2"></i>{{ successMessage() }}
      </div>

      <!-- Products Table Card -->
      <div class="card glass-card border-0 shadow-sm overflow-hidden position-relative" style="min-height: 200px;">
        <div class="table-responsive">
          <table class="custom-table m-0">
            <thead>
              <tr>
                <th>Image</th>
                <th class="cursor-pointer" (click)="toggleSort('name')">
                  Product Name
                  <i class="fas" [ngClass]="getSortIcon('name')"></i>
                </th>
                <th>Category</th>
                <th>Supplier</th>
                <th class="cursor-pointer" (click)="toggleSort('purchase_price')">
                  Cost Price
                  <i class="fas" [ngClass]="getSortIcon('purchase_price')"></i>
                </th>
                <th class="cursor-pointer" (click)="toggleSort('sales_price')">
                  Sales Price
                  <i class="fas" [ngClass]="getSortIcon('sales_price')"></i>
                </th>
                <th class="cursor-pointer" (click)="toggleSort('stock_quantity')">
                  Stock
                  <i class="fas" [ngClass]="getSortIcon('stock_quantity')"></i>
                </th>
                <th>Sizes Available</th>
                <th *ngIf="isAuthorizedForAudit()">Created By</th>
                <th *ngIf="isAuthorizedForAudit()">Role</th>
                <th *ngIf="isAuthorizedForAudit()">Created At</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody *ngIf="sortedProducts().length > 0">
              <tr *ngFor="let prod of sortedProducts()">
                <td>
                  <img [src]="prod.image ? imageBaseUrl + prod.image : 'assets/placeholder.png'" 
                       (error)="handleImgError($event)"
                       class="rounded border object-fit-cover" style="width: 48px; height: 48px;">
                </td>
                <td>
                  <div class="fw-bold text-primary cursor-pointer text-decoration-underline" (click)="openProductHistory(prod)">{{ prod.name }}</div>
                  <span class="badge bg-light text-muted border mt-1" style="font-size: 0.72rem;">{{ prod.code }}</span>
                </td>
                <td>{{ prod.category_name || 'General' }}</td>
                <td>{{ prod.supplier_name || '-' }}</td>
                <td class="fw-semibold">₹{{ prod.purchase_price | number:'1.2-2' }}</td>
                <td class="fw-semibold text-primary">
                  <div>₹{{ prod.sales_price | number:'1.2-2' }}</div>
                  <div class="text-muted text-decoration-line-through small fw-normal" *ngIf="prod.actual_price" style="font-size: 0.72rem;">
                    ₹{{ prod.actual_price | number:'1.2-2' }}
                  </div>
                  <span class="badge bg-danger-subtle text-danger px-1.5 py-0.5 mt-1 font-monospace" style="font-size: 0.65rem;" *ngIf="prod.discount_percent > 0">
                    {{ prod.discount_percent }}% OFF
                  </span>
                </td>
                <td>
                  <div class="d-flex flex-column gap-1">
                    <span class="fw-extrabold badge align-self-start" style="font-size: 0.65rem;" [ngClass]="{
                      'text-danger': prod.stock_quantity <= 10,
                      'bg-danger-subtle': prod.stock_quantity <= 10,
                      'text-success': prod.stock_quantity > 10,
                      'bg-success-subtle': prod.stock_quantity > 10
                    }">
                      Current: {{ prod.stock_quantity }}
                    </span>
                    <span class="badge bg-light text-muted border align-self-start" style="font-size: 0.65rem;">
                      Initial: {{ prod.initial_stock_quantity ?? 0 }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="d-flex flex-wrap gap-1">
                    <span class="badge bg-light text-dark border" style="font-size: 0.7rem;" *ngFor="let v of prod.variants">
                      {{ v.size }} ({{ v.stock_quantity }})
                    </span>
                    <span class="text-muted" style="font-size: 0.8rem;" *ngIf="prod.variants.length === 0">
                      {{ prod.size || '-' }}
                    </span>
                  </div>
                </td>
                <td *ngIf="isAuthorizedForAudit()">{{ prod.created_by_name || '-' }}</td>
                <td *ngIf="isAuthorizedForAudit()">{{ prod.created_by_role || '-' }}</td>
                <td *ngIf="isAuthorizedForAudit()">{{ (prod.created_at | date: 'dd-MM-yyyy') || '-' }}</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-2" (click)="openEditModal(prod)" *appHasPermission="['Products', 'Edit']">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" (click)="deleteProduct(prod.id)" *appHasPermission="['Products', 'Delete']">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <app-loader 
          [loading]="loading()" 
          [isEmpty]="!loading() && !errorMessage() && sortedProducts().length === 0" 
          [error]="errorMessage()" 
          (retry)="loadProducts()"
          emptyMessage="No products found matching filters.">
        </app-loader>
      </div>
    </div>
  `,
  styles: [`
    .cursor-pointer {
      cursor: pointer;
      user-select: none;
    }
  `]
})
export class ProductsComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private router = inject(Router);
  private unsavedChangesService = inject(UnsavedChangesService);
  productModalService = inject(ProductModalService);
  loaderService = inject(LoaderService);
  authService = inject(AuthService);
  productHistoryModalService = inject(ProductPurchaseHistoryModalService);
  private searchTimeout: any = null;
  imageBaseUrl = environment.imageBaseUrl;

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.productModalService.isOpen() && this.productModalService.isDirty()) {
      $event.returnValue = true;
    }
  }

  canDeactivate(): boolean | import('rxjs').Observable<boolean> {
    if (this.productModalService.isOpen() && this.productModalService.isDirty()) {
      return this.unsavedChangesService.confirm();
    }
    return true;
  }

  products = signal<any[]>([]);
  categories = signal<any[]>([]);
  suppliers = signal<any[]>([]);

  searchQuery = signal<string>('');
  selectedCategoryFilter = signal<number>(0);
  selectedSupplierFilter = signal<number>(0);

  // Sorting state signals
  sortBy = signal<string>('code');
  sortAsc = signal<boolean>(true);

  // Audit filter state signals
  showAuditFilters = signal<boolean>(false);
  auditUserFilter = signal<string>('');
  auditRoleFilter = signal<string>('');
  auditDateFilter = signal<string>('');

  isAuthorizedForAudit = computed(() => {
    const user = this.authService.currentUser();
    return user && (user.role === 'Owner' || user.role === 'Admin');
  });

  uniqueUsers = computed(() => {
    const creators = this.products().map(item => item.created_by_name).filter(Boolean);
    return Array.from(new Set(creators));
  });

  uniqueRoles = computed(() => {
    const roles = this.products().map(item => item.created_by_role).filter(Boolean);
    return Array.from(new Set(roles));
  });

  filteredProducts = computed(() => {
    let list = this.products();

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

  // Computed signal for sorted list of products
  sortedProducts = computed(() => {
    const list = [...this.filteredProducts()];
    const key = this.sortBy();
    const asc = this.sortAsc();

    if (!key) return list;

    list.sort((a, b) => {
      const valA = this.getSortValue(a, key);
      const valB = this.getSortValue(b, key);

      if (valA === valB) return 0;
      
      const comparison = valA < valB ? -1 : 1;
      return asc ? comparison : -comparison;
    });

    return list;
  });

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  loading = signal<boolean>(false);

  private sub: Subscription | null = null;

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
    this.loadSuppliers();

    this.sub = this.productModalService.productSaved.subscribe((msg: string) => {
      this.successMessage.set(msg);
      this.errorMessage.set(null);
      this.loadProducts();
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  loadProducts() {
    this.loading.set(true);
    this.errorMessage.set(null);
    const params = {
      q: this.searchQuery(),
      category: this.selectedCategoryFilter(),
      supplier: this.selectedSupplierFilter()
    };
    this.api.get('products', params)
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.products.set(res.products);
          } else {
            this.errorMessage.set(res.message || 'Failed to load products.');
          }
        },
        error: (err) => {
          console.error('Failed to load products:', err);
          this.errorMessage.set(err.error?.error || 'Failed to load products.');
        }
      });
  }

  loadCategories() {
    this.api.get('categories').subscribe({
      next: (res) => {
        if (res.success) {
          this.categories.set(res.categories);
        }
      }
    });
  }

  loadSuppliers() {
    this.api.get('suppliers').subscribe({
      next: (res) => {
        if (res.success) {
          this.suppliers.set(res.suppliers);
        }
      }
    });
  }

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.loadProducts();
    }, 300);
  }

  onCategoryFilterChange(val: number) {
    this.selectedCategoryFilter.set(Number(val));
    this.loadProducts();
  }

  onSupplierFilterChange(val: number) {
    console.log(val);
    this.selectedSupplierFilter.set(Number(val));
    this.loadProducts();
  }

  goToImport() {
    this.router.navigate(['/products/import']);
  }

  openAddModal() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.productModalService.openAdd();
  }

  openEditModal(product: any) {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.productModalService.openEdit(product);
  }

  deleteProduct(id: number) {
    this.unsavedChangesService.confirmAction({
      message: 'Are you sure you want to delete this product?',
      title: 'Confirm Deletion',
      confirmBtnText: 'Delete',
      type: 'danger'
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.errorMessage.set(null);
      this.successMessage.set(null);

      this.api.delete(`products/${id}`).subscribe({
        next: (res) => {
          this.successMessage.set(res.message);
          this.loadProducts();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.error || 'Failed to delete product.');
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

  toggleSort(key: string) {
    if (this.sortBy() === key) {
      this.sortAsc.set(!this.sortAsc());
    } else {
      this.sortBy.set(key);
      this.sortAsc.set(true);
    }
  }

  getSortIcon(key: string): string {
    if (this.sortBy() !== key) {
      return 'fa-sort text-muted ms-1';
    }
    return this.sortAsc() ? 'fa-sort-up text-primary ms-1' : 'fa-sort-down text-primary ms-1';
  }

  private getSortValue(item: any, key: string): any {
    if (key === 'purchase_price' || key === 'sales_price' || key === 'stock_quantity') {
      return Number(item[key]) || 0;
    }
    if (key === 'category_name') {
      return (item.category_name || 'General').toLowerCase();
    }
    if (key === 'supplier_name') {
      return (item.supplier_name || '').toLowerCase();
    }
    if (key === 'name') {
      return (item.name || '').toLowerCase();
    }
    if (key === 'code') {
      return (item.code || '').toLowerCase();
    }
    return (item[key] || '').toString().toLowerCase();
  }

  openProductHistory(prod: any) {
    this.productHistoryModalService.open(prod.id || prod.product_id, prod.name, prod.code);
  }

  handleImgError(event: any) {
    event.target.src = 'assets/placeholder.png';
  }
}
