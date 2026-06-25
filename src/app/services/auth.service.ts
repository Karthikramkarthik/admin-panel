import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  
  // Angular signals for reactive state management
  currentUser = signal<any>(null);
  token = signal<string | null>(null);
  isAuthenticated = signal<boolean>(false);
  currentUserPermissions = signal<string[]>([]);
  permissionsLoaded$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {
    this.loadStorage();
  }

  private loadStorage() {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      this.token.set(savedToken);
      this.currentUser.set(JSON.parse(savedUser));
      this.isAuthenticated.set(true);
      this.loadPermissions();
    } else {
      this.permissionsLoaded$.next(true);
    }
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    this.permissionsLoaded$.next(false);
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          
          this.token.set(res.token);
          this.currentUser.set(res.user);
          this.isAuthenticated.set(true);
          this.loadPermissions();
        }
      })
    );
  }

  loadPermissions() {
    if (!this.isAuthenticated()) {
      this.permissionsLoaded$.next(true);
      return;
    }
    this.http.get<any>(`${this.apiUrl}/permissions`).subscribe({
      next: (res) => {
        if (res.success && res.permissions) {
          this.currentUserPermissions.set(res.permissions);
          
          // Update the current user role dynamically if it changed in the database
          const user = this.currentUser();
          if (user && res.role && (user.role !== res.role || user.roleId !== res.roleId)) {
            user.role = res.role;
            user.roleId = res.roleId;
            this.currentUser.set({ ...user });
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
        this.permissionsLoaded$.next(true);
      },
      error: (err) => {
        console.error('Failed to load user permissions:', err);
        this.permissionsLoaded$.next(true);
      }
    });
  }

  hasPermission(module: string, action: string): boolean {
    const user = this.currentUser();
    if (!user) return false;

    // Owner role always has full access
    if (user.role === 'Owner') return true;

    const perms = this.currentUserPermissions();
    if (perms.includes('*')) return true;

    const key = `${module}:${action}`.toLowerCase();
    return perms.some(p => p.toLowerCase() === key);
  }

  changePassword(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, data);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    this.token.set(null);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.currentUserPermissions.set([]);
    this.permissionsLoaded$.next(false);
    
    this.router.navigate(['/auth/login']);
  }
}
