import { Component, Input, Output, EventEmitter, signal, inject, OnChanges, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ProductModalService } from '../../services/product-modal.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Add/Edit Product Modal -->
    <div class="modal fade" id="productModal" tabindex="-1" aria-hidden="true" [class.show]="isOpen" [style.display]="isOpen ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5); overflow-y: auto;">
      <div class="modal-dialog modal-lg">
        <div class="modal-content border-0 shadow-lg" style="background-color: var(--bg-sidebar);">
          <div class="modal-header bg-light-subtle py-3 border-bottom-0">
            <h5 class="modal-title fw-bold">{{ editMode() ? 'Edit' : 'Add' }} Product</h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          
          <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
            <div class="modal-body p-4">
              <div class="alert alert-danger border-0 p-3 mb-3 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
                <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
              </div>

              <div class="row g-3">
                <!-- Product Code -->
                <div class="col-md-3">
                  <label class="form-label fw-semibold text-muted">Product Code / SKU</label>
                  <input type="text" class="form-control" formControlName="code" placeholder="e.g. TSH-001">
                  <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="productForm.get('code')?.touched && productForm.get('code')?.invalid">
                    Code is required.
                  </div>
                </div>

                <!-- Product Name -->
                <div class="col-md-3">
                  <label class="form-label fw-semibold text-muted">Product Name</label>
                  <input type="text" class="form-control" formControlName="name" placeholder="e.g. Slimfit Blue Shirt">
                  <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="productForm.get('name')?.touched && productForm.get('name')?.invalid">
                    Name is required.
                  </div>
                </div>

                <!-- Category -->
                <div class="col-md-3">
                  <label class="form-label fw-semibold text-muted">Category</label>
                  <select class="form-select" formControlName="category_id">
                    <option value="">Select Category</option>
                    <option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.name }}</option>
                  </select>
                  <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="productForm.get('category_id')?.touched && productForm.get('category_id')?.invalid">
                    Category is required.
                  </div>
                </div>

                <!-- Supplier -->
                <div class="col-md-3">
                  <label class="form-label fw-semibold text-muted">Supplier</label>
                  <select class="form-select" formControlName="supplier_id">
                    <option [value]="null">Select Supplier</option>
                    <option *ngFor="let sup of suppliers()" [value]="sup.id">{{ sup.name }}</option>
                  </select>
                </div>

                <!-- Purchase Price -->
                <div class="col-md-3">
                  <label class="form-label fw-semibold text-muted">Purchase Price (₹)</label>
                  <input type="number" step="0.01" class="form-control" formControlName="purchase_price" placeholder="0.00">
                  <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="productForm.get('purchase_price')?.touched && productForm.get('purchase_price')?.invalid">
                    Purchase price must be positive.
                  </div>
                </div>

                <!-- Actual Price -->
                <div class="col-md-3">
                  <label class="form-label fw-semibold text-muted">Actual Price (₹)</label>
                  <input type="number" step="0.01" class="form-control" formControlName="actual_price" placeholder="Original price">
                  <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="productForm.get('actual_price')?.touched && productForm.get('actual_price')?.invalid">
                    Actual price must be positive.
                  </div>
                </div>

                <!-- Sales Price -->
                <div class="col-md-3">
                  <label class="form-label fw-semibold text-muted d-flex align-items-center justify-content-between">
                    <span>Sales Price (₹)</span>
                    <span class="badge bg-danger-subtle text-danger font-monospace" style="font-size: 0.65rem;" *ngIf="getFormDiscountPercent() > 0">
                      {{ getFormDiscountPercent() }}% OFF
                    </span>
                  </label>
                  <input type="number" step="0.01" class="form-control" formControlName="sales_price" placeholder="Selling price">
                  <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="productForm.get('sales_price')?.touched && productForm.get('sales_price')?.invalid">
                    Sales price must be positive.
                  </div>
                </div>

                <!-- Initial Stock Quantity -->
                <div class="col-md-3">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <label class="form-label fw-semibold text-muted mb-0">Initial Stock Qty</label>
                    <button *ngIf="editMode()" type="button" class="btn btn-link p-0 text-decoration-none" style="font-size: 0.75rem; line-height: 1;" (click)="allowInitialStockEdit.set(!allowInitialStockEdit())">
                      {{ allowInitialStockEdit() ? 'Lock' : 'Unlock' }}
                    </button>
                  </div>
                  <input type="number" class="form-control" formControlName="initial_stock_quantity" placeholder="0" [readOnly]="editMode() && !allowInitialStockEdit()">
                </div>

                <!-- Current Stock Quantity -->
                <div class="col-md-3">
                  <label class="form-label fw-semibold text-muted">Current Stock Qty</label>
                  <input type="number" class="form-control" formControlName="stock_quantity" placeholder="0">
                </div>

                <!-- Age details (optional) -->
                <div class="col-md-3">
                  <label class="form-label fw-semibold text-muted">Target Age / Group</label>
                  <input type="number" class="form-control" formControlName="age" placeholder="Age limit">
                </div>
                <!-- Base Size (optional if not using variants) -->
                <div class="col-md-3">
                  <label class="form-label fw-semibold text-muted">General Size</label>
                  <input type="text" class="form-control" formControlName="size" placeholder="e.g. Free Size, 32">
                </div>

                <!-- Product Images Section -->
                <div class="col-12">
                  <label class="form-label fw-bold text-muted mb-3"><i class="fas fa-images text-primary me-2"></i>Product Image Management (Up to 4 Views)</label>
                  <div class="row g-3">
                    <!-- Slot 1: Front View (Primary) -->
                    <div class="col-md-6 col-lg-3">
                      <div class="card h-100 border p-3 bg-light-subtle rounded slot-card">
                        <span class="badge bg-primary-subtle text-primary mb-2 text-uppercase font-monospace" style="font-size: 0.65rem; width: fit-content;">Front View *</span>
                        
                        <!-- Preview image -->
                        <div class="slot-preview-box mb-2 border rounded overflow-hidden position-relative bg-light" style="height: 120px; display: flex; align-items: center; justify-content: center;">
                          <img *ngIf="getImagePath('front')" [src]="getImagePath('front')" alt="Front View" class="w-100 h-100 object-fit-cover">
                          <i *ngIf="!getImagePath('front')" class="fas fa-image fs-1 text-muted opacity-25"></i>
                          <button type="button" *ngIf="getImagePath('front')" (click)="clearImageSlot('front')" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle p-1 d-flex align-items-center justify-content-center" style="width: 22px; height: 22px;">
                            <i class="fas fa-times" style="font-size: 0.7rem;"></i>
                          </button>
                        </div>
                        
                        <!-- Buttons -->
                        <div class="d-flex flex-column gap-2 mt-auto">
                          <button type="button" class="btn btn-outline-secondary btn-xs py-1" (click)="openFMModal('front')">
                            <i class="fas fa-folder-open me-1"></i>Browse FM
                          </button>
                          <input type="file" id="prod_file_front" class="d-none" (change)="onFileSelect($event, 'front')" accept="image/*">
                          <button type="button" class="btn btn-light btn-xs border py-1" onclick="document.getElementById('prod_file_front').click()">
                            <i class="fas fa-upload me-1"></i>Upload File
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Slot 2: Back View -->
                    <div class="col-md-6 col-lg-3">
                      <div class="card h-100 border p-3 bg-light-subtle rounded slot-card">
                        <span class="badge bg-secondary-subtle text-secondary mb-2 text-uppercase font-monospace" style="font-size: 0.65rem; width: fit-content;">Back View</span>
                        
                        <!-- Preview image -->
                        <div class="slot-preview-box mb-2 border rounded overflow-hidden position-relative bg-light" style="height: 120px; display: flex; align-items: center; justify-content: center;">
                          <img *ngIf="getImagePath('back')" [src]="getImagePath('back')" alt="Back View" class="w-100 h-100 object-fit-cover">
                          <i *ngIf="!getImagePath('back')" class="fas fa-image fs-1 text-muted opacity-25"></i>
                          <button type="button" *ngIf="getImagePath('back')" (click)="clearImageSlot('back')" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle p-1 d-flex align-items-center justify-content-center" style="width: 22px; height: 22px;">
                            <i class="fas fa-times" style="font-size: 0.7rem;"></i>
                          </button>
                        </div>
                        
                        <!-- Buttons -->
                        <div class="d-flex flex-column gap-2 mt-auto">
                          <button type="button" class="btn btn-outline-secondary btn-xs py-1" (click)="openFMModal('back')">
                            <i class="fas fa-folder-open me-1"></i>Browse FM
                          </button>
                          <input type="file" id="prod_file_back" class="d-none" (change)="onFileSelect($event, 'back')" accept="image/*">
                          <button type="button" class="btn btn-light btn-xs border py-1" onclick="document.getElementById('prod_file_back').click()">
                            <i class="fas fa-upload me-1"></i>Upload File
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Slot 3: Side View -->
                    <div class="col-md-6 col-lg-3">
                      <div class="card h-100 border p-3 bg-light-subtle rounded slot-card">
                        <span class="badge bg-secondary-subtle text-secondary mb-2 text-uppercase font-monospace" style="font-size: 0.65rem; width: fit-content;">Side View</span>
                        
                        <!-- Preview image -->
                        <div class="slot-preview-box mb-2 border rounded overflow-hidden position-relative bg-light" style="height: 120px; display: flex; align-items: center; justify-content: center;">
                          <img *ngIf="getImagePath('side')" [src]="getImagePath('side')" alt="Side View" class="w-100 h-100 object-fit-cover">
                          <i *ngIf="!getImagePath('side')" class="fas fa-image fs-1 text-muted opacity-25"></i>
                          <button type="button" *ngIf="getImagePath('side')" (click)="clearImageSlot('side')" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle p-1 d-flex align-items-center justify-content-center" style="width: 22px; height: 22px;">
                            <i class="fas fa-times" style="font-size: 0.7rem;"></i>
                          </button>
                        </div>
                        
                        <!-- Buttons -->
                        <div class="d-flex flex-column gap-2 mt-auto">
                          <button type="button" class="btn btn-outline-secondary btn-xs py-1" (click)="openFMModal('side')">
                            <i class="fas fa-folder-open me-1"></i>Browse FM
                          </button>
                          <input type="file" id="prod_file_side" class="d-none" (change)="onFileSelect($event, 'side')" accept="image/*">
                          <button type="button" class="btn btn-light btn-xs border py-1" onclick="document.getElementById('prod_file_side').click()">
                            <i class="fas fa-upload me-1"></i>Upload File
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Slot 4: Detail View -->
                    <div class="col-md-6 col-lg-3">
                      <div class="card h-100 border p-3 bg-light-subtle rounded slot-card">
                        <span class="badge bg-secondary-subtle text-secondary mb-2 text-uppercase font-monospace" style="font-size: 0.65rem; width: fit-content;">Detail View</span>
                        
                        <!-- Preview image -->
                        <div class="slot-preview-box mb-2 border rounded overflow-hidden position-relative bg-light" style="height: 120px; display: flex; align-items: center; justify-content: center;">
                          <img *ngIf="getImagePath('detail')" [src]="getImagePath('detail')" alt="Detail View" class="w-100 h-100 object-fit-cover">
                          <i *ngIf="!getImagePath('detail')" class="fas fa-image fs-1 text-muted opacity-25"></i>
                          <button type="button" *ngIf="getImagePath('detail')" (click)="clearImageSlot('detail')" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle p-1 d-flex align-items-center justify-content-center" style="width: 22px; height: 22px;">
                            <i class="fas fa-times" style="font-size: 0.7rem;"></i>
                          </button>
                        </div>
                        
                        <!-- Buttons -->
                        <div class="d-flex flex-column gap-2 mt-auto">
                          <button type="button" class="btn btn-outline-secondary btn-xs py-1" (click)="openFMModal('detail')">
                            <i class="fas fa-folder-open me-1"></i>Browse FM
                          </button>
                          <input type="file" id="prod_file_detail" class="d-none" (change)="onFileSelect($event, 'detail')" accept="image/*">
                          <button type="button" class="btn btn-light btn-xs border py-1" onclick="document.getElementById('prod_file_detail').click()">
                            <i class="fas fa-upload me-1"></i>Upload File
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Slot 5: Thumbnail View (304x304) -->
                    <div class="col-md-6 col-lg-3">
                      <div class="card h-100 border p-3 bg-light-subtle rounded slot-card">
                        <span class="badge bg-warning-subtle text-warning mb-2 text-uppercase font-monospace" style="font-size: 0.65rem; width: fit-content;">Thumbnail (304x304)</span>
                        
                        <!-- Preview image -->
                        <div class="slot-preview-box mb-2 border rounded overflow-hidden position-relative bg-light" style="height: 120px; display: flex; align-items: center; justify-content: center;">
                          <img *ngIf="getImagePath('thumbnail')" [src]="getImagePath('thumbnail')" alt="Thumbnail View" class="w-100 h-100 object-fit-cover">
                          <i *ngIf="!getImagePath('thumbnail')" class="fas fa-image fs-1 text-muted opacity-25"></i>
                          <button type="button" *ngIf="getImagePath('thumbnail')" (click)="clearImageSlot('thumbnail')" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle p-1 d-flex align-items-center justify-content-center" style="width: 22px; height: 22px;">
                            <i class="fas fa-times" style="font-size: 0.7rem;"></i>
                          </button>
                        </div>
                        
                        <!-- Buttons -->
                        <div class="d-flex flex-column gap-2 mt-auto">
                          <button type="button" class="btn btn-outline-secondary btn-xs py-1" (click)="openFMModal('thumbnail')">
                            <i class="fas fa-folder-open me-1"></i>Browse FM
                          </button>
                          <input type="file" id="prod_file_thumbnail" class="d-none" (change)="onFileSelect($event, 'thumbnail')" accept="image/*">
                          <button type="button" class="btn btn-light btn-xs border py-1" onclick="document.getElementById('prod_file_thumbnail').click()">
                            <i class="fas fa-upload me-1"></i>Upload File
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <hr class="my-4">

                <!-- Sizing Variants List -->
                <div class="col-12">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="fw-bold m-0"><i class="fas fa-tags text-primary me-2"></i>Stock Sizing Variants</h6>
                    <button type="button" class="btn btn-xs btn-outline-primary py-1 px-2 rounded" (click)="addVariant()">
                      <i class="fas fa-plus me-1"></i>Add Variant
                    </button>
                  </div>

                  <div formArrayName="variants" class="row g-2">
                    <div class="col-12" *ngFor="let item of variantsFormArray.controls; let i=index" [formGroupName]="i">
                      <div class="d-flex gap-2 align-items-center">
                        <input type="text" class="form-control" formControlName="size" placeholder="Size (e.g. M, L, 34)" style="width: 50%;">
                        <input type="number" class="form-control" formControlName="stock_quantity" placeholder="Initial Stock" style="width: 40%;">
                        <button type="button" class="btn btn-outline-danger" (click)="removeVariant(i)">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                    <div class="col-12 text-center text-muted" *ngIf="variantsFormArray.controls.length === 0" style="font-size: 0.85rem;">
                      No individual variants added. Standard size and stock values will apply.
                    </div>
                  </div>
                </div>

                <hr class="my-4">

                <!-- Color Variants List -->
                <div class="col-12">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="fw-bold m-0"><i class="fas fa-palette text-primary me-2"></i>Product Color Variants</h6>
                    <button type="button" class="btn btn-xs btn-outline-primary py-1 px-2 rounded" (click)="addColor()">
                      <i class="fas fa-plus me-1"></i>Add Color
                    </button>
                  </div>

                  <div formArrayName="colors" class="row g-3">
                    <div class="col-12" *ngFor="let item of colorsFormArray.controls; let i=index" [formGroupName]="i">
                      <div class="card p-3 border rounded bg-light-subtle shadow-xs">
                        <div class="row g-2 align-items-center">
                          <!-- Color Name input -->
                          <div class="col-md-5">
                            <label class="form-label fw-semibold text-muted small mb-1">Color Name</label>
                            <input type="text" class="form-control form-control-sm" formControlName="color_name" placeholder="e.g. Ruby Red, Ocean Blue">
                          </div>
                          
                          <!-- Image slot showing preview -->
                          <div class="col-md-4">
                            <label class="form-label fw-semibold text-muted small mb-1">Color Image</label>
                            <div class="d-flex gap-2 align-items-center">
                              <div class="border rounded overflow-hidden position-relative bg-light flex-shrink-0" style="width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
                                <img *ngIf="getColorImagePath(i)" [src]="getColorImagePath(i)" alt="Color Preview" class="w-100 h-100 object-fit-cover">
                                <i *ngIf="!getColorImagePath(i)" class="fas fa-paint-brush text-muted opacity-25" style="font-size: 1.2rem;"></i>
                                <button type="button" *ngIf="getColorImagePath(i)" (click)="clearColorImage(i)" class="btn btn-xs btn-danger position-absolute top-0 end-0 rounded-circle p-0 d-flex align-items-center justify-content-center" style="width: 16px; height: 16px; margin: 1px;">
                                  <i class="fas fa-times" style="font-size: 0.55rem;"></i>
                                </button>
                              </div>
                              <div class="d-flex flex-column gap-1">
                                <button type="button" class="btn btn-outline-secondary btn-xs py-0.5 px-1.5" style="font-size: 0.7rem;" (click)="openFMModalForColor(i)">
                                  Browse FM
                                </button>
                                <input type="file" [id]="'prod_file_color_' + i" class="d-none" (change)="onColorFileSelect($event, i)" accept="image/*">
                                <button type="button" class="btn btn-light border btn-xs py-0.5 px-1.5" style="font-size: 0.7rem;" (click)="triggerColorFileInput(i)">
                                  Upload File
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <!-- Delete button -->
                          <div class="col-md-3 text-end">
                            <button type="button" class="btn btn-sm btn-outline-danger" (click)="removeColor(i)">
                              <i class="fas fa-trash me-1"></i>Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="col-12 text-center text-muted" *ngIf="colorsFormArray.controls.length === 0" style="font-size: 0.85rem;">
                      No color variants added. Standard primary image will represent this product.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="modal-footer bg-light-subtle border-top-0 py-3">
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="productForm.invalid || loading()">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loading()"></span>
                {{ editMode() ? 'Save Product' : 'Create Product' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- File Manager Select Modal Overlay -->
    <div class="modal fade" id="fmSelectModal" tabindex="-1" aria-hidden="true" [class.show]="fmModalOpen()" [style.display]="fmModalOpen() ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5); overflow-y: auto; z-index: 1060;">
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; background-color: var(--bg-sidebar);">
          <div class="modal-header bg-light-subtle py-3 border-bottom-0">
            <h5 class="modal-title fw-bold"><i class="fas fa-images text-primary me-2"></i>Select Product Image</h5>
            <button type="button" class="btn-close" (click)="closeFMModal()"></button>
          </div>
          
          <div class="modal-body p-4">
            <!-- Folder Tabs Navigation -->
            <ul class="nav nav-tabs nav-pills mb-3 gap-1 border-0" role="tablist">
              <li class="nav-item" role="presentation">
                <button class="nav-link px-3 py-2 fw-semibold border bg-transparent text-secondary" [class.active-pill]="fmActiveTab() === 'all'" (click)="fmActiveTab.set('all')">
                  All Images
                </button>
              </li>
              <li class="nav-item" role="presentation" *ngFor="let folder of fmFolders()">
                <button class="nav-link px-3 py-2 fw-semibold border bg-transparent text-secondary" [class.active-pill]="fmActiveTab() === folder.id.toString()" (click)="fmActiveTab.set(folder.id.toString())">
                  {{ folder.name }}
                </button>
              </li>
            </ul>
            
            <!-- Tab content grid -->
            <div class="row g-3" style="max-height: 400px; overflow-y: auto;">
              <div class="col-6 col-sm-4 col-md-3 col-lg-2" *ngFor="let file of getFMActiveFiles()">
                <div class="card h-100 cursor-pointer border rounded shadow-xs fm-image-card" (click)="selectFMImage(file.file_path)">
                  <img [src]="imageBaseUrl + file.file_path" class="card-img-top object-fit-cover rounded" style="height: 110px;" [title]="file.file_name">
                  <div class="p-2 border-top text-center text-truncate small text-muted" style="font-size: 0.72rem;">
                    {{ file.file_name }}
                  </div>
                </div>
              </div>
              
              <div class="col-12 text-center text-muted py-5" *ngIf="getFMActiveFiles().length === 0">
                <i class="fas fa-images fs-2 mb-2 text-light"></i>
                <p class="m-0">No image files available in this directory.</p>
              </div>
            </div>
          </div>
          
          <div class="modal-footer bg-light-subtle border-top-0 py-3">
            <button type="button" class="btn btn-outline-secondary btn-sm" (click)="closeFMModal()">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .slot-card {
      border: 1px dashed rgba(0, 0, 0, 0.15) !important;
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    }
    .slot-card:hover {
      transform: translateY(-2px);
      border-color: var(--bs-primary) !important;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    }
    .slot-preview-box img {
      transition: transform 0.2s;
    }
    .slot-preview-box:hover img {
      transform: scale(1.05);
    }
    .fm-image-card {
      transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
      cursor: pointer;
    }
    .fm-image-card:hover {
      transform: scale(1.04);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
      border-color: var(--bs-primary) !important;
    }
    .active-pill {
      background-color: rgba(13, 110, 253, 0.08) !important;
      color: var(--bs-primary) !important;
      border-color: var(--bs-primary) !important;
    }
  `]
})
export class ProductModalComponent implements OnChanges, OnInit, OnDestroy {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private productModalService = inject(ProductModalService);
imageBaseUrl = environment.imageBaseUrl;
  @Input() isOpen = false;
  @Input() product: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();

  categories = signal<any[]>([]);
  suppliers = signal<any[]>([]);

  editMode = signal<boolean>(false);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Image slots state management
  selectedFiles = {
    front: null as File | null,
    back: null as File | null,
    side: null as File | null,
    detail: null as File | null,
    thumbnail: null as File | null
  };

  fmImagePaths = {
    front: signal<string | null>(null),
    back: signal<string | null>(null),
    side: signal<string | null>(null),
    detail: signal<string | null>(null),
    thumbnail: signal<string | null>(null)
  };

  activeProductImages = {
    front: null as string | null,
    back: null as string | null,
    side: null as string | null,
    detail: null as string | null,
    thumbnail: null as string | null
  };

  slotPreviews = {
    front: signal<string | null>(null),
    back: signal<string | null>(null),
    side: signal<string | null>(null),
    detail: signal<string | null>(null),
    thumbnail: signal<string | null>(null)
  };

  // Color slots state management
  colorFiles: { [index: number]: File | null } = {};
  colorPreviews: { [index: number]: string | null } = {};
  colorFmPaths: { [index: number]: string | null } = {};
  colorActiveImages: { [index: number]: string | null } = {};
  fmTargetColorIndex: number | null = null;

  // Target slot when browsing file manager
  fmTargetSlot: 'front' | 'back' | 'side' | 'detail' | 'thumbnail' = 'front';

  // File manager browse state
  fmFolders = signal<any[]>([]);
  fmFiles = signal<any[]>([]);
  fmModalOpen = signal<boolean>(false);
  fmActiveTab = signal<string>('all');
  allowInitialStockEdit = signal<boolean>(false);

  productForm: FormGroup = this.fb.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    category_id: ['', Validators.required],
    supplier_id: [null],
    purchase_price: [0, [Validators.required, Validators.min(0.01)]],
    actual_price: [null, [Validators.min(0.01)]],
    sales_price: [0, [Validators.required, Validators.min(0.01)]],
    stock_quantity: [0],
    initial_stock_quantity: [0],
    age: [null],
    size: [''],
    status: ['active'],
    variants: this.fb.array([]),
    colors: this.fb.array([])
  });

  private formSub: Subscription;

  get variantsFormArray(): FormArray {
    return this.productForm.get('variants') as FormArray;
  }

  get colorsFormArray(): FormArray {
    return this.productForm.get('colors') as FormArray;
  }

  constructor() {
    this.formSub = this.productForm.valueChanges.subscribe(() => {
      // Form is dirty if values change and we are open
      const isDirtyVal = this.productForm.dirty || 
                         Object.values(this.selectedFiles).some(f => f !== null) ||
                         Object.values(this.colorFiles).some(f => f !== null);
      this.productModalService.isDirty.set(isDirtyVal);
    });

    // Sync initial_stock_quantity to stock_quantity in add mode
    this.productForm.get('initial_stock_quantity')?.valueChanges.subscribe(val => {
      if (!this.editMode()) {
        this.productForm.get('stock_quantity')?.setValue(val, { emitEvent: false });
      }
    });
  }

  ngOnInit() {
    this.loadCategories();
    this.loadSuppliers();
  }

  ngOnDestroy() {
    this.formSub.unsubscribe();
  }

  loadCategories() {
    this.api.get('categories').subscribe({
      next: (res) => {
        if (res.success) this.categories.set(res.categories);
      }
    });
  }

  loadSuppliers() {
    this.api.get('suppliers').subscribe({
      next: (res) => {
        if (res.success) this.suppliers.set(res.suppliers);
      }
    });
  }

  getFormDiscountPercent(): number {
    const actual = this.productForm.get('actual_price')?.value;
    const sales = this.productForm.get('sales_price')?.value;
    if (actual && sales && actual > sales) {
      return Math.round(((actual - sales) / actual) * 100);
    }
    return 0;
  }

  getImagePath(slot: 'front' | 'back' | 'side' | 'detail' | 'thumbnail'): string | null {
    if (this.slotPreviews[slot]()) {
      return this.slotPreviews[slot]();
    }
    if (this.fmImagePaths[slot]()) {
      return this.imageBaseUrl + this.fmImagePaths[slot]();
    }
    if (this.activeProductImages[slot]) {
      return this.imageBaseUrl + this.activeProductImages[slot];
    }
    return null;
  }

  clearImageSlot(slot: 'front' | 'back' | 'side' | 'detail' | 'thumbnail') {
    this.selectedFiles[slot] = null;
    this.fmImagePaths[slot].set(null);
    this.slotPreviews[slot].set(null);
    this.activeProductImages[slot] = null;
    const fileInput = document.getElementById('prod_file_' + slot) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  addVariant(size = '', stock = 0) {
    this.variantsFormArray.push(
      this.fb.group({
        size: [size, Validators.required],
        stock_quantity: [stock, [Validators.required, Validators.min(0)]]
      })
    );
  }

  removeVariant(index: number) {
    this.variantsFormArray.removeAt(index);
  }

  addColor(colorName = '', imagePath = '') {
    const control = this.fb.group({
      color_name: [colorName, Validators.required],
      image_path: [imagePath]
    });
    this.colorsFormArray.push(control);
    const index = this.colorsFormArray.length - 1;
    this.colorFiles[index] = null;
    this.colorPreviews[index] = null;
    this.colorFmPaths[index] = null;
    this.colorActiveImages[index] = imagePath || null;
  }

  removeColor(index: number) {
    this.colorsFormArray.removeAt(index);
    const length = this.colorsFormArray.length;
    for (let i = index; i < length; i++) {
      this.colorFiles[i] = this.colorFiles[i + 1] || null;
      this.colorPreviews[i] = this.colorPreviews[i + 1] || null;
      this.colorFmPaths[i] = this.colorFmPaths[i + 1] || null;
      this.colorActiveImages[i] = this.colorActiveImages[i + 1] || null;
    }
    delete this.colorFiles[length];
    delete this.colorPreviews[length];
    delete this.colorFmPaths[length];
    delete this.colorActiveImages[length];
  }

  getColorImagePath(index: number): string | null {
    if (this.colorPreviews[index]) {
      return this.colorPreviews[index];
    }
    if (this.colorFmPaths[index]) {
      return this.imageBaseUrl + this.colorFmPaths[index];
    }
    if (this.colorActiveImages[index]) {
      return this.imageBaseUrl + this.colorActiveImages[index];
    }
    return null;
  }

  clearColorImage(index: number) {
    this.colorFiles[index] = null;
    this.colorFmPaths[index] = null;
    this.colorPreviews[index] = null;
    this.colorActiveImages[index] = null;
    this.colorsFormArray.at(index).get('image_path')?.setValue(null);
    const fileInput = document.getElementById('prod_file_color_' + index) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  triggerColorFileInput(index: number) {
    const fileInput = document.getElementById('prod_file_color_' + index) as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  onColorFileSelect(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      this.colorFiles[index] = file;
      this.colorFmPaths[index] = null;
      this.colorsFormArray.at(index).get('image_path')?.setValue(null);
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.colorPreviews[index] = e.target.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.errorMessage.set(null);
    }
    if (changes['product']) {
      const prod = changes['product'].currentValue;
      this.editMode.set(!!prod);
      
      // Clear files/previews state
      this.selectedFiles = { front: null, back: null, side: null, detail: null, thumbnail: null };
      this.slotPreviews.front.set(null);
      this.slotPreviews.back.set(null);
      this.slotPreviews.side.set(null);
      this.slotPreviews.detail.set(null);
      this.slotPreviews.thumbnail.set(null);
      this.fmImagePaths.front.set(null);
      this.fmImagePaths.back.set(null);
      this.fmImagePaths.side.set(null);
      this.fmImagePaths.detail.set(null);
      this.fmImagePaths.thumbnail.set(null);

      this.variantsFormArray.clear();
      this.colorsFormArray.clear();
      this.colorFiles = {};
      this.colorPreviews = {};
      this.colorFmPaths = {};
      this.colorActiveImages = {};

      if (prod) {
        this.activeProductImages = {
          front: prod.image || null,
          back: prod.image_back || null,
          side: prod.image_side || null,
          detail: prod.image_detail || null,
          thumbnail: prod.thumbnail || null
        };
        this.allowInitialStockEdit.set(false);
        this.productForm.patchValue({
          code: prod.code,
          name: prod.name,
          category_id: prod.category_id,
          supplier_id: prod.supplier_id,
          purchase_price: prod.purchase_price,
          actual_price: prod.actual_price,
          sales_price: prod.sales_price,
          stock_quantity: prod.stock_quantity,
          initial_stock_quantity: prod.initial_stock_quantity,
          age: prod.age,
          size: prod.size,
          status: prod.status
        });
        if (prod.variants && prod.variants.length > 0) {
          prod.variants.forEach((v: any) => this.addVariant(v.size, v.stock_quantity));
        }
        if (prod.colors && prod.colors.length > 0) {
          prod.colors.forEach((col: any) => this.addColor(col.color_name, col.image_path));
        }
      } else {
        this.activeProductImages = { front: null, back: null, side: null, detail: null, thumbnail: null };
        this.allowInitialStockEdit.set(false);
        this.productForm.reset({
          purchase_price: 0,
          actual_price: null,
          sales_price: 0,
          stock_quantity: 0,
          initial_stock_quantity: 0,
          status: 'active',
          supplier_id: null
        });
      }
      this.productModalService.isDirty.set(false);
    }
  }

  closeModal() {
    this.close.emit();
  }

  onFileSelect(event: any, slot: 'front' | 'back' | 'side' | 'detail' | 'thumbnail') {
    const file = event.target.files[0];
    if (file) {
      if (slot === 'thumbnail') {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          if (img.width !== 912 || img.height !== 912) {
            this.errorMessage.set('Thumbnail image must be exactly 304 × 304 pixels.');
            this.clearImageSlot('thumbnail');
          } else {
            this.errorMessage.set(null);
            this.setFile(file, slot);
          }
        };
      } else {
        this.setFile(file, slot);
      }
    }
  }

  private setFile(file: File, slot: 'front' | 'back' | 'side' | 'detail' | 'thumbnail') {
    this.selectedFiles[slot] = file;
    this.fmImagePaths[slot].set(null);
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.slotPreviews[slot].set(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  onSubmit() {
    if (this.productForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const formData = new FormData();
    const formVals = this.productForm.value;

    Object.keys(formVals).forEach(key => {
      if (key === 'variants') {
        formData.append('variants', JSON.stringify(formVals.variants));
      } else if (key === 'colors') {
        formData.append('colors', JSON.stringify(formVals.colors));
      } else if (formVals[key] !== null && formVals[key] !== undefined) {
        formData.append(key, formVals[key]);
      }
    });

    this.colorsFormArray.controls.forEach((ctrl, i) => {
      if (this.colorFiles[i]) {
        formData.append('color_image_' + i, this.colorFiles[i]!);
      }
    });

    if (this.selectedFiles.front) {
      formData.append('image', this.selectedFiles.front);
    } else if (this.fmImagePaths.front()) {
      formData.append('image', this.fmImagePaths.front()!);
    } else if (!this.activeProductImages.front) {
      formData.append('image', '');
    }

    if (this.selectedFiles.back) {
      formData.append('image_back', this.selectedFiles.back);
    } else if (this.fmImagePaths.back()) {
      formData.append('image_back', this.fmImagePaths.back()!);
    } else if (!this.activeProductImages.back) {
      formData.append('image_back', '');
    }

    if (this.selectedFiles.side) {
      formData.append('image_side', this.selectedFiles.side);
    } else if (this.fmImagePaths.side()) {
      formData.append('image_side', this.fmImagePaths.side()!);
    } else if (!this.activeProductImages.side) {
      formData.append('image_side', '');
    }

    if (this.selectedFiles.detail) {
      formData.append('image_detail', this.selectedFiles.detail);
    } else if (this.fmImagePaths.detail()) {
      formData.append('image_detail', this.fmImagePaths.detail()!);
    } else if (!this.activeProductImages.detail) {
      formData.append('image_detail', '');
    }

    if (this.selectedFiles.thumbnail) {
      formData.append('thumbnail', this.selectedFiles.thumbnail);
    } else if (this.fmImagePaths.thumbnail()) {
      formData.append('thumbnail', this.fmImagePaths.thumbnail()!);
    } else if (!this.activeProductImages.thumbnail) {
      formData.append('thumbnail', '');
    }

    const url = this.editMode() ? `products/${this.product.id}` : 'products';
    const request = this.editMode()
      ? this.api.put(url, formData)
      : this.api.post(url, formData);

    request.subscribe({
      next: (res) => {
        this.loading.set(false);
        this.save.emit(res.message);
        this.close.emit();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Failed to save product.');
      }
    });
  }

  // --- File Manager Modal Actions ---
  openFMModal(slotKey: 'front' | 'back' | 'side' | 'detail' | 'thumbnail') {
    this.fmTargetColorIndex = null;
    this.fmTargetSlot = slotKey;
    this.loadFMData();
  }

  openFMModalForColor(index: number) {
    this.fmTargetColorIndex = index;
    this.loadFMData();
  }

  private loadFMData() {
    this.errorMessage.set(null);
    this.api.get('file-manager').subscribe({
      next: (res) => {
        if (res.success) {
          this.fmFolders.set(res.folders);
          this.fmFiles.set(res.files);
          this.fmActiveTab.set('all');
          this.fmModalOpen.set(true);
        }
      },
      error: (err) => {
        console.error('Failed to load FM directories:', err);
        this.errorMessage.set('Failed to open file manager catalog.');
      }
    });
  }

  closeFMModal() {
    this.fmModalOpen.set(false);
  }

  isImage(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext);
  }

  getFMActiveFiles(): any[] {
    const tab = this.fmActiveTab();
    const files = this.fmFiles();
    const images = files.filter(f => this.isImage(f.file_name));
    if (tab === 'all') {
      return images;
    } else {
      const folderId = Number(tab);
      return images.filter(f => f.folder_id === folderId);
    }
  }

  selectFMImage(filePath: string) {
    if (this.fmTargetColorIndex !== null) {
      const idx = this.fmTargetColorIndex;
      this.colorFmPaths[idx] = filePath;
      this.colorFiles[idx] = null;
      this.colorPreviews[idx] = null;
      this.colorsFormArray.at(idx).get('image_path')?.setValue(filePath);
      const fileInput = document.getElementById('prod_file_color_' + idx) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      this.fmModalOpen.set(false);
    } else {
      const slot = this.fmTargetSlot;
      if (slot === 'thumbnail') {
        const img = new Image();
        img.src = this.imageBaseUrl + filePath;
        img.onload = () => {
          if (img.width !== 912 || img.height !== 912) {
            this.errorMessage.set('Selected thumbnail image is not 304 × 304 pixels (dimensions: ' + img.width + 'x' + img.height + ').');
            this.fmModalOpen.set(false);
          } else {
            this.errorMessage.set(null);
            this.setFMImage(filePath, slot);
          }
        };
      } else {
        this.setFMImage(filePath, slot);
      }
    }
  }

  private setFMImage(filePath: string, slot: 'front' | 'back' | 'side' | 'detail' | 'thumbnail') {
    this.fmImagePaths[slot].set(filePath);
    this.selectedFiles[slot] = null;
    this.slotPreviews[slot].set(null);
    const fileInput = document.getElementById('prod_file_' + slot) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    this.fmModalOpen.set(false);
  }
}
