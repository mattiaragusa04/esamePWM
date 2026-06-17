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

export interface StoricoSpesaPunti {
  data: string;
  puntiSpesi: number;
  descrizione: string;
  codice?: string;
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
  storicoSpesaPunti: StoricoSpesaPunti[] = [];

  private readonly API        = 'http://localhost:3000/api/auth/profile';
  private readonly API_FEDELTA = 'http://localhost:3000/api/coupon/fedelta';

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

      // Carica storico punti spesi
      this.http.get<StoricoSpesaPunti[]>(`${this.API_FEDELTA}/storico-spesa`, { headers }).subscribe({
        next: (d) => this.storicoSpesaPunti = d,
        error: () => this.storicoSpesaPunti = this.leggiStoricoLocale()
      });

      // Carica coupon riscattati
      this.http.get<CouponRiscattato[]>(`${this.API_FEDELTA}/miei-coupon`, { headers }).subscribe({
        next: (d) => this.couponRiscattati = d,
        error: () => this.couponRiscattati = this.leggiCouponLocali()
      });
    }
  }

  /** Legge lo storico punti spesi salvato localmente come fallback */
  private leggiStoricoLocale(): StoricoSpesaPunti[] {
    try {
      const raw = localStorage.getItem('storico_punti');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  /** Legge i coupon riscattati salvati localmente come fallback */
  private leggiCouponLocali(): CouponRiscattato[] {
    try {
      const raw = localStorage.getItem('coupon_riscattati');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  /** Aggiunge un coupon appena generato alla lista locale e aggiorna lo storico */
  aggiungiCouponLocale(coupon: CouponRiscattato, puntiSpesi: number, descrizione: string): void {
    // Aggiorna lista coupon
    const couponList = this.leggiCouponLocali();
    couponList.unshift({ ...coupon, dataAcquisto: new Date().toISOString() });
    localStorage.setItem('coupon_riscattati', JSON.stringify(couponList));
    this.couponRiscattati = couponList;

    // Aggiorna storico punti
    const storico = this.leggiStoricoLocale();
    storico.unshift({
      data: new Date().toISOString(),
      puntiSpesi,
      descrizione,
      codice: coupon.codice
    });
    localStorage.setItem('storico_punti', JSON.stringify(storico));
    this.storicoSpesaPunti = storico;
  }

  /** Aggiunge al storico locale una spesa per prodotto usato */
  aggiungiSpesaProdottoLocale(puntiSpesi: number, nomeProdotto: string): void {
    const storico = this.leggiStoricoLocale();
    storico.unshift({
      data: new Date().toISOString(),
      puntiSpesi,
      descrizione: `Prodotto usato: ${nomeProdotto}`
    });
    localStorage.setItem('storico_punti', JSON.stringify(storico));
    this.storicoSpesaPunti = storico;
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
