import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExpenseModalService {
  isOpen = signal<boolean>(false);
  expense = signal<any>(null);
  isDirty = signal<boolean>(false);
  expenseSaved = new Subject<string>();

  openAdd() {
    this.expense.set(null);
    this.isDirty.set(false);
    this.isOpen.set(true);
  }

  openEdit(expense: any) {
    this.expense.set(expense);
    this.isDirty.set(false);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.isDirty.set(false);
  }
}
