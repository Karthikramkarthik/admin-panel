import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomerModalService {
  isOpen = signal<boolean>(false);
  customer = signal<any>(null);
  isDirty = signal<boolean>(false);
  customerSaved = new Subject<string>();

  openAdd() {
    this.customer.set(null);
    this.isDirty.set(false);
    this.isOpen.set(true);
  }

  openEdit(customer: any) {
    this.customer.set(customer);
    this.isDirty.set(false);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.isDirty.set(false);
  }
}
