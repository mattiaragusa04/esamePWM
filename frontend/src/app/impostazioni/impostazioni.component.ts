import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { ToastService } from '../shared/toast.service';
import { ThemeService, Theme } from '../shared/theme.service';
@Component({
  selector: 'app-impostazioni',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './impostazioni.component.html',
  styleUrl: './impostazioni.component.css'
})
export class ImpostazioniComponent implements OnInit {
  utente: any = null;

  // Tema
  tema: 'light' | 'dark' = 'light';

  // Notifiche
  notifichePromozioni = true;
  notificheOrdini = true;
  notificheVendite = true;

  // Reset password
  emailResetPassword: string = '';
  isRichiestaResetInCorso = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private toast: ToastService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Utente
    const userString = localStorage.getItem('user');
    if (userString) {
      this.utente = JSON.parse(userString);
    }

    // Tema: legge dal service centralizzato (già applicato all'avvio dell'app)
    this.tema = this.themeService.theme();

    // Notifiche
    const notifPromo = localStorage.getItem('notifPromozioni');
    const notifOrdini = localStorage.getItem('notifOrdini');
    const notifVendite = localStorage.getItem('notifVendite');

    if (notifPromo !== null) {
      this.notifichePromozioni = notifPromo === 'true';
    }
    if (notifOrdini !== null) {
      this.notificheOrdini = notifOrdini === 'true';
    }
    if (notifVendite !== null) {
      this.notificheVendite = notifVendite === 'true';
    }
  }

  // === TEMA ===
  cambiaTema(theme: Theme): void {
    this.tema = theme;
    this.themeService.setTheme(theme);
  }

  // === NOTIFICHE ===
  salvaImpostazioniNotifiche(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    localStorage.setItem('notifPromozioni', String(this.notifichePromozioni));
    localStorage.setItem('notifOrdini', String(this.notificheOrdini));
    localStorage.setItem('notifVendite', String(this.notificheVendite));

    this.toast.success('Preferenze di notifica salvate.');
  }

  // === RESET PASSWORD ===
  richiediResetPassword(): void {
    if (!this.emailResetPassword) {
      this.toast.warning('Inserisci un indirizzo email.');
      return;
    }

    this.isRichiestaResetInCorso = true;

    this.http.post('/api/auth/password-reset', { email: this.emailResetPassword })
      .subscribe({
        next: () => {
          this.toast.info('Se l’email è corretta, riceverai a breve le istruzioni per il reset.');
          this.isRichiestaResetInCorso = false;
        },
        error: () => {
          this.toast.error('Si è verificato un problema durante la richiesta di reset.');
          this.isRichiestaResetInCorso = false;
        }
      });
  }

  // === RIPRISTINO PAGINA ===
  ripristinaPagina(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // cancella preferenze di UI
    localStorage.removeItem('tema');
    localStorage.removeItem('notifPromozioni');
    localStorage.removeItem('notifOrdini');
    localStorage.removeItem('notifVendite');
    localStorage.removeItem('isSidebarCollapsed');

    this.toast.success('Impostazioni e stato pagina ripristinati ai valori iniziali.');
    window.location.reload();
  }

  // === CANCELLA DATI LOCALI ===
  cancellaDatiLocali(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (confirm('Vuoi davvero cancellare tutti i dati salvati in questo browser per questa applicazione?')) {
      const token = localStorage.getItem('token');
      localStorage.clear();
      if (token) {
        localStorage.setItem('token', token);
      }
      this.toast.success('Dati locali cancellati.');
      this.router.navigate(['/']);
    }
  }

  // === LOGOUT ===
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.toast.success('Logout effettuato con successo!');
    this.router.navigate(['/']);
  }
}