import { Component, OnInit, OnDestroy, signal, inject, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LoaderService } from '../../services/loader.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { finalize } from 'rxjs';

declare var anychart: any;

@Component({
  selector: 'app-revenue-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="animate-fade-in py-2">
      <!-- Header section -->
      <div class="d-flex justify-content-between align-items-center mb-4 no-print">
        <div>
          <h4 class="fw-extrabold m-0 text-dark tracking-tight">Total Revenue History</h4>
          <p class="text-muted m-0">Gain insights into business cash flow, orders performance, and growth trends.</p>
        </div>
        
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-outline-success btn-sm d-flex align-items-center gap-1.5 px-3 py-2 fw-semibold" (click)="exportCSV()" [disabled]="loading() || history().length === 0">
            <i class="fas fa-file-excel"></i>
            <span>Export CSV</span>
          </button>
          
          <button class="btn btn-outline-danger btn-sm d-flex align-items-center gap-1.5 px-3 py-2 fw-semibold" (click)="exportPDF()" [disabled]="loading() || history().length === 0">
            <i class="fas fa-file-pdf"></i>
            <span>Export PDF</span>
          </button>
          
          <a routerLink="/dashboard" class="btn btn-outline-secondary btn-sm px-3 py-2 fw-semibold">
            <i class="fas fa-arrow-left me-1"></i>Back
          </a>
        </div>
      </div>

      <!-- Filters Panel -->
      <div class="card glass-card border-0 p-3 mb-4 no-print">
        <div class="row g-3 align-items-end">
          <div class="col-md-3 col-sm-6">
            <label class="form-label fw-bold text-muted small">View Interval</label>
            <select class="form-select form-select-sm" [(ngModel)]="filterInterval" (change)="loadData()">
              <option value="daily">Daily Revenue</option>
              <option value="weekly">Weekly Revenue</option>
              <option value="monthly">Monthly Revenue</option>
              <option value="yearly">Yearly Revenue</option>
            </select>
          </div>
          
          <div class="col-md-3 col-sm-6">
            <label class="form-label fw-bold text-muted small">Revenue Source</label>
            <select class="form-select form-select-sm" [(ngModel)]="filterSource" (change)="loadData()">
              <option value="all">All Sources</option>
              <option value="pos">POS Sales (Offline)</option>
              <option value="invoice">Invoices Ledger (Unpaid)</option>
              <option value="website">Website Orders (E-commerce)</option>
            </select>
          </div>

          <div class="col-md-3 col-sm-6">
            <label class="form-label fw-bold text-muted small">Start Date</label>
            <input type="date" class="form-control form-control-sm" [(ngModel)]="filterStartDate" (change)="loadData()">
          </div>

          <div class="col-md-3 col-sm-6">
            <label class="form-label fw-bold text-muted small">End Date</label>
            <input type="date" class="form-control form-control-sm" [(ngModel)]="filterEndDate" (change)="loadData()">
          </div>
        </div>
      </div>

      <div class="alert alert-danger border-0 p-3 mb-4 rounded d-flex justify-content-between align-items-center no-print" style="font-size: 0.85rem;" *ngIf="errorMessage()">
        <div>
          <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
        </div>
        <button class="btn btn-sm btn-danger py-1 px-3" (click)="loadData()">
          <i class="fas fa-sync-alt me-1"></i>Retry
        </button>
      </div>

      <!-- Report Printable Container wrapper -->
      <div id="revenue-history-printable">
        <!-- Summary stats -->
        <div class="row g-3 mb-4">
          <!-- Total Revenue -->
          <div class="col-xl-3 col-md-6 col-6">
            <div class="card glass-card stat-card border-0 p-3 bg-gradient-primary text-white" style="border-left: 4px solid var(--accent-primary) !important;">
              <div class="d-flex align-items-center gap-2 mb-2">
                <div class="stat-icon-wrapper bg-white bg-opacity-20 text-white">
                  <i class="fas fa-chart-line"></i>
                </div>
                <div>
                  <span class="stat-label text-white-50 fw-bold">Total Revenue</span>
                  <h3 class="stat-value m-0 text-white">₹{{ summary().total_revenue | number:'1.2-2' }}</h3>
                </div>
              </div>
            </div>
          </div>

          <!-- Total Profit -->
          <div class="col-xl-3 col-md-6 col-6">
            <div class="card glass-card stat-card border-0 p-3 bg-gradient-success text-white" style="border-left: 4px solid var(--accent-success) !important;">
              <div class="d-flex align-items-center gap-2 mb-2">
                <div class="stat-icon-wrapper bg-white bg-opacity-20 text-white">
                  <i class="fas fa-coins"></i>
                </div>
                <div>
                  <span class="stat-label text-white-50 fw-bold">Est. Profit</span>
                  <h3 class="stat-value m-0 text-white">₹{{ summary().total_profit | number:'1.2-2' }}</h3>
                </div>
              </div>
            </div>
          </div>

          <!-- Orders Count -->
          <div class="col-xl-3 col-md-6 col-6">
            <div class="card glass-card stat-card border-0 p-3" style="border-left: 4px solid #0d6efd !important;">
              <div class="d-flex align-items-center gap-2 mb-2">
                <div class="stat-icon-wrapper bg-primary bg-opacity-10 text-primary">
                  <i class="fas fa-shopping-cart"></i>
                </div>
                <div>
                  <span class="stat-label text-muted fw-bold">Orders Count</span>
                  <h3 class="stat-value m-0 text-primary">{{ summary().total_orders }}</h3>
                </div>
              </div>
            </div>
          </div>

          <!-- Shipping Amount -->
          <div class="col-xl-3 col-md-6 col-6">
            <div class="card glass-card stat-card border-0 p-3" style="border-left: 4px solid #0dcaf0 !important;">
              <div class="d-flex align-items-center gap-2 mb-2">
                <div class="stat-icon-wrapper bg-info bg-opacity-10 text-info">
                  <i class="fas fa-truck"></i>
                </div>
                <div>
                  <span class="stat-label text-muted fw-bold">Shipping Charges</span>
                  <h3 class="stat-value m-0 text-info">₹{{ summary().total_shipping | number:'1.2-2' }}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chart Section -->
        <div class="card glass-card border-0 p-4 mb-4 no-print">
          <h5 class="fw-bold mb-3"><i class="fas fa-chart-area text-purple me-2"></i>Revenue & Profit Growth Trend</h5>
          <div #revenueChartContainer style="height: 340px; width: 100%;">
            <div class="d-flex flex-column align-items-center justify-content-center h-100 text-muted" *ngIf="loading()">
              <div class="spinner-border text-purple mb-2" role="status"></div>
              <span>Preparing chart trend analytics...</span>
            </div>
          </div>
        </div>

        <!-- History Records Table -->
        <div class="card glass-card border-0 p-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-bold m-0"><i class="fas fa-list text-primary me-2"></i>History Ledger Details</h5>
            <span class="badge bg-light text-dark border fw-bold">{{ history().length }} periods found</span>
          </div>

          <div class="table-responsive rounded border">
            <table class="table table-hover table-striped align-middle m-0" style="font-size: 0.88rem;">
              <thead class="table-light text-uppercase fw-bold" style="font-size: 0.75rem; letter-spacing: 0.5px;">
                <tr>
                  <th class="ps-3 py-3">Date Period</th>
                  <th>Source</th>
                  <th class="text-center">Orders</th>
                  <th class="text-end">Shipping Amount</th>
                  <th class="text-end">Revenue Amount</th>
                  <th class="text-end pe-3">Est. Profit</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of history()" class="transition-all">
                  <td class="ps-3 py-3 fw-bold">{{ row.date | date: getDateFormat() }}</td>
                  <td>
                    <span class="badge border" 
                          [class.bg-light-subtle]="row.revenue_source === 'All Sources'"
                          [class.text-dark]="row.revenue_source === 'All Sources'"
                          [class.bg-primary-subtle]="row.revenue_source === 'POS Sales'"
                          [class.text-primary]="row.revenue_source === 'POS Sales'"
                          [class.bg-warning-subtle]="row.revenue_source === 'Invoices'"
                          [class.text-warning]="row.revenue_source === 'Invoices'"
                          [class.bg-success_subtle]="row.revenue_source === 'Website Orders'"
                          [class.text-success]="row.revenue_source === 'Website Orders'">
                      {{ row.revenue_source }}
                    </span>
                  </td>
                  <td class="text-center fw-semibold">{{ row.orders_count }}</td>
                  <td class="text-end text-muted">₹{{ row.shipping_amount | number:'1.2-2' }}</td>
                  <td class="text-end fw-extrabold text-main">₹{{ row.revenue | number:'1.2-2' }}</td>
                  <td class="text-end fw-extrabold text-success pe-3">₹{{ row.profit | number:'1.2-2' }}</td>
                </tr>
                <tr *ngIf="history().length === 0 && !loading()">
                  <td colspan="6" class="text-center text-muted py-5">
                    <i class="fas fa-folder-open fs-2 mb-2 opacity-50"></i>
                    <p class="m-0">No historical revenue data matches the selected parameters.</p>
                  </td>
                </tr>
                <!-- Skeleton Loading Rows -->
                <ng-container *ngIf="loading() && history().length === 0">
                  <tr *ngFor="let skeleton of [1,2,3,4,5]">
                    <td class="ps-3 py-3"><div class="skeleton-loader skeleton-text" style="width: 100px;"></div></td>
                    <td><div class="skeleton-loader skeleton-text" style="width: 80px;"></div></td>
                    <td class="text-center"><div class="skeleton-loader skeleton-text mx-auto" style="width: 30px;"></div></td>
                    <td class="text-end"><div class="skeleton-loader skeleton-text ms-auto" style="width: 60px;"></div></td>
                    <td class="text-end"><div class="skeleton-loader skeleton-text ms-auto" style="width: 80px;"></div></td>
                    <td class="text-end pe-3"><div class="skeleton-loader skeleton-text ms-auto" style="width: 80px;"></div></td>
                  </tr>
                </ng-container>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bg-gradient-primary {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
    }
    .bg-gradient-success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
    }
    .text-purple {
      color: #6f42c1 !important;
    }
    .btn-outline-success {
      border-color: #10b981;
      color: #10b981;
    }
    .btn-outline-success:hover {
      background-color: #10b981;
      color: #fff;
    }
    .bg-success_subtle {
      background-color: rgba(16, 185, 129, 0.08);
      border-color: rgba(16, 185, 129, 0.15) !important;
    }
    .text-success {
      color: #10b981 !important;
    }
    @media print {
      .no-print {
        display: none !important;
      }
      body {
        background: #ffffff !important;
        color: #000000 !important;
      }
      .glass-card {
        box-shadow: none !important;
        border: none !important;
        background: #ffffff !important;
      }
    }
  `]
})
export class RevenueHistoryComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private toastService = inject(ToastService);
  loaderService = inject(LoaderService);
  auth = inject(AuthService);

  @ViewChild('revenueChartContainer') revenueChartContainer!: ElementRef;

  filterInterval = 'daily';
  filterSource = 'all';
  filterStartDate = '';
  filterEndDate = '';

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  history = signal<any[]>([]);
  summary = signal<any>({
    total_orders: 0,
    total_revenue: 0,
    total_shipping: 0,
    total_profit: 0
  });

  chartInstance: any = null;

  ngOnInit() {
    // Default: load stats from last 30 days daily
    const today = new Date();
    const prev30 = new Date();
    prev30.setDate(prev30.getDate() - 30);
    
    this.filterStartDate = prev30.toISOString().slice(0, 10);
    this.filterEndDate = today.toISOString().slice(0, 10);

    this.loadData();
  }

  ngOnDestroy() {
    this.destroyChart();
  }

  destroyChart() {
    if (this.chartInstance) {
      try {
        this.chartInstance.dispose();
      } catch (e) {
        console.error('Error disposing AnyChart instance:', e);
      }
      this.chartInstance = null;
    }
  }

  getDateFormat(): string {
    if (this.filterInterval === 'weekly') return 'dd MMM yyyy';
    if (this.filterInterval === 'monthly') return 'MMM yyyy';
    if (this.filterInterval === 'yearly') return 'yyyy';
    return 'dd MMM yyyy';
  }

  loadData() {
    this.loading.set(true);
    this.errorMessage.set(null);
    const params = {
      interval: this.filterInterval,
      source: this.filterSource,
      startDate: this.filterStartDate,
      endDate: this.filterEndDate
    };

    this.api.get('reports/revenue-history', params)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.history.set(res.history || []);
            this.summary.set(res.summary);
            this.initChart(res.history || []);
          } else {
            this.errorMessage.set(res.message || 'Failed to load revenue history ledger.');
          }
        },
        error: (err) => {
          console.error('Failed to load revenue history:', err);
          this.errorMessage.set(err.error?.error || 'Failed to load revenue history ledger.');
          this.toastService.show(err.error?.error || 'Failed to load revenue history ledger.', 'error');
        }
      });
  }

  lastChartData: any[] = [];

  @HostListener('window:theme-change')
  onThemeChange() {
    if (this.lastChartData && this.lastChartData.length > 0) {
      this.buildChart(this.lastChartData);
    }
  }

  initChart(data: any[]) {
    this.lastChartData = data;
    this.destroyChart();

    if (typeof (window as any).anychart === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.anychart.com/releases/8.11.0/js/anychart-base.min.js';
      script.onload = () => {
        const exportsScript = document.createElement('script');
        exportsScript.src = 'https://cdn.anychart.com/releases/8.11.0/js/anychart-exports.min.js';
        exportsScript.onload = () => {
          this.buildChart(data);
        };
        document.head.appendChild(exportsScript);
      };
      document.head.appendChild(script);
    } else {
      setTimeout(() => this.buildChart(data), 100);
    }
  }

  buildChart(data: any[]) {
    if (!this.revenueChartContainer) return;
    const container = this.revenueChartContainer.nativeElement;
    container.innerHTML = '';

    if (data.length === 0) {
      container.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
          <i class="fas fa-chart-line fs-1 mb-2 opacity-50"></i>
          <span>No historical revenue data matches criteria.</span>
        </div>
      `;
      return;
    }

    const chartData: any[] = [];
    const reversed = [...data].reverse();
    reversed.forEach(row => {
      chartData.push([row.date, row.revenue, row.profit]);
    });

    const isDarkMode = document.body.classList.contains('dark-mode');

    // Create Cartesian chart
    const chart = anychart.area();
    chart.animation(true);
    chart.background().fill('transparent');

    const dataSet = anychart.data.set(chartData);

    const revenueData = dataSet.mapAs({ x: 0, value: 1 });
    const profitData = dataSet.mapAs({ x: 0, value: 2 });

    // Revenue series
    const revenueSeries = chart.area(revenueData);
    revenueSeries.name('Revenue Amount');
    revenueSeries.fill('rgba(99, 102, 241, 0.15)');
    revenueSeries.stroke('2 #6366f1');
    revenueSeries.hovered().stroke('3 #6366f1');

    // Profit series
    const profitSeries = chart.area(profitData);
    profitSeries.name('Estimated Profit');
    profitSeries.fill('rgba(16, 185, 129, 0.15)');
    profitSeries.stroke('2 #10b981');
    profitSeries.hovered().stroke('3 #10b981');

    // Axes and grids
    const textColor = isDarkMode ? '#a5b4fc' : '#475569';
    const gridColor = isDarkMode ? '#312e81' : '#f1f5f9';

    chart.xAxis().labels().fontColor(textColor).fontSize(10);
    chart.yAxis().labels().fontColor(textColor).fontSize(10).format('₹{%Value}');

    chart.xAxis().stroke(isDarkMode ? '#3730a3' : '#cbd5e1');
    chart.yAxis().stroke(isDarkMode ? '#3730a3' : '#cbd5e1');

    chart.xGrid(true).xGrid().stroke(gridColor);
    chart.yGrid(true).yGrid().stroke(gridColor);

    // Legend
    chart.legend().enabled(true).fontColor(textColor).fontSize(11).padding(10);

    // Tooltip settings
    chart.tooltip().useHtml(true).format('<b>{%SeriesName}</b><br/>Value: <b>₹{%Value}</b>');

    chart.container(container);
    chart.draw();

    this.chartInstance = chart;
  }

  exportCSV() {
    const list = this.history();
    if (list.length === 0) return;
    
    let csvContent = 'Date Period,Orders Count,Revenue,Profit,Shipping,Source,Created By\n';
    list.forEach(row => {
      csvContent += `"${row.date}",${row.orders_count},${row.revenue},${row.profit},${row.shipping_amount},"${row.revenue_source}","${row.created_by}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Revenue_History_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toastService.show('CSV report exported successfully!', 'success');
  }

  exportPDF() {
    const element = document.getElementById('revenue-history-printable');
    if (!element) return;
    
    this.toastService.show('Preparing PDF document export...', 'success');
    
    const opt = {
      margin: [12, 12, 12, 12],
      filename: `Revenue_History_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2.2, useCORS: true, logging: false },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      }
    };
    
    const runExport = (html2pdfLib: any) => {
      html2pdfLib().from(element).set(opt).save();
    };

    if (typeof (window as any).html2pdf === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => {
        runExport((window as any).html2pdf);
      };
      document.head.appendChild(script);
    } else {
      runExport((window as any).html2pdf);
    }
  }
}
