import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
  private readonly API        = 'http://localhost:3000/api/auth/profile';
  private readonly API_FEDELTA = 'http://localhost:3000/api/coupon';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const raw = localStorage.getItem('user');
    if (raw) {
      this.utente = this.normalizza(JSON.parse(raw));
    }

    const token = localStorage.getItem('token');
    if (token) {
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      this.http.get<any>(this.API, { headers }).subscribe({
        next: (utenteAggiornato) => {
          this.utente = this.normalizza(utenteAggiornato);
          localStorage.setItem('user', JSON.stringify(this.utente));
        },
        error: (err) => {
          console.warn('[Profilo] Impossibile ricaricare il profilo dal server, uso cache locale:', err.status);
        }
      });

      
    }
  }


  /** Aggiorna i punti dell'utente nel modello locale */
  aggiornaPuntiUtente(nuoviPunti: number): void {
    if (this.utente) {
      this.utente = this.normalizza({ ...this.utente, puntiFedelta: nuoviPunti, punti_fedelta: nuoviPunti });
    }
  }

  /** Aggiunge alias punti_fedelta = puntiFedelta per compatibilità template */
  private normalizza(u: any): any {
    if (!u) return u;
    return {
      ...u,
      puntiFedelta:  u.puntiFedelta  ?? u.punti_fedelta  ?? 0,
      punti_fedelta: u.puntiFedelta  ?? u.punti_fedelta  ?? 0
    };
  }

  async caricaCouponRiscattati() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${this.API_FEDELTA}/miei-coupon`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        this.couponRiscattati = await res.json();
      }
    } catch {
      console.error('[Profilo] Impossibile connettersi al server.');
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
