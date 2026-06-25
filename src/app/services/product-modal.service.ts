import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductModalService {
  isOpen = signal<boolean>(false);
  product = signal<any>(null);
  isDirty = signal<boolean>(false);
  productSaved = new Subject<string>();

  openAdd() {
    this.product.set(null);
    this.isDirty.set(false);
    this.isOpen.set(true);
  }

  openEdit(product: any) {
    this.product.set(product);
    this.isDirty.set(false);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.isDirty.set(false);
  }
}
