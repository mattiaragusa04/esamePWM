import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterModule } from '@angular/router';

interface CatalogoCoupon {
  id: string;
  percentuale: number;
  costoInPunti: number;
  descrizione: string;
}

interface ProdottoUsato {
  id: number;
  nome: string;
  descrizione: string;
  prezzoUnitarioVendita: number;
  costoInPunti: number;
  immagine: string;
  giacenza: number;
  categoria_nome: string;
}

@Component({
  selector: 'app-fedelta',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './fedelta.html',
  styleUrls: ['./fedelta.css']
})
export class FedeltaComponent implements OnInit {
  tabAttiva: 'coupon' | 'prodotti' = 'coupon';

  puntiFedelta = 0;
  catalogoCoupon: CatalogoCoupon[] = [];
  prodottiUsati: ProdottoUsato[] = [];

  caricandoCoupon  = false;
  caricandoProdotti = false;

  messaggio: { testo: string; tipo: 'success' | 'error' } | null = null;
  couponAcquistato: { codice: string; percentuale: number; scadenza: string } | null = null;

  prodottoScelto: ProdottoUsato | null = null;
  mostraConferma = false;
  acquistando = false;

  private readonly API = 'http://localhost:3000/api/fedelta';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.leggiPuntiLocali();
    this.caricaCatalogoCoupon();
    this.caricaProdottiUsati();
  }

  private leggiPuntiLocali(): void {
    const raw = localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      this.puntiFedelta = u.puntiFedelta ?? u.punti_fedelta ?? 0;
    }
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  caricaCatalogoCoupon(): void {
    this.caricandoCoupon = true;
    this.http.get<CatalogoCoupon[]>(`${this.API}/catalogo-coupon`, { headers: this.headers() })
      .subscribe({
        next: d  => { this.catalogoCoupon = d; this.caricandoCoupon = false; },
        error: () => this.caricandoCoupon = false
      });
  }

  caricaProdottiUsati(): void {
    this.caricandoProdotti = true;
    this.http.get<ProdottoUsato[]>(`${this.API}/prodotti-usati`, { headers: this.headers() })
      .subscribe({
        next: d  => { this.prodottiUsati = d; this.caricandoProdotti = false; },
        error: () => this.caricandoProdotti = false
      });
  }

  acquistaCoupon(coupon: CatalogoCoupon): void {
    if (this.puntiFedelta < coupon.costoInPunti) {
      this.mostraMessaggio(`Punti insufficienti (hai ${this.puntiFedelta} pt, ne servono ${coupon.costoInPunti} pt).`, 'error');
      return;
    }
    this.http.post<any>(`${this.API}/acquista-coupon`, { catalogoId: coupon.id }, { headers: this.headers() })
      .subscribe({
        next: r => {
          this.puntiFedelta = r.puntiFedeltaRimanenti;
          this.aggiornaPuntiLocale(r.puntiFedeltaRimanenti);
          this.couponAcquistato = { codice: r.codice, percentuale: coupon.percentuale, scadenza: r.scadenza };
          this.mostraMessaggio(`✅ Coupon acquistato! Codice: ${r.codice}`, 'success');
        },
        error: e => this.mostraMessaggio(e.error?.error || 'Errore durante l\'acquisto.', 'error')
      });
  }

  apriConferma(prodotto: ProdottoUsato): void {
    this.prodottoScelto = prodotto;
    this.mostraConferma = true;
  }

  annullaConferma(): void {
    this.prodottoScelto = null;
    this.mostraConferma = false;
  }

  confermaAcquistoProdotto(): void {
    if (!this.prodottoScelto) return;
    this.acquistando = true;
    this.http.post<any>(`${this.API}/acquista-prodotto`, { prodottoId: this.prodottoScelto.id }, { headers: this.headers() })
      .subscribe({
        next: r => {
          this.puntiFedelta = r.puntiFedeltaRimanenti;
          this.aggiornaPuntiLocale(r.puntiFedeltaRimanenti);
          // Rimuovi il prodotto dalla lista o aggiorna giacenza
          this.prodottiUsati = this.prodottiUsati
            .map(p => p.id === this.prodottoScelto!.id ? { ...p, giacenza: p.giacenza - 1 } : p)
            .filter(p => p.giacenza > 0);
          this.acquistando = false;
          this.annullaConferma();
          this.mostraMessaggio(`🏆 Acquisto effettuato! Ordine #${r.ordineId} creato con ${r.costoInPunti} punti.`, 'success');
        },
        error: e => {
          this.acquistando = false;
          this.mostraMessaggio(e.error?.error || 'Errore durante l\'acquisto.', 'error');
        }
      });
  }

  private aggiornaPuntiLocale(nuoviPunti: number): void {
    const raw = localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      u.puntiFedelta = nuoviPunti;
      u.punti_fedelta = nuoviPunti;
      localStorage.setItem('user', JSON.stringify(u));
    }
  }

  private mostraMessaggio(testo: string, tipo: 'success' | 'error'): void {
    this.messaggio = { testo, tipo };
    setTimeout(() => this.messaggio = null, 6000);
  }

  getCopiaAbbreviata(codice: string): string {
    return codice.length > 20 ? codice.substring(0, 20) + '…' : codice;
  }

  getImmagineProdotto(immagine: string): string {
    if (!immagine) return 'https://placehold.co/300x200?text=Prodotto';
    if (immagine.startsWith('http')) return immagine;
    return `http://localhost:3000/public/${immagine}`;
  }
}
