import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
export interface ToastData {
  message: string;
  type: 'success' | 'error';
}
@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor() { }
   private toastSubject = new Subject<ToastData>();

  toast$ = this.toastSubject.asObservable();

  private lastMessage = '';
  private lastTimestamp = 0;

  show(message: string, type: 'success' | 'error' = 'success') {
    const now = Date.now();
    // Ignore identical message if sent within 2 seconds
    if (message === this.lastMessage && (now - this.lastTimestamp) < 2000) {
      return;
    }
    this.lastMessage = message;
    this.lastTimestamp = now;
    this.toastSubject.next({ message, type });
  }
}
