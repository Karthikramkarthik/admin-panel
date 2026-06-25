import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environments/environment';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
  selector: 'app-banners',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HasPermissionDirective],
  template: `
    <div class="animate-fade-in h-100">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold m-0">Banner Management</h4>
          <p class="text-muted m-0">Upload homepage carousel sliding banners, subtitles, action links, and prioritize display weight order</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()" *appHasPermission="['Settings', 'Create']">
          <i class="fas fa-plus me-2"></i>Upload Banner
        </button>
      </div>

      <div class="alert alert-danger border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
        <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
      </div>
      
      <div class="alert alert-success border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="successMessage()">
        <i class="fas fa-check-circle me-2"></i>{{ successMessage() }}
      </div>

      <!-- Banners Grid -->
      <div class="row g-4">
        <div class="col-md-6 col-lg-4" *ngFor="let banner of banners()">
          <div class="card glass-card border-0 overflow-hidden h-100 d-flex flex-column shadow-sm">
            
            <!-- Banner Image Preview -->
            <div class="position-relative bg-dark" style="height: 180px;">
              <img [src]="imageBaseUrl + banner.image" class="w-100 h-100 object-fit-cover opacity-75" alt="Banner Image">
              <span class="position-absolute top-3 start-3 badge rounded-pill fw-semibold" [ngClass]="banner.status === 'active' ? 'bg-success' : 'bg-danger' " style="font-size: 0.72rem; padding: 0.35em 0.8em; z-index: 5;">
                {{ banner.status === 'active' ? 'Active' : 'Inactive' }}
              </span>
              <span class="position-absolute bottom-3 end-3 badge bg-dark text-white fw-bold" style="font-size: 0.75rem; z-index: 5;">
                Priority Weight: {{ banner.display_order }}
              </span>
            </div>

            <!-- Banner info -->
            <div class="card-body p-4 flex-grow-1 d-flex flex-column justify-content-between">
              <div>
                <h5 class="fw-bold text-main mb-1">{{ banner.title }}</h5>
                <p class="text-muted text-small mb-3">{{ banner.subtitle || 'No subtitle provided.' }}</p>
                
                <div class="bg-light-subtle rounded p-2 text-truncate" style="font-size: 0.75rem;" *ngIf="banner.redirect_url">
                  <i class="fas fa-link text-muted me-1"></i>
                  <a [href]="banner.redirect_url" target="_blank" class="text-decoration-none text-primary fw-semibold">{{ banner.redirect_url }}</a>
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <button class="btn btn-sm btn-outline-primary" (click)="openEditModal(banner)" *appHasPermission="['Settings', 'Edit']">
                  <i class="fas fa-edit me-1"></i>Edit
                </button>
                <button class="btn btn-sm btn-outline-danger" (click)="deleteBanner(banner.id)" *appHasPermission="['Settings', 'Delete']">
                  <i class="fas fa-trash me-1"></i>Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div class="col-12 text-center text-muted py-5" *ngIf="banners().length === 0">
          <i class="fas fa-images d-block fs-1 mb-3 opacity-50 text-primary animate-pulse"></i>
          No e-commerce sliders or promotional banners uploaded yet.
        </div>
      </div>

      <!-- Banner Uploader Modal -->
      <div class="modal fade" id="bannerModal" tabindex="-1" aria-hidden="true" [class.show]="modalOpen()" [style.display]="modalOpen() ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; background-color: var(--bg-sidebar);">
            <div class="modal-header bg-light-subtle py-3 border-bottom-0">
              <h5 class="modal-title fw-bold">{{ editMode() ? 'Edit' : 'Upload' }} Home Banner</h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            
            <form [formGroup]="bannerForm" (ngSubmit)="onSubmit()">
              <div class="modal-body p-4">
                
                <!-- Title -->
                <div class="mb-3">
                  <label class="form-label fw-semibold text-muted">Banner Title</label>
                  <input type="text" class="form-control" formControlName="title" placeholder="e.g. Mega Summer Clearance!">
                  <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="bannerForm.get('title')?.touched && bannerForm.get('title')?.invalid">
                    Title is required.
                  </div>
                </div>

                <!-- Subtitle -->
                <div class="mb-3">
                  <label class="form-label fw-semibold text-muted">Subtitle / Promo Text</label>
                  <input type="text" class="form-control" formControlName="subtitle" placeholder="e.g. Flat 50% Off on all apparel lines. Code: MEGA50">
                </div>

                <!-- Image File Upload -->
                <div class="mb-3">
                  <label class="form-label fw-semibold text-muted">Banner Image File</label>
                  <input type="file" class="form-control" (change)="onFileSelected($event)" accept="image/*">
                  <small class="text-muted d-block mt-1" style="font-size: 0.7rem;">Recommended resolution: 1920x600 px. Maximum file size: 10MB.</small>
                  <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="!editMode() && !selectedFile">
                    Image file is required for new banners.
                  </div>
                </div>

                <!-- Redirect Action Link -->
                <div class="mb-3">
                  <label class="form-label fw-semibold text-muted">Redirect URL / Link</label>
                  <input type="url" class="form-control" formControlName="redirect_url" placeholder="e.g. http://my-store.com/summer-sale">
                </div>

                <!-- Display Weight & Status -->
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label fw-semibold text-muted">Display Priority Weight</label>
                    <input type="number" class="form-control" formControlName="display_order" placeholder="0">
                    <small class="text-muted" style="font-size: 0.65rem;">Lower values appear first.</small>
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
                <button type="submit" class="btn btn-primary btn-sm" [disabled]="bannerForm.invalid || loading() || (!editMode() && !selectedFile)">
                  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loading()"></span>
                  {{ editMode() ? 'Save Banner' : 'Upload Banner' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BannersComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
imageBaseUrl = environment.imageBaseUrl;
  banners = signal<any[]>([]);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  modalOpen = signal<boolean>(false);
  editMode = signal<boolean>(false);
  loading = signal<boolean>(false);
  activeBannerId: number | null = null;
  selectedFile: File | null = null;

  bannerForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    subtitle: [''],
    redirect_url: [''],
    display_order: [0, [Validators.min(0)]],
    status: ['active', Validators.required]
  });

  ngOnInit() {
    this.loadBanners();
  }

  loadBanners() {
    this.api.get('admin/banners').subscribe({
      next: (res) => {
        if (res.success) {
          this.banners.set(res.banners);
        }
      },
      error: (err) => console.error('Failed to load banners:', err)
    });
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  openAddModal() {
    this.editMode.set(false);
    this.activeBannerId = null;
    this.selectedFile = null;
    
    this.bannerForm.reset({
      display_order: 0,
      status: 'active'
    });
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.modalOpen.set(true);
  }

  openEditModal(banner: any) {
    this.editMode.set(true);
    this.activeBannerId = banner.id;
    this.selectedFile = null;
    
    this.bannerForm.patchValue({
      title: banner.title,
      subtitle: banner.subtitle,
      redirect_url: banner.redirect_url,
      display_order: banner.display_order,
      status: banner.status
    });
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.modalOpen.set(true);
  }

  closeModal() {
    this.modalOpen.set(false);
  }

  onSubmit() {
    if (this.bannerForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formData = new FormData();
    const formVals = this.bannerForm.value;

    Object.keys(formVals).forEach(key => {
      if (formVals[key] !== null && formVals[key] !== undefined) {
        formData.append(key, formVals[key]);
      }
    });

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    const request = this.editMode()
      ? this.api.put(`admin/banners/${this.activeBannerId}`, formData)
      : this.api.post('admin/banners', formData);

    request.subscribe({
      next: (res) => {
        this.loading.set(false);
        this.modalOpen.set(false);
        this.successMessage.set(res.message);
        this.loadBanners();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Operation failed.');
      }
    });
  }

  deleteBanner(id: number) {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.api.delete(`admin/banners/${id}`).subscribe({
      next: (res) => {
        this.successMessage.set(res.message);
        this.loadBanners();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.error || 'Failed to delete banner.');
      }
    });
  }
}
