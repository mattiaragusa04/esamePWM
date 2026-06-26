import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastService } from '../shared/toast.service';
import { PuntiService } from '../shared/punti.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit, OnDestroy {
  utente: any = null;
  isMenuCollapsed: boolean = false;
  isAnimationEnabled: boolean = false;
  private readonly COLLAPSE_BREAKPOINT = 992;
  private autoCollapsed: boolean = false;
  private punteSub?: Subscription;
  private readonly API_PROFILE = 'http://localhost:3000/api/auth/profile';

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private toast: ToastService,
    private puntiService: PuntiService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userString = localStorage.getItem('user');
      if (userString) this.utente = JSON.parse(userString);

      const savedState = localStorage.getItem('isSidebarCollapsed');
      if (savedState !== null) this.isMenuCollapsed = savedState === 'true';

      if (window.innerWidth < this.COLLAPSE_BREAKPOINT && !this.isMenuCollapsed) {
        this.isMenuCollapsed = true;
        this.autoCollapsed = true;
      }

      setTimeout(() => { this.isAnimationEnabled = true; }, 50);

  
      this.punteSub = this.puntiService.punti$.subscribe(punti => {
        if (!this.utente) {
          const raw = localStorage.getItem('user');
          if (raw) this.utente = JSON.parse(raw);
        }
        if (this.utente) {
          this.utente = { ...this.utente, puntiFedelta: punti };
        }
      });


      window.addEventListener('storage', this.onStorage);


      this.sincronizzaPuntiDalServer();
    }
  }

  ngOnDestroy(): void {
    this.punteSub?.unsubscribe();
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('storage', this.onStorage);
    }
  }


  private sincronizzaPuntiDalServer(): void {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(this.API_PROFILE, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : null)
      .then(utenteFresco => {
        if (!utenteFresco) return;
        const punti = utenteFresco.puntiFedelta ?? utenteFresco.punti_fedelta ?? 0;

        const raw = localStorage.getItem('user');
        if (raw) {
          const u = JSON.parse(raw);
          u.puntiFedelta  = punti;
          u.punti_fedelta = punti;
          localStorage.setItem('user', JSON.stringify(u));
        }

        this.puntiService.aggiorna(punti);
      })
      .catch(() => { });
  }


  private onStorage = (e: StorageEvent) => {
    if (e.key === 'user' && e.newValue) {
      try {
        const u = JSON.parse(e.newValue);
        const nuoviPunti = u.puntiFedelta ?? u.punti_fedelta ?? 0;
        this.puntiService.aggiorna(nuoviPunti);
      } catch {}
    }
  };


  get iniziali(): string {
    if (!this.utente) return '?';
    const n = (this.utente.nome?.[0] || '').toUpperCase();
    const c = (this.utente.cognome?.[0] || '').toUpperCase();
    return n + c || '?';
  }

  private get livelli() {
    return [
      { nome: 'Bronze',   min: 0,   max: 99   },
      { nome: 'Silver',   min: 100, max: 299  },
      { nome: 'Gold',     min: 300, max: 699  },
      { nome: 'Platinum', min: 700, max: 9999 },
    ];
  }

  private get punti(): number {
    return this.utente?.puntiFedelta || 0;
  }

  get livelloCorrente(): string {
    const l = this.livelli.find(l => this.punti >= l.min && this.punti <= l.max);
    return l ? l.nome : 'Platinum';
  }

  get livelloSuccessivo(): string {
    const idx = this.livelli.findIndex(l => this.punti >= l.min && this.punti <= l.max);
    return idx < this.livelli.length - 1 ? this.livelli[idx + 1].nome : 'MAX';
  }

  get progressoPunti(): number {
    const l = this.livelli.find(l => this.punti >= l.min && this.punti <= l.max);
    if (!l || l.max === 9999) return 100;
    return Math.round(((this.punti - l.min) / (l.max - l.min + 1)) * 100);
  }



  @HostListener('window:resize')
  onWindowResize(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const w = window.innerWidth;
    if (w < this.COLLAPSE_BREAKPOINT && !this.isMenuCollapsed) {
      this.isMenuCollapsed = true;
      this.autoCollapsed = true;
      localStorage.setItem('isSidebarCollapsed', 'true');
    } else if (w >= this.COLLAPSE_BREAKPOINT && this.autoCollapsed && this.isMenuCollapsed) {
      this.isMenuCollapsed = false;
      this.autoCollapsed = false;
      localStorage.setItem('isSidebarCollapsed', 'false');
    }
  }

  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
    this.autoCollapsed = false;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('isSidebarCollapsed', String(this.isMenuCollapsed));
    }
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.toast.success('Logout effettuato con successo!');
    this.router.navigate(['/']);
  }
}
