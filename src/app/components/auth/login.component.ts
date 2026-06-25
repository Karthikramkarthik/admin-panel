import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrapper d-flex align-items-center justify-content-center">
      <div class="auth-card glass-card p-5 w-100 animate-fade-in" style="max-width: 440px;">
        <div class="text-center mb-4">
                   <img src="assets/invoicelogo.png" alt="" class="" style="width: 8rem;">
          <h2 class="fw-bold mb-1">Welcome Back</h2>
          <p class="text-muted">Sign in to manage your inventory</p>
        </div>

        <div class="alert alert-danger border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
          <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <!-- Username -->
          <div class="form mb-3">
               <label for="username">Username</label>
            <input type="text" class="form-control" id="username" placeholder="" formControlName="username">
         
            <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="loginForm.get('username')?.touched && loginForm.get('username')?.invalid">
              Username is required.
            </div>
          </div>

          <!-- Password -->
          <div class="form mb-4">
                <label for="password">Password</label>
                <div class="eye-button-container position-relative">
                    <input [type]="showPassword ? 'text' : 'password'" class="form-control" id="password" placeholder="" formControlName="password">
                   <button
      type="button"
      class="eye-button"
      (click)="togglePassword()"
    >
     
      <i [ngClass]="showPassword ? 'fas fa-eye-slash' :  'fas fa-eye'"></i>
    </button>
                </div>
          
          
            <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.invalid">
              Password is required.
            </div>
          </div>

          <!-- Action Button -->
          <button type="submit" class="btn btn-primary w-100 py-3 mb-3" [disabled]="loginForm.invalid || loading()">
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loading()"></span>
            {{ loading() ? 'Signing in...' : 'Sign In' }}
          </button>
          
          <div class="text-center" style="font-size: 0.85rem;">
            <span class="text-muted">Don't have an account? </span>
            <a routerLink="/auth/register" class="text-primary fw-bold text-decoration-none">Register here</a>
          </div>
        </form>
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
      background: #fff;
      box-shadow: 0 8px 32px 0 rgba(148, 163, 184, 0.25);
    }
    
    body.dark-mode .auth-card {
      border: 1px solid rgba(255, 255, 255, 0.05);
      background: rgba(15, 23, 42, 0.8);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.45);
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });
showPassword = false;

togglePassword() {
  this.showPassword = !this.showPassword;
}
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.login(this.loginForm.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Failed to authenticate. Check details.');
      }
    });
  }
}
