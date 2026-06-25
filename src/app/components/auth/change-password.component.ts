import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="animate-fade-in h-100" style="max-width: 600px; margin: 0 auto;">
      <h2 class="mb-4 fw-bold">Change Password</h2>

      <div class="card glass-card border-0 shadow-sm p-4">
        <div class="card-body">
          <div class="alert alert-danger border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
            <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
          </div>
          
          <div class="alert alert-success border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="successMessage()">
            <i class="fas fa-check-circle me-2"></i>{{ successMessage() }}
          </div>

          <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()">
            <!-- Current Password -->
            <div class="mb-3">
              <label class="form-label fw-semibold text-muted">Current Password</label>
              <input type="password" class="form-control" formControlName="currentPassword" placeholder="••••••••">
              <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="passwordForm.get('currentPassword')?.touched && passwordForm.get('currentPassword')?.invalid">
                Current password is required.
              </div>
            </div>

            <!-- New Password -->
            <div class="mb-4">
              <label class="form-label fw-semibold text-muted">New Password</label>
              <input type="password" class="form-control" formControlName="newPassword" placeholder="••••••••">
              <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="passwordForm.get('newPassword')?.touched && passwordForm.get('newPassword')?.invalid">
                New password must be at least 6 characters.
              </div>
            </div>

            <!-- Buttons -->
            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-primary" [disabled]="passwordForm.invalid || loading()">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loading()"></span>
                Change Password
              </button>
              <button type="button" class="btn btn-outline-secondary rounded-3" (click)="onCancel()" [disabled]="loading()">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  onSubmit() {
    if (this.passwordForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.auth.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Password updated successfully!');
        this.passwordForm.reset();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Password update failed.');
      }
    });
  }

  onCancel() {
    this.router.navigate(['/dashboard']);
  }
}
