import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CouponModalService {
  isOpen = signal<boolean>(false);
  coupon = signal<any>(null);
  isDirty = signal<boolean>(false);
  couponSaved = new Subject<string>();

  openAdd() {
    this.coupon.set(null);
    this.isDirty.set(false);
    this.isOpen.set(true);
  }

  openEdit(coupon: any) {
    this.coupon.set(coupon);
    this.isDirty.set(false);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.isDirty.set(false);
  }
}
