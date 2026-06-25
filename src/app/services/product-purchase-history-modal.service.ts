import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProductPurchaseHistoryModalService {
  isOpen = signal<boolean>(false);
  productId = signal<number | null>(null);
  productName = signal<string | null>(null);
  productCode = signal<string | null>(null);

  open(productId: number, productName: string, productCode: string) {
    this.productId.set(productId);
    this.productName.set(productName);
    this.productCode.set(productCode);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.productId.set(null);
    this.productName.set(null);
    this.productCode.set(null);
  }
}
