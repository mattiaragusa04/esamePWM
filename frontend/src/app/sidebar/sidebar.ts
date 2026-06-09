import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

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

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

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

      // Abilita le animazioni solo dopo il rendering iniziale per evitare scatti
      setTimeout(() => {
        this.isAnimationEnabled = true;
      }, 50);
    }
  }

  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('isSidebarCollapsed', String(this.isMenuCollapsed));
    }
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    alert('Logout effettuato con successo!');
    this.router.navigate(['/']);
  }
}
