import { Component, Input, Output, EventEmitter, signal, inject, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CategoryModalService } from '../../services/category-modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-category-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal fade" id="categoryModal" tabindex="-1" aria-hidden="true" [class.show]="isOpen" [style.display]="isOpen ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; background-color: var(--bg-sidebar);">
          <div class="modal-header bg-light-subtle py-3 border-bottom-0">
            <h5 class="modal-title fw-bold">{{ editMode() ? 'Edit' : 'Add' }} Category</h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          
          <form [formGroup]="categoryForm" (ngSubmit)="onSubmit()">
            <div class="modal-body p-4">
              <div class="alert alert-danger border-0 p-3 mb-3 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
                <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
              </div>

              <!-- Name -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted">Category Name</label>
                <input type="text" class="form-control" formControlName="name" placeholder="e.g. Shirts, Electronics">
                <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="categoryForm.get('name')?.touched && categoryForm.get('name')?.invalid">
                  Category name is required.
                </div>
              </div>

              <!-- Details -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted">Details / Notes</label>
                <textarea class="form-control" formControlName="details" rows="3" placeholder="Optional details about category..."></textarea>
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
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="categoryForm.invalid || loading()">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loading()"></span>
                {{ editMode() ? 'Save Changes' : 'Create Category' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class CategoryModalComponent implements OnChanges, OnDestroy {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private categoryModalService = inject(CategoryModalService);

  @Input() isOpen = false;
  @Input() category: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();

  editMode = signal<boolean>(false);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  categoryForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    details: [''],
    status: ['active', Validators.required]
  });

  private sub: Subscription;

  constructor() {
    this.sub = this.categoryForm.valueChanges.subscribe(() => {
      this.categoryModalService.isDirty.set(this.categoryForm.dirty);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.errorMessage.set(null);
    }
    if (changes['category']) {
      const cat = changes['category'].currentValue;
      this.editMode.set(!!cat);
      if (cat) {
        this.categoryForm.patchValue({
          name: cat.name,
          details: cat.details,
          status: cat.status
        });
      } else {
        this.categoryForm.reset({ status: 'active' });
      }
      this.categoryModalService.isDirty.set(false);
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  closeModal() {
    this.close.emit();
  }

  onSubmit() {
    if (this.categoryForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const data = this.categoryForm.value;

    const request = this.editMode() 
      ? this.api.put(`categories/${this.category.id}`, data)
      : this.api.post('categories', data);

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
