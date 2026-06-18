import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface CouponRiscattato {
  codice: string;
  percentuale: number;
  scadenza: string;
  dataAcquisto?: string;
}

@Component({
  selector: 'app-profilo',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profilo.html',
  styleUrls: ['./profilo.css']
})
export class Profilo implements OnInit {
  utente: any = null;

  totalOrdini    = 0;
  totalVendite   = 0;
  totalPreferiti = 0;

  couponRiscattati: CouponRiscattato[] = [];
  private readonly API         = 'http://localhost:3000/api/auth/profile';
  private readonly API_FEDELTA = 'http://localhost:3000/api/coupon';
  private readonly API_ORDINI  = 'http://localhost:3000/api/ordini/utente';
  private readonly API_VENDI   = 'http://localhost:3000/api/vendi/utente';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.caricaProfilo();
    this.caricaCouponRiscattati();
    this.caricaContatori();
  }

  async caricaContatori() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const [resOrdini, resVendite] = await Promise.all([
        fetch(this.API_ORDINI, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(this.API_VENDI,  { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (resOrdini.ok) {
        const ordini = await resOrdini.json();
        this.totalOrdini = Array.isArray(ordini) ? ordini.length : 0;
      }

      if (resVendite.ok) {
        const vendite = await resVendite.json();
        this.totalVendite = Array.isArray(vendite) ? vendite.length : 0;
      }
    } catch {
      console.error('[Profilo] Errore nel caricamento dei contatori.');
    }

    // I preferiti sono salvati in localStorage
    try {
      const salvati = localStorage.getItem('preferiti');
      this.totalPreferiti = salvati ? JSON.parse(salvati).length : 0;
    } catch {
      this.totalPreferiti = 0;
    }

    this.cdr.detectChanges();
  }

  async caricaCouponRiscattati() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${this.API_FEDELTA}/miei-coupon`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        this.couponRiscattati = await res.json();
      }
    } catch {
      console.error('[Profilo] Impossibile connettersi al server.');
    } finally {
      this.cdr.detectChanges();
    }
  }

  async caricaProfilo() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(this.API, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        this.utente = (await res.json());
      }
    } catch {
      console.error('[Profilo] Impossibile connettersi al server.');
    } finally {
      this.cdr.detectChanges();
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

  formatData(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
