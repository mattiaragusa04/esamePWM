import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from './toast.service';

/**
 * Intercetta tutte le chiamate fetch() dell'app e gestisce le risposte 401.
 *
 * Il backend, quando il server viene riavviato, rifiuta tutti i token
 * emessi prima del riavvio (vedi serverBoot.js + authMiddleware.js).
 * Quando questo accade, l'utente viene sloggato automaticamente, viene
 * mostrato un toast e si torna alla home.
 *
 * Solo le chiamate che includono l'header "Authorization" sono coinvolte
 * nel logout automatico: per le altre (login, register, fetch di prodotti
 * pubblici, ecc.) il 401 viene semplicemente propagato al chiamante e
 * non causa logout.
 *
 * Effetto pratico:
 * - Refresh pagina con server in esecuzione -> token valido -> nessun logout
 * - Riavvio backend -> primo request autenticato risponde 401 -> logout pulito
 */
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

      // Ignora l'interceptor per la richiesta di recupero password
      if (url.includes('/api/auth/richiesta-recupero-password')) {
        return originalFetch(...args);
      }

      const response = await originalFetch(...args);

      // Sloggare solo se:
      // 1. la risposta è 401
      // 2. la richiesta includeva un header Authorization (ovvero era autenticata)
      // 3. l'utente è effettivamente loggato (token in localStorage)
      if (response.status === 401 && self.wasAuthenticated(init) && localStorage.getItem('token')) {
        self.forceLogout(response);
      }

      return response;
    };
  }

  /**
   * Verifica se la richiesta originale includeva un header Authorization.
   * Gestisce sia oggetti Headers che plain object.
   */
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
    // Tenta di leggere il messaggio del server (solo se JSON)
    let message = 'Sessione scaduta. Effettua nuovamente il login.';
    try {
      // Cloniamo per non consumare il body originale
      const clone = response.clone();
      const data = await clone.json();
      if (data?.message) message = data.message;
    } catch {
      // ignora: non era JSON
    }

    // Pulisci lo stato locale
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Avvisa l'utente e riporta alla home (una sola volta)
    if (!sessionStorage.getItem('__loggingOut')) {
      sessionStorage.setItem('__loggingOut', '1');
      this.toast.warning(message);
      this.router.navigate(['/']).finally(() => {
        // Reset del flag dopo un attimo, cosi' eventuali errori futuri sono gestiti
        setTimeout(() => sessionStorage.removeItem('__loggingOut'), 1500);
        // Force reload per assicurarci che lo stato della navbar sia aggiornato
        setTimeout(() => window.location.reload(), 600);
      });
    }
  }
}
