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
  menuItems = [
    { label: 'Il mio Profilo', link: '/profilo', icon: 'bi-person-circle' },
    { label: 'I miei Ordini', link: '/profilo/ordini', icon: 'bi-box-seam' },
    { label: 'I miei Indirizzi', link: '/profilo/indirizzi', icon: 'bi-geo-alt'},
    { label: 'I miei metodi di pagamento', link: '/profilo/carte-di-credito', icon: 'bi-credit-card'},
    { label: 'Impostazioni', link: '/profilo/impostazioni', icon: 'bi-gear' },
    { label: 'Assistenza', link: '/contattaci', icon: 'bi-headset' }
  ];
  isMenuCollapsed: boolean = false;
  isAnimationEnabled: boolean = false;
  /* Breakpoint sotto al quale la sidebar si chiude da sola */
  private readonly COLLAPSE_BREAKPOINT = 992; // <= Bootstrap lg
  /* Memorizza se l'utente ha aperto manualmente la sidebar mentre era "piccola";
     in tal caso non la richiudiamo automaticamente fino al prossimo passaggio sopra al breakpoint. */
  private autoCollapsed: boolean = false;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object, private toast: ToastService) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userString = localStorage.getItem('user');
      if (userString) {
        this.utente = JSON.parse(userString);
      }

      // Recupera lo stato salvato della sidebar (se esiste)
      const savedState = localStorage.getItem('isSidebarCollapsed');
      if (savedState !== null) {
        this.isMenuCollapsed = savedState === 'true';
      }

      // Se la viewport è già stretta al primo render, forziamo collapsed
      if (window.innerWidth < this.COLLAPSE_BREAKPOINT && !this.isMenuCollapsed) {
        this.isMenuCollapsed = true;
        this.autoCollapsed = true;
      }

      // Abilita le animazioni solo dopo il rendering iniziale per evitare scatti
      setTimeout(() => {
        this.isAnimationEnabled = true;
      }, 50);
    }
  }

  /** Chiude automaticamente la sidebar se la finestra diventa stretta,
   *  e la riapre se l'utente torna su uno schermo grande (solo se era stata
   *  chiusa automaticamente, per rispettare la scelta manuale dell'utente). */
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
    // Click manuale = override dell'auto-collapse
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
