import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private hasView = false;

  private currentModule?: string;
  private currentAction?: string;

  @Input('appHasPermission') set hasPermission(val: [string, string] | string[]) {
    if (val && val.length === 2) {
      this.currentModule = val[0];
      this.currentAction = val[1];
      this.check();
    }
  }

  constructor() {
    // Re-evaluate elements if permissions signals update dynamically
    effect(() => {
      this.authService.currentUserPermissions();
      this.check();
    });
  }

  private check() {
    if (!this.currentModule || !this.currentAction) {
      return;
    }

    const permitted = this.authService.hasPermission(this.currentModule, this.currentAction);

    if (permitted && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!permitted && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
