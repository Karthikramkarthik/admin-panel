import { Component, signal, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { UnsavedChangesService } from '../../services/unsaved-changes.service';

@Component({
  selector: 'app-product-import',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="animate-fade-in h-100" style="max-width: 900px; margin: 0 auto;">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold m-0">Bulk Product Importer</h4>
          <p class="text-muted m-0">Upload a spreadsheet to import or update inventory items in bulk</p>
        </div>
        <a routerLink="/products" class="btn btn-outline-secondary btn-sm"><i class="fas fa-arrow-left me-2"></i>Back to Catalog</a>
      </div>

      <div class="card glass-card border-0 p-4 mb-4">
        <div class="card-body">
          <div class="alert alert-danger border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
            <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
          </div>
          
          <div class="alert alert-success border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="successMessage()">
            <i class="fas fa-check-circle me-2"></i>{{ successMessage() }}
          </div>

          <div class="alert alert-warning border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="failedRows().length > 0">
            <h6 class="fw-bold mb-2">Partial Import Failures ({{ failedRows().length }} rows)</h6>
            <ul class="m-0 ps-3">
              <li *ngFor="let failed of failedRows()">
                <strong>Row {{ failed.row }}:</strong> {{ failed.errors.join(' ') }}
              </li>
            </ul>
          </div>

          <form (submit)="onSubmit($event)">
            <div class="row g-4 align-items-end">
              <div class="col-md-8">
                <label class="form-label fw-semibold text-muted">Upload CSV or Excel Spreadsheet (.csv, .xlsx)</label>
                <input type="file" class="form-control" (change)="onFileSelect($event)" accept=".csv,.xlsx" required>
                <div class="form-text">Ensure your file contains all required headers.</div>
              </div>
              <div class="col-md-4">
                <!-- Trigger dynamic CSV sample download -->
                <button type="button" class="btn btn-outline-primary w-100 py-2" (click)="downloadTemplate()">
                  <i class="fas fa-download me-2"></i>Sample Template
                </button>
              </div>
              <div class="col-12">
                <button type="submit" class="btn btn-primary px-4 py-2" [disabled]="!selectedFile() || loading()">
                  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loading()"></span>
                  {{ loading() ? 'Importing spreadsheet...' : 'Import Products' }}
                </button>
              </div>
            </div>
          </form>

          <hr class="my-4">

          <div class="row g-4">
            <div class="col-md-6">
              <div class="border rounded p-3 bg-light-subtle">
                <h6 class="fw-bold text-primary mb-2"><i class="fas fa-list-ol me-2"></i>Expected Columns</h6>
                <ul class="m-0 ps-3 style-type-decimal" style="font-size: 0.85rem; line-height: 1.6;">
                  <li><strong>Product Name:</strong> Title of the item.</li>
                  <li><strong>Product Code:</strong> Unique code / SKU.</li>
                  <li><strong>Category:</strong> Folder class (creates general fallback if blank).</li>
                  <li><strong>Supplier List:</strong> Name of supplier (creates new record if missing).</li>
                  <li><strong>Age:</strong> Product target age (optional numeric).</li>
                  <li><strong>Purchase Price:</strong> Product purchase cost value.</li>
                  <li><strong>Sales Price:</strong> Catalog standard sales price.</li>
                  <li><strong>Initial Stock Quantity:</strong> Sizing item stock levels.</li>
                  <li><strong>Size:</strong> Item size tag (supports variants grouping!).</li>
                </ul>
              </div>
            </div>
            <div class="col-md-6">
              <div class="border rounded p-3 bg-light-subtle">
                <h6 class="fw-bold text-success mb-2"><i class="fas fa-circle-info me-2"></i>Importing Guidelines</h6>
                <ul class="m-0 ps-3" style="font-size: 0.85rem; line-height: 1.6; list-style-type: square;">
                  <li>File will validate correct column matching structure before executing write.</li>
                  <li>Products sharing the exact same <strong>Product Code</strong> but having different <strong>Size</strong> columns will be automatically grouped as variants under a single product catalog item!</li>
                  <li>Stock totals are auto-summed and sizes aggregated dynamically.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProductImportComponent {
  private api = inject(ApiService);
  private unsavedChangesService = inject(UnsavedChangesService);

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.selectedFile() && !this.loading() && !this.successMessage()) {
      $event.returnValue = true;
    }
  }

  canDeactivate(): boolean | import('rxjs').Observable<boolean> {
    if (this.selectedFile() && !this.loading() && !this.successMessage()) {
      return this.unsavedChangesService.confirm();
    }
    return true;
  }

  selectedFile = signal<File | null>(null);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  failedRows = signal<any[]>([]);

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile.set(file);
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.selectedFile()) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.failedRows.set([]);

    const formData = new FormData();
    formData.append('product_file', this.selectedFile() as File);

    this.api.post('products/import', formData).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set(res.message);
        if (res.failedRows && res.failedRows.length > 0) {
          this.failedRows.set(res.failedRows);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Import operation failed. Check format.');
      }
    });
  }

  downloadTemplate() {
    // Generate an in-memory CSV template download since it is very clean and reliable!
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Product Name,Product Code,Category,Supplier List,Age,Purchase Price,Sales Price,Initial Stock Quantity,Size\n"
      + "Crew Neck Red Tee,TEE-RED-01,Apparel,Trionova Apparel,18,150.00,350.00,20,M\n"
      + "Crew Neck Red Tee,TEE-RED-01,Apparel,Trionova Apparel,18,150.00,350.00,15,L\n"
      + "Leather Wallet Classic,WL-BLK-02,Accessories,Style & Co,,300.00,699.00,50,\n";
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_product_import.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
