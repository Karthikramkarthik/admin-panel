import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { UnsavedChangesService } from '../../services/unsaved-changes.service';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs';
import { LoaderComponent } from '../loader/loader.component';

@Component({
  selector: 'app-file-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
  template: `
    <div class="animate-fade-in h-100">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold m-0">File Explorer</h4>
          <p class="text-muted m-0">Store receipts, procurement bills, product catalogs, and documents</p>
        </div>
        <div class="d-flex gap-2">
          <!-- Folder Action buttons -->
          <button class="btn btn-outline-primary btn-sm" (click)="openCreateFolderModal()">
            <i class="fas fa-folder-plus me-2"></i>New Folder
          </button>
          
          <button class="btn btn-outline-secondary btn-sm" *ngIf="activeFolder()" (click)="openRenameFolderModal()">
            <i class="fas fa-pen me-2"></i>Rename Folder
          </button>
          
          <button class="btn btn-outline-danger btn-sm" *ngIf="activeFolder()" (click)="deleteFolder(activeFolder().id)">
            <i class="fas fa-folder-minus me-2"></i>Delete Folder
          </button>
        </div>
      </div>

      <div class="alert alert-danger border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
        <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
      </div>
      
      <div class="alert alert-success border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="successMessage()">
        <i class="fas fa-check-circle me-2"></i>{{ successMessage() }}
      </div>

      <div class="row g-4">
        <!-- Folders Drawer List (Left) -->
        <div class="col-md-3">
          <div class="card glass-card border-0 p-3 h-100" style="min-height: 400px;">
            <h6 class="fw-bold mb-3 text-muted text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.5px;">Directories</h6>
            <div class="list-group list-group-flush overflow-y-auto" style="max-height: 500px;">
              <button *ngFor="let f of folders()" class="list-group-item list-group-item-action border-0 d-flex align-items-center justify-content-between py-2 px-3 rounded mb-1 bg-transparent"
                      [class.active-dir]="activeFolder() && activeFolder().id === f.id" (click)="selectFolder(f.id)">
                <span class="d-flex align-items-center gap-2 text-truncate">
                  <i class="fas fa-folder text-warning fs-5"></i>
                  <span class="fw-semibold" style="font-size: 0.88rem;">{{ f.name }}</span>
                </span>
              </button>
              <div *ngIf="folders().length === 0" class="text-center text-muted py-4" style="font-size: 0.82rem;">
                No directories found. Click New Folder to get started.
              </div>
            </div>
          </div>
        </div>

        <!-- Files Window explorer (Right) -->
        <div class="col-md-9">
          <div class="card glass-card border-0 p-4 h-100 position-relative" style="min-height: 400px;"
               (dragover)="onDragOver($event)"
               (dragenter)="onDragEnter($event)"
               (dragleave)="onDragLeave($event)"
               (drop)="onDrop($event)">

            <!-- Drag and Drop Overlay -->
            <div class="drag-drop-overlay" *ngIf="isDragOver() && activeFolder()">
              <div class="drag-drop-box">
                <i class="fas fa-cloud-arrow-up fs-1 mb-3 text-primary animate-bounce"></i>
                <h5 class="fw-bold text-main">Drop files to upload</h5>
                <p class="text-muted mb-0">Upload to folder: {{ activeFolder().name }}</p>
              </div>
            </div>

            <!-- Active folder title -->
            <div class="d-flex justify-content-between align-items-center pb-3 border-bottom mb-4" *ngIf="activeFolder(); else noActiveFolderTpl">
              <div>
                <h5 class="fw-bold m-0 text-main"><i class="fas fa-folder-open text-warning me-2"></i>{{ activeFolder().name }}</h5>
                <span class="text-muted" style="font-size: 0.78rem;">{{ files().length }} file(s) inside this directory</span>
              </div>
              <div class="d-flex gap-2">
                <span class="text-muted align-self-center me-2 d-none d-lg-inline" style="font-size: 0.75rem;">
                  <i class="fas fa-hand-pointer me-1"></i>Drag & drop files here or
                </span>
                <!-- Multi-file uploader button -->
                <input type="file" #multiFileInput class="d-none" multiple (change)="onFileSelect($event)">
                <button class="btn btn-primary btn-sm" (click)="multiFileInput.click()" [disabled]="uploading()">
                  <span class="spinner-border spinner-border-sm me-1" *ngIf="uploading()"></span>
                  <i class="fas fa-upload me-2" *ngIf="!uploading()"></i>Upload Files
                </button>
                
                <button class="btn btn-outline-danger btn-sm" *ngIf="selectedFileIds.size > 0" (click)="deleteSelectedFiles()">
                  <i class="fas fa-trash-can me-2"></i>Delete Selected ({{ selectedFileIds.size }})
                </button>
              </div>
            </div>

            <ng-template #noActiveFolderTpl>
              <div class="text-center text-muted py-5" *ngIf="!loading() && !errorMessage()">
                <i class="fas fa-folder-closed fs-1 mb-3 text-light"></i>
                <h5>Select a directory from the folder drawer to explore files</h5>
              </div>
            </ng-template>

            <!-- Files Grid explorer -->
            <div class="row g-3" *ngIf="activeFolder() && files().length > 0">
              <!-- Progress Upload Tracker -->
              <div class="col-12" *ngIf="uploading()">
                <div class="alert alert-info py-2 px-3 d-flex align-items-center gap-3">
                  <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                  <span style="font-size: 0.85rem;" class="fw-semibold">Uploading and processing files, please wait...</span>
                </div>
              </div>

              <!-- Files list items -->
              <div class="col-xl-3 col-md-4 col-sm-6" *ngFor="let file of files()">
                <div class="card border rounded h-100 p-2 position-relative overflow-hidden d-flex flex-column justify-content-between text-center bg-light-subtle" style="border-radius: 8px;">
                  <!-- Checkbox selector -->
                  <div class="position-absolute top-0 start-0 m-2" style="z-index: 10;">
                    <input type="checkbox" class="form-check-input" [checked]="selectedFileIds.has(file.id)" (change)="toggleFileSelect(file.id)">
                  </div>
                  
                  <div class="py-3">
                    <!-- Icon or Image preview depending on type -->
                    <div class="file-preview-icon mb-2">
                      <img *ngIf="isImage(file.file_name)" [src]="imageBaseUrl + file.file_path" class="w-100 object-fit-cover rounded border" style="height: 80px;">
                      <i *ngIf="!isImage(file.file_name)" class="fas fs-1 text-secondary" [class.fa-file-pdf]="file.file_name.endsWith('.pdf')" [class.fa-file-excel]="file.file_name.endsWith('.xlsx') || file.file_name.endsWith('.csv')" [class.fa-file-lines]="!file.file_name.endsWith('.pdf') && !file.file_name.endsWith('.xlsx') && !file.file_name.endsWith('.csv')"></i>
                    </div>
                    
                    <div class="fw-semibold text-truncate px-1 text-main" style="font-size: 0.8rem;" [title]="file.file_name">{{ file.file_name }}</div>
                    <div class="text-muted" style="font-size: 0.72rem;">
                      {{
                        file.file_size >= 1048576
                          ? ((file.file_size / 1024 / 1024) | number:'1.2-2') + ' MB'
                          : ((file.file_size / 1024) | number:'1.0-0') + ' KB'
                      }}
                    </div>
                  </div>

                  <div class="d-flex gap-1 border-top pt-2">
                    <a [href]="imageBaseUrl + file.file_path" target="_blank" class="btn btn-outline-primary btn-xs py-1 flex-grow-1" style="font-size: 0.72rem;">
                      <i class="fas fa-eye me-1"></i>Open
                    </a>
                    <button class="btn btn-outline-danger btn-xs py-1 px-2" (click)="deleteFile(file.id)">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Upload progress when files is empty -->
            <div class="row g-3" *ngIf="activeFolder() && files().length === 0 && uploading()">
              <div class="col-12">
                <div class="alert alert-info py-2 px-3 d-flex align-items-center gap-3">
                  <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                  <span style="font-size: 0.85rem;" class="fw-semibold">Uploading and processing files, please wait...</span>
                </div>
              </div>
            </div>

            <app-loader 
              [loading]="loading()" 
              [isEmpty]="!loading() && !errorMessage() && activeFolder() && files().length === 0" 
              [error]="errorMessage()" 
              (retry)="loadExplorer()"
              emptyMessage="This directory is empty. Drag & drop images or files here, or click the Upload button.">
            </app-loader>
          </div>
        </div>
      </div>

      <!-- Folder Create/Rename Modal -->
      <div class="modal fade" id="folderModal" tabindex="-1" aria-hidden="true" [class.show]="folderModalOpen()" [style.display]="folderModalOpen() ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; background-color: var(--bg-sidebar);">
            <div class="modal-header bg-light-subtle py-3 border-bottom-0">
              <h5 class="modal-title fw-bold">{{ renameMode() ? 'Rename' : 'Create' }} Folder</h5>
              <button type="button" class="btn-close" (click)="closeFolderModal()"></button>
            </div>
            
            <div class="modal-body p-4">
              <label class="form-label fw-semibold text-muted">Folder Name</label>
              <input type="text" class="form-control" [(ngModel)]="folderInputName" placeholder="e.g. Bills 2026">
            </div>
            
            <div class="modal-footer bg-light-subtle border-top-0 py-3">
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="closeFolderModal()">Cancel</button>
              <button type="button" class="btn btn-primary btn-sm" [disabled]="!folderInputName || loadingFolder()" (click)="onFolderSubmit()">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loadingFolder()"></span>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .active-dir {
      background-color: var(--accent-primary-light) !important;
      color: var(--accent-primary) !important;
    }
    .drag-drop-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--bg-card);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: inherit;
    }
    .drag-drop-box {
      border: 2px dashed var(--accent-primary, #6366f1);
      border-radius: 12px;
      padding: 3rem;
      text-align: center;
      background: var(--bg-sidebar, #ffffff);
      animation: pulse 1.5s infinite;
      pointer-events: none;
    }
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.02); }
      100% { transform: scale(1); }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .animate-bounce {
      animation: bounce 1s infinite;
      display: inline-block;
    }
  `]
})
export class FileManagerComponent implements OnInit {
  private api = inject(ApiService);
  private unsavedChangesService = inject(UnsavedChangesService);
  imageBaseUrl = environment.imageBaseUrl;
  folders = signal<any[]>([]);
  activeFolder = signal<any | null>(null);
  files = signal<any[]>([]);

  // Selection set for bulk delete
  selectedFileIds = new Set<number>();

  // modal fields
  folderModalOpen = signal<boolean>(false);
  renameMode = signal<boolean>(false);
  loadingFolder = signal<boolean>(false);
  uploading = signal<boolean>(false);
  isDragOver = signal<boolean>(false);
  private dragCounter = 0;
  folderInputName = '';

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  loading = signal<boolean>(false);

  ngOnInit() {
    this.loadExplorer();
  }

  loadExplorer(activeFolderId?: number) {
    this.loading.set(true);
    this.errorMessage.set(null);
    const params: any = {};
    if (activeFolderId) params.folder_id = activeFolderId;
    else if (this.activeFolder()) params.folder_id = this.activeFolder().id;

    this.api.get('file-manager', params)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.folders.set(res.folders);
            this.activeFolder.set(res.activeFolder);
            this.files.set(res.files);
            this.selectedFileIds.clear(); // Reset bulk selection
          } else {
            this.errorMessage.set(res.message || 'Failed to load explorer.');
          }
        },
        error: (err) => {
          console.error('Failed to load explorer:', err);
          this.errorMessage.set(err.error?.error || 'Failed to load explorer.');
        }
      });
  }

  selectFolder(id: number) {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.loadExplorer(id);
  }

  openCreateFolderModal() {
    this.renameMode.set(false);
    this.folderInputName = '';
    this.loadingFolder.set(false);
    this.folderModalOpen.set(true);
  }

  openRenameFolderModal() {
    if (!this.activeFolder()) return;
    this.renameMode.set(true);
    this.folderInputName = this.activeFolder().name;
    this.loadingFolder.set(false);
    this.folderModalOpen.set(true);
  }

  closeFolderModal() {
    this.folderModalOpen.set(false);
  }

  onFolderSubmit() {
    if (!this.folderInputName.trim()) return;

    this.loadingFolder.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const folderName = this.folderInputName.trim();

    if (this.renameMode()) {
      // Rename
      this.api.put(`file-manager/folder/${this.activeFolder().id}`, { newName: folderName }).subscribe({
        next: (res) => {
          this.loadingFolder.set(false);
          this.folderModalOpen.set(false);
          this.successMessage.set(res.message);
          this.loadExplorer();
        },
        error: (err) => {
          this.loadingFolder.set(false);
          this.errorMessage.set(err.error?.error || 'Rename failed.');
        }
      });
    } else {
      // Create
      this.api.post('file-manager/folder', { name: folderName }).subscribe({
        next: (res) => {
          this.loadingFolder.set(false);
          this.folderModalOpen.set(false);
          this.successMessage.set(res.message);
          this.loadExplorer(res.folderId);
        },
        error: (err) => {
          this.loadingFolder.set(false);
          this.errorMessage.set(err.error?.error || 'Create folder failed.');
        }
      });
    }
  }

  onFileSelect(event: any) {
    const filesList: FileList = event.target.files;
    if (!filesList || filesList.length === 0 || !this.activeFolder()) return;
    this.uploadFiles(filesList);
  }

  uploadFiles(filesList: FileList) {
    this.uploading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formData = new FormData();
    formData.append('folder_id', this.activeFolder().id);
    formData.append('folder_name', this.activeFolder().name);

    for (let i = 0; i < filesList.length; i++) {
      formData.append('images', filesList[i]);
    }

    this.api.post('file-manager/upload', formData).subscribe({
      next: (res) => {
        this.uploading.set(false);
        this.successMessage.set(res.message);
        this.loadExplorer();
      },
      error: (err) => {
        this.uploading.set(false);
        this.errorMessage.set(err.error?.error || 'Upload failed.');
      }
    });
  }

  onDragOver(event: DragEvent) {
    if (!this.activeFolder() || this.uploading()) return;
    event.preventDefault();
    event.stopPropagation();
  }

  onDragEnter(event: DragEvent) {
    if (!this.activeFolder() || this.uploading()) return;
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter++;
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter--;
    if (this.dragCounter <= 0) {
      this.dragCounter = 0;
      this.isDragOver.set(false);
    }
  }

  onDrop(event: DragEvent) {
    if (!this.activeFolder() || this.uploading()) return;
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter = 0;
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFiles(files);
    }
  }

  toggleFileSelect(id: number) {
    if (this.selectedFileIds.has(id)) {
      this.selectedFileIds.delete(id);
    } else {
      this.selectedFileIds.add(id);
    }
  }

  deleteFile(id: number) {
    this.unsavedChangesService.confirmAction({
      message: 'Are you sure you want to delete this file permanently from disk?',
      title: 'Confirm Deletion',
      confirmBtnText: 'Delete',
      type: 'danger'
    }).subscribe(confirmed => {
      if (!confirmed) return;

      this.errorMessage.set(null);
      this.successMessage.set(null);

      this.api.delete(`file-manager/file/${id}`).subscribe({
        next: (res) => {
          this.successMessage.set(res.message);
          this.loadExplorer();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.error || 'Failed to delete file.');
        }
      });
    });
  }

  deleteSelectedFiles() {
    if (this.selectedFileIds.size === 0) return;

    this.unsavedChangesService.confirmAction({
      message: `Are you sure you want to delete all ${this.selectedFileIds.size} selected file(s) permanently?`,
      title: 'Confirm Deletion',
      confirmBtnText: 'Delete',
      type: 'danger'
    }).subscribe(confirmed => {
      if (!confirmed) return;

      this.errorMessage.set(null);
      this.successMessage.set(null);

      const idsArr = Array.from(this.selectedFileIds);

      this.api.post('file-manager/file/bulk-delete', { ids: idsArr }).subscribe({
        next: (res) => {
          this.successMessage.set(res.message);
          this.loadExplorer();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.error || 'Failed to delete files bulk.');
        }
      });
    });
  }

  deleteFolder(id: number) {
    this.unsavedChangesService.confirmAction({
      message: 'Are you sure you want to delete this folder and ALL files inside it permanently?',
      title: 'Confirm Deletion',
      confirmBtnText: 'Delete',
      type: 'danger'
    }).subscribe(confirmed => {
      if (!confirmed) return;

      this.errorMessage.set(null);
      this.successMessage.set(null);

      this.api.delete(`file-manager/folder/${id}`).subscribe({
        next: (res) => {
          this.successMessage.set(res.message);
          this.activeFolder.set(null);
          this.files.set([]);
          this.loadExplorer();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.error || 'Failed to delete folder.');
        }
      });
    });
  }

  // File extension checks
  isImage(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ext);
  }
}
