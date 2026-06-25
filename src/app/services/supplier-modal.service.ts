import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupplierModalService {
  isOpen = signal<boolean>(false);
  supplier = signal<any>(null);
  isDirty = signal<boolean>(false);
  supplierSaved = new Subject<string>();

  openAdd() {
    this.supplier.set(null);
    this.isDirty.set(false);
    this.isOpen.set(true);
  }

  openEdit(supplier: any) {
    this.supplier.set(supplier);
    this.isDirty.set(false);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.isDirty.set(false);
  }
}
