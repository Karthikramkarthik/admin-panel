import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoryModalService {
  isOpen = signal<boolean>(false);
  category = signal<any>(null);
  isDirty = signal<boolean>(false);
  categorySaved = new Subject<string>();

  openAdd() {
    this.category.set(null);
    this.isDirty.set(false);
    this.isOpen.set(true);
  }

  openEdit(category: any) {
    this.category.set(category);
    this.isDirty.set(false);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.isDirty.set(false);
  }
}
