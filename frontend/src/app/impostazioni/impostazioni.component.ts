import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ToastService } from '../shared/toast.service';
import { ThemeService, Theme } from '../shared/theme.service';
import { NeuralCanvasService } from '../shared/neural-canvas.service';

@Component({
  selector: 'app-impostazioni',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './impostazioni.component.html',
  styleUrl: './impostazioni.component.css'
})
export class ImpostazioniComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('impostazioniCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('impostazioniHero')   heroRef!:   ElementRef<HTMLDivElement>;

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
    @Inject(PLATFORM_ID) private platformId: Object,
    private toast: ToastService,
    private themeService: ThemeService,
    private neuralCanvas: NeuralCanvasService
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const userString = localStorage.getItem('user');
    if (userString) {
      this.utente = JSON.parse(userString);
    }

    this.tema = this.themeService.theme();

    const notifPromo   = localStorage.getItem('notifPromozioni');
    const notifOrdini  = localStorage.getItem('notifOrdini');
    const notifVendite = localStorage.getItem('notifVendite');

    if (notifPromo   !== null) this.notifichePromozioni = notifPromo   === 'true';
    if (notifOrdini  !== null) this.notificheOrdini     = notifOrdini  === 'true';
    if (notifVendite !== null) this.notificheVendite    = notifVendite === 'true';
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    requestAnimationFrame(() => {
      const canvas = this.canvasRef?.nativeElement;
      const hero   = this.heroRef?.nativeElement;
      if (canvas && hero) this.neuralCanvas.init(canvas, hero);
    });
  }

  ngOnDestroy(): void {
    if (this.canvasRef?.nativeElement) this.neuralCanvas.destroy(this.canvasRef.nativeElement);
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
    localStorage.setItem('notifOrdini',     String(this.notificheOrdini));
    localStorage.setItem('notifVendite',    String(this.notificheVendite));

    this.toast.success('Preferenze di notifica salvate.');
  }

  // === RESET PASSWORD ===
  async richiediResetPassword() {
    if (!this.emailResetPassword) {
      this.toast.warning('Inserisci un indirizzo email.');
      return;
    }
    this.isRichiestaResetInCorso = true;
    try {
      const res = await fetch('http://localhost:3000/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.emailResetPassword })
      });
      if (res.ok) {
        this.toast.info('Se l’email è corretta, riceverai a breve le istruzioni per il reset.');
      } else {
        this.toast.error('Si è verificato un problema durante la richiesta di reset.');
      }
    } catch (e) {
      console.error('[Impostazioni] Errore di rete reset password:', e);
      this.toast.error('Errore di connessione al server.');
    } finally {
      this.isRichiestaResetInCorso = false;
    }
  }

  // === RIPRISTINO PAGINA ===
  ripristinaPagina(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.themeService.setTheme('light');
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
      if (token) localStorage.setItem('token', token);
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
