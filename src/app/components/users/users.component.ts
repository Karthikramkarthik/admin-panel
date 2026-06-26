import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { UnsavedChangesService } from '../../services/unsaved-changes.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { LoaderComponent } from '../loader/loader.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, LoaderComponent],
  template: `
    <div class="animate-fade-in h-100">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold m-0">User Management</h4>
          <p class="text-muted m-0">Administer backend user accounts, credentials, and roles</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()" *appHasPermission="['Users', 'Create']">
          <i class="fas fa-user-plus me-2"></i>Add User
        </button>
      </div>

      <!-- Messages -->
      <div class="alert alert-danger border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
        <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
      </div>
      
      <div class="alert alert-success border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="successMessage()">
        <i class="fas fa-check-circle me-2"></i>{{ successMessage() }}
      </div>

      <!-- Users Grid/Table -->
      <div class="card glass-card border-0 shadow-sm overflow-hidden position-relative" style="min-height: 200px;">
        <div class="table-responsive">
          <table class="custom-table m-0">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Created Date</th>
                <th class="text-end" style="min-width: 100px;">Actions</th>
              </tr>
            </thead>
            <tbody *ngIf="users().length > 0">
              <tr *ngFor="let usr of users()">
                <td class="fw-bold text-main d-flex align-items-center gap-2">
                  <div class="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold" style="width: 32px; height: 32px; font-size: 0.85rem;">
                    {{ usr.username.charAt(0).toUpperCase() }}
                  </div>
                  {{ usr.username }}
                  <span class="badge bg-light text-muted border border-light-subtle" *ngIf="usr.id === authService.currentUser()?.id">You</span>
                </td>
                <td>{{ usr.email }}</td>
                <td>
                  <span class="badge" [ngClass]="getRoleBadgeClass(usr.role_name)">
                    {{ usr.role_name || 'No Role Assigned' }}
                  </span>
                </td>
                <td class="small text-muted">{{ usr.created_at | date:'mediumDate' }}</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-2" (click)="openEditModal(usr)" *appHasPermission="['Users', 'Edit']">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" [disabled]="usr.id === authService.currentUser()?.id" (click)="deleteUser(usr)" *appHasPermission="['Users', 'Delete']">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <app-loader 
          [loading]="tableLoading()" 
          [isEmpty]="!tableLoading() && !errorMessage() && users().length === 0" 
          [error]="errorMessage()" 
          (retry)="loadUsers()"
          emptyMessage="No users found. Click Add User to create one.">
        </app-loader>
      </div>
    </div>

    <!-- Add/Edit User Modal Dialog -->
    <div class="modal fade show" tabindex="-1" style="display: block; background: rgba(0, 0, 0, 0.5);" *ngIf="isModalOpen()">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content glass-card border shadow-lg">
          <div class="modal-header border-bottom-0 pb-0">
            <h5 class="modal-title fw-bold text-main">
              <i class="fas" [class.fa-user-plus]="!editingUser()" [class.fa-user-edit]="!!editingUser()" class="me-2 text-primary"></i>
              {{ editingUser() ? 'Edit User Details' : 'Create User Account' }}
            </h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          <form (ngSubmit)="saveUser()">
            <div class="modal-body py-3">
              <div class="mb-3">
                <label class="form-label small fw-semibold text-muted">Username</label>
                <input type="text" class="form-control" name="usrName" [(ngModel)]="userForm.username" required placeholder="e.g. john_doe">
              </div>
              <div class="mb-3">
                <label class="form-label small fw-semibold text-muted">Email Address</label>
                <input type="email" class="form-control" name="usrEmail" [(ngModel)]="userForm.email" required placeholder="e.g. john@example.com">
              </div>
              <div class="mb-3">
                <label class="form-label small fw-semibold text-muted">Role Assignment</label>
                <select class="form-select" name="usrRole" [(ngModel)]="userForm.roleId" required>
                  <option [value]="null" disabled selected>Select user role...</option>
                  <option *ngFor="let role of roles()" [value]="role.id" [disabled]="role.status !== 'active'">
                    {{ role.name }} {{ role.status === 'inactive' ? '(Inactive)' : '' }}
                  </option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label small fw-semibold text-muted">
                  Password {{ editingUser() ? '(Leave blank to keep current)' : '' }}
                </label>
                <input type="password" class="form-control" name="usrPass" [(ngModel)]="userForm.password" [required]="!editingUser()" placeholder="••••••••">
              </div>
            </div>
            <div class="modal-footer border-top-0 pt-0">
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm px-4" [disabled]="loading()">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loading()"></span>
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-table {
      width: 100%;
      border-collapse: collapse;
    }
    .custom-table th, .custom-table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      text-align: left;
    }
    .custom-table th {
      background-color: var(--bg-primary);
      font-weight: 600;
      color: var(--text-muted);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .custom-table tr:hover {
      background-color: rgba(0, 0, 0, 0.01);
    }
    .dark-mode .custom-table tr:hover {
      background-color: rgba(255, 255, 255, 0.01);
    }
  `]
})
export class UsersComponent implements OnInit {
  private api = inject(ApiService);
  authService = inject(AuthService);
  private unsavedChangesService = inject(UnsavedChangesService);

  users = signal<any[]>([]);
  roles = signal<any[]>([]);

  isModalOpen = signal<boolean>(false);
  editingUser = signal<any | null>(null);
  loading = signal<boolean>(false);
  tableLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  userForm = {
    username: '',
    email: '',
    roleId: null as number | null,
    password: ''
  };

  ngOnInit() {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers() {
    this.tableLoading.set(true);
    this.errorMessage.set(null);
    this.api.get('users')
      .pipe(finalize(() => this.tableLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.users.set(res.users);
          } else {
            this.errorMessage.set(res.message || 'Failed to retrieve user list.');
          }
        },
        error: (err) => {
          console.error('Failed to load user list:', err);
          this.errorMessage.set(err.error?.error || 'Failed to retrieve user list.');
        }
      });
  }

  loadRoles() {
    this.api.get('roles').subscribe({
      next: (res) => {
        if (res.success) {
          this.roles.set(res.roles);
        }
      },
      error: (err) => console.error('Failed to load role list:', err)
    });
  }

  openAddModal() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isModalOpen.set(true);
    this.editingUser.set(null);
    this.userForm = {
      username: '',
      email: '',
      roleId: null,
      password: ''
    };
  }

  openEditModal(usr: any) {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isModalOpen.set(true);
    this.editingUser.set(usr);
    this.userForm = {
      username: usr.username,
      email: usr.email,
      roleId: usr.role_id,
      password: ''
    };
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingUser.set(null);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  saveUser() {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload = {
      username: this.userForm.username,
      email: this.userForm.email,
      role_id: this.userForm.roleId,
      password: this.userForm.password
    };

    const editUsr = this.editingUser();
    if (editUsr && editUsr.id) {
      // Edit User
      this.api.put(`users/${editUsr.id}`, payload).subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success) {
            this.successMessage.set('User updated successfully!');
            this.closeModal();
            this.loadUsers();
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set('Failed to update user: ' + (err.error?.error || err.message));
        }
      });
    } else {
      // Create User
      this.api.post('users', payload).subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success) {
            this.successMessage.set('User created successfully!');
            this.closeModal();
            this.loadUsers();
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set('Failed to create user: ' + (err.error?.error || err.message));
        }
      });
    }
  }

  deleteUser(usr: any) {
    this.unsavedChangesService.confirmAction({
      title: 'Confirm User Deletion',
      message: `Are you sure you want to delete the user account for "${usr.username}"? This action cannot be undone.`,
      confirmBtnText: 'Delete Account',
      type: 'danger'
    }).subscribe(confirmed => {
      if (!confirmed) return;

      this.loading.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      this.api.delete(`users/${usr.id}`).subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success) {
            this.successMessage.set(res.message);
            this.loadUsers();
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set('Failed to delete user: ' + (err.error?.error || err.message));
        }
      });
    });
  }

  getRoleBadgeClass(roleName: string): string {
    switch (roleName) {
      case 'Owner': return 'bg-danger text-white border border-danger-subtle';
      case 'Admin': return 'bg-warning text-dark border border-warning-subtle';
      case 'Manager': return 'bg-primary text-white border border-primary-subtle';
      case 'Staff': return 'bg-info text-white border border-info-subtle';
      case 'Sales': return 'bg-success text-white border border-success-subtle';
      case 'Inventory Manager': return 'bg-indigo text-dark border border-indigo-subtle';
      case 'Viewer': return 'bg-secondary text-white border border-secondary-subtle';
      default: return 'bg-light text-dark border';
    }
  }
}
