import { Component, OnInit, OnDestroy, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CustomerHistoryModalService } from '../../services/customer-history-modal.service';
import { ProductPurchaseHistoryModalService } from '../../services/product-purchase-history-modal.service';
import { LoaderService } from '../../services/loader.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { HasPermissionDirective } from '../../directives/has-permission.directive';


declare var Chart: any;

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <div class="animate-fade-in container-fluid py-2">
      <!-- Title & Header section -->
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 no-print">
        <div>
          <h4 class="fw-extrabold m-0 text-dark tracking-tight">Reports & Business Analytics</h4>
          <p class="text-muted m-0">Gain real-time insights into financials, stock levels, suppliers, and price shifts.</p>
        </div>
        
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 px-3 py-2" (click)="printDashboard()">
            <i class="fas fa-print text-muted"></i>
            <span>Print Dashboard</span>
          </button>
          
          <select class="form-select form-select-sm px-3 py-2 fw-semibold border-light shadow-sm" style="width: 120px;" [(ngModel)]="selectedYear" (change)="loadReportData()">
            <option value="2026">Year: 2026</option>
            <option value="2025">Year: 2025</option>
            <option value="2024">Year: 2024</option>
          </select>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <ul class="nav nav-tabs nav-fill mb-4 bg-white p-2 rounded shadow-sm border-0 no-print" role="tablist" style="border-radius: 12px !important;">
        <li class="nav-item" role="presentation">
          <button class="nav-link py-2 fw-bold d-flex align-items-center justify-content-center gap-2 border-0" 
                  [class.active]="activeTab === 'financials'" 
                  (click)="switchTab('financials')" type="button" role="tab">
            <i class="fas fa-chart-line text-primary"></i>Financials
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link py-2 fw-bold d-flex align-items-center justify-content-center gap-2 border-0" 
                  [class.active]="activeTab === 'products'" 
                  (click)="switchTab('products')" type="button" role="tab">
            <i class="fas fa-box-open text-success"></i>Product Performance
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link py-2 fw-bold d-flex align-items-center justify-content-center gap-2 border-0" 
                  [class.active]="activeTab === 'suppliers'" 
                  (click)="switchTab('suppliers')" type="button" role="tab">
            <i class="fas fa-truck text-info"></i>Supplier Analytics
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link py-2 fw-bold d-flex align-items-center justify-content-center gap-2 border-0" 
                  [class.active]="activeTab === 'expenses'" 
                  (click)="switchTab('expenses')" type="button" role="tab">
            <i class="fas fa-wallet text-danger"></i>Expenses Breakdown
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link py-2 fw-bold d-flex align-items-center justify-content-center gap-2 border-0" 
                  [class.active]="activeTab === 'stock'" 
                  (click)="switchTab('stock')" type="button" role="tab">
            <i class="fas fa-warehouse text-secondary"></i>Stock Report
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link py-2 fw-bold d-flex align-items-center justify-content-center gap-2 border-0" 
                  [class.active]="activeTab === 'audit'" 
                  (click)="switchTab('audit')" type="button" role="tab">
            <i class="fas fa-history text-warning"></i>Price Audit Log
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link py-2 fw-bold d-flex align-items-center justify-content-center gap-2 border-0" 
                  [class.active]="activeTab === 'customer-purchases'" 
                  (click)="switchTab('customer-purchases')" type="button" role="tab">
            <i class="fas fa-users" style="color: #8b5cf6 !important;"></i>Customer Purchases
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link py-2 fw-bold d-flex align-items-center justify-content-center gap-2 border-0" 
                  [class.active]="activeTab === 'personal-use'" 
                  (click)="switchTab('personal-use')" type="button" role="tab">
            <i class="fas fa-hand-holding-heart" style="color: #fd7e14 !important;"></i>Personal Use
          </button>
        </li>
      </ul>

      <!-- Error State -->
      <div class="alert alert-danger border-0 p-4 rounded shadow-sm text-center mb-4" *ngIf="errorMessage() && !loaderService.reportsLoading()">
        <i class="fas fa-exclamation-triangle fs-3 text-danger mb-3 d-block"></i>
        <h5 class="fw-bold">Failed to Load Reports</h5>
        <p class="text-muted">{{ errorMessage() }}</p>
        <button class="btn btn-primary btn-sm mt-2 px-4" (click)="loadReportData()">
          <i class="fas fa-sync-alt me-2"></i>Retry Loading
        </button>
      </div>

      <!-- Content Area -->
      <div class="tab-content" *ngIf="!loaderService.reportsLoading() && !errorMessage()">
        
        <!-- Tab 1: Financial Analytics -->
        <div *ngIf="activeTab === 'financials'" class="tab-pane fade show active">
          <!-- Summary Cards Grid -->
          <div class="row g-4 mb-4" *ngIf="totals()">
            <!-- Total Sales -->
            <div class="col-md-3">
              <div class="card glass-card border-0 p-4 shadow-sm" style="border-left: 5px solid #10b981 !important;">
                <span class="text-uppercase text-muted fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Annual Sales (Revenue)</span>
                <h3 class="fw-extrabold text-success mt-2 mb-0">₹{{ totals().sales | number:'1.2-2' }}</h3>
              </div>
            </div>

            <!-- Total Purchases -->
            <div class="col-md-3">
              <div class="card glass-card border-0 p-4 shadow-sm" style="border-left: 5px solid #ef4444 !important;">
                <span class="text-uppercase text-muted fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Annual Purchases</span>
                <h3 class="fw-extrabold text-danger mt-2 mb-0">₹{{ totals().purchases | number:'1.2-2' }}</h3>
              </div>
            </div>

            <!-- Total Expenses -->
            <div class="col-md-3">
              <div class="card glass-card border-0 p-4 shadow-sm" style="border-left: 5px solid #f59e0b !important;">
                <span class="text-uppercase text-muted fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Annual Expenses</span>
                <h3 class="fw-extrabold text-warning mt-2 mb-0">₹{{ totals().expenses | number:'1.2-2' }}</h3>
              </div>
            </div>

            <!-- Net Profit -->
            <div class="col-md-3">
              <div class="card glass-card border-0 p-4 shadow-sm" [style.borderLeft]="totals().netProfit > 0 ? '5px solid #10b981 !important' : '5px solid #ef4444 !important'">
                <span class="text-uppercase text-muted fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Net Profit Summary</span>
                <h3 class="fw-extrabold mt-2 mb-0" [class.text-success]="totals().netProfit > 0" [class.text-danger]="totals().netProfit <= 0">
                  ₹{{ totals().netProfit | number:'1.2-2' }}
                </h3>
              </div>
            </div>
          </div>

          <!-- Payment Collection Row -->
          <div class="row g-4 mb-4" *ngIf="totals()">
            <!-- Total Paid Revenue -->
            <div class="col-md-4">
              <div class="card glass-card border-0 p-4 shadow-sm" style="border-left: 5px solid #10b981 !important;">
                <span class="text-uppercase text-muted fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Total Paid Revenue</span>
                <h3 class="fw-extrabold text-success mt-2 mb-0">₹{{ totals().totalPaidAmount | number:'1.2-2' }}</h3>
                <small class="text-muted d-block mt-1">{{ totals().paidPaymentsCount || 0 }} completed collections</small>
              </div>
            </div>

            <!-- Pending Collection Amount -->
            <div class="col-md-4">
              <div class="card glass-card border-0 p-4 shadow-sm" style="border-left: 5px solid #f59e0b !important;">
                <span class="text-uppercase text-muted fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Pending Collection Amount</span>
                <h3 class="fw-extrabold text-warning mt-2 mb-0">₹{{ totals().totalPendingAmount | number:'1.2-2' }}</h3>
                <small class="text-muted d-block mt-1">{{ totals().pendingPaymentsCount || 0 }} invoices pending</small>
              </div>
            </div>

            <!-- Payment Collection Rate -->
            <div class="col-md-4">
              <div class="card glass-card border-0 p-4 shadow-sm" style="border-left: 5px solid #3b82f6 !important;">
                <span class="text-uppercase text-muted fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Payment Collection Rate</span>
                <h3 class="fw-extrabold text-primary mt-2 mb-0">
                  {{ (totals().sales > 0 ? (totals().totalPaidAmount / totals().sales * 100) : 0) | number:'1.1-1' }}%
                </h3>
                <small class="text-muted d-block mt-1">Ratio of paid revenue to total sales</small>
              </div>
            </div>
          </div>

          <!-- Charts Row -->
          <div class="row g-4 mb-4">
            <div class="col-lg-8">
              <div class="card glass-card border-0 p-4 shadow-sm h-100">
                <h5 class="fw-bold mb-3 text-dark"><i class="fas fa-chart-area text-primary me-2"></i>Revenue vs Profit Trends (Last 12 Months)</h5>
                <div class="chart-container" style="position: relative; height: 320px; width: 100%;">
                  <canvas #financialChartCanvas></canvas>
                </div>
              </div>
            </div>

            <div class="col-lg-4">
              <div class="card glass-card border-0 p-4 shadow-sm h-100">
                <h5 class="fw-bold mb-3 text-dark"><i class="fas fa-balance-scale text-danger me-2"></i>Expense vs Income Comparison</h5>
                <div class="chart-container d-flex flex-column justify-content-center align-items-center" style="position: relative; height: 260px; width: 100%;">
                  <canvas #expenseIncomeCanvas></canvas>
                </div>
                <p class="text-muted small text-center mt-3 mb-0">
                  Compares total <strong>Sales (Income)</strong> against total outgoings <strong>(Purchases + logged general expenses)</strong>.
                </p>
              </div>
            </div>
          </div>

          <!-- Period over Period Table -->
          <div class="card glass-card border-0 shadow-sm mb-4">
            <div class="card-header bg-white border-0 py-2 fw-bold d-flex align-items-center text-dark">
              <i class="fas fa-history text-muted me-2"></i>Period-over-Period Performance Comparison
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0" style="font-size: 0.88rem;">
                <thead>
                  <tr class="table-light text-muted uppercase font-semibold">
                    <th class="ps-4">Period</th>
                    <th>Revenue (Sales)</th>
                    <th>Net Profit</th>
                    <th>Inventory Purchases</th>
                    <th class="pe-4">Logged Expenses</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Daily Comparison -->
                  <tr *ngIf="reportData()?.periodStats">
                    <td class="fw-bold ps-4">Today vs Yesterday</td>
                    <td>
                      <span class="fw-semibold">₹{{ reportData().periodStats.today.revenue | number:'1.2-2' }}</span>
                      <span class="badge rounded-pill ms-2" [ngClass]="getGrowthBadgeClass(reportData().periodStats.growth.dailyRevenue)">
                        {{ getGrowthSign(reportData().periodStats.growth.dailyRevenue) }}{{ reportData().periodStats.growth.dailyRevenue | number:'1.1-1' }}%
                      </span>
                    </td>
                    <td>
                      <span class="fw-bold text-dark">₹{{ reportData().periodStats.today.net_profit | number:'1.2-2' }}</span>
                      <span class="badge rounded-pill ms-2" [ngClass]="getGrowthBadgeClass(reportData().periodStats.growth.dailyProfit)">
                        {{ getGrowthSign(reportData().periodStats.growth.dailyProfit) }}{{ reportData().periodStats.growth.dailyProfit | number:'1.1-1' }}%
                      </span>
                    </td>
                    <td>₹{{ reportData().periodStats.today.purchases | number:'1.2-2' }}</td>
                    <td class="text-danger pe-4">₹{{ reportData().periodStats.today.expenses | number:'1.2-2' }}</td>
                  </tr>

                  <!-- Monthly Comparison -->
                  <tr *ngIf="reportData()?.periodStats">
                    <td class="fw-bold ps-4">This Month vs Last Month</td>
                    <td>
                      <span class="fw-semibold">₹{{ reportData().periodStats.thisMonth.revenue | number:'1.2-2' }}</span>
                      <span class="badge rounded-pill ms-2" [ngClass]="getGrowthBadgeClass(reportData().periodStats.growth.monthlyRevenue)">
                        {{ getGrowthSign(reportData().periodStats.growth.monthlyRevenue) }}{{ reportData().periodStats.growth.monthlyRevenue | number:'1.1-1' }}%
                      </span>
                    </td>
                    <td>
                      <span class="fw-bold text-dark">₹{{ reportData().periodStats.thisMonth.net_profit | number:'1.2-2' }}</span>
                      <span class="badge rounded-pill ms-2" [ngClass]="getGrowthBadgeClass(reportData().periodStats.growth.monthlyProfit)">
                        {{ getGrowthSign(reportData().periodStats.growth.monthlyProfit) }}{{ reportData().periodStats.growth.monthlyProfit | number:'1.1-1' }}%
                      </span>
                    </td>
                    <td>₹{{ reportData().periodStats.thisMonth.purchases | number:'1.2-2' }}</td>
                    <td class="text-danger pe-4">₹{{ reportData().periodStats.thisMonth.expenses | number:'1.2-2' }}</td>
                  </tr>

                  <!-- Yearly Comparison -->
                  <tr *ngIf="reportData()?.periodStats">
                    <td class="fw-bold ps-4">This Year vs Last Year</td>
                    <td>
                      <span class="fw-semibold">₹{{ reportData().periodStats.thisYear.revenue | number:'1.2-2' }}</span>
                      <span class="badge rounded-pill ms-2" [ngClass]="getGrowthBadgeClass(reportData().periodStats.growth.yearlyRevenue)">
                        {{ getGrowthSign(reportData().periodStats.growth.yearlyRevenue) }}{{ reportData().periodStats.growth.yearlyRevenue | number:'1.1-1' }}%
                      </span>
                    </td>
                    <td>
                      <span class="fw-bold text-dark">₹{{ reportData().periodStats.thisYear.net_profit | number:'1.2-2' }}</span>
                      <span class="badge rounded-pill ms-2" [ngClass]="getGrowthBadgeClass(reportData().periodStats.growth.yearlyProfit)">
                        {{ getGrowthSign(reportData().periodStats.growth.yearlyProfit) }}{{ reportData().periodStats.growth.yearlyProfit | number:'1.1-1' }}%
                      </span>
                    </td>
                    <td>₹{{ reportData().periodStats.thisYear.purchases | number:'1.2-2' }}</td>
                    <td class="text-danger pe-4">₹{{ reportData().periodStats.thisYear.expenses | number:'1.2-2' }}</td>
                  </tr>
                  
                  <tr *ngIf="!reportData()?.periodStats">
                    <td colspan="5" class="text-center text-muted py-4">No historical period logs recorded.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab 2: Product Performance -->
        <div *ngIf="activeTab === 'products'" class="tab-pane fade show active animate-fade-in">
          <div class="row g-4">
            <!-- Top Selling -->
            <div class="col-lg-6">
              <div class="card glass-card border-0 p-4 shadow-sm h-100">
                <h5 class="fw-bold mb-3 text-dark"><i class="fas fa-trophy text-warning me-2"></i>Top 10 Selling Products</h5>
                <div class="chart-container mb-4 d-flex justify-content-center align-items-center" style="position: relative; height: 230px; width: 100%;">
                  <canvas #topSellingCanvas></canvas>
                </div>
                
                <!-- <div class="table-responsive">
                  <table class="table table-striped table-sm align-middle" style="font-size: 0.82rem;">
                    <thead>
                      <tr class="table-light">
                        <th>Code</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th class="text-center">Units Sold</th>
                        <th class="text-end">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let prod of reportData()?.topSelling">
                        <td><code>{{ prod.code }}</code></td>
                        <td class="fw-semibold text-dark">{{ prod.name }}</td>
                        <td>{{ prod.category_name || 'General' }}</td>
                        <td class="text-center fw-bold text-success">{{ prod.units_sold }}</td>
                        <td class="text-end fw-bold text-dark">₹{{ prod.total_revenue | number:'1.2-2' }}</td>
                      </tr>
                      <tr *ngIf="!reportData()?.topSelling?.length">
                        <td colspan="5" class="text-center py-2 text-muted">No sales logged yet</td>
                      </tr>
                    </tbody>
                  </table>
                </div> -->
              </div>
            </div>

            <!-- Slow Moving -->
            <div class="col-lg-6">
              <div class="card glass-card border-0 p-4 shadow-sm h-100">
                <h5 class="fw-bold mb-2 text-danger"><i class="fas fa-snowflake me-2"></i>Slow-Moving Inventory (Idle Stock)</h5>
                <div class="alert alert-warning border-0 mb-3 px-3 py-2 text-warning d-flex align-items-center gap-2" style="font-size: 0.8rem; background: rgba(245, 158, 11, 0.08); border-radius: 8px;">
                  <i class="fas fa-exclamation-circle text-warning fs-5"></i>
                  <span>Active products with low sales volumes but high current stock. Focus marketing efforts here to free up locked capital!</span>
                </div>
                
                <div class="table-responsive">
                  <table class="table table-striped table-sm align-middle" style="font-size: 0.82rem;">
                    <thead>
                      <tr class="table-light">
                        <th>Product</th>
                        <th class="text-center">Stock</th>
                        <th>Price</th>
                        <th class="text-end text-danger">Locked Capital</th>
                        <th class="text-center">Sales</th>
                        <th>Last Sold</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let prod of reportData()?.slowMoving">
                        <td>
                          <span class="fw-bold text-dark" style="font-size: 0.8rem;">{{ prod.name }}</span><br>
                          <small class="text-muted">Code: {{ prod.code }}</small>
                        </td>
                        <td class="text-center fw-bold text-dark">{{ prod.stock_quantity }}</td>
                        <td>₹{{ prod.purchase_price | number:'1.2-2' }}</td>
                        <td class="text-end fw-bold text-danger">₹{{ prod.capital_locked | number:'1.2-2' }}</td>
                        <td class="text-center text-muted">{{ prod.units_sold }} sold</td>
                        <td class="text-muted small">{{ prod.last_sold ? (prod.last_sold | date:'dd MMMM yyyy') : 'Never' }}</td>
                      </tr>
                      <tr *ngIf="!reportData()?.slowMoving?.length">
                        <td colspan="6" class="text-center py-2 text-muted">No slow moving products found</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- All Products Performance List -->
          <div class="card glass-card border-0 shadow-sm mt-4 p-4">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
              <h5 class="fw-bold text-dark m-0"><i class="fas fa-list-ol text-primary me-2"></i>All Products Sales Performance</h5>
              
              <div class="search-box position-relative" style="width: 300px;">
                <i class="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                <input type="text" class="form-control form-control-sm ps-5 py-2 border-light shadow-xs" 
                       placeholder="Filter by name or code..." [(ngModel)]="productSearchQuery">
              </div>
            </div>

            <div class="table-responsive">
              <table class="table table-striped table-hover table-sm align-middle" style="font-size: 0.85rem;">
                <thead>
                  <tr class="table-light">
                    <th>Code</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th class="text-center">Units Sold</th>
                    <th class="text-end">Revenue Collected</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let prod of getFilteredProducts()">
                    <td><code>{{ prod.code }}</code></td>
                    <td  class="fw-semibold text-primary" (click)="openProductHistory(prod)" style="cursor:pointer !important;">{{ prod.name }}</td>
                    <td>{{ prod.category_name || 'General' }}</td>
                    <td class="text-center fw-bold text-success">{{ prod.units_sold || 0 }}</td>
                    <td class="text-end fw-bold text-dark">₹{{ prod.total_revenue | number:'1.2-2' }}</td>
                  </tr>
                  <tr *ngIf="getFilteredProducts().length === 0">
                    <td colspan="5" class="text-center text-muted py-4">No matching product performance metrics found.</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="table-light fw-bold" style="border-top: 2px solid #dee2e6;">
                    <td colspan="3" class="text-end">Total:</td>
                    <td class="text-center text-success">{{ getFilteredProductsUnitsSold() | number }} units</td>
                    <td class="text-end text-dark">₹{{ getFilteredProductsRevenue() | number:'1.2-2' }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab 3: Supplier Analytics -->
        <div *ngIf="activeTab === 'suppliers'" class="tab-pane fade show active animate-fade-in">
          <div class="row g-4">
            <!-- Pie Chart Shares -->
            <div class="col-lg-5">
              <div class="card glass-card border-0 p-4 shadow-sm h-100">
                <h5 class="fw-bold mb-3 text-dark"><i class="fas fa-chart-pie text-info me-2"></i>Purchase Volume Share</h5>
                <div class="chart-container d-flex flex-column justify-content-center align-items-center" style="position: relative; height: 260px; width: 100%;">
                  <canvas #supplierShareCanvas></canvas>
                </div>
                <p class="text-muted small text-center mt-3 mb-0">Visualizes procurement distributions to monitor supplier dependency.</p>
              </div>
            </div>

            <!-- Table -->
            <div class="col-lg-7">
              <div class="card glass-card border-0 p-4 shadow-sm h-100">
                <h5 class="fw-bold mb-3 text-dark"><i class="fas fa-truck-loading text-primary me-2"></i>Supplier Procurement Performance</h5>
                
                <div class="table-responsive">
                  <table class="table table-striped align-middle" style="font-size: 0.85rem;">
                    <thead>
                      <tr class="table-light">
                        <th>Supplier Name</th>
                        <th class="text-center">Total Invoices</th>
                        <th class="text-end">Procured Amount</th>
                        <th class="text-end">Avg. Invoice Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let sup of reportData()?.supplierAnalytics">
                        <td class="fw-bold text-dark">{{ sup.supplier_name }}</td>
                        <td class="text-center fw-semibold text-muted">{{ sup.bills_count }}</td>
                        <td class="text-end fw-bold text-primary">₹{{ sup.total_purchased | number:'1.2-2' }}</td>
                        <td class="text-end text-muted font-monospace">₹{{ sup.avg_invoice | number:'1.2-2' }}</td>
                      </tr>
                      <tr *ngIf="!reportData()?.supplierAnalytics?.length">
                        <td colspan="4" class="text-center py-2 text-muted">No procurement log recorded</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 4: Expenses Breakdown -->
        <div *ngIf="activeTab === 'expenses'" class="tab-pane fade show active animate-fade-in">
          <div class="row g-4">
            <!-- Allocation Chart -->
            <div class="col-lg-5">
              <div class="card glass-card border-0 p-4 shadow-sm h-100">
                <h5 class="fw-bold mb-3 text-dark"><i class="fas fa-chart-pie text-danger me-2"></i>Expense Allocations</h5>
                <div class="chart-container d-flex flex-column justify-content-center align-items-center" style="position: relative; height: 260px; width: 100%;">
                  <canvas #expenseCategoriesCanvas></canvas>
                </div>
              </div>
            </div>

            <!-- Detail Breakdown -->
            <div class="col-lg-7">
              <div class="card glass-card border-0 p-4 shadow-sm h-100">
                <h5 class="fw-bold mb-3 text-dark"><i class="fas fa-wallet text-danger me-2"></i>Expenses Categories Breakdown</h5>
                
                <div class="table-responsive">
                  <table class="table table-striped align-middle" style="font-size: 0.85rem;">
                    <thead>
                      <tr class="table-light">
                        <th>Category Name</th>
                        <th class="text-center">Logged Transactions</th>
                        <th class="text-end">Total Expenses</th>
                        <th class="text-end">Percentage Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let cat of reportData()?.expenseCategories">
                        <td class="fw-bold text-dark">{{ cat.category }}</td>
                        <td class="text-center fw-semibold text-muted">{{ cat.transaction_count }}</td>
                        <td class="text-end fw-bold text-danger">₹{{ cat.total_amount | number:'1.2-2' }}</td>
                        <td class="text-end text-muted fw-bold">{{ getExpenseCategoryShare(cat.total_amount) | number:'1.1-1' }}%</td>
                      </tr>
                      <tr *ngIf="!reportData()?.expenseCategories?.length">
                        <td colspan="4" class="text-center py-2 text-muted">No general expenses recorded</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 5: Stock Report -->
        <div *ngIf="activeTab === 'stock'" class="tab-pane fade show active animate-fade-in">
          <div class="card glass-card border-0 shadow-sm p-4">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
              <div>
                <h5 class="fw-bold text-dark m-0"><i class="fas fa-boxes text-primary me-2"></i>Stock Inventory Levels</h5>
                <p class="text-muted small m-0">Real-time counts, low-stock warnings and active product states.</p>
              </div>
              
              <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-3">
                <div class="form-check form-switch pt-1">
                  <input class="form-check-input" type="checkbox" id="lowStockToggle" [(ngModel)]="showLowStockOnly">
                  <label class="form-check-label fw-semibold text-muted" for="lowStockToggle" style="font-size: 0.85rem; cursor: pointer;">
                    Low Stock Only (&le; 10 units)
                  </label>
                </div>

                <div class="search-box position-relative" style="width: 250px;">
                  <i class="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                  <input type="text" class="form-control form-control-sm ps-5 py-2 border-light shadow-xs" 
                         placeholder="Search stock list..." [(ngModel)]="stockSearchQuery">
                </div>
              </div>
            </div>

            <div class="table-responsive">
              <table class="table table-striped table-hover align-middle mb-0" style="font-size: 0.88rem;">
                <thead>
                  <tr class="table-light text-muted font-semibold">
                    <th class="ps-3">Product Code</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th class="text-center">Initial Stock</th>
                    <th class="text-center">Current Stock</th>
                    <th class="pe-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let prod of getFilteredStock()">
                    <td class="ps-3"><code>{{ prod.code }}</code></td>
                    <td class="fw-bold text-dark">{{ prod.name }}</td>
                    <td>{{ prod.category_name || 'General' }}</td>
                    <td class="text-center fw-semibold text-muted">{{ prod.initial_stock_quantity ?? 0 }}</td>
                    <td class="text-center">
                      <span *ngIf="prod.stock_quantity <= 10" class="text-danger fw-extrabold d-flex align-items-center justify-content-center gap-1">
                        <i class="fas fa-exclamation-triangle small"></i> {{ prod.stock_quantity }} (Low Stock)
                      </span>
                      <span *ngIf="prod.stock_quantity > 10" class="text-success fw-bold">
                        {{ prod.stock_quantity }}
                      </span>
                    </td>
                    <td class="pe-3">
                      <span class="badge bg-success bg-opacity-10 text-success fw-bold" *ngIf="prod.stock_quantity > 0">In Stock</span>
                      <span class="badge bg-danger   fw-bold" *ngIf="prod.stock_quantity <= 0">Out of Stock</span>
                    </td>
                  </tr>
                  <tr *ngIf="getFilteredStock().length === 0">
                    <td colspan="6" class="text-center text-muted py-4">No product stock inventory entries matches the active filters.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab 6: Price Audit Log -->
        <div *ngIf="activeTab === 'audit'" class="tab-pane fade show active animate-fade-in">
          <div class="card glass-card border-0 shadow-sm p-4">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
              <div>
                <h5 class="fw-bold text-dark m-0"><i class="fas fa-history text-warning me-2"></i>Security Price Audit Trail</h5>
                <p class="text-muted small m-0">System audit log of custom price overrides made in checkout and receipts.</p>
              </div>

              <div class="search-box position-relative" style="width: 300px;">
                <i class="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                <input type="text" class="form-control form-control-sm ps-5 py-2 border-light shadow-xs" 
                       placeholder="Filter by product, user, or ref..." [(ngModel)]="auditSearchQuery">
              </div>
            </div>

            <div class="table-responsive">
              <table class="table table-striped table-hover align-middle mb-0" style="font-size: 0.85rem;">
                <thead>
                  <tr class="table-light text-muted font-semibold">
                    <th class="ps-3">Date & Time</th>
                    <th>Edited By</th>
                    <th>Product Details</th>
                    <th>Original Price</th>
                    <th>Overridden Price</th>
                    <th>Price Shift</th>
                    <th>Module</th>
                    <th class="pe-3">Reference Document</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let log of getFilteredAudits()">
                    <td class="ps-3 text-muted">{{ log.created_at | date:'dd MMM yyyy, hh:mm a' }}</td>
                    <td>
                      <span class="badge bg-light text-dark fw-bold border"><i class="fas fa-user-shield me-1 small text-muted"></i>{{ log.username }}</span>
                    </td>
                    <td>
                      <strong class="text-dark">{{ log.product_name }}</strong><br>
                      <small class="text-muted">Code: {{ log.product_code }}</small>
                    </td>
                    <td>₹{{ log.original_price | number:'1.2-2' }}</td>
                    <td class="fw-bold text-primary">₹{{ log.edited_price | number:'1.2-2' }}</td>
                    <td class="fw-bold" [ngClass]="getAuditDiffClass(log.original_price, log.edited_price)">
                      {{ getAuditDiffSign(log.original_price, log.edited_price) }}₹{{ getAuditDiffValue(log.original_price, log.edited_price) | number:'1.2-2' }}
                    </td>
                    <td>
                      <span class="badge bg-success bg-opacity-10 text-success fw-bold" *ngIf="log.transaction_type === 'sale'">
                        <i class="fas fa-arrow-down me-1"></i>POS Sale
                      </span>
                      <span class="badge bg-info bg-opacity-10 text-info fw-bold" *ngIf="log.transaction_type === 'purchase'">
                        <i class="fas fa-arrow-up me-1"></i>Purchase
                      </span>
                    </td>
                    <td class="pe-3 font-monospace">
                      <span class="fw-bold text-muted" style="cursor: default;">
                        <i class="fas" [ngClass]="log.transaction_type === 'sale' ? 'fa-file-invoice-dollar text-success' : 'fa-shopping-cart text-info'"></i> 
                        {{ log.reference_number }}
                      </span>
                    </td>
                  </tr>
                  <tr *ngIf="getFilteredAudits().length === 0">
                    <td colspan="8" class="text-center text-muted py-4">No price overrides audited.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab 7: Customer Purchases Report -->
        <div *ngIf="activeTab === 'customer-purchases'" class="tab-pane fade show active animate-fade-in">
          <!-- Summary Cards Grid -->
          <div class="row g-4 mb-4">
            <!-- Total Customers Purchased -->
            <div class="col-md-6">
              <div class="card glass-card border-0 p-4 shadow-sm" style="border-left: 5px solid #8b5cf6 !important;">
                <span class="text-uppercase text-muted fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Total Customers Purchased</span>
                <h3 class="fw-extrabold mt-2 mb-0" style="color: #8b5cf6 !important;">{{ customerReportSummary.totalCustomers || 0 }}</h3>
              </div>
            </div>

            <!-- Total Revenue from selected product -->
            <div class="col-md-6">
              <div class="card glass-card border-0 p-4 shadow-sm" style="border-left: 5px solid #10b981 !important;">
                <span class="text-uppercase text-muted fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Total Revenue from Product(s)</span>
                <h3 class="fw-extrabold text-success mt-2 mb-0">₹{{ customerReportSummary.totalRevenue | number:'1.2-2' }}</h3>
              </div>
            </div>
          </div>

          <!-- Filters Card -->
          <div class="card glass-card border-0 shadow-sm p-4 mb-4 no-print">
            <h5 class="fw-bold text-dark mb-3"><i class="fas fa-filter text-muted me-2"></i>Report Filters</h5>
            <div class="row g-3">
              <!-- Product Search -->
              <div class="col-md-3">
                <label class="form-label small fw-bold text-muted">Product / Category</label>
                <div class="search-box position-relative">
                  <i class="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                  <input type="text" class="form-control form-control-sm ps-5 py-2" 
                         placeholder="e.g. Jumpsuits, Shirts" [(ngModel)]="customerFilters.product" (input)="onFilterChange()">
                </div>
              </div>

              <!-- Customer Search -->
              <div class="col-md-3">
                <label class="form-label small fw-bold text-muted">Customer Name / Mobile</label>
                <div class="search-box position-relative">
                  <i class="fas fa-user position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                  <input type="text" class="form-control form-control-sm ps-5 py-2" 
                         placeholder="e.g. John Doe, 98765..." [(ngModel)]="customerFilters.customer" (input)="onFilterChange()">
                </div>
              </div>

              <!-- Date Start -->
              <div class="col-md-3">
                <label class="form-label small fw-bold text-muted">From Date</label>
                <input type="date" class="form-control form-control-sm py-2" [(ngModel)]="customerFilters.dateStart" (change)="onFilterChange()">
              </div>

              <!-- Date End -->
              <div class="col-md-3">
                <label class="form-label small fw-bold text-muted">To Date</label>
                <input type="date" class="form-control form-control-sm py-2" [(ngModel)]="customerFilters.dateEnd" (change)="onFilterChange()">
              </div>
            </div>

            <!-- Export Buttons & Reset -->
            <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <button class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2" (click)="resetCustomerFilters()">
                <i class="fas fa-undo"></i> Reset Filters
              </button>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-success d-flex align-items-center gap-2" (click)="exportToExcel()" *appHasPermission="['Reports', 'Export']">
                  <i class="fas fa-file-excel"></i> Export Excel
                </button>
                <button class="btn btn-sm btn-danger d-flex align-items-center gap-2" (click)="exportToPdf()" *appHasPermission="['Reports', 'Export']">
                  <i class="fas fa-file-pdf"></i> Export PDF
                </button>
              </div>
            </div>
          </div>

          <!-- Customer Report Table -->
          <div class="card glass-card border-0 shadow-sm p-4">
            <div class="table-responsive">
              <table id="customerReportTable" class="table table-hover align-middle mb-0" style="font-size: 0.88rem;">
                <thead>
                  <tr class="table-light text-muted uppercase font-semibold">
                    <th class="ps-4">Customer Name</th>
                    <th>Phone Number</th>
                    <th>Email</th>
                    <th class="text-center">Total Orders</th>
                    <th class="text-center">Qty Purchased</th>
                    <th class="text-end">Total Spend</th>
                    <th class="pe-4 text-end">Last Purchase Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let cust of customersList()" (click)="customerHistoryModalService.open(cust.mobile)" style="cursor: pointer;">
                    <td class="fw-bold ps-4 text-primary">
                      {{ cust.customer_name }}
                      <span *ngIf="cust.source === 'Website'" class="badge bg-primary bg-opacity-10 text-primary ms-1" style="font-size: 0.72rem; vertical-align: middle;">Website</span>
                    </td>
                    <td>{{ cust.mobile }}</td>
                    <td>{{ cust.customer_email || 'N/A' }}</td>
                    <td class="text-center">{{ cust.total_orders }}</td>
                    <td class="text-center fw-bold">{{ cust.total_quantity }}</td>
                    <td class="text-end fw-extrabold text-dark">₹{{ cust.total_amount | number:'1.2-2' }}</td>
                    <td class="pe-4 text-end text-muted">{{ cust.last_purchase_date | date:'dd MMM yyyy' }}</td>
                  </tr>
                  <tr *ngIf="customersList().length === 0">
                    <td colspan="7" class="text-center text-muted py-5">
                      <i class="fas fa-users-slash fs-2 mb-2 d-block text-muted"></i>
                      No customers found matching the filters.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination Footer -->
            <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top no-print" *ngIf="customerPagination.totalCustomers > 0">
              <span class="text-muted small">
                Showing {{ (customerPagination.page - 1) * customerPagination.limit + 1 }} to 
                {{ Math.min(customerPagination.page * customerPagination.limit, customerPagination.totalCustomers) }} of 
                {{ customerPagination.totalCustomers }} customers
              </span>
              <div class="d-flex gap-1">
                <button class="btn btn-xs btn-outline-secondary px-2" [disabled]="customerPagination.page === 1" (click)="setCustomerPage(customerPagination.page - 1)">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button class="btn btn-xs" *ngFor="let p of getPagesArray()" 
                        [class.btn-primary]="p === customerPagination.page" 
                        [class.btn-outline-secondary]="p !== customerPagination.page"
                        (click)="setCustomerPage(p)">
                  {{ p }}
                </button>
                <button class="btn btn-xs btn-outline-secondary px-2" [disabled]="customerPagination.page * customerPagination.limit >= customerPagination.totalCustomers" (click)="setCustomerPage(customerPagination.page + 1)">
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 8: Personal Use Report -->
        <div *ngIf="activeTab === 'personal-use'" class="tab-pane fade show active animate-fade-in">
          <div class="card glass-card border-0 shadow-sm p-4">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
              <div>
                <h5 class="fw-bold text-dark m-0"><i class="fas fa-hand-holding-heart text-warning me-2" style="color: #fd7e14 !important;"></i>Personal & Internal Usage Ledger</h5>
                <p class="text-muted small m-0">Inventory stock consumed internally for personal, family, sample, or damage reasons.</p>
              </div>

              <div class="search-box position-relative" style="width: 300px;">
                <i class="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                <input type="text" class="form-control form-control-sm ps-5 py-2 border-light shadow-xs" 
                       placeholder="Filter by product, person, or reason..." [(ngModel)]="personalSearchQuery">
              </div>
            </div>

            <div class="table-responsive">
              <table class="table table-striped table-hover align-middle mb-0" style="font-size: 0.85rem;">
                <thead>
                  <tr class="table-light text-muted font-semibold">
                    <th class="ps-3">Usage Date</th>
                    <th>Product Details</th>
                    <th>Size</th>
                    <th class="text-center">Quantity</th>
                    <th class="text-end">Usage Cost (Value)</th>
                    <th>Used By</th>
                    <th>Reason</th>
                    <th class="pe-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let log of getFilteredPersonalUsage()">
                    <td class="ps-3 text-muted">{{ log.usage_date }}</td>
                    <td>
                      <strong class="text-dark">{{ log.product_name }}</strong><br>
                      <small class="text-muted">Code: {{ log.product_code }}</small>
                    </td>
                    <td><span class="badge bg-light text-dark border">{{ log.size || '-' }}</span></td>
                    <td class="text-center fw-bold text-dark">{{ log.quantity }}</td>
                    <td class="text-end fw-semibold text-danger">₹{{ log.usage_cost | number:'1.2-2' }}</td>
                    <td><span class="badge bg-light text-dark border">{{ log.used_by }}</span></td>
                    <td>
                      <span class="badge bg-warning-subtle text-warning-emphasis" style="font-size: 0.72rem;">
                        {{ log.reason }}
                      </span>
                    </td>
                    <td class="pe-3 text-muted" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" [title]="log.notes || ''">
                      {{ log.notes || '-' }}
                    </td>
                  </tr>
                  <tr *ngIf="getFilteredPersonalUsage().length === 0">
                    <td colspan="8" class="text-center text-muted py-5">
                      <i class="fas fa-hand-holding-heart d-block fs-3 mb-2 opacity-50 text-warning" style="color: #fd7e14 !important;"></i>
                      No personal usage records matched the filters.
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="table-light fw-bold" style="border-top: 2px solid #dee2e6;">
                    <td colspan="3" class="text-end">Total:</td>
                    <td class="text-center">{{ getFilteredPersonalUsageTotalQty() | number }} units</td>
                    <td class="text-end text-danger">₹{{ getFilteredPersonalUsageTotalCost() | number:'1.2-2' }}</td>
                    <td colspan="3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

       <!-- Reports Skeleton Loader -->
      <div class="animate-fade-in" *ngIf="loaderService.reportsLoading()">
        <!-- Cards Skeleton -->
        <div class="row g-4 mb-4">
          <div class="col-md-3" *ngFor="let item of [1,2,3,4]">
            <div class="card glass-card border-0 p-4 shadow-sm" style="min-height: 100px;">
              <div class="skeleton-loader skeleton-text" style="width: 70%;"></div>
              <div class="skeleton-loader skeleton-text" style="width: 45%; height: 24px; margin-top: 8px;"></div>
            </div>
          </div>
        </div>
        <!-- Chart + Pie Skeleton -->
        <div class="row g-4 mb-4">
          <div class="col-lg-8">
            <div class="card glass-card border-0 p-4 shadow-sm" style="height: 380px;">
              <div class="skeleton-loader skeleton-title" style="width: 40%;"></div>
              <div class="skeleton-loader w-100" style="height: 280px;"></div>
            </div>
          </div>
          <div class="col-lg-4">
            <div class="card glass-card border-0 p-4 shadow-sm" style="height: 380px;">
              <div class="skeleton-loader skeleton-title" style="width: 60%;"></div>
              <div class="skeleton-loader skeleton-circle mx-auto" style="width: 200px; height: 200px; margin-top: 20px;"></div>
            </div>
          </div>
        </div>
        <!-- Table Skeleton -->
        <div class="card glass-card border-0 shadow-sm p-4">
          <div class="skeleton-loader skeleton-title" style="width: 30%;"></div>
          <div class="table-responsive">
            <table class="table mb-0">
              <tbody>
                <tr *ngFor="let item of [1,2,3,4]">
                  <td><div class="skeleton-loader skeleton-text" style="width: 150px;"></div></td>
                  <td><div class="skeleton-loader skeleton-text" style="width: 100px;"></div></td>
                  <td><div class="skeleton-loader skeleton-text" style="width: 100px;"></div></td>
                  <td><div class="skeleton-loader skeleton-text" style="width: 80px;"></div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-box input {
      padding-left: 40px !important;
    }
    .nav-tabs .nav-link {
      color: var(--bs-secondary-color);
      border-radius: 8px !important;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 12px;
    }
    .nav-tabs .nav-link:hover {
      background-color: rgba(0, 0, 0, 0.02);
      color: var(--bs-primary);
    }
    .nav-tabs .nav-link.active {
      background-color: var(--bs-primary-bg-subtle, rgba(13, 110, 253, 0.08)) !important;
      color: var(--bs-primary) !important;
    }
    @media print {
      .no-print {
        display: none !important;
      }
      body {
        background-color: white !important;
        padding: 0 !important;
      }
      .card {
        box-shadow: none !important;
        border: 1px solid #dee2e6 !important;
      }
    }
  `]
})
export class ReportsComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  customerHistoryModalService = inject(CustomerHistoryModalService);
  productHistoryModalService = inject(ProductPurchaseHistoryModalService);
  loaderService = inject(LoaderService);
  private route = inject(ActivatedRoute);


  @ViewChild('financialChartCanvas') financialChartCanvas?: ElementRef;
  @ViewChild('expenseIncomeCanvas') expenseIncomeCanvas?: ElementRef;
  @ViewChild('topSellingCanvas') topSellingCanvas?: ElementRef;
  @ViewChild('supplierShareCanvas') supplierShareCanvas?: ElementRef;
  @ViewChild('expenseCategoriesCanvas') expenseCategoriesCanvas?: ElementRef;

  errorMessage = signal<string | null>(null);
  selectedYear = '2026';
  activeTab = 'financials';
  totals = signal<any>(null);
  reportData = signal<any>(null);

  // Search models
  productSearchQuery = '';
  stockSearchQuery = '';
  showLowStockOnly = false;
  auditSearchQuery = '';
  personalSearchQuery = '';

  // Customer Purchases Report Model
  Math = Math;
  customerFilters = {
    product: '',
    customer: '',
    dateStart: '',
    dateEnd: ''
  };
  customersList = signal<any[]>([]);
  customerReportSummary = {
    totalCustomers: 0,
    totalRevenue: 0
  };
  customerPagination = {
    page: 1,
    limit: 10,
    totalCustomers: 0
  };


  // Chart JS instances
  chartInstances: { [key: string]: any } = {};

  private filterSubject = new Subject<void>();
  private filterSubscription?: Subscription;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'];
      }
      this.loadReportData();
    });

    this.filterSubscription = this.filterSubject.pipe(
      debounceTime(300)
    ).subscribe(() => {
      this.loadCustomerReportData();
    });
  }

  ngOnDestroy() {
    this.destroyCharts();
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }
  }

  loadReportData() {
    if (this.activeTab === 'customer-purchases') {
      this.loadCustomerReportData();
      return;
    }
    this.errorMessage.set(null);
    this.api.get('reports', { year: this.selectedYear }).subscribe({
      next: (res) => {
        if (res.success) {
          this.reportData.set(res);
          this.totals.set(res.totals);

          // Render active tab charts after DOM renders
          setTimeout(() => {
            this.renderTabCharts(this.activeTab);
          }, 60);
        } else {
          this.errorMessage.set(res.message || 'Failed to load report data.');
        }
      },
      error: (err) => {
        console.error('Failed to load reports:', err);
        this.errorMessage.set(err.error?.error || 'Failed to load report data.');
      }
    });
  }

  switchTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'customer-purchases') {
      this.loadCustomerReportData();
    } else {
      setTimeout(() => {
        this.renderTabCharts(tab);
      }, 60);
    }
  }

  loadCustomerReportData() {
    this.errorMessage.set(null);
    const params: any = {
      page: this.customerPagination.page.toString(),
      limit: this.customerPagination.limit.toString()
    };
    if (this.customerFilters.product) params.product = this.customerFilters.product;
    if (this.customerFilters.customer) params.customer = this.customerFilters.customer;
    if (this.customerFilters.dateStart) params.dateStart = this.customerFilters.dateStart;
    if (this.customerFilters.dateEnd) params.dateEnd = this.customerFilters.dateEnd;

    this.api.get('reports/customers-by-product', params).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.customersList.set(res.customers || []);
          this.customerReportSummary = res.summary || { totalCustomers: 0, totalRevenue: 0 };
          this.customerPagination.totalCustomers = res.pagination.totalCustomers || 0;
        } else {
          this.errorMessage.set(res.message || 'Failed to load customer purchases report.');
        }
      },
      error: (err) => {
        console.error('Failed to load customer report:', err);
        this.errorMessage.set(err.error?.error || 'Failed to load customer purchases report.');
      }
    });
  }

  onFilterChange() {
    this.customerPagination.page = 1;
    this.filterSubject.next();
  }

  resetCustomerFilters() {
    this.customerFilters = {
      product: '',
      customer: '',
      dateStart: '',
      dateEnd: ''
    };
    this.customerPagination.page = 1;
    this.loadCustomerReportData();
  }

  setCustomerPage(page: number) {
    this.customerPagination.page = page;
    this.loadCustomerReportData();
  }

  getPagesArray(): number[] {
    const totalPages = Math.ceil(this.customerPagination.totalCustomers / this.customerPagination.limit);
    const arr = [];
    for (let i = 1; i <= totalPages; i++) {
      arr.push(i);
    }
    return arr;
  }



  exportToExcel() {
    this.loadExcelLibrary(() => {
      const wsData = this.customersList().map(cust => ({
        'Customer Name': cust.customer_name,
        'Phone Number': cust.mobile,
        'Email Address': cust.customer_email || 'N/A',
        'Total Orders': cust.total_orders,
        'Qty Purchased': cust.total_quantity,
        'Total Spend (₹)': cust.total_amount,
        'Last Purchase Date': cust.last_purchase_date
      }));

      // @ts-ignore
      const XLSX = window.XLSX;
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Customer Purchases');

      const filename = `Customer_Purchases_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
    });
  }

  loadExcelLibrary(callback: () => void) {
    // @ts-ignore
    if (window.XLSX) {
      callback();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.onload = () => callback();
    document.head.appendChild(script);
  }

  exportToPdf() {
    this.loadPdfLibrary(() => {
      // @ts-ignore
      const html2pdf = window.html2pdf;
      const element = document.getElementById('customerReportTable');
      if (!element) return;

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Customer_Purchases_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      const wrapper = document.createElement('div');
      wrapper.style.padding = '20px';
      wrapper.style.fontFamily = 'Inter, sans-serif';

      const header = document.createElement('div');
      header.innerHTML = `
        <h2 style="margin: 0; color: #1e293b;">Customer Purchases Report</h2>
        <p style="margin: 5px 0 20px 0; color: #64748b; font-size: 14px;">
          Product Filter: ${this.customerFilters.product || 'All'} &nbsp;|&nbsp; 
          Date Range: ${this.customerFilters.dateStart || 'Any'} to ${this.customerFilters.dateEnd || 'Any'}
        </p>
        <div style="display: flex; gap: 40px; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px;">
          <div>
            <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold;">Total Customers</span>
            <h3 style="margin: 5px 0 0 0; color: #8b5cf6;">${this.customerReportSummary.totalCustomers}</h3>
          </div>
          <div>
            <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold;">Total Revenue</span>
            <h3 style="margin: 5px 0 0 0; color: #10b981;">₹${this.customerReportSummary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>
      `;
      wrapper.appendChild(header);

      const tableClone = element.cloneNode(true) as HTMLElement;
      wrapper.appendChild(tableClone);

      html2pdf().set(opt).from(wrapper).save();
    });
  }

  loadPdfLibrary(callback: () => void) {
    // @ts-ignore
    if (window.html2pdf) {
      callback();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => callback();
    document.head.appendChild(script);
  }

  destroyCharts() {
    Object.keys(this.chartInstances).forEach((key) => {
      if (this.chartInstances[key]) {
        this.chartInstances[key].destroy();
      }
    });
    this.chartInstances = {};
  }

  renderTabCharts(tabName: string) {
    const data = this.reportData();
    if (!data) return;

    if (tabName === 'financials') {
      this.initChartScript(() => {
        this.buildRevenueProfitChart(data.timeline);
        this.buildExpenseIncomeChart(data.totals);
      });
    } else if (tabName === 'products') {
      this.initChartScript(() => {
        this.buildTopSellingChart(data.topSelling);
      });
    } else if (tabName === 'suppliers') {
      this.initChartScript(() => {
        this.buildSupplierShareChart(data.supplierAnalytics);
      });
    } else if (tabName === 'expenses') {
      this.initChartScript(() => {
        this.buildExpenseCategoriesChart(data.expenseCategories);
      });
    }
  }

  initChartScript(callback: () => void) {
    if (typeof Chart === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = () => callback();
      document.head.appendChild(script);
    } else {
      callback();
    }
  }

  // --- Chart Builders ---

  buildRevenueProfitChart(timeline: any) {
    if (!this.financialChartCanvas) return;

    if (this.chartInstances['financial']) {
      this.chartInstances['financial'].destroy();
    }

    const ctx = this.financialChartCanvas.nativeElement.getContext('2d');
    this.chartInstances['financial'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: timeline.labels,
        datasets: [
          {
            label: 'Sales Revenue (₹)',
            data: timeline.revenue,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.04)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.35
          },
          {
            label: 'Gross Profit (₹)',
            data: timeline.grossProfit,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.04)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.35
          },
          {
            label: 'Net Profit (₹)',
            data: timeline.netProfit,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.04)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.35
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { family: 'Inter', size: 11, weight: '500' } }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: any) => '₹' + value.toLocaleString()
            }
          }
        }
      }
    });
  }

  buildExpenseIncomeChart(totals: any) {
    if (!this.expenseIncomeCanvas) return;

    if (this.chartInstances['expenseIncome']) {
      this.chartInstances['expenseIncome'].destroy();
    }

    const outgoings = parseFloat(totals.purchases) + parseFloat(totals.expenses);

    const ctx = this.expenseIncomeCanvas.nativeElement.getContext('2d');
    this.chartInstances['expenseIncome'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Income (Sales)', 'Outgoings (Procurement + Expenses)'],
        datasets: [{
          data: [totals.sales, outgoings],
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { family: 'Inter', size: 10, weight: '500' } }
          }
        },
        cutout: '65%'
      }
    });
  }

  buildTopSellingChart(topSelling: any[]) {
    if (!this.topSellingCanvas) return;

    if (this.chartInstances['topSelling']) {
      this.chartInstances['topSelling'].destroy();
    }

    const labels = topSelling.map(p => p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name);
    const dataValues = topSelling.map(p => p.units_sold);

    const ctx = this.topSellingCanvas.nativeElement.getContext('2d');
    this.chartInstances['topSelling'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Units Sold',
          data: dataValues,
          backgroundColor: 'rgba(245, 158, 11, 0.85)',
          borderRadius: 6,
          maxBarThickness: 30
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true }
        }
      }
    });
  }

  buildSupplierShareChart(supplierAnalytics: any[]) {
    if (!this.supplierShareCanvas) return;

    if (this.chartInstances['supplierShare']) {
      this.chartInstances['supplierShare'].destroy();
    }

    const labels = supplierAnalytics.map(s => s.supplier_name);
    const dataValues = supplierAnalytics.map(s => s.total_purchased);

    const ctx = this.supplierShareCanvas.nativeElement.getContext('2d');
    this.chartInstances['supplierShare'] = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { font: { family: 'Inter', size: 10 } }
          }
        }
      }
    });
  }

  buildExpenseCategoriesChart(expenseCategories: any[]) {
    if (!this.expenseCategoriesCanvas) return;

    if (this.chartInstances['expenseCategories']) {
      this.chartInstances['expenseCategories'].destroy();
    }

    const labels = expenseCategories.map(c => c.category);
    const dataValues = expenseCategories.map(c => c.total_amount);

    const ctx = this.expenseCategoriesCanvas.nativeElement.getContext('2d');
    this.chartInstances['expenseCategories'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: ['#ef4444', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#6366f1'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { font: { family: 'Inter', size: 10 } }
          }
        },
        cutout: '60%'
      }
    });
  }

  // --- Helpers for formatting and calculations ---

  getGrowthBadgeClass(val: number): string {
    if (!val || val === 0) return 'bg-secondary bg-opacity-15  fw-bold';
    return val > 0 ? 'bg-success bg-opacity-15 fw-bold' : 'bg-danger   fw-bold';
  }

  getGrowthSign(val: number): string {
    return val > 0 ? '+' : '';
  }

  getExpenseCategoryShare(catAmount: number): number {
    const categories = this.reportData()?.expenseCategories || [];
    const total = categories.reduce((sum: number, c: any) => sum + parseFloat(c.total_amount), 0);
    return total > 0 ? (catAmount / total) * 100 : 0;
  }

  // --- Filtering lists ---

  getFilteredProducts(): any[] {
    const products = this.reportData()?.allProductSales || [];
    if (!this.productSearchQuery) return products;

    const query = this.productSearchQuery.toLowerCase();
    return products.filter((p: any) =>
      p.name.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query) ||
      (p.category_name && p.category_name.toLowerCase().includes(query))
    );
  }

  getFilteredProductsUnitsSold(): number {
    return this.getFilteredProducts().reduce((sum, p) => sum + parseInt(p.units_sold || 0), 0);
  }

  getFilteredProductsRevenue(): number {
    return this.getFilteredProducts().reduce((sum, p) => sum + parseFloat(p.total_revenue || 0), 0);
  }

  getFilteredStock(): any[] {
    let stock = this.reportData()?.stockReport || [];

    if (this.showLowStockOnly) {
      stock = stock.filter((p: any) => p.stock_quantity <= 10);
    }

    if (!this.stockSearchQuery) return stock;

    const query = this.stockSearchQuery.toLowerCase();
    return stock.filter((p: any) =>
      p.name.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query) ||
      (p.category_name && p.category_name.toLowerCase().includes(query))
    );
  }

  getFilteredAudits(): any[] {
    const audits = this.reportData()?.priceAudits || [];
    if (!this.auditSearchQuery) return audits;

    const query = this.auditSearchQuery.toLowerCase();
    return audits.filter((log: any) =>
      log.product_name.toLowerCase().includes(query) ||
      log.product_code.toLowerCase().includes(query) ||
      log.username.toLowerCase().includes(query) ||
      log.reference_number.toLowerCase().includes(query)
    );
  }

  getFilteredPersonalUsage(): any[] {
    const usage = this.reportData()?.personalUsage || [];
    if (!this.personalSearchQuery) return usage;

    const query = this.personalSearchQuery.toLowerCase();
    return usage.filter((log: any) =>
      log.product_name.toLowerCase().includes(query) ||
      log.product_code.toLowerCase().includes(query) ||
      log.used_by.toLowerCase().includes(query) ||
      log.reason.toLowerCase().includes(query)
    );
  }

  getFilteredPersonalUsageTotalCost(): number {
    return this.getFilteredPersonalUsage().reduce((sum, log) => sum + parseFloat(log.usage_cost || 0), 0);
  }

  getFilteredPersonalUsageTotalQty(): number {
    return this.getFilteredPersonalUsage().reduce((sum, log) => sum + parseInt(log.quantity || 0), 0);
  }

  // --- Audit Helpers ---

  getAuditDiffValue(original: string, edited: string): number {
    return Math.abs(parseFloat(edited) - parseFloat(original));
  }

  getAuditDiffSign(original: string, edited: string): string {
    const diff = parseFloat(edited) - parseFloat(original);
    if (diff === 0) return '';
    return diff > 0 ? '+' : '-';
  }

  getAuditDiffClass(original: string, edited: string): string {
    const diff = parseFloat(edited) - parseFloat(original);
    if (diff === 0) return 'text-secondary';
    return diff > 0 ? 'text-success' : 'text-danger';
  }

  // --- Print triggered ---
  printDashboard() {
    window.print();
  }

  openProductHistory(prod: any) {

    this.productHistoryModalService.open(prod.id || prod.product_id, prod.name, prod.code);
  }
}
