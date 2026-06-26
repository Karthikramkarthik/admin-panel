import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Loading Overlay / Spinner -->
    <div *ngIf="showSpinner" 
         [ngClass]="overlay ? 'loader-overlay' : 'loader-inline'"
         class="d-flex flex-column align-items-center justify-content-center animate-fade-in">
      <div class="spinner-container text-center">
        <div class="spinner-border text-primary" role="status" style="width: 2.5rem; height: 2.5rem; border-width: 0.25em;">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-muted mt-2 mb-0 small fw-semibold">{{ loadingMessage }}</p>
      </div>
    </div>

    <!-- Error State -->
    <div *ngIf="!loading && error" 
         [ngClass]="overlay ? 'error-overlay' : 'error-inline'"
         class="d-flex flex-column align-items-center justify-content-center p-4 text-center animate-fade-in">
      <div class="text-danger mb-2">
        <i class="fas fa-exclamation-triangle fs-3 animate-bounce"></i>
      </div>
      <h6 class="fw-bold text-danger mb-1">Failed to load data</h6>
      <p class="text-muted small mb-3 max-w-300">{{ error }}</p>
      <button *ngIf="showRetry" class="btn btn-sm btn-outline-danger px-3 shadow-sm" (click)="onRetry()">
        <i class="fas fa-redo me-1"></i> Retry
      </button>
    </div>

    <!-- Empty State / No Data Found -->
    <div *ngIf="!loading && !error && isEmpty" 
         [ngClass]="overlay ? 'empty-overlay' : 'empty-inline'"
         class="d-flex flex-column align-items-center justify-content-center p-4 text-center animate-fade-in">
      <div class="text-muted mb-2 opacity-50">
        <i class="fas fa-folder-open fs-3"></i>
      </div>
      <h6 class="fw-semibold text-secondary mb-1">No Records Found</h6>
      <p class="text-muted small mb-0">{{ emptyMessage }}</p>
    </div>
  `,
  styles: [`
    .loader-overlay, .error-overlay, .empty-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(3px);
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 180px;
      border-radius: var(--border-radius, 12px);
    }
    
    body.dark-mode .loader-overlay, 
    body.dark-mode .error-overlay, 
    body.dark-mode .empty-overlay {
      background: rgba(11, 15, 25, 0.8);
    }

    .loader-inline, .error-inline, .empty-inline {
      padding: 3rem 1.5rem;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 180px;
    }
    
    .max-w-300 {
      max-width: 300px;
      word-wrap: break-word;
    }
    
    .animate-fade-in {
      animation: fadeIn 0.2s ease-in-out forwards;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .animate-bounce {
      animation: bounce 2s infinite;
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
  `]
})
export class LoaderComponent implements OnChanges, OnDestroy {
  @Input() loading = false;
  @Input() overlay = true;
  @Input() isEmpty = false;
  @Input() error: string | null = null;
  @Input() loadingMessage = 'Fetching data...';
  @Input() emptyMessage = 'There are no items to display at the moment.';
  @Input() showRetry = true;
  @Input() delay = 250; // ms
  @Output() retry = new EventEmitter<void>();

  showSpinner = false;
  private delayTimeout: any = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['loading']) {
      const isCurrentlyLoading = changes['loading'].currentValue;
      if (isCurrentlyLoading) {
        if (this.delayTimeout) {
          clearTimeout(this.delayTimeout);
        }
        if (this.delay > 0) {
          this.delayTimeout = setTimeout(() => {
            this.showSpinner = true;
          }, this.delay);
        } else {
          this.showSpinner = true;
        }
      } else {
        if (this.delayTimeout) {
          clearTimeout(this.delayTimeout);
          this.delayTimeout = null;
        }
        this.showSpinner = false;
      }
    }
  }

  ngOnDestroy() {
    if (this.delayTimeout) {
      clearTimeout(this.delayTimeout);
    }
  }

  onRetry() {
    this.retry.emit();
  }
}
