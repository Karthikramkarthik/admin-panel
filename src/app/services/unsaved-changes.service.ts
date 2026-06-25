import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UnsavedChangesService {
  confirm(): Observable<boolean> {
    const subject = new Subject<boolean>();

    // Create backdrop wrapper
    const wrapper = document.createElement('div');
    wrapper.id = 'unsaved-changes-modal-backdrop';
    wrapper.className = 'modal fade show';
    wrapper.style.display = 'block';
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.width = '100vw';
    wrapper.style.height = '100vh';
    wrapper.style.backgroundColor = 'rgba(15, 23, 42, 0.6)';
    wrapper.style.backdropFilter = 'blur(8px)';
    wrapper.style.setProperty('-webkit-backdrop-filter', 'blur(8px)');
    wrapper.style.zIndex = '99999';
    wrapper.style.opacity = '0';
    wrapper.style.transition = 'opacity 0.2s ease-out';

    // Modal dialog container
    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog modal-dialog-centered';
    dialog.style.maxWidth = '420px';
    dialog.style.transform = 'scale(0.9)';
    dialog.style.transition = 'transform 0.2s ease-out';

    // Modal content
    const content = document.createElement('div');
    content.className = 'modal-content border-0 shadow-lg';
    content.style.borderRadius = '16px';
    content.style.backgroundColor = 'var(--bg-sidebar)';
    content.style.border = '1px solid var(--border-color)';

    // Modal body
    const body = document.createElement('div');
    body.className = 'modal-body p-4 text-center';

    // Warning icon wrapper
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'mb-3 d-inline-flex align-items-center justify-content-center rounded-circle';
    iconWrapper.style.width = '64px';
    iconWrapper.style.height = '64px';
    iconWrapper.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
    iconWrapper.style.color = 'var(--accent-warning)';

    const icon = document.createElement('i');
    icon.className = 'fas fa-exclamation-triangle fa-2x';
    iconWrapper.appendChild(icon);

    // Title
    const titleEl = document.createElement('h4');
    titleEl.className = 'fw-bold mb-2 text-main';
    titleEl.innerText = 'Leave this page?';
    titleEl.style.fontSize = '1.35rem';

    // Message
    const msgEl = document.createElement('p');
    msgEl.className = 'text-muted mb-4 px-2';
    msgEl.style.fontSize = '0.925rem';
    msgEl.style.lineHeight = '1.5';
    msgEl.innerText = 'If you leave, your unsaved changes will be discarded.';

    // Actions button row
    const btnRow = document.createElement('div');
    btnRow.className = 'd-flex gap-3 justify-content-center';

    // Stay button
    const stayBtn = document.createElement('button');
    stayBtn.type = 'button';
    stayBtn.className = 'btn btn-outline-secondary w-50';
    stayBtn.style.borderRadius = '8px';
    stayBtn.style.fontWeight = '550';
    stayBtn.style.padding = '10px';
    stayBtn.style.fontSize = '0.9rem';
    stayBtn.innerText = 'Stay on Page';

    // Leave button
    const leaveBtn = document.createElement('button');
    leaveBtn.type = 'button';
    leaveBtn.className = 'btn btn-danger w-50';
    leaveBtn.style.borderRadius = '8px';
    leaveBtn.style.fontWeight = '550';
    leaveBtn.style.padding = '10px';
    leaveBtn.style.fontSize = '0.9rem';
    leaveBtn.style.backgroundColor = 'var(--accent-danger)';
    leaveBtn.style.borderColor = 'var(--accent-danger)';
    leaveBtn.style.boxShadow = '0 4px 14px 0 rgba(239, 68, 68, 0.3)';
    leaveBtn.innerText = 'Leave Page';

    btnRow.appendChild(stayBtn);
    btnRow.appendChild(leaveBtn);

    body.appendChild(iconWrapper);
    body.appendChild(titleEl);
    body.appendChild(msgEl);
    body.appendChild(btnRow);

    content.appendChild(body);
    dialog.appendChild(content);
    wrapper.appendChild(dialog);

    document.body.appendChild(wrapper);

    // Trigger transitions
    setTimeout(() => {
      wrapper.style.opacity = '1';
      dialog.style.transform = 'scale(1)';
    }, 10);

    const cleanup = () => {
      wrapper.style.opacity = '0';
      dialog.style.transform = 'scale(0.9)';
      setTimeout(() => {
        if (wrapper.parentNode) {
          wrapper.parentNode.removeChild(wrapper);
        }
      }, 200);
    };

    stayBtn.addEventListener('click', () => {
      cleanup();
      subject.next(false);
      subject.complete();
    });

    leaveBtn.addEventListener('click', () => {
      cleanup();
      subject.next(true);
      subject.complete();
    });

    return subject.asObservable();
  }

  alert(message: string, title: string = 'Alert'): Observable<boolean> {
    const subject = new Subject<boolean>();

    // Create backdrop wrapper
    const wrapper = document.createElement('div');
    wrapper.id = 'alert-modal-backdrop';
    wrapper.className = 'modal fade show';
    wrapper.style.display = 'block';
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.width = '100vw';
    wrapper.style.height = '100vh';
    wrapper.style.backgroundColor = 'rgba(15, 23, 42, 0.6)';
    wrapper.style.backdropFilter = 'blur(8px)';
    wrapper.style.setProperty('-webkit-backdrop-filter', 'blur(8px)');
    wrapper.style.zIndex = '99999';
    wrapper.style.opacity = '0';
    wrapper.style.transition = 'opacity 0.2s ease-out';

    // Modal dialog container
    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog modal-dialog-centered';
    dialog.style.maxWidth = '420px';
    dialog.style.transform = 'scale(0.9)';
    dialog.style.transition = 'transform 0.2s ease-out';

    // Modal content
    const content = document.createElement('div');
    content.className = 'modal-content border-0 shadow-lg';
    content.style.borderRadius = '16px';
    content.style.backgroundColor = 'var(--bg-sidebar)';
    content.style.border = '1px solid var(--border-color)';

    // Modal body
    const body = document.createElement('div');
    body.className = 'modal-body p-4 text-center';

    // Warning icon wrapper
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'mb-3 d-inline-flex align-items-center justify-content-center rounded-circle';
    iconWrapper.style.width = '64px';
    iconWrapper.style.height = '64px';
    iconWrapper.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
    iconWrapper.style.color = 'var(--accent-warning)';

    const icon = document.createElement('i');
    icon.className = 'fas fa-exclamation-triangle fa-2x';
    iconWrapper.appendChild(icon);

    // Title
    const titleEl = document.createElement('h4');
    titleEl.className = 'fw-bold mb-2 text-main';
    titleEl.innerText = title;
    titleEl.style.fontSize = '1.35rem';

    // Message
    const msgEl = document.createElement('p');
    msgEl.className = 'text-muted mb-4 px-2';
    msgEl.style.fontSize = '0.925rem';
    msgEl.style.lineHeight = '1.5';
    msgEl.innerText = message;

    // Actions button row
    const btnRow = document.createElement('div');
    btnRow.className = 'd-flex justify-content-center';

    // OK button
    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.className = 'btn btn-primary px-4';
    okBtn.style.borderRadius = '8px';
    okBtn.style.fontWeight = '550';
    okBtn.style.padding = '10px 24px';
    okBtn.style.fontSize = '0.9rem';
    okBtn.innerText = 'OK';

    btnRow.appendChild(okBtn);

    body.appendChild(iconWrapper);
    body.appendChild(titleEl);
    body.appendChild(msgEl);
    body.appendChild(btnRow);

    content.appendChild(body);
    dialog.appendChild(content);
    wrapper.appendChild(dialog);

    document.body.appendChild(wrapper);

    // Trigger transitions
    setTimeout(() => {
      wrapper.style.opacity = '1';
      dialog.style.transform = 'scale(1)';
    }, 10);

    const cleanup = () => {
      wrapper.style.opacity = '0';
      dialog.style.transform = 'scale(0.9)';
      setTimeout(() => {
        if (wrapper.parentNode) {
          wrapper.parentNode.removeChild(wrapper);
        }
      }, 200);
    };

    okBtn.addEventListener('click', () => {
      cleanup();
      subject.next(true);
      subject.complete();
    });

    return subject.asObservable();
  }

  confirmAction(options: {
    message: string;
    title?: string;
    confirmBtnText?: string;
    cancelBtnText?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
  }): Observable<boolean> {
    const subject = new Subject<boolean>();

    const title = options.title || 'Confirm Action';
    const confirmBtnText = options.confirmBtnText || 'Confirm';
    const cancelBtnText = options.cancelBtnText || 'Cancel';
    const type = options.type || 'danger';

    // Create backdrop wrapper
    const wrapper = document.createElement('div');
    wrapper.id = 'confirm-action-modal-backdrop';
    wrapper.className = 'modal fade show';
    wrapper.style.display = 'block';
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.width = '100vw';
    wrapper.style.height = '100vh';
    wrapper.style.backgroundColor = 'rgba(15, 23, 42, 0.6)';
    wrapper.style.backdropFilter = 'blur(8px)';
    wrapper.style.setProperty('-webkit-backdrop-filter', 'blur(8px)');
    wrapper.style.zIndex = '99999';
    wrapper.style.opacity = '0';
    wrapper.style.transition = 'opacity 0.2s ease-out';

    // Modal dialog container
    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog modal-dialog-centered';
    dialog.style.maxWidth = '420px';
    dialog.style.transform = 'scale(0.9)';
    dialog.style.transition = 'transform 0.2s ease-out';

    // Modal content
    const content = document.createElement('div');
    content.className = 'modal-content border-0 shadow-lg';
    content.style.borderRadius = '16px';
    content.style.backgroundColor = 'var(--bg-sidebar)';
    content.style.border = '1px solid var(--border-color)';

    // Modal body
    const body = document.createElement('div');
    body.className = 'modal-body p-4 text-center';

    // Icon configuration
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'mb-3 d-inline-flex align-items-center justify-content-center rounded-circle';
    iconWrapper.style.width = '64px';
    iconWrapper.style.height = '64px';

    const icon = document.createElement('i');
    icon.className = 'fas fa-2x';

    let btnClass = 'btn-primary';
    let btnColor = 'var(--accent-primary)';

    if (type === 'danger') {
      iconWrapper.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
      iconWrapper.style.color = 'var(--accent-danger)';
      icon.className += ' fa-trash-alt';
      btnClass = 'btn-danger';
      btnColor = 'var(--accent-danger)';
    } else if (type === 'warning') {
      iconWrapper.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
      iconWrapper.style.color = 'var(--accent-warning)';
      icon.className += ' fa-exclamation-triangle';
      btnClass = 'btn-warning';
      btnColor = 'var(--accent-warning)';
    } else if (type === 'success') {
      iconWrapper.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
      iconWrapper.style.color = 'var(--accent-success)';
      icon.className += ' fa-check-circle';
      btnClass = 'btn-success';
      btnColor = 'var(--accent-success)';
    } else {
      iconWrapper.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
      iconWrapper.style.color = 'var(--accent-primary)';
      icon.className += ' fa-info-circle';
      btnClass = 'btn-primary';
      btnColor = 'var(--accent-primary)';
    }

    iconWrapper.appendChild(icon);

    // Title
    const titleEl = document.createElement('h4');
    titleEl.className = 'fw-bold mb-2 text-main';
    titleEl.innerText = title;
    titleEl.style.fontSize = '1.35rem';

    // Message
    const msgEl = document.createElement('p');
    msgEl.className = 'text-muted mb-4 px-2';
    msgEl.style.fontSize = '0.925rem';
    msgEl.style.lineHeight = '1.5';
    msgEl.innerText = options.message;

    // Actions button row
    const btnRow = document.createElement('div');
    btnRow.className = 'd-flex gap-3 justify-content-center';

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-outline-secondary w-50';
    cancelBtn.style.borderRadius = '8px';
    cancelBtn.style.fontWeight = '550';
    cancelBtn.style.padding = '10px';
    cancelBtn.style.fontSize = '0.9rem';
    cancelBtn.innerText = cancelBtnText;

    // Confirm button
    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = `btn ${btnClass} w-50`;
    confirmBtn.style.borderRadius = '8px';
    confirmBtn.style.fontWeight = '550';
    confirmBtn.style.padding = '10px';
    confirmBtn.style.fontSize = '0.9rem';
    confirmBtn.style.backgroundColor = btnColor;
    confirmBtn.style.borderColor = btnColor;
    confirmBtn.style.boxShadow = `0 4px 14px 0 ${type === 'danger' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`;
    confirmBtn.innerText = confirmBtnText;

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);

    body.appendChild(iconWrapper);
    body.appendChild(titleEl);
    body.appendChild(msgEl);
    body.appendChild(btnRow);

    content.appendChild(body);
    dialog.appendChild(content);
    wrapper.appendChild(dialog);

    document.body.appendChild(wrapper);

    // Trigger transitions
    setTimeout(() => {
      wrapper.style.opacity = '1';
      dialog.style.transform = 'scale(1)';
    }, 10);

    const cleanup = () => {
      wrapper.style.opacity = '0';
      dialog.style.transform = 'scale(0.9)';
      setTimeout(() => {
        if (wrapper.parentNode) {
          wrapper.parentNode.removeChild(wrapper);
        }
      }, 200);
    };

    cancelBtn.addEventListener('click', () => {
      cleanup();
      subject.next(false);
      subject.complete();
    });

    confirmBtn.addEventListener('click', () => {
      cleanup();
      subject.next(true);
      subject.complete();
    });

    return subject.asObservable();
  }
}
