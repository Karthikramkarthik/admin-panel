import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PurchaseModalService {
  isOpen = signal<boolean>(false);
  mode = signal<'add' | 'edit' | 'view'>('add');
  purchaseId = signal<number | null>(null);
  isDirty = signal<boolean>(false);
  purchaseSaved = new Subject<string>();

  openAdd() {
    this.mode.set('add');
    this.purchaseId.set(null);
    this.isDirty.set(false);
    this.isOpen.set(true);
  }

  openEdit(id: number) {
    this.mode.set('edit');
    this.purchaseId.set(id);
    this.isDirty.set(false);
    this.isOpen.set(true);
  }

  openView(id: number) {
    this.mode.set('view');
    this.purchaseId.set(id);
    this.isDirty.set(false);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.isDirty.set(false);
  }
}
