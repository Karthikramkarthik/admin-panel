import { Component, Input, Output, EventEmitter, signal, inject, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CustomerModalService } from '../../services/customer-modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-customer-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Customer Modal -->
    <div class="modal fade" id="customerModal" tabindex="-1" aria-hidden="true" [class.show]="isOpen" [style.display]="isOpen ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; background-color: var(--bg-sidebar);">
          <div class="modal-header bg-light-subtle py-3 border-bottom-0">
            <h5 class="modal-title fw-bold">{{ editMode() ? 'Edit' : 'Add' }} Customer</h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          
          <form [formGroup]="customerForm" (ngSubmit)="onSubmit()">
            <div class="modal-body p-4">
              <div class="alert alert-danger border-0 p-3 mb-3 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
                <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
              </div>

              <!-- Name -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted">Customer Name</label>
                <input type="text" class="form-control" formControlName="name" placeholder="e.g. Ramesh Kumar">
                <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="customerForm.get('name')?.touched && customerForm.get('name')?.invalid">
                  Customer name is required.
                </div>
              </div>

              <!-- Mobile -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted">Mobile Number</label>
                <input type="text" class="form-control" formControlName="mobile" placeholder="e.g. 9876543210">
                <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="customerForm.get('mobile')?.touched && customerForm.get('mobile')?.invalid">
                  Mobile number is required.
                </div>
              </div>

              <!-- Email -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted">Email Address</label>
                <input type="email" class="form-control" formControlName="email" placeholder="e.g. customer@example.com">
                <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="customerForm.get('email')?.touched && customerForm.get('email')?.invalid">
                  Please enter a valid email address.
                </div>
              </div>

              <!-- Address -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted">Billing Address</label>
                <textarea class="form-control" formControlName="address" rows="3" placeholder="Optional billing address..."></textarea>
              </div>

              <!-- Source -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted">Customer Source</label>
                <select class="form-select" formControlName="source">
                  <option value="Admin Panel">Admin Panel</option>
                  <option value="Website">Website</option>
                  <option value="POS">POS</option>
                  <option value="Import">Import</option>
                </select>
              </div>

              <!-- Status -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted">Status</label>
                <select class="form-select" formControlName="status">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div class="modal-footer bg-light-subtle border-top-0 py-3">
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="customerForm.invalid || loading()">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loading()"></span>
                {{ editMode() ? 'Save Customer' : 'Create Customer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class CustomerModalComponent implements OnChanges, OnDestroy {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private customerModalService = inject(CustomerModalService);

  @Input() isOpen = false;
  @Input() customer: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();

  editMode = signal<boolean>(false);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  customerForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    mobile: ['', [Validators.required, Validators.pattern(/^[0-9+\\(\\)\\s-]{10,20}$/)]],
    email: ['', [Validators.email]],
    address: [''],
    status: ['active', Validators.required],
    source: ['Admin Panel', Validators.required]
  });

  private sub: Subscription;

  constructor() {
    this.sub = this.customerForm.valueChanges.subscribe(() => {
      this.customerModalService.isDirty.set(this.customerForm.dirty);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.errorMessage.set(null);
    }
    if (changes['customer']) {
      const cust = changes['customer'].currentValue;
      this.editMode.set(!!cust);
      if (cust) {
        this.customerForm.patchValue({
          name: cust.name,
          mobile: cust.mobile,
          email: cust.email,
          address: cust.address,
          status: cust.status,
          source: cust.source || 'Admin Panel'
        });
      } else {
        this.customerForm.reset({ status: 'active', source: 'Admin Panel' });
      }
      this.customerModalService.isDirty.set(false);
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  closeModal() {
    this.close.emit();
  }

  onSubmit() {
    if (this.customerForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const data = this.customerForm.value;

    const request = this.editMode() 
      ? this.api.put(`customers/${this.customer.id}`, data)
      : this.api.post('customers', data);

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
