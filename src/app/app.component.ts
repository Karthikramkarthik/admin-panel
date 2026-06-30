import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';
import { AuthService } from './services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'stockmanagement-frontend';
  private auth = inject(AuthService);
  
  private permissionsLoaded = toSignal(this.auth.permissionsLoaded$, { initialValue: false });

  isLoading = computed(() => {
    return this.auth.isAuthenticated() && !this.permissionsLoaded();
  });
}
