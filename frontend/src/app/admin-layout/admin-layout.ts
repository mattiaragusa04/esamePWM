import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayout implements OnInit, OnDestroy {
  adminNome: string = 'Amministratore';
  oraCorrente: string = '';
  private timerOra: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        this.adminNome = (user.nome || '') + (user.cognome ? ' ' + user.cognome : '');
        if (!this.adminNome.trim()) this.adminNome = 'Amministratore';
      }
      this.aggiornaOra();
      this.timerOra = setInterval(() => this.aggiornaOra(), 1000);
    }
  }

  ngOnDestroy() {
    if (this.timerOra) clearInterval(this.timerOra);
  }

  private aggiornaOra() {
    const now = new Date();
    this.oraCorrente = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}
