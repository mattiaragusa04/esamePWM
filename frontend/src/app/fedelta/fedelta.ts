import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastService } from '../shared/toast.service';
import { PuntiService } from '../shared/punti.service';
import { NeuralCanvasService } from '../shared/neural-canvas.service';

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
export class FedeltaComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('fedeltaCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fedeltaHero')   heroRef!:   ElementRef<HTMLDivElement>;

  tabAttiva: 'coupon' | 'prodotti' = 'coupon';

  puntiFedelta = 0;
  presetCoupon: PresetCoupon[] = [];
  catalogoCoupon: CatalogoCoupon[] = [];
  couponPeriodici: any[] = [];
  prodottiUsati: ProdottoUsato[] = [];

  caricandoCoupon   = false;
  caricandoPeriodici = false;
  caricandoProdotti = false;
  acquistandoPresetMap: Record<number, boolean> = {};

  couponAcquistato: { codice: string; percentuale: number; scadenza: string } | null = null;

  prodottoScelto: ProdottoUsato | null = null;
  mostraConferma = false;
  acquistando = false;

  private readonly API         = 'http://localhost:3000/api/coupon';
  private readonly API_PROFILE = 'http://localhost:3000/api/auth/profile';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private puntiService: PuntiService,
    private neuralCanvas: NeuralCanvasService
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.caricaPuntiFreschi().then(() => {
      this.caricaPresetCoupon();
      this.caricaCatalogoCoupon();
      this.caricaCouponPeriodici();
      this.caricaProdottiUsati();
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    requestAnimationFrame(() => {
      const canvas = this.canvasRef?.nativeElement;
      const hero   = this.heroRef?.nativeElement;
      if (canvas && hero) this.neuralCanvas.init(canvas, hero);
    });
  }

  ngOnDestroy(): void {
    if (this.canvasRef?.nativeElement) this.neuralCanvas.destroy(this.canvasRef.nativeElement);
  }

  private getToken(): string {
    return localStorage.getItem('token') || '';
  }

  private async caricaPuntiFreschi(): Promise<void> {
    const token = this.getToken();
    if (!token) return;
    try {
      const res = await fetch(this.API_PROFILE, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const utente = await res.json();
        const punti = utente.puntiFedelta ?? utente.punti_fedelta ?? 0;
        this.puntiFedelta = punti;
        this.puntiService.aggiorna(punti);
        const raw = localStorage.getItem('user');
        if (raw) {
          const u = JSON.parse(raw);
          u.puntiFedelta  = punti;
          u.punti_fedelta = punti;
          localStorage.setItem('user', JSON.stringify(u));
        }
      }
    } catch (e) {
      this.puntiFedelta = this.puntiService.valore ?? 0;
    } finally {
      this.cdr.detectChanges();
    }
  }

  async caricaPresetCoupon() {
    const token = this.getToken();
    try {
      const res = await fetch(`${this.API}/preset-coupon`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        this.presetCoupon = await res.json();
      } else {
        console.error('[Fedelta] Errore caricamento preset coupon:', res.status);
      }
    } catch (e) {
      console.error('[Fedelta] Errore di rete preset coupon:', e);
    } finally {
      this.cdr.detectChanges();
    }
  }

  async caricaCatalogoCoupon() {
    this.caricandoCoupon = true;
    const token = this.getToken();
    try {
      const res = await fetch(`${this.API}/catalogo-coupon`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        this.catalogoCoupon = await res.json();
      } else {
        console.error('[Fedelta] Errore caricamento catalogo coupon:', res.status);
      }
    } catch (e) {
      console.error('[Fedelta] Errore di rete catalogo coupon:', e);
    } finally {
      this.caricandoCoupon = false;
      this.cdr.detectChanges();
    }
  }

  async caricaCouponPeriodici() {
    this.caricandoPeriodici = true;
    const token = this.getToken();
    try {
      const res = await fetch(`${this.API}`, { // Endpoint che restituisce TUTTI i coupon
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const tuttiCoupon = await res.json();
        // Filtriamo solo quelli periodici: attivi e senza costo in punti
        this.couponPeriodici = tuttiCoupon.filter((c: any) => c.attivo && (!c.costo_punti || c.costo_punti === 0));
      } else {
        console.error('[Fedelta] Errore caricamento coupon periodici:', res.status);
      }
    } catch (e) {
      console.error('[Fedelta] Errore di rete coupon periodici:', e);
    } finally {
      this.caricandoPeriodici = false;
      this.cdr.detectChanges();
    }
  }

  async caricaProdottiUsati() {
    this.caricandoProdotti = true;
    const token = this.getToken();
    try {
      const res = await fetch(`${this.API}/prodotti-usati`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        this.prodottiUsati = await res.json();
      } else {
        console.error('[Fedelta] Errore caricamento prodotti usati:', res.status);
      }
    } catch (e) {
      console.error('[Fedelta] Errore di rete prodotti usati:', e);
    } finally {
      this.caricandoProdotti = false;
      this.cdr.detectChanges();
    }
  }

  async acquistaPreset(preset: PresetCoupon) {
    if (this.puntiFedelta < preset.costoInPunti) {
      this.toast.error(`Punti insufficienti (hai ${this.puntiFedelta} pt, ne servono ${preset.costoInPunti} pt).`);
      return;
    }
    this.acquistandoPresetMap = { ...this.acquistandoPresetMap, [preset.percentuale]: true };
    this.cdr.detectChanges();

    const token = this.getToken();
    try {
      const res = await fetch(`${this.API}/acquista-preset-coupon`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentuale: preset.percentuale })
      });
      const data = await res.json();
      if (res.ok) {
        this.puntiFedelta = data.puntiFedeltaRimanenti;
        this.puntiService.aggiorna(data.puntiFedeltaRimanenti);
        this.couponAcquistato = { codice: data.codice, percentuale: preset.percentuale, scadenza: data.scadenza };
        this.toast.success(`Coupon -${preset.percentuale}% ottenuto! Codice: ${data.codice}`, 5000);
      } else {
        this.toast.error(data.error || 'Errore durante l\'acquisto.');
      }
    } catch (e) {
      console.error('[Fedelta] Errore di rete acquisto preset:', e);
      this.toast.error('Errore di connessione al server.');
    } finally {
      this.acquistandoPresetMap = { ...this.acquistandoPresetMap, [preset.percentuale]: false };
      this.cdr.detectChanges();
    }
  }

  async acquistaCoupon(coupon: CatalogoCoupon) {
    if (this.puntiFedelta < coupon.costoInPunti) {
      this.toast.error(`Punti insufficienti (hai ${this.puntiFedelta} pt, ne servono ${coupon.costoInPunti} pt).`);
      return;
    }
    const token = this.getToken();
    try {
      const res = await fetch(`${this.API}/acquista-coupon`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ catalogoId: coupon.id })
      });
      const data = await res.json();
      if (res.ok) {
        this.puntiFedelta = data.puntiFedeltaRimanenti;
        this.puntiService.aggiorna(data.puntiFedeltaRimanenti);
        this.couponAcquistato = { codice: data.codice, percentuale: coupon.percentuale, scadenza: data.scadenza };
        this.toast.success(`Coupon -${coupon.percentuale}% riscattato! Codice: ${data.codice}`, 5000);
      } else {
        this.toast.error(data.error || 'Errore durante l\'acquisto.');
      }
    } catch (e) {
      console.error('[Fedelta] Errore di rete acquisto coupon:', e);
      this.toast.error('Errore di connessione al server.');
    } finally {
      this.cdr.detectChanges();
    }
  }

  copiaCodice(codice: string) {
    if (isPlatformBrowser(this.platformId)) {
      navigator.clipboard.writeText(codice).then(() => {
        this.toast.info(`Codice "${this.getCopiaAbbreviata(codice)}" copiato!`);
      });
    }
  }

  apriConferma(prodotto: ProdottoUsato): void {
    this.prodottoScelto = prodotto;
    this.mostraConferma = true;
  }

  annullaConferma(): void {
    this.prodottoScelto = null;
    this.mostraConferma = false;
  }

  async confermaAcquistoProdotto() {
    if (!this.prodottoScelto) return;
    this.acquistando = true;
    this.cdr.detectChanges();

    const token = this.getToken();
    try {
      const res = await fetch(`${this.API}/acquista-prodotto`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prodottoId: this.prodottoScelto.id })
      });
      const data = await res.json();
      if (res.ok) {
        this.puntiFedelta = data.puntiFedeltaRimanenti;
        this.puntiService.aggiorna(data.puntiFedeltaRimanenti);
        this.prodottiUsati = this.prodottiUsati
          .map(p => p.id === this.prodottoScelto!.id ? { ...p, giacenza: p.giacenza - 1 } : p)
          .filter(p => p.giacenza > 0);
        this.annullaConferma();
        this.toast.success(`Acquisto effettuato! Ordine #${data.ordineId} creato con ${data.costoInPunti} punti.`);
      } else {
        this.toast.error(data.error || 'Errore durante l\'acquisto.');
      }
    } catch (e) {
      console.error('[Fedelta] Errore di rete acquisto prodotto:', e);
      this.toast.error('Errore di connessione al server.');
    } finally {
      this.acquistando = false;
      this.cdr.detectChanges();
    }
  }

  isAcquistandoPreset(percentuale: number): boolean {
    return !!this.acquistandoPresetMap[percentuale];
  }

  getCopiaAbbreviata(codice: string): string {
    return codice.length > 20 ? codice.substring(0, 20) + '\u2026' : codice;
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
