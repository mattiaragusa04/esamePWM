import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ToastService } from '../shared/toast.service';
import { PuntiService } from '../shared/punti.service';

interface CatalogoCoupon {
  id: string;
  percentuale: number;
  costoInPunti: number;
  descrizione: string;
}

interface PresetCoupon {
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
  presetCoupon: PresetCoupon[] = [];
  catalogoCoupon: CatalogoCoupon[] = [];
  prodottiUsati: ProdottoUsato[] = [];

  caricandoCoupon   = false;
  caricandoProdotti = false;
  // Mappa percentuale -> booleano per tracciare ogni singolo preset in acquisto
  acquistandoPresetMap: Record<number, boolean> = {};

  couponAcquistato: { codice: string; percentuale: number; scadenza: string } | null = null;

  prodottoScelto: ProdottoUsato | null = null;
  mostraConferma = false;
  acquistando = false;

  private readonly API = 'http://localhost:3000/api/coupon';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private toast: ToastService,
    private puntiService: PuntiService
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.puntiFedelta = this.puntiService.valore || this.leggiPuntiLocali();
    this.caricaPresetCoupon();
    this.caricaCatalogoCoupon();
    this.caricaProdottiUsati();
  }

  private leggiPuntiLocali(): number {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        return u.puntiFedelta ?? u.punti_fedelta ?? 0;
      }
    } catch {}
    return 0;
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  caricaPresetCoupon(): void {
    this.http.get<PresetCoupon[]>(`${this.API}/preset-coupon`, { headers: this.headers() })
      .subscribe({
        next: d  => this.presetCoupon = d,
        error: () => {
          this.presetCoupon = [5, 10, 15, 20, 25].map(p => ({
            percentuale: p,
            costoInPunti: p * 10,
            descrizione: `Sconto del ${p}% su qualsiasi ordine`
          }));
        }
      });
  }

  caricaCatalogoCoupon(): void {
    this.caricandoCoupon = true;
    this.http.get<CatalogoCoupon[]>(`${this.API}/catalogo-coupon`, { headers: this.headers() })
      .subscribe({
        next: d  => { this.catalogoCoupon = d; this.caricandoCoupon = false; },
        error: () => { this.caricandoCoupon = false; }
      });
  }

  caricaProdottiUsati(): void {
    this.caricandoProdotti = true;
    this.http.get<ProdottoUsato[]>(`${this.API}/prodotti-usati`, { headers: this.headers() })
      .subscribe({
        next: d  => { this.prodottiUsati = d; this.caricandoProdotti = false; },
        error: () => { this.caricandoProdotti = false; }
      });
  }

  acquistaPreset(preset: PresetCoupon): void {
    if (this.puntiFedelta < preset.costoInPunti) {
      this.toast.error(`Punti insufficienti (hai ${this.puntiFedelta} pt, ne servono ${preset.costoInPunti} pt).`);
      return;
    }
    // Segna SOLO questo preset come in acquisto
    this.acquistandoPresetMap = { ...this.acquistandoPresetMap, [preset.percentuale]: true };

    this.http.post<any>(`${this.API}/acquista-preset-coupon`, { percentuale: preset.percentuale }, { headers: this.headers() })
      .subscribe({
        next: r => {
          // Rimuovi il flag di loading per questo preset
          this.acquistandoPresetMap = { ...this.acquistandoPresetMap, [preset.percentuale]: false };

          this.puntiFedelta = r.puntiFedeltaRimanenti;
          // Propaga al service → aggiorna sidebar in real-time
          this.puntiService.aggiorna(r.puntiFedeltaRimanenti);

          const nuovoCoupon = { codice: r.codice, percentuale: preset.percentuale, scadenza: r.scadenza };
          this.couponAcquistato = nuovoCoupon;

          this.salvaCouponLocale(nuovoCoupon, preset.costoInPunti, preset.descrizione);

          // Toast di conferma con il codice generato
          this.toast.success(`✅ Coupon -${preset.percentuale}% ottenuto! Codice: ${r.codice}`, 5000);
        },
        error: e => {
          this.acquistandoPresetMap = { ...this.acquistandoPresetMap, [preset.percentuale]: false };
          this.toast.error(e.error?.error || 'Errore durante l\'acquisto.');
        }
      });
  }

  acquistaCoupon(coupon: CatalogoCoupon): void {
    if (this.puntiFedelta < coupon.costoInPunti) {
      this.toast.error(`Punti insufficienti (hai ${this.puntiFedelta} pt, ne servono ${coupon.costoInPunti} pt).`);
      return;
    }
    this.http.post<any>(`${this.API}/acquista-coupon`, { catalogoId: coupon.id }, { headers: this.headers() })
      .subscribe({
        next: r => {
          this.puntiFedelta = r.puntiFedeltaRimanenti;
          this.puntiService.aggiorna(r.puntiFedeltaRimanenti);

          const nuovoCoupon = { codice: r.codice, percentuale: coupon.percentuale, scadenza: r.scadenza };
          this.couponAcquistato = nuovoCoupon;

          this.salvaCouponLocale(nuovoCoupon, coupon.costoInPunti, coupon.descrizione);

          this.toast.success(`✅ Coupon -${coupon.percentuale}% riscattato! Codice: ${r.codice}`, 5000);
        },
        error: e => this.toast.error(e.error?.error || 'Errore durante l\'acquisto.')
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
    const nomeProdotto  = this.prodottoScelto.nome;
    const costoInPunti = this.prodottoScelto.costoInPunti;
    this.http.post<any>(`${this.API}/acquista-prodotto`, { prodottoId: this.prodottoScelto.id }, { headers: this.headers() })
      .subscribe({
        next: r => {
          this.puntiFedelta = r.puntiFedeltaRimanenti;
          this.puntiService.aggiorna(r.puntiFedeltaRimanenti);
          this.prodottiUsati = this.prodottiUsati
            .map(p => p.id === this.prodottoScelto!.id ? { ...p, giacenza: p.giacenza - 1 } : p)
            .filter(p => p.giacenza > 0);
          this.acquistando = false;
          this.annullaConferma();

          this.salvaStoricoPuntiLocale(costoInPunti, `Prodotto usato: ${nomeProdotto}`);

          this.toast.success(`🏆 Acquisto effettuato! Ordine #${r.ordineId} creato con ${r.costoInPunti} punti.`);
        },
        error: e => {
          this.acquistando = false;
          this.toast.error(e.error?.error || 'Errore durante l\'acquisto.');
        }
      });
  }

  /** Restituisce true se il preset con quella percentuale è in fase di acquisto */
  isAcquistandoPreset(percentuale: number): boolean {
    return !!this.acquistandoPresetMap[percentuale];
  }

  /**
   * Salva il coupon appena generato nel localStorage (coupon_riscattati)
   * e aggiunge una voce allo storico punti spesi (storico_punti).
   */
  private salvaCouponLocale(
    coupon: { codice: string; percentuale: number; scadenza: string },
    puntiSpesi: number,
    descrizione: string
  ): void {
    let couponList: any[] = [];
    try { couponList = JSON.parse(localStorage.getItem('coupon_riscattati') || '[]'); } catch {}
    couponList.unshift({ ...coupon, dataAcquisto: new Date().toISOString() });
    localStorage.setItem('coupon_riscattati', JSON.stringify(couponList));
    this.salvaStoricoPuntiLocale(puntiSpesi, descrizione, coupon.codice);
  }

  /** Aggiunge una voce allo storico punti spesi nel localStorage */
  private salvaStoricoPuntiLocale(puntiSpesi: number, descrizione: string, codice?: string): void {
    let storico: any[] = [];
    try { storico = JSON.parse(localStorage.getItem('storico_punti') || '[]'); } catch {}
    storico.unshift({
      data: new Date().toISOString(),
      puntiSpesi,
      descrizione,
      ...(codice ? { codice } : {})
    });
    localStorage.setItem('storico_punti', JSON.stringify(storico));
  }

  getCopiaAbbreviata(codice: string): string {
    return codice.length > 20 ? codice.substring(0, 20) + '…' : codice;
  }

  getImmagineProdotto(immagine: string): string {
    if (!immagine) return 'https://placehold.co/300x200?text=Prodotto';
    if (immagine.startsWith('http')) return immagine;
    return `http://localhost:3000/public/${immagine}`;
  }

  getPresetColor(perc: number): string {
    const map: Record<number, string> = {
      5:  '#6c757d',
      10: '#0d6efd',
      15: '#0dcaf0',
      20: '#198754',
      25: '#dc3545'
    };
    return map[perc] || '#6c757d';
  }
}
