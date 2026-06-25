import { Component, Input, Output, EventEmitter, signal, inject, OnChanges, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { PurchaseModalService } from '../../services/purchase-modal.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-purchase-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Record / Edit Purchase Modal -->
    <div *ngIf="mode === 'add' || mode === 'edit'" class="modal fade" id="purchaseModal" tabindex="-1" aria-hidden="true" [class.show]="isOpen" [style.display]="isOpen ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5); overflow-y: auto;">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; background-color: var(--bg-sidebar);">
          <div class="modal-header bg-light-subtle py-3 border-bottom-0">
            <h5 class="modal-title fw-bold">{{ mode === 'edit' ? 'Edit Inventory Purchase' : 'Record Inventory Purchase' }}</h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          
          <form [formGroup]="purchaseForm" (ngSubmit)="onSubmit()">
            <div class="modal-body p-4">
              <div class="alert alert-danger border-0 p-3 mb-3 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
                <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
              </div>
 
              <div class="row g-3">
                <!-- Invoice Number -->
                <div class="col-md-12">
                  <label class="form-label fw-semibold text-muted">Invoice Reference Number</label>
                  <input type="text" class="form-control" formControlName="invoice_number" placeholder="e.g. TIKQ-001 (Optional, leaves empty to auto-generate)">
                </div>
 
                <!-- Supplier -->
                <div class="col-md-6">
                  <label class="form-label fw-semibold text-muted">Supplier</label>
                  <select class="form-select" formControlName="supplier_id">
                    <option value="">Select Supplier</option>
                    <option *ngFor="let sup of suppliers()" [value]="sup.id">{{ sup.name }}</option>
                  </select>
                  <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="purchaseForm.get('supplier_id')?.touched && purchaseForm.get('supplier_id')?.invalid">
                    Supplier selection is required.
                  </div>
                </div>
 
                <!-- Date -->
                <div class="col-md-6">
                  <label class="form-label fw-semibold text-muted">Purchase Date</label>
                  <input type="date" class="form-control" formControlName="purchase_date">
                  <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="purchaseForm.get('purchase_date')?.touched && purchaseForm.get('purchase_date')?.invalid">
                    Date is required.
                  </div>
                </div>

                <!-- Purchase Items Table -->
                <div class="col-md-12 mt-3">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <label class="form-label fw-bold text-main m-0">
                      <i class="fas fa-list-check me-2 text-primary"></i>Purchase Items
                    </label>
                    <button type="button" class="btn btn-xs btn-outline-primary py-1 px-2" (click)="addItem()">
                      <i class="fas fa-plus me-1"></i>Add Item
                    </button>
                  </div>
                  <div class="table-responsive border rounded" style="max-height: 250px; overflow-y: auto;">
                    <table class="table table-sm align-middle m-0 text-center">
                      <thead class="bg-light sticky-top">
                        <tr style="font-size: 0.8rem;">
                          <th style="width: 45%;" class="text-start ps-3">Product</th>
                          <th style="width: 20%;">Size</th>
                          <th style="width: 15%;">Qty</th>
                          <th style="width: 15%;">Unit Cost</th>
                          <th style="width: 5%;"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let item of itemsList(); let i = index">
                          <td class="text-start ps-3">
                            <select class="form-select form-select-sm" 
                                    [value]="item.product_id" 
                                    (change)="onProductChange(i, $any($event.target).value)">
                              <option value="">Select Product</option>
                              <option *ngFor="let prod of products()" [value]="prod.id">
                                {{ prod.name }} (SKU: {{ prod.code || 'N/A' }})
                              </option>
                            </select>
                          </td>
                          <td>
                            <div class="input-group input-group-sm">
                              <input type="text" class="form-control form-control-sm" 
                                     placeholder="Size"
                                     [value]="item.size" 
                                     (input)="updateItemValue(i, 'size', $any($event.target).value)"
                                     list="sizesList-i">
                              <datalist id="sizesList-i">
                                <option *ngFor="let sz of item.availableSizes" [value]="sz"></option>
                              </datalist>
                            </div>
                          </td>
                          <td>
                            <input type="number" class="form-control form-control-sm text-center" 
                                   min="1" 
                                   [value]="item.quantity" 
                                   (input)="updateItemValue(i, 'quantity', $any($event.target).value)">
                          </td>
                          <td>
                            <div class="input-group input-group-sm">
                              <span class="input-group-text p-1" style="font-size: 0.75rem;">₹</span>
                              <input type="number" step="0.01" class="form-control form-control-sm" 
                                     min="0" 
                                     [value]="item.price" 
                                     (input)="updateItemValue(i, 'price', $any($event.target).value)">
                            </div>
                          </td>
                          <td>
                            <button type="button" class="btn btn-link text-danger p-0" 
                                    [disabled]="itemsList().length <= 1"
                                    (click)="removeItem(i)">
                               <i class="fas fa-trash-can"></i>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div class="text-danger mt-1" style="font-size: 0.75rem;" *ngIf="itemsInvalid()">
                    All items must have a product selected, and quantity/unit cost greater than or equal to 0.
                  </div>
                </div>

                <!-- Subtotal (Read-only) -->
                <div class="col-md-6">
                  <label class="form-label fw-semibold text-muted">Subtotal (₹)</label>
                  <input type="number" step="0.01" class="form-control" formControlName="subtotal" placeholder="0.00" readonly style="background-color: var(--bg-primary); cursor: not-allowed;">
                </div>
 
                <!-- Receipt Bill -->
                <div class="col-md-6">
                  <label class="form-label fw-semibold text-muted">Receipt Bill Attachment (PDF or Image)</label>
                  <input type="file" class="form-control" (change)="onFileSelect($event)" accept="image/*,.pdf">
                </div>

                <!-- Tax Type -->
                <div class="col-md-4">
                  <label class="form-label fw-semibold text-muted">Tax Type</label>
                  <select class="form-select" formControlName="tax_type">
                    <option value="">No Tax</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

                <!-- Tax Rate / Amount Input -->
                <div class="col-md-4">
                  <label class="form-label fw-semibold text-muted">
                    {{ purchaseForm.get('tax_type')?.value === 'percentage' ? 'Tax Rate (%)' : (purchaseForm.get('tax_type')?.value === 'fixed' ? 'Tax Amount (₹)' : 'Tax Rate') }}
                  </label>
                  <input type="number" step="0.01" class="form-control" formControlName="tax_rate" 
                         [placeholder]="purchaseForm.get('tax_type')?.value ? 'Enter tax value' : '-'" 
                         [readonly]="!purchaseForm.get('tax_type')?.value" 
                         [style.background-color]="!purchaseForm.get('tax_type')?.value ? 'var(--bg-primary)' : null">
                </div>
 
                <!-- Total Amount (Read-only) -->
                <div class="col-md-4">
                  <label class="form-label fw-semibold text-muted">Total Amount (₹) - Auto calculated</label>
                  <input type="number" step="0.01" class="form-control" formControlName="total_amount" placeholder="0.00" readonly style="background-color: var(--bg-primary); cursor: not-allowed;">
                </div>
 
                <!-- Notes -->
                <div class="col-md-12">
                  <label class="form-label fw-semibold text-muted">Notes</label>
                  <input type="text" class="form-control" formControlName="note" placeholder="Optional purchase notes...">
                </div>
              </div>
            </div>
            
            <div class="modal-footer bg-light-subtle border-top-0 py-3">
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="purchaseForm.invalid || itemsInvalid() || loading()">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loading()"></span>
                {{ mode === 'edit' ? 'Save Changes' : 'Log Purchase' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
 
    <!-- View Invoice Details Modal -->
    <div *ngIf="mode === 'view'" class="modal fade" id="viewInvoiceModal" tabindex="-1" aria-hidden="true" [class.show]="isOpen" [style.display]="isOpen ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5); overflow-y: auto;">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; background-color: var(--bg-sidebar);">
          <div class="modal-header bg-light-subtle py-3 border-bottom-0">
            <h5 class="modal-title fw-bold"><i class="fas fa-file-lines text-primary me-2"></i>Purchase Invoice Detail</h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          
          <div class="modal-body p-4" *ngIf="selectedInvoice()">
            <div class="row g-3">
              <div class="col-md-6">
                <div class="text-muted text-uppercase fw-bold" style="font-size: 0.72rem;">Reference Invoice</div>
                <h4 class="fw-extrabold text-primary m-0 mt-1">{{ selectedInvoice().invoice_number }}</h4>
              </div>
              <div class="col-md-6 text-md-end">
                <div class="text-muted text-uppercase fw-bold" style="font-size: 0.72rem;">Purchase Date</div>
                <h5 class="fw-bold m-0 mt-1 text-main">{{ selectedInvoice().purchase_date }}</h5>
              </div>
              <hr class="my-2">
              <div class="col-md-6">
                <div class="text-muted text-uppercase fw-bold mb-1" style="font-size: 0.72rem;">Supplier Info</div>
                <div class="fw-bold text-main">{{ selectedInvoice().supplier_name }}</div>
                <div class="text-muted" style="font-size: 0.85rem;">{{ selectedInvoice().supplier_mobile }}</div>
                <div class="text-muted" style="font-size: 0.85rem;">{{ selectedInvoice().supplier_address || '-' }}</div>
              </div>
              <div class="col-md-6 text-md-end">
                <div class="text-muted text-uppercase fw-bold mb-1" style="font-size: 0.72rem;">Receipt Attachment</div>
                <a *ngIf="selectedInvoice().thumbnail_image" [href]="imageBaseUrl + selectedInvoice().thumbnail_image" target="_blank" class="btn btn-sm btn-outline-primary mt-1">
                  <i class="fas fa-arrow-up-right-from-square me-2"></i>View Receipt Bill
                </a>
                <span class="text-muted d-block mt-1" *ngIf="!selectedInvoice().thumbnail_image">No receipt attached</span>
              </div>
              
              <!-- Purchase Items Table in View Mode -->
              <div class="col-md-12 mt-4" *ngIf="selectedInvoice().items && selectedInvoice().items.length > 0">
                <div class="text-muted text-uppercase fw-bold mb-2" style="font-size: 0.72rem;">Items Procured</div>
                <div class="table-responsive border rounded">
                  <table class="table table-sm align-middle m-0 text-center">
                    <thead class="bg-light">
                      <tr style="font-size: 0.8rem;">
                        <th class="text-start ps-3">Product Name</th>
                        <th>SKU</th>
                        <th>Size</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th class="text-end pe-3">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let item of selectedInvoice().items">
                        <td class="text-start ps-3 fw-bold text-main">{{ item.product_name }}</td>
                        <td><span class="badge bg-secondary-subtle text-secondary">{{ item.product_sku || '-' }}</span></td>
                        <td><span class="badge bg-info-subtle text-info">{{ item.size || 'Default' }}</span></td>
                        <td class="fw-semibold">{{ item.quantity }}</td>
                        <td>₹{{ item.price | number:'1.2-2' }}</td>
                        <td class="text-end pe-3 fw-bold text-danger">₹{{ item.total | number:'1.2-2' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
 
              <hr class="my-2">
              <div class="col-md-4">
                <div class="text-muted text-uppercase fw-bold" style="font-size: 0.72rem;">Subtotal</div>
                <h5 class="fw-bold text-main m-0 mt-1">₹{{ (selectedInvoice().subtotal || selectedInvoice().total_amount) | number:'1.2-2' }}</h5>
              </div>
              <div class="col-md-4">
                <div class="text-muted text-uppercase fw-bold" style="font-size: 0.72rem;">Tax</div>
                <h5 class="fw-bold text-main m-0 mt-1">
                  <span *ngIf="selectedInvoice().tax_type === 'percentage'">₹{{ selectedInvoice().tax_amount | number:'1.2-2' }} ({{ selectedInvoice().tax_rate }}%)</span>
                  <span *ngIf="selectedInvoice().tax_type === 'fixed'">₹{{ selectedInvoice().tax_amount | number:'1.2-2' }} (Fixed)</span>
                  <span *ngIf="!selectedInvoice().tax_type">₹0.00</span>
                </h5>
              </div>
              <div class="col-md-4">
                <div class="text-muted text-uppercase fw-bold" style="font-size: 0.72rem;">Grand Total</div>
                <h4 class="fw-extrabold text-danger m-0 mt-1">₹{{ selectedInvoice().total_amount | number:'1.2-2' }}</h4>
              </div>
            </div>
 
            <div class="mt-4 p-3 bg-light-subtle rounded border border-dashed" *ngIf="selectedInvoice().note">
              <div class="text-uppercase text-muted fw-bold mb-1" style="font-size: 0.7rem;">Procurement note</div>
              <p class="m-0 text-main" style="font-size: 0.85rem;">{{ selectedInvoice().note }}</p>
            </div>
          </div>
          
          <div class="modal-footer bg-light-subtle border-top-0 py-3">
            <button type="button" class="btn btn-outline-secondary btn-sm" (click)="closeModal()">Close</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PurchaseModalComponent implements OnChanges, OnInit, OnDestroy {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private purchaseModalService = inject(PurchaseModalService);
imageBaseUrl = environment.imageBaseUrl;
  @Input() isOpen = false;
  @Input() mode: 'add' | 'edit' | 'view' = 'add';
  @Input() purchaseId: number | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();

  suppliers = signal<any[]>([]);
  products = signal<any[]>([]);
  selectedInvoice = signal<any | null>(null);

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  selectedFile: File | null = null;

  itemsList = signal<any[]>([]);

  purchaseForm: FormGroup = this.fb.group({
    invoice_number: [''],
    supplier_id: ['', Validators.required],
    purchase_date: ['', Validators.required],
    note: [''],
    subtotal: [''],
    tax_type: [''],
    tax_rate: [''],
    tax_amount: [''],
    total_amount: ['', [Validators.required, Validators.min(0.01)]]
  });

  private sub: Subscription;

  constructor() {
    this.sub = this.purchaseForm.valueChanges.subscribe(() => {
      this.purchaseModalService.isDirty.set(this.purchaseForm.dirty || this.selectedFile !== null || this.itemsList().length > 1);
    });
  }

  ngOnInit() {
    this.loadSuppliers();
    this.loadProducts();

    this.purchaseForm.get('tax_type')?.valueChanges.subscribe(() => {
      if (!this.purchaseForm.get('tax_type')?.value) {
        this.purchaseForm.patchValue({ tax_rate: '', tax_amount: '' }, { emitEvent: false });
      }
      this.calculateTotal();
    });
    this.purchaseForm.get('tax_rate')?.valueChanges.subscribe(() => {
      this.calculateTotal();
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  loadSuppliers() {
    this.api.get('suppliers').subscribe({
      next: (res) => {
        if (res.success) this.suppliers.set(res.suppliers);
      }
    });
  }

  loadProducts() {
    this.api.get('products').subscribe({
      next: (res) => {
        if (res.success) this.products.set(res.products);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.errorMessage.set(null);
      this.selectedFile = null;
    }
    
    const openVal = changes['isOpen'] ? changes['isOpen'].currentValue : this.isOpen;
    if (openVal && this.purchaseId !== null && (changes['purchaseId'] || changes['isOpen'] || changes['mode'])) {
      this.loadPurchaseDetails(this.purchaseId);
    } else if (openVal && this.purchaseId === null && this.mode === 'add') {
      const todayStr = new Date().toISOString().slice(0, 10);
      this.purchaseForm.reset({
        invoice_number: '',
        supplier_id: '',
        purchase_date: todayStr,
        subtotal: '',
        tax_type: '',
        tax_rate: '',
        tax_amount: '',
        total_amount: '',
        note: ''
      });
      this.itemsList.set([{ product_id: '', size: '', quantity: 1, price: 0, availableSizes: [] }]);
      this.selectedInvoice.set(null);
      this.purchaseModalService.isDirty.set(false);
    }
  }

  loadPurchaseDetails(id: number) {
    this.loading.set(true);
    this.api.get(`purchases/${id}`).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.selectedInvoice.set(res.purchase);
          this.purchaseForm.patchValue({
            invoice_number: res.purchase.invoice_number,
            supplier_id: res.purchase.supplier_id,
            purchase_date: res.purchase.purchase_date,
            note: res.purchase.note,
            subtotal: res.purchase.subtotal,
            tax_type: res.purchase.tax_type || '',
            tax_rate: res.purchase.tax_rate,
            tax_amount: res.purchase.tax_amount,
            total_amount: res.purchase.total_amount
          });

          if (res.purchase.items && (this.mode === 'edit' || this.mode === 'view')) {
            const items = res.purchase.items.map((item: any) => {
              const selectedProd = this.products().find(p => p.id === Number(item.product_id));
              const availableSizes = selectedProd ? ((selectedProd.size || selectedProd.sizes || '').split(',').map((s: string) => s.trim()).filter(Boolean)) : [];
              return {
                product_id: item.product_id,
                size: item.size || '',
                quantity: item.quantity,
                price: item.price,
                availableSizes: availableSizes
              };
            });
            this.itemsList.set(items);
          }
          this.purchaseModalService.isDirty.set(false);
        }
      },
      error: (err) => {
        this.loading.set(false);
        console.error(err);
        this.errorMessage.set('Failed to load purchase details.');
      }
    });
  }

  closeModal() {
    this.close.emit();
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  addItem() {
    const items = [...this.itemsList()];
    items.push({ product_id: '', size: '', quantity: 1, price: 0, availableSizes: [] });
    this.itemsList.set(items);
    this.calculateTotal();
  }

  removeItem(index: number) {
    const items = [...this.itemsList()];
    items.splice(index, 1);
    this.itemsList.set(items);
    this.calculateTotal();
  }

  onProductChange(index: number, productId: any) {
    const items = [...this.itemsList()];
    items[index].product_id = productId ? Number(productId) : '';
    
    const selectedProd = this.products().find(p => p.id === Number(productId));
    if (selectedProd) {
      items[index].availableSizes = selectedProd ? ((selectedProd.size || selectedProd.sizes || '').split(',').map((s: string) => s.trim()).filter(Boolean)) : [];
      items[index].price = selectedProd.purchase_price || 0;
    } else {
      items[index].availableSizes = [];
      items[index].price = 0;
    }
    this.itemsList.set(items);
    this.calculateTotal();
  }

  updateItemValue(index: number, field: string, value: any) {
    const items = [...this.itemsList()];
    if (field === 'quantity') {
      items[index].quantity = Number(value || 0);
    } else if (field === 'price') {
      items[index].price = Number(value || 0);
    } else if (field === 'size') {
      items[index].size = String(value || '');
    }
    this.itemsList.set(items);
    this.calculateTotal();
  }

  calculateTotal() {
    let subtotal = 0;
    const items = this.itemsList();
    for (const item of items) {
      const qty = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      subtotal += qty * price;
    }

    const taxType = this.purchaseForm.get('tax_type')?.value || '';
    const taxRate = Number(this.purchaseForm.get('tax_rate')?.value || 0);
    let taxAmount = 0;

    if (taxType === 'percentage') {
      taxAmount = Number((subtotal * (taxRate / 100)).toFixed(2));
    } else if (taxType === 'fixed') {
      taxAmount = taxRate;
    }

    const grandTotal = subtotal + taxAmount;

    this.purchaseForm.patchValue({
      subtotal: subtotal > 0 ? Number(subtotal.toFixed(2)) : '',
      tax_amount: taxType ? Number(taxAmount.toFixed(2)) : '',
      total_amount: grandTotal > 0 ? Number(grandTotal.toFixed(2)) : ''
    }, { emitEvent: false });
  }

  itemsInvalid(): boolean {
    const items = this.itemsList();
    if (items.length === 0) return true;
    for (const item of items) {
      if (!item.product_id || Number(item.quantity) <= 0 || Number(item.price) < 0) {
        return true;
      }
    }
    return false;
  }

  onSubmit() {
    if (this.purchaseForm.invalid || this.itemsInvalid()) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const formData = new FormData();
    const formVals = this.purchaseForm.value;

    formData.append('invoice_number', formVals.invoice_number || '');
    formData.append('supplier_id', formVals.supplier_id);
    formData.append('purchase_date', formVals.purchase_date);
    formData.append('note', formVals.note || '');
    formData.append('subtotal', formVals.subtotal || formVals.total_amount);
    formData.append('tax_type', formVals.tax_type || '');
    formData.append('tax_rate', formVals.tax_rate !== null && formVals.tax_rate !== undefined ? formVals.tax_rate : '');
    formData.append('tax_amount', formVals.tax_amount !== null && formVals.tax_amount !== undefined ? formVals.tax_amount : '');
    formData.append('total_amount', formVals.total_amount);
    
    formData.append('items', JSON.stringify(this.itemsList().map(item => ({
      product_id: item.product_id,
      size: item.size || '',
      quantity: item.quantity,
      price: item.price
    }))));

    if (this.selectedFile) {
      formData.append('thumbnail_image', this.selectedFile);
    }

    const url = this.mode === 'edit' ? `purchases/${this.purchaseId}` : 'purchases';
    const request = this.mode === 'edit' ? this.api.put(url, formData) : this.api.post(url, formData);

    request.subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.save.emit(res.message);
        this.close.emit();
      },
      error: (err: any) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Saving purchase failed.');
      }
    });
  }
}
