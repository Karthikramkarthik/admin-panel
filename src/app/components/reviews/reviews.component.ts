import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fade-in h-100">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold m-0">Review Moderation</h4>
          <p class="text-muted m-0">Moderate e-commerce customer product reviews, filter by moderation status, and approve/reject ratings</p>
        </div>
      </div>

      <div class="alert alert-danger border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
        <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
      </div>
      
      <div class="alert alert-success border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="successMessage()">
        <i class="fas fa-check-circle me-2"></i>{{ successMessage() }}
      </div>

      <!-- Filters Row -->
      <div class="card glass-card border-0 p-4 mb-4 shadow-sm">
        <div class="row align-items-center">
          <div class="col-md-4">
            <label class="form-label fw-semibold text-muted" style="font-size: 0.8rem;">Moderation Status</label>
            <div class="btn-group w-100" role="group">
              <button type="button" class="btn btn-outline-primary" [class.active]="activeStatusFilter() === ''" (click)="setStatusFilter('')">All Reviews</button>
              <button type="button" class="btn btn-outline-warning" [class.active]="activeStatusFilter() === 'Pending'" (click)="setStatusFilter('Pending')">Pending</button>
              <button type="button" class="btn btn-outline-success" [class.active]="activeStatusFilter() === 'Approved'" (click)="setStatusFilter('Approved')">Approved</button>
              <button type="button" class="btn btn-outline-danger" [class.active]="activeStatusFilter() === 'Rejected'" (click)="setStatusFilter('Rejected')">Rejected</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Reviews Grid -->
      <div class="row g-4">
        <div class="col-md-6 col-lg-4" *ngFor="let review of reviews()">
          <div class="card glass-card border-0 h-100 d-flex flex-column justify-content-between shadow-sm p-4">
            <div>
              <!-- Product Link Info -->
              <div class="d-flex align-items-center gap-2 mb-3 border-bottom pb-2">
                <i class="fas fa-box text-primary fs-5"></i>
                <div class="flex-grow-1 overflow-hidden">
                  <div class="fw-bold text-main text-truncate" style="font-size: 0.85rem;">{{ review.product_name }}</div>
                  <small class="text-muted" style="font-size: 0.72rem;">Code: {{ review.product_code }}</small>
                </div>
              </div>

              <!-- Customer & Rating -->
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="fw-semibold text-main" style="font-size: 0.85rem;">
                  <i class="fas fa-user-circle me-1 text-muted"></i>{{ review.customer_name }}
                </div>
                
                <!-- Stars display -->
                <div class="d-flex text-warning gap-1">
                  <i class="fas fa-star" *ngFor="let star of getStarsArray(review.rating)"></i>
                  <i class="far fa-star" *ngFor="let star of getEmptyStarsArray(review.rating)"></i>
                </div>
              </div>

              <!-- Message -->
              <p class="text-muted bg-light-subtle rounded p-3 mb-0" style="font-size: 0.8rem; line-height: 1.5; font-style: italic; min-height: 70px;">
                "{{ review.review_message }}"
              </p>
            </div>

            <!-- Action panel -->
            <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
              <span class="badge rounded-pill fw-semibold" [ngClass]="getStatusBadgeClass(review.status)" style="font-size: 0.72rem; padding: 0.35em 0.8em;">
                {{ review.status }}
              </span>

              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-success" *ngIf="review.status !== 'Approved'" (click)="moderateReview(review.id, 'Approved')" title="Approve Review">
                  <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" *ngIf="review.status !== 'Rejected'" (click)="moderateReview(review.id, 'Rejected')" title="Reject Review">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- Empty state -->
        <div class="col-12 text-center text-muted py-5" *ngIf="reviews().length === 0">
          <i class="fas fa-comments d-block fs-1 mb-3 opacity-50 text-primary"></i>
          No e-commerce product reviews found matching this filter.
        </div>
      </div>
    </div>
  `
})
export class ReviewsComponent implements OnInit {
  private api = inject(ApiService);

  reviews = signal<any[]>([]);
  activeStatusFilter = signal<string>('');
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  ngOnInit() {
    this.loadReviews();
  }

  loadReviews() {
    const params: any = {};
    if (this.activeStatusFilter()) {
      params.status = this.activeStatusFilter();
    }

    this.api.get('admin/reviews', params).subscribe({
      next: (res) => {
        if (res.success) {
          this.reviews.set(res.reviews);
        }
      },
      error: (err) => {
        console.error('Failed to load reviews:', err);
        this.errorMessage.set('Failed to retrieve product reviews.');
      }
    });
  }

  setStatusFilter(status: string) {
    this.activeStatusFilter.set(status);
    this.loadReviews();
  }

  moderateReview(id: number, status: string) {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.api.put(`admin/reviews/${id}/status`, { status }).subscribe({
      next: (res) => {
        if (res.success) {
          this.successMessage.set(res.message);
          this.loadReviews();
        }
      },
      error: (err) => {
        this.errorMessage.set(err.error?.error || 'Failed to moderate review.');
      }
    });
  }

  getStarsArray(rating: number): number[] {
    return Array(rating).fill(0);
  }

  getEmptyStarsArray(rating: number): number[] {
    return Array(5 - rating).fill(0);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Pending': return 'bg-warning text-dark bg-opacity-10';
      case 'Approved': return 'bg-success text-white';
      case 'Rejected': return 'bg-danger text-white';
      default: return 'bg-secondary text-white';
    }
  }
}
