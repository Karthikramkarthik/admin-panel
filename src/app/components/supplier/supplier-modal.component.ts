import { Component, Input, Output, EventEmitter, signal, inject, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { SupplierModalService } from '../../services/supplier-modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-supplier-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Supplier Modal -->
    <div class="modal fade" id="supplierModal" tabindex="-1" aria-hidden="true" [class.show]="isOpen" [style.display]="isOpen ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; background-color: var(--bg-sidebar);">
          <div class="modal-header bg-light-subtle py-3 border-bottom-0">
            <h5 class="modal-title fw-bold">{{ editMode() ? 'Edit' : 'Add' }} Supplier</h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          
          <form [formGroup]="supplierForm" (ngSubmit)="onSubmit()">
            <div class="modal-body p-4">
              <div class="alert alert-danger border-0 p-3 mb-3 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
                <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
              </div>

              <!-- Name -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted">Supplier Name</label>
                <input type="text" class="form-control" formControlName="name" placeholder="e.g. Trionova Apparel">
                <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="supplierForm.get('name')?.touched && supplierForm.get('name')?.invalid">
                  Supplier name is required.
                </div>
              </div>

              <!-- Mobile -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted">Mobile Number</label>
                <input type="text" class="form-control" formControlName="mobile" placeholder="e.g. 9876543210">
                <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="supplierForm.get('mobile')?.touched && supplierForm.get('mobile')?.invalid">
                  Mobile number is required.
                </div>
              </div>

              <!-- GST -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted">GST Number</label>
                <input type="text" class="form-control" formControlName="gst_number" placeholder="Optional GSTIN">
              </div>

              <!-- Address -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted">Address</label>
                <textarea class="form-control" formControlName="address" rows="3" placeholder="Optional physical address details..."></textarea>
              </div>
            </div>
            
            <div class="modal-footer bg-light-subtle border-top-0 py-3">
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="supplierForm.invalid || loading()">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loading()"></span>
                {{ editMode() ? 'Save Supplier' : 'Create Supplier' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class SupplierModalComponent implements OnChanges, OnDestroy {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private supplierModalService = inject(SupplierModalService);

  @Input() isOpen = false;
  @Input() supplier: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();

  editMode = signal<boolean>(false);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  supplierForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    mobile: ['', [Validators.required, Validators.pattern(/^[0-9+\\(\\)\\s-]{10,20}$/)]],
    gst_number: [''],
    address: ['']
  });

  private sub: Subscription;

  constructor() {
    this.sub = this.supplierForm.valueChanges.subscribe(() => {
      this.supplierModalService.isDirty.set(this.supplierForm.dirty);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.errorMessage.set(null);
    }
    if (changes['supplier']) {
      const sup = changes['supplier'].currentValue;
      this.editMode.set(!!sup);
      if (sup) {
        this.supplierForm.patchValue({
          name: sup.name,
          mobile: sup.mobile,
          gst_number: sup.gst_number,
          address: sup.address
        });
      } else {
        this.supplierForm.reset();
      }
      this.supplierModalService.isDirty.set(false);
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  closeModal() {
    this.close.emit();
  }

  onSubmit() {
    if (this.supplierForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const data = this.supplierForm.value;

    const request = this.editMode() 
      ? this.api.put(`suppliers/${this.supplier.id}`, data)
      : this.api.post('suppliers', data);

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
