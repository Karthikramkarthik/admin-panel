import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LoaderService } from '../../services/loader.service';
import { UnsavedChangesService } from '../../services/unsaved-changes.service';

@Component({
  selector: 'app-internal-consumption',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="animate-fade-in h-100">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold m-0 text-main">Personal Use & Internal Consumption</h4>
          <p class="text-muted m-0">Track and manage inventory items taken for personal, family, or other internal use.</p>
        </div>
      </div>

      <div class="alert alert-danger border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
        <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
      </div>
      
      <div class="alert alert-success border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="successMessage()">
        <i class="fas fa-check-circle me-2"></i>{{ successMessage() }}
      </div>

      <div class="row g-4">
        <!-- Record Usage Form Panel -->
        <div class="col-xl-4 col-lg-5 col-md-12">
          <div class="card glass-card border-0 shadow-sm p-4">
            <h5 class="fw-bold mb-3 text-main">
              <i class="fas fa-hand-holding-heart text-warning me-2" style="color: #fd7e14 !important;"></i>Record Internal Use
            </h5>

            <form [formGroup]="usageForm" (ngSubmit)="onSubmit()">
              <!-- Product Selection -->
              <div class="mb-3 position-relative">
                <label class="form-label fw-semibold text-muted" style="font-size: 0.8rem;">Select Product</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0"><i class="fas fa-search text-muted"></i></span>
                  <input type="text" 
                         class="form-control border-start-0" 
                         placeholder="Type name or code to search..." 
                         [value]="searchQuery()" 
                         (input)="onSearchInput($event)"
                         (focus)="searchFocused.set(true)">
                </div>

                <!-- Suggestions Dropdown -->
                <div class="search-dropdown shadow-lg position-absolute w-100 bg-white border rounded mt-1 overflow-auto" 
                     *ngIf="searchFocused() && searchResults().length > 0"
                     style="z-index: 1000; max-height: 250px;">
                  <button type="button" 
                          *ngFor="let p of searchResults()" 
                          class="dropdown-item py-2 px-3 border-bottom d-flex justify-content-between align-items-center"
                          (click)="selectProduct(p)">
                    <div>
                      <div class="fw-bold text-dark" style="font-size: 0.85rem;">{{ p.name }}</div>
                      <span class="badge bg-light text-muted border" style="font-size: 0.7rem;">{{ p.code }}</span>
                    </div>
                    <span class="badge bg-primary-subtle text-primary" style="font-size: 0.72rem;">Stock: {{ p.stock_quantity }}</span>
                  </button>
                </div>
              </div>

              <!-- Selected Product Preview Card -->
              <div class="card bg-light border-0 p-3 mb-3" *ngIf="selectedProduct()">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 class="fw-bold m-0" style="font-size: 0.9rem;">{{ selectedProduct().name }}</h6>
                    <span class="badge bg-secondary-subtle text-secondary border mt-1" style="font-size: 0.7rem;">{{ selectedProduct().code }}</span>
                  </div>
                  <button type="button" class="btn btn-sm text-danger p-0 border-0 bg-transparent" (click)="clearSelectedProduct()">
                    <i class="fas fa-times-circle fs-5"></i>
                  </button>
                </div>

                <div class="mt-2 pt-2 border-top d-flex justify-content-between text-muted" style="font-size: 0.78rem;">
                  <span>Purchase Price: <strong>₹{{ selectedProduct().purchase_price | number:'1.2-2' }}</strong></span>
                  <span>General Stock: <strong class="badge bg-success-subtle text-success">{{ selectedProduct().stock_quantity }}</strong></span>
                </div>
              </div>

              <!-- Sizing Variant -->
              <div class="mb-3" *ngIf="selectedProduct() && selectedProduct().variants && selectedProduct().variants.length > 0">
                <label class="form-label fw-semibold text-muted" style="font-size: 0.8rem;">Select Size</label>
                <select class="form-select" formControlName="size" (change)="onSizeChange()">
                  <option value="">-- Select Size --</option>
                  <option *ngFor="let v of selectedProduct().variants" [value]="v.size">
                    {{ v.size }} (Stock: {{ v.stock_quantity }})
                  </option>
                </select>
                <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="usageForm.get('size')?.touched && usageForm.get('size')?.invalid">
                  Size selection is required for this product.
                </div>
              </div>

              <!-- Quantity -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted" style="font-size: 0.8rem;">Quantity</label>
                <input type="number" class="form-control" formControlName="quantity" min="1" [max]="maxAvailableStock()">
                <div class="mt-1 d-flex justify-content-between" style="font-size: 0.72rem;">
                  <span class="text-danger" *ngIf="usageForm.get('quantity')?.touched && usageForm.get('quantity')?.invalid">
                    Quantity is required and must not exceed available stock ({{ maxAvailableStock() }}).
                  </span>
                  <span class="text-success ms-auto" *ngIf="selectedProduct()">Max Available: {{ maxAvailableStock() }}</span>
                </div>
              </div>

              <!-- Used By -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted" style="font-size: 0.8rem;">Used By (Name)</label>
                <input type="text" class="form-control" formControlName="used_by" placeholder="e.g. Owner, Staff Name">
                <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="usageForm.get('used_by')?.touched && usageForm.get('used_by')?.invalid">
                  Name is required.
                </div>
              </div>

              <!-- Reason -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted" style="font-size: 0.8rem;">Reason</label>
                <select class="form-select" formControlName="reason">
                  <option value="">-- Select Reason --</option>
                  <option value="Personal Use">Personal Use</option>
                  <option value="Family Use">Family Use</option>
                  <option value="Staff Use">Staff Use</option>
                  <option value="Marketing Sample">Marketing Sample</option>
                  <option value="Damage">Damage</option>
                  <option value="Other">Other</option>
                </select>
                <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="usageForm.get('reason')?.touched && usageForm.get('reason')?.invalid">
                  Reason is required.
                </div>
              </div>

              <!-- Usage Date -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted" style="font-size: 0.8rem;">Usage Date</label>
                <input type="date" class="form-control" formControlName="usage_date">
              </div>

              <!-- Notes -->
              <div class="mb-4">
                <label class="form-label fw-semibold text-muted" style="font-size: 0.8rem;">Notes</label>
                <textarea class="form-control" formControlName="notes" rows="3" placeholder="Add optional details..."></textarea>
              </div>

              <button type="submit" class="btn btn-primary w-100 py-2.5" [disabled]="usageForm.invalid || loading() || !selectedProduct()">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loading()"></span>
                Log Stock Deduction
              </button>
            </form>
          </div>
        </div>

        <!-- Usage Ledger Panel -->
        <div class="col-xl-8 col-lg-7 col-md-12">
          <div class="card glass-card border-0 shadow-sm p-4 h-100">
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
              <h5 class="fw-bold m-0 text-main"><i class="fas fa-list-check text-primary me-2"></i>Consumption History</h5>
              <div class="d-flex gap-2">
                <input type="text" class="form-control form-control-sm" placeholder="Search product..." [ngModel]="filterQuery()" (ngModelChange)="onFilterQueryChange($event)" style="max-width: 200px;">
                <select class="form-select form-select-sm" [ngModel]="filterReason()" (ngModelChange)="onFilterReasonChange($event)" style="max-width: 150px;">
                  <option value="">All Reasons</option>
                  <option value="Personal Use">Personal Use</option>
                  <option value="Family Use">Family Use</option>
                  <option value="Staff Use">Staff Use</option>
                  <option value="Marketing Sample">Marketing Sample</option>
                  <option value="Damage">Damage</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div class="table-responsive flex-grow-1" style="min-height: 400px;">
              <table class="table table-hover table-striped align-middle m-0" style="font-size: 0.85rem;">
                <thead>
                  <tr class="table-light">
                    <th>Product details</th>
                    <th>Size</th>
                    <th>Qty</th>
                    <th>Cost Value</th>
                    <th>Used By</th>
                    <th>Reason</th>
                    <th>Date</th>
                    <th class="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let log of filteredLogs()">
                    <td>
                      <div class="fw-bold text-main">{{ log.product_name }}</div>
                      <span class="badge bg-light text-muted border" style="font-size: 0.72rem;">{{ log.product_code }}</span>
                    </td>
                    <td><span class="badge bg-light text-dark border">{{ log.size || '-' }}</span></td>
                    <td class="fw-bold">{{ log.quantity }}</td>
                    <td class="fw-semibold text-danger">₹{{ (log.purchase_price * log.quantity) | number:'1.2-2' }}</td>
                    <td>{{ log.used_by }}</td>
                    <td>
                      <span class="badge bg-warning-subtle text-warning-emphasis" [ngClass]="getReasonBadgeClass(log.reason)" style="font-size: 0.7rem; padding: 0.35em 0.6em;">
                        {{ log.reason }}
                      </span>
                    </td>
                    <td>{{ log.usage_date }}</td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-outline-danger" (click)="deleteLog(log.id)" title="Restore Stock & Delete Log">
                        <i class="fas fa-trash-arrow-up me-1"></i>Restore
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="filteredLogs().length === 0">
                    <td colspan="8" class="text-center text-muted py-5">
                      <i class="fas fa-box-open d-block fs-3 mb-2 opacity-50 text-primary"></i>
                      No consumption records found.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-dropdown {
      border-color: var(--border-color);
      background: var(--bg-sidebar);
    }
    .search-dropdown .dropdown-item:hover {
      background-color: var(--accent-primary-light);
      color: var(--text-main);
    }
  `]
})
export class InternalConsumptionComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private unsavedChangesService = inject(UnsavedChangesService);

  usageForm!: FormGroup;
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Auto-suggest search state
  searchQuery = signal<string>('');
  searchResults = signal<any[]>([]);
  searchFocused = signal<boolean>(false);
  selectedProduct = signal<any | null>(null);

  // History ledger state
  logs = signal<any[]>([]);
  filterQuery = signal<string>('');
  filterReason = signal<string>('');

  maxAvailableStock = computed(() => {
    const prod = this.selectedProduct();
    if (!prod) return 0;
    const selectedSize = this.usageForm?.get('size')?.value;
    if (selectedSize && prod.variants) {
      const variant = prod.variants.find((v: any) => v.size === selectedSize);
      return variant ? variant.stock_quantity : 0;
    }
    return prod.stock_quantity;
  });

  filteredLogs = computed(() => {
    let list = this.logs();
    const q = this.filterQuery().toLowerCase().trim();
    const r = this.filterReason();

    if (q) {
      list = list.filter(l => 
        l.product_name.toLowerCase().includes(q) || 
        l.product_code.toLowerCase().includes(q) ||
        l.used_by.toLowerCase().includes(q)
      );
    }
    if (r) {
      list = list.filter(l => l.reason === r);
    }
    return list;
  });

  ngOnInit() {
    this.initForm();
    this.loadLogs();

    // Close suggestions dropdown on document click
    if (typeof document !== 'undefined') {
      document.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.position-relative')) {
          this.searchFocused.set(false);
        }
      });
    }
  }

  initForm() {
    const today = new Date().toISOString().slice(0, 10);
    this.usageForm = this.fb.group({
      product_id: ['', Validators.required],
      size: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      used_by: ['', Validators.required],
      reason: ['', Validators.required],
      usage_date: [today, Validators.required],
      notes: ['']
    });
  }

  loadLogs() {
    this.api.get('internal-consumption').subscribe({
      next: (res) => {
        if (res.success) {
          this.logs.set(res.logs);
        }
      },
      error: (err) => console.error('Failed to load consumption history:', err)
    });
  }

  onSearchInput(event: any) {
    const val = event.target.value;
    this.searchQuery.set(val);

    if (!val.trim()) {
      this.searchResults.set([]);
      return;
    }

    // Reuse the products endpoint for autocompletion
    this.api.get('products', { q: val }).subscribe({
      next: (res) => {
        if (res.success) {
          this.searchResults.set(res.products);
        }
      }
    });
  }

  selectProduct(product: any) {
    this.selectedProduct.set(product);
    this.usageForm.patchValue({
      product_id: product.id,
      size: ''
    });

    // Reset validations on quantity
    this.usageForm.get('quantity')?.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(product.stock_quantity)
    ]);
    this.usageForm.get('quantity')?.updateValueAndValidity();

    // Force validation for size if variants exist
    if (product.variants && product.variants.length > 0) {
      this.usageForm.get('size')?.setValidators([Validators.required]);
    } else {
      this.usageForm.get('size')?.clearValidators();
    }
    this.usageForm.get('size')?.updateValueAndValidity();

    this.searchQuery.set(product.name);
    this.searchResults.set([]);
    this.searchFocused.set(false);
  }

  onSizeChange() {
    const selectedSize = this.usageForm.get('size')?.value;
    const prod = this.selectedProduct();
    if (!prod) return;

    let maxStock = prod.stock_quantity;
    if (selectedSize && prod.variants) {
      const variant = prod.variants.find((v: any) => v.size === selectedSize);
      maxStock = variant ? variant.stock_quantity : 0;
    }

    this.usageForm.get('quantity')?.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(maxStock)
    ]);
    this.usageForm.get('quantity')?.updateValueAndValidity();
  }

  clearSelectedProduct() {
    this.selectedProduct.set(null);
    this.searchQuery.set('');
    this.usageForm.patchValue({
      product_id: '',
      size: '',
      quantity: 1
    });
    this.usageForm.get('size')?.clearValidators();
    this.usageForm.get('size')?.updateValueAndValidity();
  }

  onFilterQueryChange(val: string) {
    this.filterQuery.set(val);
  }

  onFilterReasonChange(val: string) {
    this.filterReason.set(val);
  }

  onSubmit() {
    if (this.usageForm.invalid || !this.selectedProduct()) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.api.post('internal-consumption', this.usageForm.value).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.successMessage.set('Consumption record logged and inventory reduced successfully!');
          this.clearSelectedProduct();
          this.initForm();
          this.loadLogs();
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Failed to submit consumption record.');
      }
    });
  }

  deleteLog(id: number) {
    this.unsavedChangesService.confirmAction({
      title: 'Confirm Restore & Delete',
      message: 'Are you sure you want to delete this log? The deducted stock will be restored to inventory.',
      confirmBtnText: 'Restore Stock',
      type: 'danger'
    }).subscribe(confirmed => {
      if (!confirmed) return;

      this.errorMessage.set(null);
      this.successMessage.set(null);

      this.api.delete(`internal-consumption/${id}`).subscribe({
        next: (res) => {
          if (res.success) {
            this.successMessage.set(res.message);
            this.loadLogs();
          }
        },
        error: (err) => {
          this.errorMessage.set(err.error?.error || 'Failed to delete record.');
        }
      });
    });
  }

  getReasonBadgeClass(reason: string): string {
    switch (reason) {
      case 'Personal Use': return 'bg-primary-subtle text-primary border border-primary-subtle';
      case 'Family Use': return 'bg-info-subtle text-info border border-info-subtle';
      case 'Staff Use': return 'bg-success-subtle text-success border border-success-subtle';
      case 'Marketing Sample': return 'bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle';
      case 'Damage': return 'bg-danger-subtle text-danger border border-danger-subtle';
      default: return 'bg-light text-dark border';
    }
  }
}
