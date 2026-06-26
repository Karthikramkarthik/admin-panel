import { Injectable, signal } from '@angular/core';
import { ToastService } from './toast.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  isOnline = signal<boolean>(typeof window !== 'undefined' ? window.navigator.onLine : true);
  showRestoredMessage = signal<boolean>(false);
  restored$ = new Subject<void>();
  private lastStatus = typeof window !== 'undefined' ? window.navigator.onLine : true;
  private timeoutId: any;

  constructor(private toastService: ToastService) {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.updateStatus(true));
      window.addEventListener('offline', () => this.updateStatus(false));
    }
  }

  private updateStatus(status: boolean) {
    this.isOnline.set(status);
    if (status && !this.lastStatus) {
      // Transitioned from offline to online!
      this.showRestoredMessage.set(true);
      this.restored$.next();
      this.toastService.show('Internet connection restored. Data is syncing...', 'success');
      
      if (this.timeoutId) clearTimeout(this.timeoutId);
      this.timeoutId = setTimeout(() => {
        this.showRestoredMessage.set(false);
      }, 5000);
    } else if (!status) {
      this.showRestoredMessage.set(false);
      this.toastService.show('No Internet Connection. Please check your network and try again.', 'error');
    }
    this.lastStatus = status;
  }
}
