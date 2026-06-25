import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CustomerHistoryModalService {
  isOpen = signal<boolean>(false);
  customerMobile = signal<string | null>(null);

  open(mobile: string) {
    this.customerMobile.set(mobile);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.customerMobile.set(null);
  }
}
