import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-invoice-view',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="animate-fade-in no-print" style="max-width: 1000px; margin: 0 auto 40px auto;">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold m-0">Invoice Preview</h4>
          <p class="text-muted m-0">Review sales transactions, print formats, and receipts</p>
        </div>
        <a routerLink="/invoices" class="btn btn-outline-secondary btn-sm"><i class="fas fa-arrow-left me-2"></i>Back to Ledger</a>
      </div>

      <!-- Command Bar -->
      <div class="card glass-card border-0 p-3 mb-4 d-flex flex-row justify-content-between gap-2 flex-wrap">
        <div>
          <button class="btn btn-outline-primary btn-sm me-2" (click)="onPrintStandard()">
            <i class="fas fa-print me-2"></i>A4 Standard Print
          </button>
          <button class="btn btn-outline-secondary btn-sm me-2" (click)="toggleThermalMode()">
            <i class="fas fa-receipt me-2"></i>{{ showThermal() ? 'Standard Mode' : 'Thermal mode' }}
          </button>
          <a [routerLink]="['/invoices/edit', invoice().id]" class="btn btn-outline-warning btn-sm" *ngIf="invoice() && isAdminOrOwner() && (invoice().status === 'Generated' || invoice().status === 'Sent' || !invoice().status)">
            <i class="fas fa-edit me-2"></i>Edit Order
          </a>
        </div>
        
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-success btn-sm text-white fw-bold" *ngIf="invoice() && (invoice().payment_status === 'Pending' || !invoice().payment_status) && invoice().status !== 'Cancelled' && invoice().status !== 'Revised'" (click)="openPaymentModal()">
            <i class="fas fa-check-circle me-2"></i>Mark as Paid
          </button>

          <button class="btn btn-outline-success btn-sm fw-bold" *ngIf="invoice() && invoice().payment_status === 'Paid' && (auth.currentUser()?.role === 'Owner' || auth.currentUser()?.role === 'Admin') && invoice().status !== 'Cancelled' && invoice().status !== 'Revised'" (click)="openPaymentModal()">
            <i class="fas fa-edit me-2"></i>Edit Payment Status
          </button>

          <button class="btn btn-warning btn-sm text-dark fw-bold" *ngIf="invoice() && (invoice().status === 'Generated' || !invoice().status)" (click)="markAsSent()">
            <i class="fas fa-paper-plane me-2"></i>Mark as Sent
          </button>
          
          <button class="btn btn-outline-danger btn-sm" (click)="downloadPDF()" [disabled]="downloadingPDF()">
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="downloadingPDF()"></span>
            <i class="fas fa-file-pdf me-2" *ngIf="!downloadingPDF()"></i>{{ downloadingPDF() ? 'Downloading...' : 'Download PDF' }}
          </button>
          
          <button class="btn btn-success btn-sm" (click)="shareWhatsApp()">
            <i class="fab fa-whatsapp me-2"></i>Share Whatsapp
          </button>
        </div>
      </div>

      <!-- Revision Alerts -->
      <div class="alert alert-info border-0 p-3 mb-4 rounded d-flex justify-content-between align-items-center shadow-sm" *ngIf="invoice() && revisedBy()">
        <div>
          <i class="fas fa-info-circle me-2"></i>
          This invoice has been revised. The active/newest invoice is <strong>{{ revisedBy().invoice_number }}</strong>.
        </div>
        <a [routerLink]="['/invoices/view', revisedBy().sale_id]" class="btn btn-sm btn-info text-white fw-bold">View Active Invoice</a>
      </div>

      <div class="alert alert-secondary border-0 p-3 mb-4 rounded d-flex justify-content-between align-items-center shadow-sm" *ngIf="invoice() && revisionOf()">
        <div>
          <i class="fas fa-history me-2"></i>
          This is a revised invoice. The original invoice was <strong>{{ revisionOf().original_invoice_number }}</strong>.
        </div>
        <a [routerLink]="['/invoices/view', revisionOf().original_sale_id]" class="btn btn-sm btn-outline-secondary">View Original Invoice</a>
      </div>

      <!-- Revision History Audit Logs Card -->
      <div class="card glass-card border-0 p-4 mb-4 shadow-sm" *ngIf="audits().length > 0">
        <h5 class="fw-bold mb-3"><i class="fas fa-history text-warning me-2"></i>Revision Audit Logs</h5>
        <div class="timeline-container">
          <div class="border-start ps-3 pb-3 position-relative" *ngFor="let audit of audits(); let last = last" [class.mb-3]="!last">
            <span class="position-absolute start-0 translate-middle-x bg-warning rounded-circle" style="width: 12px; height: 12px; margin-left: -1px; border: 2px solid var(--bg-sidebar);"></span>
            <div class="d-flex justify-content-between align-items-start flex-wrap">
              <div>
                <strong class="text-main">{{ audit.original_invoice_number }}</strong>
                <i class="fas fa-arrow-right mx-2 text-muted"></i>
                <strong class="text-success">{{ audit.invoice_number }}</strong>
              </div>
              <span class="text-muted small">{{ audit.edited_at }}</span>
            </div>
            <div class="text-muted small mt-1">
              Revised by <span class="fw-semibold">{{ audit.edited_by_name }}</span> ({{ audit.edited_by_role }})
            </div>
            <div class="bg-light-subtle rounded p-2 mt-2" style="font-size: 0.85rem;">
              <strong>Reason:</strong> {{ audit.reason }}
            </div>
            
            <!-- Snapshot comparisons -->
            <div class="mt-2" *ngIf="isAdminOrOwner()">
              <button class="btn btn-xs btn-outline-secondary py-0.5 px-2" style="font-size: 0.72rem;" (click)="audit.showDetails = !audit.showDetails">
                <i class="fas" [class.fa-chevron-down]="!audit.showDetails" [class.fa-chevron-up]="audit.showDetails"></i> 
                {{ audit.showDetails ? 'Hide Changes' : 'View Changes' }}
              </button>
              
              <div class="card bg-light-subtle border-0 p-3 mt-2" *ngIf="audit.showDetails" style="font-size: 0.78rem; font-family: monospace;">
                <div class="row">
                  <div class="col-md-6 border-end">
                    <div class="fw-bold text-danger mb-1"><i class="fas fa-minus-circle me-1"></i>Before</div>
                    <ul class="list-unstyled m-0">
                      <li><strong>Grand Total:</strong> ₹{{ parseDetails(audit.before_details)?.sale?.grand_total | number:'1.2-2' }}</li>
                      <li><strong>Discount:</strong> ₹{{ parseDetails(audit.before_details)?.sale?.discount | number:'1.2-2' }}</li>
                      <li><strong>Items:</strong>
                        <ul class="ps-3 m-0">
                          <li *ngFor="let item of parseDetails(audit.before_details)?.items">
                            {{ item.quantity }}x {{ item.product_name }} <span *ngIf="item.size">({{ item.size }})</span> at ₹{{ item.rate }}
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                  <div class="col-md-6">
                    <div class="fw-bold text-success mb-1"><i class="fas fa-plus-circle me-1"></i>After</div>
                    <ul class="list-unstyled m-0">
                      <li><strong>Grand Total:</strong> ₹{{ parseDetails(audit.after_details)?.sale?.grand_total | number:'1.2-2' }}</li>
                      <li><strong>Discount:</strong> ₹{{ parseDetails(audit.after_details)?.sale?.discount | number:'1.2-2' }}</li>
                      <li><strong>Items:</strong>
                        <ul class="ps-3 m-0">
                          <li *ngFor="let item of parseDetails(audit.after_details)?.items">
                            {{ item.quantity }}x {{ item.product_name || item.name }} <span *ngIf="item.size">({{ item.size }})</span> at ₹{{ item.rate || item.price }}
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Printable Area -->
    <div class="printable-invoice-container animate-fade-in" style="max-width: 1000px; margin: 0 auto;">
      <!-- Standard A4 Layout -->
      <div class="card glass-card border-0 p-5 shadow-sm" *ngIf="invoice() && !showThermal()" id="printable-a4">
        <div class="row g-4 align-items-start mb-3">
          <div class="col-6">
            <h2 class="fw-extrabold text-primary m-0 tracking-tight">
               <img src="assets/invoicelogo.png" alt="" style="width:8rem">
            </h2>
            <p class="text-muted mt-1" style="font-size: 0.85rem; line-height: 1.4;">
              P no 9 K P Colony Mariamman<br>Kovil Street, Madurai - 625009
              <!-- GSTIN: 33AAAAA1111A1Z1 -->
            </p>
          </div>
          <div class="col-6 text-end">
            <h1 class="fw-extrabold text-muted m-0" style="font-size: 2.2rem; opacity: 0.2;">INVOICE</h1>
            <div class="mt-3">
              <div class="text-muted text-uppercase fw-bold" style="font-size: 0.72rem;">Invoice Ref</div>
              <div class="d-flex align-items-center justify-content-end gap-2 mt-1">
                <h5 class="fw-extrabold text-primary m-0">{{ invoice().invoice_number }}</h5>
                <span class="badge" 
                      [class.bg-warning]="invoice().status === 'Generated' || !invoice().status" 
                      [class.bg-success]="invoice().status === 'Sent'"
                      [class.bg-danger]="invoice().status === 'Cancelled'"
                      [class.bg-secondary]="invoice().status === 'Revised'"
                      [class.bg-info]="invoice().status === 'Superseded'">
                  {{ invoice().status || 'Generated' }}
                </span>
                <span class="badge" 
                      [class.bg-warning]="invoice().payment_status === 'Pending' || !invoice().payment_status" 
                      [class.text-dark]="invoice().payment_status === 'Pending' || !invoice().payment_status"
                      [class.bg-success]="invoice().payment_status === 'Paid'">
                  {{ invoice().payment_status || 'Pending' }}
                </span>
              </div>
            </div>
            <div class="mt-3">
              <div class="text-muted text-uppercase fw-bold" style="font-size: 0.72rem;">Sales Date</div>
              <h6 class="fw-bold m-0 mt-1 text-main">{{ invoice().sale_date }}</h6>
            </div>
          </div>
        </div>

        <hr class="my-4">

        <!-- Customer Billing info -->
        <div class="row g-3 mb-5">
          <div class="col-6">
            <div class="text-muted text-uppercase fw-bold mb-2" style="font-size: 0.72rem; letter-spacing: 0.5px;">Billed To:</div>
            <h5 class="fw-bold text-main m-0">{{ invoice().customer_name }}</h5>
            <div class="text-muted mt-1" style="font-size: 0.85rem;">Mobile: {{ invoice().customer_mobile }}</div>
            <div class="text-muted" style="font-size: 0.85rem;" *ngIf="invoice().customer_email">Email: {{ invoice().customer_email }}</div>
            <div class="text-muted mt-2" style="font-size: 0.85rem;" *ngIf="invoice().customer_address">{{ invoice().customer_address }}</div>
          </div>
          <div class="col-6 text-end" *ngIf="invoice().payment_status === 'Paid'">
            <div class="text-muted text-uppercase fw-bold mb-2" style="font-size: 0.72rem; letter-spacing: 0.5px;">Payment Info:</div>
            <h6 class="fw-bold text-success m-0">Paid via {{ invoice().payment_method || 'Cash' }}</h6>
            <div class="text-muted mt-1" style="font-size: 0.85rem;" *ngIf="invoice().paid_at">
              Paid At: {{ invoice().paid_at | date:'dd MMM yyyy, h:mm a' }}
            </div>
            <div class="text-muted mt-1" style="font-size: 0.85rem;" *ngIf="invoice().payment_status_updated_by">
              Updated By: {{ invoice().payment_status_updated_by }}
            </div>
          </div>
        </div>

        <!-- Line items table -->
        <div class="table-responsive rounded border overflow-hidden mb-5">
          <table class="table table-hover table-striped align-middle m-0" style="font-size: 0.85rem;">
            <thead class="table-light text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.5px;">
              <tr>
                <th class="ps-3 py-3">Product Name</th>
                <th>SKU</th>
                <th>Size</th>
                <th>Quantity</th>
                <th>Price Rate</th>
                <th class="text-end pe-3">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of invoice().items">
                <td class="ps-3 py-3 fw-bold">{{ item.product_name }}</td>
                <td><span class="badge bg-light text-dark border">{{ item.product_code }}</span></td>
                <td><span class="badge bg-light text-primary border" *ngIf="item.size">{{ item.size }}</span><span *ngIf="!item.size">-</span></td>
                <td>{{ item.quantity }}</td>
                <td>₹{{ item.rate | number:'1.2-2' }}</td>
                <td class="text-end pe-3 fw-bold text-main">₹{{ item.total | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Calculations -->
        <div class="row justify-content-end mb-4">
          <div class="col-md-5 col-sm-8 text-end">
            <div class="d-flex justify-content-between mb-2" style="font-size: 0.88rem;">
              <span class="text-muted">Subtotal:</span>
              <span class="fw-semibold">₹{{ invoice().subtotal | number:'1.2-2' }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2 text-danger" style="font-size: 0.88rem;" *ngIf="invoice().discount > 0">
              <span>Discount Applied:</span>
              <span class="fw-semibold">-₹{{ invoice().discount | number:'1.2-2' }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2" style="font-size: 0.88rem;" *ngIf="invoice().gst_amount > 0">
              <span class="text-muted">GST / Taxes:</span>
              <span class="fw-semibold">₹{{ invoice().gst_amount | number:'1.2-2' }}</span>
            </div>
            <div class="d-flex justify-content-between mb-3" style="font-size: 0.88rem;" *ngIf="invoice().shipping_charge > 0">
              <span class="text-muted">Shipping Charges:</span>
              <span class="fw-semibold">₹{{ invoice().shipping_charge | number:'1.2-2' }}</span>
            </div>
            <hr>
            <div class="d-flex justify-content-between mt-2 align-items-center">
              <h5 class="fw-bold m-0 text-main">Grand Total:</h5>
              <h3 class="fw-extrabold text-success m-0">₹{{ invoice().grand_total | number:'1.2-2' }}</h3>
            </div>
          </div>
        </div>

        <div class="mt-5 text-center text-muted border-top pt-4" style="font-size: 0.8rem;">
          Thank you for shopping with us! This is a computer-generated invoice, no signature is required.
        </div>
      </div>

      <!-- Thermal 80mm Print Layout -->
      <div class="thermal-receipt-card" *ngIf="invoice() && showThermal()" id="printable-thermal">
        <!-- Top Contents (Header, Details, Items) -->
        <div class="thermal-top-section">
          <div class="text-center mb-3">
            <div class="mb-2 d-flex justify-content-center">
              <img src="assets/invoicelogo.png" alt="Logo" style="max-height: 115px; max-width: 160px; object-fit: contain;">
            </div>
            <!-- <h5 class="fw-bold m-0" style="font-size: 1.05rem; letter-spacing: 0.5px;">STOCK MANAGEMENT</h5> -->
            <div style="font-size: 0.7rem; line-height: 1.3; color: #444;" class="mt-1">
              P no 9 K P Colony Mariamman<br>Kovil Street, Madurai - 625009<br>
              Ph: 6381659782
            </div>
          </div>

          <div class="divider-dashed mb-2"></div>

          <!-- Customer & Invoice details -->
          <div style="font-size: 0.72rem; line-height: 1.4;" class="mb-2">
            <div class="d-flex justify-content-between mb-1">
              <span><strong>Invoice Ref:</strong></span>
              <span>
                {{ invoice().invoice_number }}
                <span class="badge text-white ms-1" 
                      [class.bg-warning]="invoice().status === 'Generated' || !invoice().status" 
                      [class.bg-success]="invoice().status === 'Sent'"
                      [class.bg-danger]="invoice().status === 'Cancelled'"
                      [class.bg-secondary]="invoice().status === 'Revised'"
                      [class.bg-info]="invoice().status === 'Superseded'"
                      style="font-size: 0.62rem; padding: 2px 5px;">
                  {{ invoice().status || 'Generated' }}
                </span>
              </span>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span><strong>Date:</strong></span>
              <span>{{ invoice().sale_date }}</span>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span><strong>Customer:</strong></span>
              <span class="fw-bold">{{ invoice().customer_name }}</span>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span><strong>Mobile:</strong></span>
              <span>{{ invoice().customer_mobile }}</span>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span><strong>Payment Status:</strong></span>
              <span>
                <span class="badge text-white" 
                      [class.bg-warning]="invoice().payment_status === 'Pending' || !invoice().payment_status" 
                      [class.bg-success]="invoice().payment_status === 'Paid'"
                      style="font-size: 0.62rem; padding: 2px 5px;">
                  {{ invoice().payment_status || 'Pending' }}
                </span>
                <span *ngIf="invoice().payment_status === 'Paid'" class="fw-bold ms-1" style="font-size: 0.65rem;">
                  ({{ invoice().payment_method || 'Cash' }})
                </span>
              </span>
            </div>
          </div>

          <div class="divider-dashed mb-2"></div>

          <!-- Product Table -->
          <table class="thermal-table" style="width: 100%; font-size: 0.72rem; border-collapse: collapse; margin-top: 6px;">
            <thead>
              <tr style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; font-weight: bold;">
                <th style="text-align: left; width: 45%; padding: 4px 0;">Item</th>
                <th style="text-align: center; width: 12%; padding: 4px 0;">Qty</th>
                <th style="text-align: right; width: 20%; padding: 4px 0;">Price</th>
                <th style="text-align: right; width: 23%; padding: 4px 0;">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of invoice().items" style="border-bottom: 1px solid #eee;">
                <td style="text-align: left; padding: 6px 0; vertical-align: top; word-break: break-word; white-space: normal;">
                  <div class="fw-bold" style="line-height: 1.2;">{{ item.product_name }}</div>
                  <div style="font-size: 0.62rem; color: #555; margin-top: 2px;" *ngIf="item.size">Size: {{ item.size }}</div>
                </td>
                <td style="text-align: center; padding: 6px 0; vertical-align: top;">{{ item.quantity }}</td>
                <td style="text-align: right; padding: 6px 0; vertical-align: top;">₹{{ item.rate | number:'1.2-2' }}</td>
                <td style="text-align: right; padding: 6px 0; vertical-align: top; font-weight: bold;">₹{{ item.total | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Bottom Contents (Totals, Barcode, QR Code, Footer) -->
        <div class="thermal-bottom-section">
          <!-- Calculation values -->
          <div style="font-size: 0.72rem; border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px;">
            <div class="d-flex justify-content-between mb-1">
              <span>Subtotal:</span>
              <span>₹{{ invoice().subtotal | number:'1.2-2' }}</span>
            </div>
            <div class="d-flex justify-content-between mb-1 text-danger" *ngIf="invoice().discount > 0">
              <span>Discount:</span>
              <span>-₹{{ invoice().discount | number:'1.2-2' }}</span>
            </div>
            <div class="d-flex justify-content-between mb-1" *ngIf="invoice().gst_amount > 0">
              <span>Taxes (GST):</span>
              <span>₹{{ invoice().gst_amount | number:'1.2-2' }}</span>
            </div>
            <div class="d-flex justify-content-between mb-1" *ngIf="invoice().shipping_charge > 0">
              <span>Shipping:</span>
              <span>₹{{ invoice().shipping_charge | number:'1.2-2' }}</span>
            </div>
            <div class="d-flex justify-content-between fw-bold mt-2 pt-2 border-top border-secondary border-opacity-10 text-success" style="font-size: 0.85rem;">
              <span>Grand Total:</span>
              <span>₹{{ invoice().grand_total | number:'1.2-2' }}</span>
            </div>
          </div>

          <div class="divider-dashed my-2"></div>

          <!-- Barcode & QR Code Section -->
          <div style="text-align: center; margin-top: 12px; margin-bottom: 8px;">
            <!-- Dynamic Barcode representing Invoice Ref -->
            <div class="mb-2 style-barcode-wrap" style="display: flex; justify-content: center;">
              <img [src]="'https://bwipjs-api.metafloor.com/?bcid=code128&text=' + encodeURIComponent(invoice().invoice_number) + '&scale=2&height=10&includetext'" 
                   alt="Barcode" 
                   style="max-width: 100%; height: 35px; object-fit: contain;">
            </div>
            
            <!-- UPI QR Code for pending payment -->
            <div class="mt-2" *ngIf="invoice().payment_status === 'Pending' || !invoice().payment_status">
              <div style="font-size: 0.6rem; font-weight: bold; color: #555; margin-bottom: 4px; text-transform: uppercase;">Scan to Pay via UPI</div>
              <img [src]="'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=' + getUpiUrl()" 
                   alt="UPI QR Code" 
                   style="width: 100px; height: 100px; object-fit: contain; border: 1px solid #ddd; padding: 4px; border-radius: 4px; background: #fff; margin: 0 auto; display: block;">
              <div style="font-size: 0.55rem; color: #666; margin-top: 4px;">Merchant: KP Colony | Ph: 6381659782</div>
            </div>
          </div>

          <div class="text-center text-muted" style="font-size: 0.7rem; line-height: 1.3; margin-top: 8px;">
            * THANK YOU *<br>
            Visit us again!
          </div>
        </div>
      </div>

      <!-- Confirm Payment Modal -->
      <div class="modal fade" id="paymentModal" tabindex="-1" aria-hidden="true" [class.show]="showPaymentModal()" [style.display]="showPaymentModal() ? 'block' : 'none'" style="background-color: rgba(0,0,0,0.5); z-index: 1050;">
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; background-color: var(--bg-sidebar);">
            <div class="modal-header bg-light-subtle py-3 border-bottom-0">
              <h6 class="modal-title fw-bold text-main"><i class="fas fa-wallet text-success me-2"></i>{{ invoice()?.payment_status === 'Paid' ? 'Edit Payment Info' : 'Confirm Payment' }}</h6>
              <button type="button" class="btn-close" (click)="closePaymentModal()"></button>
            </div>
            <div class="modal-body p-4 text-main">
              <p class="small text-muted mb-3" *ngIf="invoice()">
                Invoice <strong>{{ invoice().invoice_number }}</strong> grand total: <strong>₹{{ invoice().grand_total | number:'1.2-2' }}</strong>.
              </p>
              
              <!-- Payment Status Select (Only for Owner/Admin) -->
              <div class="mb-3" *ngIf="auth.currentUser()?.role === 'Owner' || auth.currentUser()?.role === 'Admin'">
                <label class="form-label small fw-semibold text-muted">Payment Status</label>
                <select class="form-select form-select-sm" [(ngModel)]="newPaymentStatus">
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div class="mb-3" *ngIf="newPaymentStatus === 'Paid'">
                <label class="form-label small fw-semibold text-muted">Payment Method</label>
                <select class="form-select form-select-sm" [(ngModel)]="paymentMethod">
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Online">Online</option>
                </select>
              </div>
            </div>
            <div class="modal-footer bg-light-subtle border-top-0 py-3">
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="closePaymentModal()">Cancel</button>
              <button type="button" class="btn btn-success btn-sm fw-bold" [disabled]="updatingPayment()" (click)="confirmPayment()">
                <span class="spinner-border spinner-border-sm me-1" *ngIf="updatingPayment()"></span>
                {{ newPaymentStatus === 'Paid' ? 'Confirm Payment' : 'Update Status' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .printable-invoice-container {
      background: transparent;
    }
    
    .divider-dashed {
      border-top: 1px dashed var(--text-light);
      height: 0;
      width: 100%;
    }
    .divider-light {
      border-top: 1px solid var(--border-color);
      height: 0;
      width: 100%;
    }
    
    .thermal-receipt-card {
      width: 80mm;
      height: auto;
      box-sizing: border-box !important;
      margin: 0 auto;
      background: #ffffff !important;
      color: #000000 !important;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border-radius: 8px;
      font-family: 'Courier New', Courier, monospace;
    }

    .thermal-receipt-card * {
      color: #000000 !important;
    }
    
    .thermal-top-section {
      display: block;
    }

    .thermal-bottom-section {
      display: block;
    }

    .thermal-table th {
      border-top: 1px dashed #000000 !important;
      border-bottom: 1px dashed #000000 !important;
      color: #000000 !important;
    }

    .thermal-table td {
      border-bottom: 1px solid #eeeeee !important;
      color: #000000 !important;
    }
    
    body.dark-mode .thermal-receipt-card {
      background: #ffffff !important;
      color: #000000 !important;
    }

    @media print {
      body {
        background: #ffffff !important;
        color: #000000 !important;
      }
      .no-print, nav, #sidebar-wrapper {
        display: none !important;
      }
      #page-content-wrapper {
        width: 100% !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
      .printable-invoice-container {
        margin: 0 !important;
        max-width: 100% !important;
      }
      .glass-card {
        box-shadow: none !important;
        border: none !important;
        background: #ffffff !important;
        padding: 0 !important;
      }
      .thermal-receipt-card {
        box-shadow: none !important;
        margin: 0 !important;
        width: 80mm !important;
        height: auto !important;
        min-height: 0 !important;
        padding: 0 !important;
      }
    }
  `]
})
export class InvoiceViewComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  invoice = signal<any | null>(null);
  showThermal = signal<boolean>(false);
  audits = signal<any[]>([]);
  revisedBy = signal<any | null>(null);
  revisionOf = signal<any | null>(null);

  // Payment confirmation modal state
  showPaymentModal = signal<boolean>(false);
  paymentMethod = 'Cash';
  newPaymentStatus = 'Paid';
  updatingPayment = signal<boolean>(false);
  downloadingPDF = signal<boolean>(false);

  isAdminOrOwner(): boolean {
    const user = this.auth.currentUser();
    return !!(user && (user.role === 'Owner' || user.role === 'Admin'));
  }

  encodeURIComponent(val: string): string {
    return encodeURIComponent(val);
  }

  getUpiUrl(): string {
    const inv = this.invoice();
    if (!inv) return '';
    const pa = '6381659782@ybl';
    const pn = 'KP Colony';
    const am = Number(inv.grand_total).toFixed(2);
    const tn = inv.invoice_number;
    const upiString = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&tn=${tn}&cu=INR`;
    return encodeURIComponent(upiString);
  }

  parseDetails(detailsStr: string): any {
    try {
      return JSON.parse(detailsStr);
    } catch (e) {
      return null;
    }
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadInvoice(id);
      }
    });
  }

  loadInvoice(id: number) {
    this.api.get(`sales/${id}`).subscribe({
      next: (res) => {
        console.log(res.sale)
        if (res.success) {
          this.invoice.set(res.sale);
          this.loadAudits(id);
        }
      },
      error: (err) => console.error('Failed to load invoice:', err)
    });
  }

  loadAudits(id: number) {
    this.api.get(`sales/${id}/audits`).subscribe({
      next: (res) => {
        if (res.success && res.audits) {
          this.audits.set(res.audits);
          // Find if this invoice was revised (this is the original invoice)
          const revised = res.audits.find((a: any) => a.original_sale_id === Number(id));
          this.revisedBy.set(revised || null);

          // Find if this invoice is a revision of another (this is the new invoice)
          const original = res.audits.find((a: any) => a.sale_id === Number(id));
          this.revisionOf.set(original || null);
        }
      },
      error: (err) => console.error('Failed to load audits:', err)
    });
  }

  onPrintStandard() {
    window.print();
  }

  toggleThermalMode() {
    this.showThermal.update(v => !v);
  }

  shareWhatsApp() {
    if (!this.invoice()) return;

    const invoice = this.invoice();
    const isThermal = this.showThermal();
    const element = document.getElementById(isThermal ? 'printable-thermal' : 'printable-a4');
    if (!element) return;

    let pdfFormat: any = 'a4';
    if (isThermal) {
      const computedHeight = Math.ceil(element.offsetHeight * 0.264583) + 12;
      pdfFormat = [80, Math.max(120, computedHeight)];
    }

    // Standard high-fidelity PDF settings for thermal vs A4
    const opt = {
      margin: isThermal ? 0 : [12, 12, 12, 12],
      filename: `Invoice_${invoice.invoice_number}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2.5, useCORS: true, logging: false },
      jsPDF: {
        unit: 'mm',
        format: pdfFormat,
        orientation: 'portrait'
      }
    };

    const runShare = (html2pdfLib: any) => {
      html2pdfLib().from(element).set(opt).output('blob').then((pdfBlob: Blob) => {
        const file = new File([pdfBlob], `Invoice_${invoice.invoice_number}.pdf`, { type: 'application/pdf' });

        // Check if Web Share API is available for files (typically mobile devices/tablets)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: `Invoice ${invoice.invoice_number}`,
            text: `Here is your invoice for ₹${Number(invoice.grand_total).toFixed(2)}`
          }).catch((err) => console.log('Error sharing:', err));
        } else {
          // Fallback to text summary WhatsApp API (typically desktop browsers)
          const grandTotal = Number(invoice.grand_total || 0);
          const billingSummary =
            `*INVOICE: ${invoice.invoice_number}*\n` +
            `Date: ${invoice.sale_date}\n` +
            `Customer: ${invoice.customer_name}\n` +
            `*Grand Total: ₹${grandTotal.toFixed(2)}*\n\n` +
            `Thank you for shopping with us!`;

          const encodedText = encodeURIComponent(billingSummary);
          const mobileNo = String(invoice.customer_mobile || '').replace(/[^0-9]/g, '');
          const whatsappUrl = `https://api.whatsapp.com/send?phone=91${mobileNo}&text=${encodedText}`;
          window.open(whatsappUrl, '_blank');
        }
      });
    };

    // Load html2pdf dynamically from cdn if undefined
    if (typeof (window as any).html2pdf === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => {
        runShare((window as any).html2pdf);
      };
      document.head.appendChild(script);
    } else {
      runShare((window as any).html2pdf);
    }
  }

  downloadPDF() {
    if (!this.invoice() || this.downloadingPDF()) return;

    const isThermal = this.showThermal();
    const element = document.getElementById(isThermal ? 'printable-thermal' : 'printable-a4');
    if (!element) return;

    this.downloadingPDF.set(true);

    let pdfFormat: any = 'a4';
    if (isThermal) {
      const computedHeight = Math.ceil(element.offsetHeight * 0.264583) + 12;
      pdfFormat = [80, Math.max(120, computedHeight)];
    }

    // Standard high-fidelity PDF settings for thermal vs A4
    const opt = {
      margin: isThermal ? 0 : [12, 12, 12, 12],
      filename: `Invoice_${this.invoice().invoice_number}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2.5, useCORS: true, logging: false },
      jsPDF: {
        unit: 'mm',
        format: pdfFormat,
        orientation: 'portrait'
      }
    };

    const runDownload = (html2pdfLib: any) => {
      html2pdfLib().from(element).set(opt).save().then(() => {
        this.downloadingPDF.set(false);
      }).catch((err: any) => {
        console.error('PDF generation failed:', err);
        this.downloadingPDF.set(false);
      });
    };

    // Load html2pdf dynamically from cdn if undefined
    if (typeof (window as any).html2pdf === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => {
        runDownload((window as any).html2pdf);
      };
      script.onerror = () => {
        this.downloadingPDF.set(false);
      };
      document.head.appendChild(script);
    } else {
      runDownload((window as any).html2pdf);
    }
  }

  markAsSent() {
    if (!this.invoice()) return;
    this.api.put(`sales/${this.invoice().id}/status`, { status: 'Sent' }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.loadInvoice(this.invoice().id);
        }
      },
      error: (err: any) => console.error('Failed to update invoice status:', err)
    });
  }

  // Payment confirmation actions
  openPaymentModal() {
    const isAuth = ['Owner', 'Admin'].includes(this.auth.currentUser()?.role || '');
    this.newPaymentStatus = this.invoice().payment_status || 'Pending';
    this.paymentMethod = this.invoice().payment_method || 'Cash';
    if (!isAuth) {
      this.newPaymentStatus = 'Paid';
    }
    this.showPaymentModal.set(true);
  }

  closePaymentModal() {
    this.showPaymentModal.set(false);
  }

  confirmPayment() {
    if (!this.invoice()) return;

    this.updatingPayment.set(true);
    const saleId = this.invoice().id;
    this.api.put(`sales/${saleId}/payment-status`, {
      payment_status: this.newPaymentStatus,
      payment_method: this.newPaymentStatus === 'Paid' ? this.paymentMethod : null
    }).subscribe({
      next: (res) => {
        this.updatingPayment.set(false);
        this.showPaymentModal.set(false);
        this.loadInvoice(saleId);
      },
      error: (err) => {
        this.updatingPayment.set(false);
        console.error('Failed to update payment status:', err);
      }
    });
  }
}
