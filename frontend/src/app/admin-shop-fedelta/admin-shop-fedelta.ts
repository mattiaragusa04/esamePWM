import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface CouponFedelta {
  id: number;
  codice: string;
  tipo: string;
  valore: number;
  descrizione: string;
  data_scadenza: string;
  utilizzi_massimi: number;
  utilizzi_attuali: number;
  attivo: number;
  costo_punti: number;
  disponibile: number;
}

interface ProdottoUsato {
  id: number;
  nome: string;
  descrizione: string;
  prezzoUnitarioVendita: number;
  costoInPunti: number;
  immagine: string;
  giacenza: number;
  condizione: string;
  categoria_nome: string;
  pubblicatoVetrina: number;
}

@Component({
  selector: 'app-admin-shop-fedelta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-shop-fedelta.html',
  styleUrls: ['./admin-shop-fedelta.css']
})
export class AdminShopFedelta implements OnInit {
  tabAttiva: 'coupon' | 'prodotti' = 'coupon';

  /* ── Coupon ─────────────────────────────────────────────── */
  couponList: CouponFedelta[] = [];
  caricandoCoupon = false;
  salvandoCoupon  = false;
  msgCoupon: { testo: string; tipo: 'success' | 'error' } | null = null;

  nuovoCoupon = {
    codice: '',
    percentuale: 10,
    costoInPunti: 90,
    descrizione: '',
    scadenza: '',
    disponibile: -1
  };

  /* ── Prodotti usati ─────────────────────────────────────── */
  prodottiUsati: ProdottoUsato[] = [];
  caricandoProdotti = false;
  msgProdotti: { testo: string; tipo: 'success' | 'error' } | null = null;

  private readonly API_FEDELTA = 'http://localhost:3000/api/coupon/fedelta';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.caricaCoupon();
    this.caricaProdottiUsati();
    // Imposta data scadenza default a +1 anno
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    this.nuovoCoupon.scadenza = d.toISOString().split('T')[0];
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  /* ── COUPON ─────────────────────────────────────────────────── */

  caricaCoupon(): void {
    this.caricandoCoupon = true;
    this.http.get<CouponFedelta[]>(`${this.API_FEDELTA}/admin/coupon-fedelta`, { headers: this.headers() })
      .subscribe({
        next: d  => { this.couponList = d; this.caricandoCoupon = false; },
        error: () => { this.caricandoCoupon = false; }
      });
  }

  creaCoupon(): void {
    if (!this.nuovoCoupon.codice.trim()) {
      this.showMsgCoupon('Il codice è obbligatorio.', 'error'); return;
    }
    this.salvandoCoupon = true;
    this.http.post<any>(`${this.API_FEDELTA}/admin/coupon-fedelta`, this.nuovoCoupon, { headers: this.headers() })
      .subscribe({
        next: () => {
          this.salvandoCoupon = false;
          this.showMsgCoupon('✅ Coupon creato con successo!', 'success');
          this.caricaCoupon();
          this.resetForm();
        },
        error: e => {
          this.salvandoCoupon = false;
          this.showMsgCoupon(e.error?.error || 'Errore nella creazione.', 'error');
        }
      });
  }

  eliminaCoupon(id: number): void {
    if (!confirm('Eliminare questo coupon fedeltà?')) return;
    this.http.delete(`${this.API_FEDELTA}/admin/coupon-fedelta/${id}`, { headers: this.headers() })
      .subscribe({
        next: () => {
          this.showMsgCoupon('Coupon eliminato.', 'success');
          this.couponList = this.couponList.filter(c => c.id !== id);
        },
        error: e => this.showMsgCoupon(e.error?.error || 'Errore eliminazione.', 'error')
      });
  }

  toggleAttivoCoupon(coupon: CouponFedelta): void {
    const nuovoStato = coupon.attivo ? 0 : 1;
    this.http.patch(`${this.API_FEDELTA}/admin/coupon-fedelta/${coupon.id}/toggle`, { attivo: nuovoStato }, { headers: this.headers() })
      .subscribe({
        next: () => { coupon.attivo = nuovoStato; },
        error: e => this.showMsgCoupon(e.error?.error || 'Errore aggiornamento.', 'error')
      });
  }

  private resetForm(): void {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    this.nuovoCoupon = { codice: '', percentuale: 10, costoInPunti: 90, descrizione: '', scadenza: d.toISOString().split('T')[0], disponibile: -1 };
  }

  private showMsgCoupon(testo: string, tipo: 'success' | 'error'): void {
    this.msgCoupon = { testo, tipo };
    setTimeout(() => this.msgCoupon = null, 5000);
  }

  /* ── PRODOTTI USATI ─────────────────────────────────────────── */

  caricaProdottiUsati(): void {
    this.caricandoProdotti = true;
    this.http.get<ProdottoUsato[]>(`${this.API_FEDELTA}/admin/prodotti-usati`, { headers: this.headers() })
      .subscribe({
        next: d  => { this.prodottiUsati = d; this.caricandoProdotti = false; },
        error: () => { this.caricandoProdotti = false; }
      });
  }

  getImmagineProdotto(immagine: string): string {
    if (!immagine) return 'https://placehold.co/60x60?text=?';
    if (immagine.startsWith('http')) return immagine;
    return `http://localhost:3000/public/${immagine}`;
  }

  private showMsgProdotti(testo: string, tipo: 'success' | 'error'): void {
    this.msgProdotti = { testo, tipo };
    setTimeout(() => this.msgProdotti = null, 5000);
  }
}
