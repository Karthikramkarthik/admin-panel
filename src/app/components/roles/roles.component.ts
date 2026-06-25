import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { UnsavedChangesService } from '../../services/unsaved-changes.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <div class="animate-fade-in h-100">
      <!-- Top Navigation Tabs -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold m-0">Security & Roles</h4>
          <p class="text-muted m-0">Configure system roles, granular permissions, and view change logs</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary btn-sm" [class.active]="activeTab() === 'roles'" (click)="activeTab.set('roles')">
            <i class="fas fa-user-shield me-2"></i>Roles
          </button>
          <button class="btn btn-outline-secondary btn-sm" [class.active]="activeTab() === 'audit'" (click)="activeTab.set('audit')">
            <i class="fas fa-history me-2"></i>Audit Logs
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div class="alert alert-danger border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="errorMessage()">
        <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage() }}
      </div>
      
      <div class="alert alert-success border-0 p-3 mb-4 rounded" style="font-size: 0.85rem;" *ngIf="successMessage()">
        <i class="fas fa-check-circle me-2"></i>{{ successMessage() }}
      </div>

      <!-- TAB 1: Roles List & Editor -->
      <div *ngIf="activeTab() === 'roles'">
        <!-- Roles List (Visible when not editing) -->
        <div *ngIf="!isEditing()">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-semibold m-0 text-main">System Roles</h5>
            <button class="btn btn-primary" (click)="startCreateRole()" *appHasPermission="['Settings', 'Create']">
              <i class="fas fa-plus me-2"></i>Create New Role
            </button>
          </div>

          <div class="row g-4">
            <div class="col-md-6 col-lg-4" *ngFor="let role of roles()">
              <div class="card glass-card border-0 shadow-sm h-100 role-card">
                <div class="card-body p-4 d-flex flex-column">
                  <div class="d-flex justify-content-between align-items-start mb-3">
                    <h5 class="fw-bold m-0 text-main">{{ role.name }}</h5>
                    <div class="d-flex gap-1">
                      <span class="badge bg-primary-subtle text-primary border border-primary-subtle" *ngIf="role.is_system">System</span>
                      <span class="badge" [class.bg-success]="role.status === 'active'" [class.bg-secondary]="role.status === 'inactive'">
                        {{ role.status }}
                      </span>
                    </div>
                  </div>
                  
                  <p class="text-muted small flex-grow-1">{{ role.description || 'No description provided.' }}</p>
                  
                  <div class="border-top pt-3 mt-3 d-flex justify-content-between align-items-center">
                    <span class="small text-muted">
                      <i class="fas fa-users me-1 text-primary"></i> {{ role.user_count }} users assigned
                    </span>
                    
                    <div class="d-flex gap-2">
                      <button class="btn btn-xs btn-outline-secondary" title="Clone Role" (click)="openCloneModal(role)" *appHasPermission="['Settings', 'Create']">
                        <i class="fas fa-copy"></i>
                      </button>
                      <button class="btn btn-xs btn-outline-primary" title="Edit Role & Permissions" (click)="startEditRole(role)" *appHasPermission="['Settings', 'Edit']">
                        <i class="fas fa-edit"></i>
                      </button>
                      <ng-container *appHasPermission="['Settings', 'Delete']">
                        <button class="btn btn-xs btn-outline-danger" title="Delete Role" *ngIf="!role.is_system" (click)="deleteRole(role)">
                          <i class="fas fa-trash"></i>
                        </button>
                      </ng-container>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Role Editor (Visible when editing/creating) -->
        <div class="card glass-card border-0 shadow-sm p-4 animate-fade-in" *ngIf="isEditing()">
          <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <h5 class="fw-bold m-0 text-main">{{ editingRole()?.id ? 'Edit Role: ' + editingRole()?.name : 'Create New Role' }}</h5>
            <button class="btn btn-outline-secondary btn-sm" (click)="cancelEditing()">Cancel</button>
          </div>

          <form (ngSubmit)="saveRole()">
            <!-- General Info Section -->
            <div class="row mb-4">
              <div class="col-md-6 mb-3">
                <label class="form-label small fw-bold text-muted text-uppercase">Role Name</label>
                <input type="text" class="form-control" name="roleName" [(ngModel)]="roleForm.name" required [disabled]="!!editingRole()?.is_system">
                <div class="form-text small text-danger" *ngIf="editingRole()?.is_system">System role names are read-only to preserve system operations.</div>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label small fw-bold text-muted text-uppercase">Status</label>
                <div class="form-check form-switch mt-2">
                  <input class="form-check-input" type="checkbox" role="switch" id="roleStatusSwitch" name="roleStatus" 
                         [(ngModel)]="roleForm.isActive" [disabled]="editingRole()?.name === 'Owner' || editingRole()?.name === 'Admin'">
                  <label class="form-check-label small" for="roleStatusSwitch">
                    Role Enabled ({{ roleForm.isActive ? 'Active' : 'Disabled' }})
                  </label>
                </div>
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold text-muted text-uppercase">Description</label>
                <textarea class="form-control" name="roleDesc" rows="2" [(ngModel)]="roleForm.description"></textarea>
              </div>
            </div>

            <!-- Permission Matrix Section -->
            <div class="mb-4">
              <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
                <div>
                  <h6 class="fw-bold m-0 text-main">Permission Authorization Matrix</h6>
                  <p class="text-muted small m-0">Assign access privileges across modules and actions</p>
                </div>
                
                <div class="d-flex gap-2 w-100 w-sm-auto">
                  <input type="text" class="form-control form-control-sm" placeholder="🔍 Search modules..." name="matrixSearch" [(ngModel)]="matrixSearchQuery" style="max-width: 200px;">
                  <button type="button" class="btn btn-xs btn-outline-primary" (click)="toggleAllMatrix(true)">Select All</button>
                  <button type="button" class="btn btn-xs btn-outline-secondary" (click)="toggleAllMatrix(false)">Clear All</button>
                </div>
              </div>

              <div class="table-responsive border rounded glass-card-nested">
                <table class="custom-table m-0">
                  <thead>
                    <tr>
                      <th style="min-width: 200px;">Module</th>
                      <th *ngFor="let act of actions" class="text-center" style="font-size: 0.72rem; min-width: 80px;">
                        {{ act }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let mod of filteredModules()">
                      <td class="d-flex justify-content-between align-items-center py-2">
                        <span class="fw-semibold" style="font-size: 0.85rem;">{{ mod }}</span>
                        <button type="button" class="btn btn-link btn-xs text-primary p-0 text-decoration-none" style="font-size: 0.7rem;" (click)="toggleRow(mod)">
                          Toggle Row
                        </button>
                      </td>
                      <td *ngFor="let act of actions" class="text-center py-2">
                        <input class="form-check-input cursor-pointer" type="checkbox" 
                               [checked]="permissionsGrid[mod][act]" 
                               (change)="togglePermission(mod, act)">
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- User Assignment Section -->
            <div class="card bg-light-subtle border p-4 mb-4" *ngIf="editingRole()?.id">
              <h6 class="fw-bold text-main mb-2">User Assignment</h6>
              <p class="text-muted small mb-3">Assign administrative users to this role in bulk</p>
              
              <div class="row g-2 overflow-y-auto" style="max-height: 200px;">
                <div class="col-sm-6 col-md-4 col-lg-3" *ngFor="let usr of usersList()">
                  <div class="form-check p-2 border rounded rounded-3 bg-white-glass shadow-xs d-flex align-items-center gap-2">
                    <input class="form-check-input ms-0" type="checkbox" [id]="'user_' + usr.id" 
                           [checked]="usr.role_id === editingRole()?.id || assignedUsersSet.has(usr.id)"
                           (change)="toggleUserAssignment(usr.id)">
                    <label class="form-check-label small text-truncate w-100 cursor-pointer" [for]="'user_' + usr.id">
                      <span class="fw-semibold d-block text-truncate">{{ usr.username }}</span>
                      <span class="text-muted text-truncate d-block" style="font-size: 0.7rem;">{{ usr.email }}</span>
                    </label>
                  </div>
                </div>
                <div class="col-12 text-center py-3 text-muted small" *ngIf="usersList().length === 0">
                  No administrative users found to assign.
                </div>
              </div>
            </div>

            <!-- Save Cancel actions -->
            <div class="d-flex justify-content-end gap-2 border-top pt-3">
              <button type="button" class="btn btn-outline-secondary" (click)="cancelEditing()">Cancel</button>
              <button type="submit" class="btn btn-primary px-4" [disabled]="loading()">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loading()"></span>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- TAB 2: Audit Logs -->
      <div *ngIf="activeTab() === 'audit'">
        <div class="card glass-card border-0 shadow-sm overflow-hidden animate-fade-in">
          <div class="card-header bg-transparent border-0 p-3 d-flex justify-content-between align-items-center">
            <h6 class="fw-bold m-0 text-main"><i class="fas fa-list-ul me-2 text-primary"></i>Role Security Audit Trail</h6>
            <button class="btn btn-sm btn-outline-secondary" (click)="loadAuditLogs()">
              <i class="fas fa-sync-alt me-1"></i>Refresh
            </button>
          </div>
          
          <div class="table-responsive">
            <table class="custom-table m-0">
              <thead>
                <tr>
                  <th style="min-width: 150px;">Timestamp</th>
                  <th>Performer</th>
                  <th>Action</th>
                  <th>Target Role</th>
                  <th style="min-width: 320px;">Details</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let log of auditLogs()">
                  <td class="small text-muted">{{ log.created_at | date:'short' }}</td>
                  <td>
                    <span class="fw-semibold text-main">{{ log.performer_username || 'System' }}</span>
                  </td>
                  <td>
                    <span class="badge rounded-pill text-uppercase text-xs" [ngClass]="getLogActionBadge(log.action)">
                      {{ log.action.replace('_', ' ') }}
                    </span>
                  </td>
                  <td class="fw-semibold text-muted">{{ log.role_name || 'N/A' }}</td>
                  <td class="small text-main">{{ log.details }}</td>
                </tr>
                <tr *ngIf="auditLogs().length === 0">
                  <td colspan="5" class="text-center text-muted py-4">No audit logs found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Clone Role Modal Dialog -->
    <div class="modal fade show" tabindex="-1" style="display: block; background: rgba(0, 0, 0, 0.5);" *ngIf="cloneModalRole()">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content glass-card border shadow-lg">
          <div class="modal-header border-bottom-0 pb-0">
            <h5 class="modal-title fw-bold text-main"><i class="fas fa-copy me-2 text-primary"></i>Clone Role</h5>
            <button type="button" class="btn-close" (click)="closeCloneModal()"></button>
          </div>
          <div class="modal-body py-3">
            <p class="text-muted small">Duplicate all permissions from <strong>{{ cloneModalRole()?.name }}</strong> to a new customized role.</p>
            <div class="mb-3">
              <label class="form-label small fw-semibold text-muted">New Role Name</label>
              <input type="text" class="form-control" name="cloneName" [(ngModel)]="cloneForm.name" placeholder="e.g. Lead Assistant">
            </div>
            <div class="mb-3">
              <label class="form-label small fw-semibold text-muted">Description</label>
              <textarea class="form-control" name="cloneDesc" rows="2" [(ngModel)]="cloneForm.description" placeholder="Short description of responsibilities"></textarea>
            </div>
          </div>
          <div class="modal-footer border-top-0 pt-0">
            <button type="button" class="btn btn-outline-secondary btn-sm" (click)="closeCloneModal()">Cancel</button>
            <button type="button" class="btn btn-primary btn-sm px-3" [disabled]="loading() || !cloneForm.name" (click)="submitCloneRole()">
              <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" *ngIf="loading()"></span>
              Clone
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .role-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .role-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md) !important;
    }
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
    .glass-card-nested {
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(10px);
    }
    .dark-mode .glass-card-nested {
      background: rgba(30, 30, 45, 0.5);
    }
    .bg-white-glass {
      background: rgba(255, 255, 255, 0.85);
    }
    .dark-mode .bg-white-glass {
      background: rgba(30, 30, 45, 0.85);
      border-color: rgba(255, 255, 255, 0.05) !important;
    }
    .cursor-pointer {
      cursor: pointer;
    }
    .btn-xs {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      border-radius: 4px;
    }
    .text-xs {
      font-size: 0.65rem;
    }
  `]
})
export class RolesComponent implements OnInit {
  private api = inject(ApiService);
  private unsavedChangesService = inject(UnsavedChangesService);

  activeTab = signal<string>('roles');
  roles = signal<any[]>([]);
  auditLogs = signal<any[]>([]);
  usersList = signal<any[]>([]);

  isEditing = signal<boolean>(false);
  editingRole = signal<any | null>(null);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Form states
  roleForm = {
    name: '',
    description: '',
    isActive: true
  };

  // Matrix variables
  modules = [
    'Dashboard', 'POS', 'Categories', 'Products', 'Suppliers', 'Purchases', 
    'Customers', 'Sales', 'Orders', 'Invoices', 'Reports', 'Expenses', 
    'Assets', 'Coupons', 'File Manager', 'Users', 'Settings'
  ];
  actions = ['View', 'Create', 'Edit', 'Delete', 'Export', 'Approve', 'Restore', 'Manage Settings'];
  permissionsGrid: { [module: string]: { [action: string]: boolean } } = {};
  matrixSearchQuery: string = '';

  // User Assignment states
  assignedUsersSet = new Set<number>();

  // Clone Form states
  cloneModalRole = signal<any | null>(null);
  cloneForm = {
    name: '',
    description: ''
  };

  ngOnInit() {
    this.loadRoles();
    this.loadUsersList();
    this.loadAuditLogs();
    this.initializePermissionsGrid();
  }

  initializePermissionsGrid() {
    this.permissionsGrid = {};
    this.modules.forEach(mod => {
      this.permissionsGrid[mod] = {};
      this.actions.forEach(act => {
        this.permissionsGrid[mod][act] = false;
      });
    });
  }

  loadRoles() {
    this.api.get('roles').subscribe({
      next: (res) => {
        if (res.success) {
          this.roles.set(res.roles);
        }
      },
      error: (err) => console.error('Failed to load roles:', err)
    });
  }

  loadUsersList() {
    this.api.get('users').subscribe({
      next: (res) => {
        if (res.success) {
          this.usersList.set(res.users);
        }
      },
      error: (err) => console.error('Failed to load user list:', err)
    });
  }

  loadAuditLogs() {
    this.api.get('roles/audit-logs').subscribe({
      next: (res) => {
        if (res.success) {
          this.auditLogs.set(res.auditLogs);
        }
      },
      error: (err) => console.error('Failed to load role audit logs:', err)
    });
  }

  filteredModules(): string[] {
    if (!this.matrixSearchQuery.trim()) {
      return this.modules;
    }
    const query = this.matrixSearchQuery.toLowerCase();
    return this.modules.filter(m => m.toLowerCase().includes(query));
  }

  togglePermission(module: string, action: string) {
    if (!this.permissionsGrid[module]) {
      this.permissionsGrid[module] = {};
    }
    this.permissionsGrid[module][action] = !this.permissionsGrid[module][action];
  }

  toggleRow(module: string) {
    const isAnyUnchecked = this.actions.some(act => !this.permissionsGrid[module]?.[act]);
    this.actions.forEach(act => {
      this.permissionsGrid[module][act] = isAnyUnchecked;
    });
  }

  toggleAllMatrix(checked: boolean) {
    this.modules.forEach(mod => {
      this.actions.forEach(act => {
        this.permissionsGrid[mod][act] = checked;
      });
    });
  }

  toggleUserAssignment(userId: number) {
    if (this.assignedUsersSet.has(userId)) {
      this.assignedUsersSet.delete(userId);
    } else {
      this.assignedUsersSet.add(userId);
    }
  }

  startCreateRole() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isEditing.set(true);
    this.editingRole.set(null);
    
    this.roleForm = {
      name: '',
      description: '',
      isActive: true
    };
    this.initializePermissionsGrid();
    this.assignedUsersSet.clear();
  }

  startEditRole(role: any) {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.loading.set(true);

    this.api.get(`roles/${role.id}`).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.isEditing.set(true);
          this.editingRole.set(res.role);
          this.roleForm = {
            name: res.role.name,
            description: res.role.description,
            isActive: res.role.status === 'active'
          };
          
          this.initializePermissionsGrid();
          res.permissions.forEach((p: any) => {
            if (this.permissionsGrid[p.module_name]) {
              this.permissionsGrid[p.module_name][p.action_name] = true;
            }
          });

          this.assignedUsersSet.clear();
          res.users.forEach((u: any) => {
            this.assignedUsersSet.add(u.id);
          });
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set('Failed to fetch role details: ' + (err.error?.error || err.message));
      }
    });
  }

  cancelEditing() {
    this.isEditing.set(false);
    this.editingRole.set(null);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  saveRole() {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Format permissions payload
    const formattedPerms: any[] = [];
    this.modules.forEach(mod => {
      this.actions.forEach(act => {
        if (this.permissionsGrid[mod]?.[act]) {
          formattedPerms.push({ module_name: mod, action_name: act });
        }
      });
    });

    const payload = {
      name: this.roleForm.name,
      description: this.roleForm.description,
      status: this.roleForm.isActive ? 'active' : 'inactive',
      permissions: formattedPerms
    };

    const role = this.editingRole();
    if (role && role.id) {
      // Update existing role
      this.api.put(`roles/${role.id}`, payload).subscribe({
        next: (res) => {
          if (res.success) {
            // Update user assignments
            const userIds = Array.from(this.assignedUsersSet);
            this.api.put(`roles/${role.id}/users`, { userIds }).subscribe({
              next: () => {
                this.successMessage.set('Role and user assignments updated successfully!');
                this.isEditing.set(false);
                this.editingRole.set(null);
                this.loadRoles();
                this.loadUsersList();
                this.loadAuditLogs();
                this.loading.set(false);
              },
              error: (err) => {
                this.loading.set(false);
                this.errorMessage.set('Role details saved, but user assignment failed: ' + (err.error?.error || err.message));
              }
            });
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set('Failed to save role: ' + (err.error?.error || err.message));
        }
      });
    } else {
      // Create new role
      this.api.post('roles', payload).subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success) {
            this.successMessage.set('Role created successfully!');
            this.isEditing.set(false);
            this.loadRoles();
            this.loadAuditLogs();
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set('Failed to create role: ' + (err.error?.error || err.message));
        }
      });
    }
  }

  deleteRole(role: any) {
    this.unsavedChangesService.confirmAction({
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete the role "${role.name}"? Users assigned to this role will lose their role assignment.`,
      confirmBtnText: 'Delete',
      type: 'danger'
    }).subscribe(confirmed => {
      if (!confirmed) return;

      this.loading.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      this.api.delete(`roles/${role.id}`).subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success) {
            this.successMessage.set(res.message);
            this.loadRoles();
            this.loadUsersList();
            this.loadAuditLogs();
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set('Failed to delete role: ' + (err.error?.error || err.message));
        }
      });
    });
  }

  openCloneModal(role: any) {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.cloneModalRole.set(role);
    this.cloneForm = {
      name: `${role.name} Copy`,
      description: `Cloned copy of ${role.name}`
    };
  }

  closeCloneModal() {
    this.cloneModalRole.set(null);
  }

  submitCloneRole() {
    const role = this.cloneModalRole();
    if (!role) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.api.post(`roles/${role.id}/clone`, this.cloneForm).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.closeCloneModal();
        if (res.success) {
          this.successMessage.set('Role cloned successfully!');
          this.loadRoles();
          this.loadAuditLogs();
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set('Failed to clone role: ' + (err.error?.error || err.message));
      }
    });
  }

  getLogActionBadge(action: string): string {
    switch (action) {
      case 'create_role': return 'bg-success-subtle text-success border border-success-subtle';
      case 'update_role': return 'bg-primary-subtle text-primary border border-primary-subtle';
      case 'delete_role': return 'bg-danger-subtle text-danger border border-danger-subtle';
      case 'clone_role': return 'bg-info-subtle text-info border border-info-subtle';
      case 'assign_users': return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      default: return 'bg-light text-dark border';
    }
  }
}
