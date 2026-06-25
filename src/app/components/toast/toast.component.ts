import { Component } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent {
  toasts: any[] = [];

  constructor(private toastService: ToastService) { }
  ngOnInit() {
    this.toastService.toast$.subscribe((toast) => {
      this.toasts.push(toast);
      console.log(this.toasts, 's')
      setTimeout(() => {
        this.toasts.shift();
      }, 4000);
    });
  }
}
