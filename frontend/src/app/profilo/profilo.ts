import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profilo',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profilo.html',
  styleUrls: ['./profilo.css']
})
export class Profilo implements OnInit {
  utente: any = null;

  // Placeholder: collegare ai servizi reali
  totalOrdini    = 0;
  totalVendite   = 0;
  totalPreferiti = 0;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const raw = localStorage.getItem('user');
      if (raw) {
        this.utente = JSON.parse(raw);
      }
    }
  }

  getInitials(): string {
    if (!this.utente) return '?';
    const n = (this.utente.nome    || '').charAt(0).toUpperCase();
    const c = (this.utente.cognome || '').charAt(0).toUpperCase();
    return n + c || '?';
  }

  getLevelName(): string {
    const p = this.utente?.puntiFedelta || 0;
    if (p >= 1000) return 'Leggenda';
    if (p >= 500)  return 'Gold';
    if (p >= 200)  return 'Silver';
    if (p >= 50)   return 'Bronze';
    return 'Starter';
  }

  getLevelThreshold(): number {
    const p = this.utente?.puntiFedelta || 0;
    if (p >= 1000) return 1000;
    if (p >= 500)  return 500;
    if (p >= 200)  return 200;
    if (p >= 50)   return 50;
    return 0;
  }

  getLevelNextThreshold(): number {
    const p = this.utente?.puntiFedelta || 0;
    if (p >= 1000) return 1000;
    if (p >= 500)  return 1000;
    if (p >= 200)  return 500;
    if (p >= 50)   return 200;
    return 50;
  }

  getLevelPercent(): number {
    const p    = this.utente?.puntiFedelta || 0;
    const from = this.getLevelThreshold();
    const to   = this.getLevelNextThreshold();
    if (to === from) return 100;
    return Math.min(100, Math.round(((p - from) / (to - from)) * 100));
  }
}
