import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrapper d-flex align-items-center justify-content-center">
      <div class="auth-card glass-card p-5 w-100 animate-fade-in" style="max-width: 440px;">
        <div class="text-center mb-4">
          <i class="fas fa-user-plus text-primary fs-1 mb-2"></i>
          <h2 class="fw-bold mb-1">Create Account</h2>
          <p class="text-muted">Register to get started</p>
        </div>

        <div class="alert alert-danger border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
          <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
        </div>
        
        <div class="alert alert-success border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="successMessage()">
          <i class="fas fa-check-circle me-2"></i>{{ successMessage() }}
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" *ngIf="!successMessage()">
          <!-- Username -->
          <div class="form-floating mb-3">
            <input type="text" class="form-control" id="username" placeholder="admin" formControlName="username">
            <label for="username">Username</label>
            <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="registerForm.get('username')?.touched && registerForm.get('username')?.invalid">
              Username is required.
            </div>
          </div>

          <!-- Email -->
          <div class="form-floating mb-3">
            <input type="email" class="form-control" id="email" placeholder="admin@example.com" formControlName="email">
            <label for="email">Email address</label>
            <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="registerForm.get('email')?.touched && registerForm.get('email')?.invalid">
              Please enter a valid email address.
            </div>
          </div>

          <!-- Password -->
          <div class="form-floating mb-4">
            <input type="password" class="form-control" id="password" placeholder="••••••••" formControlName="password">
            <label for="password">Password</label>
            <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="registerForm.get('password')?.touched && registerForm.get('password')?.invalid">
              Password must be at least 6 characters.
            </div>
          </div>

          <!-- Action Button -->
          <button type="submit" class="btn btn-primary w-100 py-3 mb-3" [disabled]="registerForm.invalid || loading()">
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loading()"></span>
            {{ loading() ? 'Registering...' : 'Register' }}
          </button>
          
          <div class="text-center" style="font-size: 0.85rem;">
            <span class="text-muted">Already have an account? </span>
            <a routerLink="/auth/login" class="text-primary fw-bold text-decoration-none">Sign in here</a>
          </div>
        </form>

        <div *ngIf="successMessage()" class="text-center mt-3">
          <a routerLink="/auth/login" class="btn btn-outline-primary py-2 px-4 rounded">Go to Login</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: 100vh;
      background: linear-gradient(135deg, #eef2f6 0%, #cbd5e1 100%);
    }
    
    body.dark-mode .auth-wrapper {
      background: linear-gradient(135deg, #0f172a 0%, #020617 100%);
    }

    .auth-card {
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.4);
      background: rgba(255, 255, 255, 0.8);
      box-shadow: 0 8px 32px 0 rgba(148, 163, 184, 0.25);
    }
    
    body.dark-mode .auth-card {
      border: 1px solid rgba(255, 255, 255, 0.05);
      background: rgba(15, 23, 42, 0.8);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.45);
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  registerForm: FormGroup = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.auth.register(this.registerForm.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Account registered successfully! You can now log in.');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Registration failed. Try again.');
      }
    });
  }
}
