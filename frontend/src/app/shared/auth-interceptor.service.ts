import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from './toast.service';


@Injectable({ providedIn: 'root' })
export class AuthInterceptorService {
  private installed = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private toast: ToastService
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.install();
    }
  }

  private install(): void {
    if (this.installed) return;
    this.installed = true;

    const originalFetch = window.fetch.bind(window);
    const self = this;

    window.fetch = async function (...args: Parameters<typeof window.fetch>): Promise<Response> {
      const url = args[0] instanceof Request ? args[0].url : String(args[0]);
      const init = args[1];

      if (url.includes('/api/auth/richiesta-recupero-password')) {
        return originalFetch(...args);
      }

      const response = await originalFetch(...args);


      if (response.status === 401 && self.wasAuthenticated(init) && localStorage.getItem('token')) {
        self.forceLogout(response);
      }

      return response;
    };
  }


  private wasAuthenticated(init?: RequestInit): boolean {
    if (!init || !init.headers) return false;
    const headers = init.headers as any;

    if (headers instanceof Headers) {
      return headers.has('Authorization') || headers.has('authorization');
    }
    if (Array.isArray(headers)) {
      return headers.some(([k]) => k.toLowerCase() === 'authorization');
    }
    if (typeof headers === 'object') {
      return Object.keys(headers).some(k => k.toLowerCase() === 'authorization');
    }
    return false;
  }

  private async forceLogout(response: Response): Promise<void> {

    let message = 'Sessione scaduta. Effettua nuovamente il login.';
    try {
    
      const clone = response.clone();
      const data = await clone.json();
      if (data?.message) message = data.message;
    } catch {
      
    }

    
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    
    if (!sessionStorage.getItem('__loggingOut')) {
      sessionStorage.setItem('__loggingOut', '1');
      this.toast.warning(message);
      this.router.navigate(['/']).finally(() => {
        
        setTimeout(() => sessionStorage.removeItem('__loggingOut'), 1500);
        setTimeout(() => window.location.reload(), 600);
      });
    }
  }
}
