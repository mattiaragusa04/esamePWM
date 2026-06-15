import { Component, OnInit, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  utente: any = null;
  isMenuCollapsed: boolean = false;
  isAnimationEnabled: boolean = false;
  private readonly COLLAPSE_BREAKPOINT = 992;
  private autoCollapsed: boolean = false;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private toast: ToastService
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
    }
  }

  // ── Proprietà derivate ─────────────────────────────────────

  get iniziali(): string {
    if (!this.utente) return '?';
    const n = (this.utente.nome?.[0] || '').toUpperCase();
    const c = (this.utente.cognome?.[0] || '').toUpperCase();
    return n + c || '?';
  }

  /** Livelli fedeltà: Bronze 0-99, Silver 100-299, Gold 300-699, Platinum 700+ */
  private get livelli() {
    return [
      { nome: 'Bronze',   min: 0,   max: 99  },
      { nome: 'Silver',   min: 100, max: 299 },
      { nome: 'Gold',     min: 300, max: 699 },
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

  // ── Resize / toggle / logout ──────────────────────────────

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
