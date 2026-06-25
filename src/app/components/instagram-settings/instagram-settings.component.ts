import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-instagram-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="animate-fade-in h-100">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold m-0">Instagram Reels Integration</h4>
          <p class="text-muted m-0">Configure your brand's feed display rules, profile redirects, and manage mock reels playback media</p>
        </div>
      </div>

      <div class="alert alert-danger border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
        <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
      </div>
      
      <div class="alert alert-success border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="successMessage()">
        <i class="fas fa-check-circle me-2"></i>{{ successMessage() }}
      </div>

      <div class="row g-4">
        <!-- 1. Left Card: Settings Configuration Form -->
        <div class="col-lg-5">
          <div class="card glass-card border-0 p-4 shadow-sm h-100">
            <h5 class="fw-bold text-main mb-3 border-bottom pb-2">
              <i class="fas fa-sliders-h text-primary me-2"></i>Feed Display Parameters
            </h5>

            <form [formGroup]="settingsForm" (ngSubmit)="onSaveSettings()">
              <!-- Enable Switch -->
              <div class="form-check form-switch mb-4 p-0 d-flex align-items-center justify-content-between">
                <div>
                  <label class="form-check-label fw-bold text-main cursor-pointer" for="isEnabledSwitch">Enable Instagram Section</label>
                  <div class="text-muted text-small">Show or hide the Reels horizontal carousel on the homepage</div>
                </div>
                <input class="form-check-input ms-0 cursor-pointer" type="checkbox" id="isEnabledSwitch" formControlName="is_enabled" style="width: 2.8em; height: 1.5em;">
              </div>

              <!-- Section Title -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted">Section Title Headline</label>
                <input type="text" class="form-control" formControlName="section_title" placeholder="e.g. ✨ Capture The Sparkle on Instagram">
                <div class="text-danger mt-1 text-small" *ngIf="settingsForm.get('section_title')?.touched && settingsForm.get('section_title')?.invalid">
                  Section Title is required.
                </div>
              </div>

              <!-- Profile URL -->
              <div class="mb-3">
                <label class="form-label fw-semibold text-muted">Instagram Profile URL</label>
                <input type="url" class="form-control" formControlName="profile_url" placeholder="e.g. https://www.instagram.com/kids_boutique">
                <div class="text-danger mt-1 text-small" *ngIf="settingsForm.get('profile_url')?.touched && settingsForm.get('profile_url')?.invalid">
                  A valid profile URL is required.
                </div>
              </div>

              <!-- Reels Count Display Slider -->
              <div class="mb-4">
                <div class="d-flex justify-content-between mb-2">
                  <label class="form-label fw-semibold text-muted mb-0">Reels to Display (Count limit)</label>
                  <span class="badge bg-primary text-white fw-bold fs-7">{{ settingsForm.get('reels_count')?.value }} Reels</span>
                </div>
                <input type="range" class="form-range" min="3" max="12" step="1" formControlName="reels_count">
                <div class="d-flex justify-content-between text-muted" style="font-size: 0.7rem;">
                  <span>3 Reels</span>
                  <span>12 Reels</span>
                </div>
              </div>

              <!-- Submit -->
              <button type="submit" class="btn btn-primary w-100 py-2.5 rounded-pill shadow-sm" [disabled]="settingsForm.invalid || loadingSettings()">
                <span class="spinner-border spinner-border-sm me-2" *ngIf="loadingSettings()"></span>
                <i class="fas fa-save me-1" *ngIf="!loadingSettings()"></i> Save Instagram Settings
              </button>
            </form>
          </div>
        </div>

        <!-- 2. Right Card: Reels List Manager & Mock Sync -->
        <div class="col-lg-7">
          <div class="card glass-card border-0 p-4 shadow-sm h-100 d-flex flex-column">
            <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
              <h5 class="fw-bold text-main m-0">
                <i class="fab fa-instagram text-rose me-2"></i>Active Reels Media Engine
              </h5>
              <button class="btn btn-sm btn-outline-rose rounded-pill" (click)="openAddReelModal()">
                <i class="fas fa-plus-circle me-1"></i>Add Mock Reel
              </button>
            </div>

            <!-- Reels Listing Grid -->
            <div class="overflow-y-auto flex-grow-1" style="max-height: 480px;">
              <div class="table-responsive" *ngIf="reels().length > 0; else emptyReels">
                <table class="table align-middle table-hover">
                  <thead class="table-light fs-8 text-uppercase text-muted">
                    <tr>
                      <th style="width: 70px;">Cover</th>
                      <th>Caption & Assets</th>
                      <th style="width: 140px;">Publish Date</th>
                      <th class="text-end" style="width: 80px;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let reel of reels()" class="fs-8">
                      <!-- Cover image -->
                      <td>
                        <div class="rounded overflow-hidden bg-light position-relative" style="width: 50px; height: 50px;">
                          <img [src]="reel.thumbnail_url" class="w-100 h-100 object-fit-cover" (error)="onImgError($event)">
                          <a [href]="reel.video_url" target="_blank" class="position-absolute top-50 start-50 translate-middle text-white bg-dark bg-opacity-50 rounded-circle d-flex align-items-center justify-content-center" style="width: 22px; height: 22px;">
                            <i class="fas fa-play" style="font-size: 0.55rem;"></i>
                          </a>
                        </div>
                      </td>

                      <!-- Caption Info -->
                      <td>
                        <div class="fw-bold text-main text-truncate" style="max-width: 250px;" [title]="reel.caption">{{ reel.caption }}</div>
                        <div class="text-muted text-truncate" style="max-width: 250px; font-size: 0.72rem;">
                          <i class="fas fa-link me-1"></i>
                          <a [href]="reel.instagram_url" target="_blank" class="text-decoration-none text-rose">{{ reel.instagram_url }}</a>
                        </div>
                      </td>

                      <!-- Date -->
                      <td class="text-muted">
                        {{ reel.publish_date | date:'mediumDate' }}
                      </td>

                      <!-- Delete action -->
                      <td class="text-end">
                        <button class="btn btn-sm btn-outline-danger border-0 rounded-circle" (click)="deleteReel(reel.id)" title="Delete reel">
                          <i class="fas fa-trash-can"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <ng-template #emptyReels>
                <div class="text-center text-muted py-5 my-4">
                  <i class="fab fa-instagram d-block fs-1 mb-3 opacity-30 text-rose"></i>
                  <p class="m-0 fw-semibold text-main">No Reels Added Yet</p>
                  <p class="text-small m-0">Click "Add Mock Reel" to load high-quality children boutique reels!</p>
                </div>
              </ng-template>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Mock Reel Uploader Modal -->
      <div class="modal fade" id="reelModal" tabindex="-1" aria-hidden="true" [class.show]="reelModalOpen()" [style.display]="reelModalOpen() ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5); z-index: 1060;">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; background-color: var(--bg-sidebar);">
            <div class="modal-header bg-light-subtle py-3 border-bottom-0">
              <h5 class="modal-title fw-bold">Add Instagram Mock Reel</h5>
              <button type="button" class="btn-close" (click)="closeReelModal()"></button>
            </div>
            
            <form [formGroup]="reelForm" (ngSubmit)="onCreateReel()">
              <div class="modal-body p-4">
                <!-- Preset Helper -->
                <div class="mb-3 bg-light-subtle border rounded p-3">
                  <label class="form-label fw-bold text-rose" style="font-size: 0.78rem;">💡 Preset Mock Outfits Reels Templates</label>
                  <select class="form-select form-select-sm" (change)="selectPreset($event)">
                    <option value="">-- Choose an aesthetic kidswear template --</option>
                    <option value="toy">🎨 Puzzles & Toddler Toys Play (Baby girl)</option>
                    <option value="dress">🌈 Rainbow Cotton Summer Dress (Princess girl)</option>
                    <option value="overalls">🌿 Natural Parks & Meadow Overalls (Toddler boy)</option>
                    <option value="sleep">💤 Dreaming Clouds Sleepwear (Infants comfy crib)</option>
                  </select>
                </div>

                <!-- Caption -->
                <div class="mb-3">
                  <label class="form-label fw-semibold text-muted">Reel Caption / Text description</label>
                  <textarea class="form-control" rows="3" formControlName="caption" placeholder="Write cute kids descriptions and standard hashtags #toddleroutfit..."></textarea>
                  <div class="text-danger mt-1 text-small" *ngIf="reelForm.get('caption')?.touched && reelForm.get('caption')?.invalid">
                    Caption is required.
                  </div>
                </div>

                <!-- Video Asset URL -->
                <div class="mb-3">
                  <label class="form-label fw-semibold text-muted">Video Asset URL (.mp4)</label>
                  <input type="url" class="form-control" formControlName="video_url" placeholder="e.g. https://assets.mixkit.co/video.mp4">
                  <div class="text-danger mt-1 text-small" *ngIf="reelForm.get('video_url')?.touched && reelForm.get('video_url')?.invalid">
                    Video URL is required.
                  </div>
                </div>

                <!-- Cover Thumbnail URL -->
                <div class="mb-3">
                  <label class="form-label fw-semibold text-muted">Cover Thumbnail URL (.jpg/.png)</label>
                  <input type="url" class="form-control" formControlName="thumbnail_url" placeholder="e.g. https://images.unsplash.com/photo-xxx">
                  <div class="text-danger mt-1 text-small" *ngIf="reelForm.get('thumbnail_url')?.touched && reelForm.get('thumbnail_url')?.invalid">
                    Thumbnail URL is required.
                  </div>
                </div>

                <!-- Instagram Reel URL -->
                <div class="mb-3">
                  <label class="form-label fw-semibold text-muted">Instagram Reel URL (External Redirect)</label>
                  <input type="url" class="form-control" formControlName="instagram_url" placeholder="https://www.instagram.com/reel/xxx">
                </div>
              </div>
              
              <div class="modal-footer bg-light-subtle border-top-0 py-3">
                <button type="button" class="btn btn-outline-secondary btn-sm" (click)="closeReelModal()">Cancel</button>
                <button type="submit" class="btn btn-primary btn-sm" [disabled]="reelForm.invalid || loadingReel()">
                  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loadingReel()"></span>
                  Add Mock Reel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-rose {
      color: #f43f5e !important;
    }
    .btn-outline-rose {
      color: #f43f5e;
      border-color: #f43f5e !important;
    }
    .btn-outline-rose:hover {
      background-color: rgba(244, 63, 94, 0.08) !important;
      color: #f43f5e;
    }
    .cursor-pointer {
      cursor: pointer;
    }
    .text-small {
      font-size: 0.72rem;
    }
  `]
})
export class InstagramSettingsComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  loadingSettings = signal<boolean>(false);
  loadingReel = signal<boolean>(false);

  settingsForm: FormGroup = this.fb.group({
    profile_url: ['', [Validators.required, Validators.pattern('https?://.+')]],
    is_enabled: [true],
    reels_count: [6, [Validators.min(3), Validators.max(12)]],
    section_title: ['', Validators.required]
  });

  reels = signal<any[]>([]);
  reelModalOpen = signal<boolean>(false);

  reelForm: FormGroup = this.fb.group({
    caption: ['', Validators.required],
    video_url: ['', [Validators.required, Validators.pattern('https?://.+')]],
    thumbnail_url: ['', [Validators.required, Validators.pattern('https?://.+')]],
    instagram_url: ['https://www.instagram.com/']
  });

  ngOnInit() {
    this.loadSettings();
    this.loadReels();
  }

  loadSettings() {
    this.api.get('instagram/settings').subscribe({
      next: (res) => {
        if (res.success && res.settings) {
          const s = res.settings;
          this.settingsForm.patchValue({
            profile_url: s.profile_url,
            is_enabled: !!s.is_enabled,
            reels_count: s.reels_count || 6,
            section_title: s.section_title
          });
        }
      },
      error: (err) => console.error('Failed to load Instagram settings:', err)
    });
  }

  loadReels() {
    this.api.get('instagram/admin/reels').subscribe({
      next: (res) => {
        if (res.success) {
          this.reels.set(res.reels);
        }
      },
      error: (err) => console.error('Failed to load Instagram reels:', err)
    });
  }

  onSaveSettings() {
    if (this.settingsForm.invalid) return;

    this.loadingSettings.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.api.put('instagram/settings', this.settingsForm.value).subscribe({
      next: (res) => {
        this.loadingSettings.set(false);
        this.successMessage.set(res.message || 'Instagram Settings saved successfully!');
        this.loadSettings();
      },
      error: (err) => {
        this.loadingSettings.set(false);
        this.errorMessage.set(err.error?.error || 'Failed to save settings.');
      }
    });
  }

  openAddReelModal() {
    this.reelForm.reset({
      instagram_url: 'https://www.instagram.com/'
    });
    this.reelModalOpen.set(true);
  }

  closeReelModal() {
    this.reelModalOpen.set(false);
  }

  selectPreset(event: any) {
    const val = event.target.value;
    if (val === 'toy') {
      this.reelForm.patchValue({
        caption: '🎨 Messy hands and creative minds! Exploring new pastel puzzles today at our baby activity workshop. #kidsplay #organicclothing',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-toddler-girl-playing-with-toys-48866-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=600&auto=format&fit=crop',
        instagram_url: 'https://www.instagram.com/reel/C8a1b2c3d4/'
      });
    } else if (val === 'dress') {
      this.reelForm.patchValue({
        caption: '🌈 Summer dresses made for pure joy! Extremely soft cotton fabric, certified 100% skin-safe for toddlers. #kidswear #summerboutique',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-little-child-playing-with-a-colorful-toy-42353-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=600&auto=format&fit=crop',
        instagram_url: 'https://www.instagram.com/reel/C8e5f6g7h8/'
      });
    } else if (val === 'overalls') {
      this.reelForm.patchValue({
        caption: '🌿 Outdoor active plays in hyper-stretch overalls. Let them explore the summer nature comfortably! ☀️ #toddlervibe #playwear',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-toddler-boy-playing-on-the-grass-48863-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1515488042361-404e9250afef?q=80&w=600&auto=format&fit=crop',
        instagram_url: 'https://www.instagram.com/reel/C8i9j0k1l2/'
      });
    } else if (val === 'sleep') {
      this.reelForm.patchValue({
        caption: '💤 Dreaming high in organic cotton sleepwear sets. Keep them cozy and happy through cozy naps. #babyessentials #babysleep',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-baby-playing-in-a-crib-with-toys-48868-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop',
        instagram_url: 'https://www.instagram.com/reel/C8m3n4o5p6/'
      });
    }
  }

  onCreateReel() {
    if (this.reelForm.invalid) return;

    this.loadingReel.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.api.post('instagram/reels', this.reelForm.value).subscribe({
      next: (res) => {
        this.loadingReel.set(false);
        this.reelModalOpen.set(false);
        this.successMessage.set(res.message || 'Instagram Reel added successfully!');
        this.loadReels();
      },
      error: (err) => {
        this.loadingReel.set(false);
        this.errorMessage.set(err.error?.error || 'Failed to create reel.');
      }
    });
  }

  deleteReel(id: number) {
    if (!confirm('Are you sure you want to delete this mock reel?')) return;

    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.api.delete(`instagram/reels/${id}`).subscribe({
      next: (res) => {
        this.successMessage.set(res.message || 'Instagram Reel deleted successfully.');
        this.loadReels();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.error || 'Failed to delete reel.');
      }
    });
  }

  onImgError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=300&auto=format&fit=crop';
  }
}
