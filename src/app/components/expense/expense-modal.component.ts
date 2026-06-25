import { Component, Input, Output, EventEmitter, signal, inject, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ExpenseModalService } from '../../services/expense-modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-expense-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Expense Modal -->
    <div class="modal fade" id="expenseModal" tabindex="-1" aria-hidden="true" [class.show]="isOpen" [style.display]="isOpen ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; background-color: var(--bg-sidebar);">
          <div class="modal-header bg-light-subtle py-3 border-bottom-0">
            <h5 class="modal-title fw-bold">{{ editMode() ? 'Edit' : 'Record' }} Expense</h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          
          <form [formGroup]="expenseForm" (ngSubmit)="onSubmit()">
            <div class="modal-body p-4">
              <div class="alert alert-danger border-0 p-3 mb-3 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
                <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
              </div>

              <!-- Title -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted">Expense Title</label>
                <input type="text" class="form-control" formControlName="title" placeholder="e.g. Office Rent, Electric bill">
                <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="expenseForm.get('title')?.touched && expenseForm.get('title')?.invalid">
                  Title is required.
                </div>
              </div>

              <!-- Amount -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted">Amount (₹)</label>
                <input type="number" step="0.01" class="form-control" formControlName="amount" placeholder="0.00">
                <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="expenseForm.get('amount')?.touched && expenseForm.get('amount')?.invalid">
                  Amount is required and must be greater than 0.
                </div>
              </div>

              <!-- Expense Date -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted">Date</label>
                <input type="date" class="form-control" formControlName="expense_date">
                <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="expenseForm.get('expense_date')?.touched && expenseForm.get('expense_date')?.invalid">
                  Date is required.
                </div>
              </div>

              <!-- Category -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted">Category</label>
                <select class="form-select" formControlName="category">
                  <option value="">Select Category</option>
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities (Power, Water)</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Salaries">Staff Salaries</option>
                  <option value="Marketing">Marketing / Printing</option>
                  <option value="Travel">Travel / Fuel</option>
                  <option value="Pantry">Pantry & Snacks</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <!-- Note -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted">Note</label>
                <textarea class="form-control" formControlName="note" rows="3" placeholder="Optional notes..."></textarea>
              </div>
            </div>
            
            <div class="modal-footer bg-light-subtle border-top-0 py-3">
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="expenseForm.invalid || loading()">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loading()"></span>
                {{ editMode() ? 'Save Expense' : 'Record Expense' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class ExpenseModalComponent implements OnChanges, OnDestroy {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private expenseModalService = inject(ExpenseModalService);

  @Input() isOpen = false;
  @Input() expense: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();

  editMode = signal<boolean>(false);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  expenseForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    expense_date: ['', Validators.required],
    category: [''],
    note: ['']
  });

  private sub: Subscription;

  constructor() {
    this.sub = this.expenseForm.valueChanges.subscribe(() => {
      this.expenseModalService.isDirty.set(this.expenseForm.dirty);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.errorMessage.set(null);
    }
    if (changes['expense']) {
      const exp = changes['expense'].currentValue;
      this.editMode.set(!!exp);
      if (exp) {
        this.expenseForm.patchValue({
          title: exp.title,
          amount: exp.amount,
          expense_date: exp.expense_date,
          category: exp.category,
          note: exp.note
        });
      } else {
        const todayStr = new Date().toISOString().slice(0, 10);
        this.expenseForm.reset({
          amount: 0,
          expense_date: todayStr,
          category: ''
        });
      }
      this.expenseModalService.isDirty.set(false);
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  closeModal() {
    this.close.emit();
  }

  onSubmit() {
    if (this.expenseForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const data = this.expenseForm.value;

    const request = this.editMode() 
      ? this.api.put(`expenses/${this.expense.id}`, data)
      : this.api.post('expenses', data);

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
