import { Component, Input, Output, EventEmitter, signal, inject, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CouponModalService } from '../../services/coupon-modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-coupon-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Coupon Modal -->
    <div class="modal fade" id="couponModal" tabindex="-1" aria-hidden="true" [class.show]="isOpen" [style.display]="isOpen ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; background-color: var(--bg-sidebar);">
          <div class="modal-header bg-light-subtle py-3 border-bottom-0">
            <h5 class="modal-title fw-bold">{{ editMode() ? 'Edit' : 'Create' }} Coupon</h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          
          <form [formGroup]="couponForm" (ngSubmit)="onSubmit()">
            <div class="modal-body p-4">
              <div class="alert alert-danger border-0 p-3 mb-3 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
                <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
              </div>

              <!-- Code -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted">Promo Code</label>
                <input type="text" class="form-control text-uppercase" formControlName="code" placeholder="e.g. WELCOME100" style="letter-spacing: 1px;">
                <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="couponForm.get('code')?.touched && couponForm.get('code')?.invalid">
                  Coupon code is required.
                </div>
              </div>

              <!-- Type & Value -->
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label fw-semibold text-muted">Discount Type</label>
                  <select class="form-select" formControlName="type">
                    <option value="fixed">Fixed Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold text-muted">Discount Value</label>
                  <input type="number" step="0.01" class="form-control" formControlName="value" placeholder="0.00">
                  <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="couponForm.get('value')?.touched && couponForm.get('value')?.invalid">
                    Value is required and must be greater than 0.
                  </div>
                </div>
              </div>

              <!-- Min Order Amount & Usage Limit -->
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label fw-semibold text-muted">Min Purchase (₹)</label>
                  <input type="number" step="0.01" class="form-control" formControlName="min_order_amount" placeholder="0.00">
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold text-muted">Usage Limit</label>
                  <input type="number" class="form-control" formControlName="usage_limit" placeholder="0 = Unlimited">
                  <small class="text-muted" style="font-size: 0.7rem;">0 means unlimited total uses.</small>
                </div>
              </div>

              <!-- Expiry Date & Status -->
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label fw-semibold text-muted">Expiry Date</label>
                  <input type="date" class="form-control" formControlName="expiry_date">
                  <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="couponForm.get('expiry_date')?.touched && couponForm.get('expiry_date')?.invalid">
                    Expiry date is required.
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold text-muted">Status</label>
                  <select class="form-select" formControlName="status">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="modal-footer bg-light-subtle border-top-0 py-3">
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="couponForm.invalid || loading()">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loading()"></span>
                {{ editMode() ? 'Save Changes' : 'Create Coupon' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class CouponModalComponent implements OnChanges, OnDestroy {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private couponModalService = inject(CouponModalService);

  @Input() isOpen = false;
  @Input() coupon: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();

  editMode = signal<boolean>(false);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  couponForm: FormGroup = this.fb.group({
    code: ['', Validators.required],
    type: ['fixed', Validators.required],
    value: [0, [Validators.required, Validators.min(0.01)]],
    min_order_amount: [0, [Validators.min(0)]],
    expiry_date: ['', Validators.required],
    usage_limit: [0, [Validators.min(0)]],
    status: ['active', Validators.required]
  });

  private sub: Subscription;

  constructor() {
    this.sub = this.couponForm.valueChanges.subscribe(() => {
      this.couponModalService.isDirty.set(this.couponForm.dirty);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.errorMessage.set(null);
    }
    if (changes['coupon']) {
      const c = changes['coupon'].currentValue;
      this.editMode.set(!!c);
      if (c) {
        this.couponForm.patchValue({
          code: c.code,
          type: c.type,
          value: c.value,
          min_order_amount: c.min_order_amount,
          expiry_date: c.expiry_date,
          usage_limit: c.usage_limit,
          status: c.status
        });
      } else {
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1);
        const expiryStr = expiry.toISOString().slice(0, 10);
        this.couponForm.reset({
          type: 'fixed',
          value: 0,
          min_order_amount: 0,
          usage_limit: 0,
          expiry_date: expiryStr,
          status: 'active'
        });
      }
      this.couponModalService.isDirty.set(false);
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  closeModal() {
    this.close.emit();
  }

  onSubmit() {
    if (this.couponForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const data = this.couponForm.value;

    const request = this.editMode() 
      ? this.api.put(`admin/coupons/${this.coupon.id}`, data)
      : this.api.post('admin/coupons', data);

    request.subscribe({
      next: (res) => {
        this.loading.set(false);
        this.save.emit(res.message);
        this.close.emit();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Operation failed.');
      }
    });
  }
}
