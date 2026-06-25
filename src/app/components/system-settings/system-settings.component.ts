import { Component, OnInit, signal, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { UnsavedChangesService } from '../../services/unsaved-changes.service';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="animate-fade-in h-100">
      <!-- Title Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="fw-bold m-0 text-main">System Settings</h2>
          <p class="text-muted m-0">Control application-wide settings like Estimated GST percentages and Shipping policies dynamically</p>
        </div>
      </div>

      <!-- Feedback Messages -->
      <div class="alert alert-danger border-0 p-3 mb-4 rounded d-flex align-items-center gap-2 animate-fade-in" style="font-size: 0.85rem;" *ngIf="errorMessage()">
        <i class="fas fa-exclamation-circle text-danger fs-5"></i>
        <span>{{ errorMessage() }}</span>
      </div>
      
      <div class="alert alert-success border-0 p-3 mb-4 rounded d-flex align-items-center gap-2 animate-fade-in" style="font-size: 0.85rem;" *ngIf="successMessage()">
        <i class="fas fa-check-circle text-success fs-5"></i>
        <span>{{ successMessage() }}</span>
      </div>

      <div class="row g-4">
        <!-- Configuration Form (Left Panel) -->
        <div class="col-lg-5 col-md-6">
          <div class="card glass-card border-0 p-4 shadow-sm h-100" style="border-radius: 16px;">
            <h5 class="fw-bold text-main mb-4 border-bottom pb-2">
              <i class="fas fa-cog text-primary me-2"></i>Configure Parameters
            </h5>

            <form [formGroup]="settingsForm" (ngSubmit)="onSaveSettings()">
              <!-- GST Percentage -->
              <div class="mb-4">
                <label class="form-label fw-bold text-muted mb-1">Estimated GST (%)</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0"><i class="fas fa-percent text-muted"></i></span>
                  <input type="number" class="form-control border-start-0" formControlName="gst_percentage" placeholder="5">
                </div>
                <div class="text-muted mt-1" style="font-size: 0.72rem;">Configure the dynamic GST rate applied automatically during checkout. Example: 5%, 12%, 18%.</div>
                <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="settingsForm.get('gst_percentage')?.touched && settingsForm.get('gst_percentage')?.invalid">
                  GST percentage must be a valid number between 0 and 100.
                </div>
              </div>

              <!-- Fixed Shipping Charge -->
              <div class="mb-4">
                <label class="form-label fw-bold text-muted mb-1">Fixed Shipping Charge (₹)</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0"><i class="fas fa-truck text-muted"></i></span>
                  <input type="number" class="form-control border-start-0" formControlName="shipping_fixed" placeholder="100">
                </div>
                <div class="text-muted mt-1" style="font-size: 0.72rem;">Default shipping charge applied to order checkout totals below the threshold.</div>
                <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="settingsForm.get('shipping_fixed')?.touched && settingsForm.get('shipping_fixed')?.invalid">
                  Shipping charge must be a valid non-negative number.
                </div>
              </div>

              <!-- Free Shipping Threshold -->
              <div class="mb-4">
                <label class="form-label fw-bold text-muted mb-1">Free Shipping Threshold (₹)</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0"><i class="fas fa-wallet text-muted"></i></span>
                  <input type="number" class="form-control border-start-0" formControlName="shipping_threshold" placeholder="1500">
                </div>
                <div class="text-muted mt-1" style="font-size: 0.72rem;">Minimum order amount required to qualify for free standard home delivery.</div>
                <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="settingsForm.get('shipping_threshold')?.touched && settingsForm.get('shipping_threshold')?.invalid">
                  Free shipping threshold must be a valid non-negative number.
                </div>
              </div>

              <!-- Live Viewer Count Toggle -->
              <div class="mb-4">
                <div class="form-check form-switch p-0 d-flex justify-content-between align-items-center">
                  <div>
                    <label class="form-check-label fw-bold text-muted mb-0" style="cursor: pointer;" for="viewerCountSwitch">Enable Live Viewer Count</label>
                    <div class="text-muted mt-1" style="font-size: 0.72rem;">Display active and simulated user browsing indicators on product detail pages.</div>
                  </div>
                  <input class="form-check-input ms-0 fs-4" type="checkbox" id="viewerCountSwitch" formControlName="viewer_count_enabled" style="cursor: pointer;">
                </div>
              </div>

              <!-- Save Button -->
              <button type="submit" class="btn btn-primary w-100 py-2.5 rounded-pill shadow-sm" [disabled]="settingsForm.invalid || loading()">
                <span class="spinner-border spinner-border-sm me-2" *ngIf="loading()"></span>
                <i class="fas fa-save me-1" *ngIf="!loading()"></i> Save System Settings
              </button>
            </form>
          </div>
        </div>

        <!-- Audit Summary (Right Panel) -->
        <div class="col-lg-7 col-md-6">
          <div class="card glass-card border-0 p-4 shadow-sm h-100 d-flex flex-column" style="border-radius: 16px;">
            <h5 class="fw-bold text-main mb-3 border-bottom pb-2">
              <i class="fas fa-history text-primary me-2"></i>Active Settings & Audit Log
            </h5>
            
            <div class="table-responsive flex-grow-1">
              <table class="table align-middle table-hover">
                <thead class="table-light fs-8 text-uppercase text-muted">
                  <tr>
                    <th>Setting Name</th>
                    <th>Current Value</th>
                    <th>Last Updated By</th>
                    <th style="width: 160px;">Updated Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let s of rawSettings()" class="fs-8">
                    <td class="fw-semibold text-main">{{ s.display_name }}</td>
                    <td>
                      <span class="badge fw-extrabold px-3 py-1.5 rounded-pill"
                        [ngClass]="{
                          'bg-secondary-sky-light text-secondary': s.key_name !== 'viewer_count_enabled',
                          'bg-success-subtle text-success': s.key_name === 'viewer_count_enabled' && s.value === '1',
                          'bg-danger-subtle text-danger': s.key_name === 'viewer_count_enabled' && s.value === '0'
                        }">
                        <ng-container *ngIf="s.key_name === 'gst_percentage'">{{ s.value }}%</ng-container>
                        <ng-container *ngIf="s.key_name === 'shipping_fixed' || s.key_name === 'shipping_threshold'">₹{{ s.value }}</ng-container>
                        <ng-container *ngIf="s.key_name === 'viewer_count_enabled'">{{ s.value === '1' ? 'Enabled' : 'Disabled' }}</ng-container>
                      </span>
                    </td>
                    <td class="text-muted">
                      <i class="fas fa-user-circle me-1 opacity-70"></i>{{ s.updated_by || 'System' }}
                    </td>
                    <td class="text-muted">
                      {{ s.updated_at | date:'medium' }}
                    </td>
                  </tr>
                  <tr *ngIf="rawSettings().length === 0">
                    <td colspan="4" class="text-center py-5 text-muted">
                      <i class="fas fa-circle-notch fa-spin fs-4 mb-2 d-block"></i> Loading active settings logs...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- Future ready note -->
            <div class="mt-4 p-3 bg-light rounded-3 d-flex align-items-start gap-2 border-start border-primary border-4" style="font-size: 0.78rem;">
              <i class="fas fa-info-circle text-primary mt-0.5"></i>
              <div>
                <strong class="text-main d-block mb-1">Future Shipping Rules Ready</strong>
                <span class="text-muted">This settings architecture supports extensible key-value configurations, allowing dynamic postal code mapping, vendor rules, and courier API integrations without schema changes.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cursor-pointer {
      cursor: pointer;
    }
  `]
})
export class SystemSettingsComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private unsavedChangesService = inject(UnsavedChangesService);

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.settingsForm.dirty) {
      $event.returnValue = true;
    }
  }

  canDeactivate(): boolean | import('rxjs').Observable<boolean> {
    if (this.settingsForm.dirty) {
      return this.unsavedChangesService.confirm();
    }
    return true;
  }

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  loading = signal<boolean>(false);
  rawSettings = signal<any[]>([]);

  settingsForm: FormGroup = this.fb.group({
    gst_percentage: [5, [Validators.required, Validators.min(0), Validators.max(100)]],
    shipping_fixed: [100, [Validators.required, Validators.min(0)]],
    shipping_threshold: [1500, [Validators.required, Validators.min(0)]],
    viewer_count_enabled: [true, [Validators.required]]
  });

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.api.get('settings').subscribe({
      next: (res) => {
        if (res.success && res.settings) {
          this.rawSettings.set(res.settings);
          
          const gst = res.settings.find((s: any) => s.key_name === 'gst_percentage');
          const shipFixed = res.settings.find((s: any) => s.key_name === 'shipping_fixed');
          const shipThreshold = res.settings.find((s: any) => s.key_name === 'shipping_threshold');
          const viewerCount = res.settings.find((s: any) => s.key_name === 'viewer_count_enabled');

          this.settingsForm.patchValue({
            gst_percentage: gst ? parseFloat(gst.value) : 5,
            shipping_fixed: shipFixed ? parseFloat(shipFixed.value) : 100,
            shipping_threshold: shipThreshold ? parseFloat(shipThreshold.value) : 1500,
            viewer_count_enabled: viewerCount ? parseFloat(viewerCount.value) === 1 : true
          });
          this.settingsForm.markAsPristine();
        }
      },
      error: (err) => {
        console.error('Failed to load system settings:', err);
        this.errorMessage.set('Failed to fetch settings from server.');
      }
    });
  }

  onSaveSettings() {
    if (this.settingsForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload = {
      ...this.settingsForm.value,
      viewer_count_enabled: this.settingsForm.value.viewer_count_enabled ? 1 : 0
    };

    this.api.put('settings', payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set(res.message || 'System Settings updated successfully!');
        this.loadSettings(); // Reload to update table audit trails
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Failed to update system settings.');
      }
    });
  }
}
