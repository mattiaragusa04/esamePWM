import { Component, OnInit, OnDestroy, AfterViewInit, Inject, PLATFORM_ID, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NeuralCanvasService } from '../shared/neural-canvas.service';

export interface CouponRiscattato {
  codice: string;
  percentuale: number;
  scadenza: string;
  dataAcquisto?: string;
}

@Component({
  selector: 'app-profilo',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './profilo.html',
  styleUrls: ['./profilo.css']
})
export class Profilo implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('profiloCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('profiloHero')   heroRef!:   ElementRef<HTMLDivElement>;

  utente: any = null;

  totalOrdini    = 0;
  totalVendite   = 0;
  totalPreferiti = 0;

  couponRiscattati: CouponRiscattato[] = [];

  // ── Recensione (Opzione C: banner fisso nel profilo) ──────────────────────
  haOrdineConsegnato: boolean = false;
  miaRecensione: any = null;          // null = non ha ancora recensito
  mostraPopupRecensione: boolean = false;
  recensioneForm = { voto: 0, testo: '' };
  stelleHover: number = 0;
  recensioneInvio: boolean = false;
  recensioneErrore: string = '';
  recensioneSuccesso: boolean = false;
  // ─────────────────────────────────────────────────────────────────────────

  private readonly API         = 'http://localhost:3000/api/auth/profile';
  private readonly API_FEDELTA = 'http://localhost:3000/api/coupon';
  private readonly API_ORDINI  = 'http://localhost:3000/api/ordine/utente';
  private readonly API_VENDI   = 'http://localhost:3000/api/vendi/utente';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private neuralCanvas: NeuralCanvasService
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.caricaProfilo();
    this.caricaCouponRiscattati();
    this.caricaContatori();
    this.caricaStatoRecensione();
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
        // controlla se c'è almeno un ordine consegnato
        this.haOrdineConsegnato = Array.isArray(ordini) && ordini.some((o: any) => o.statoOrdine === 'Consegnato');
      }

      if (resVendite.ok) {
        const vendite = await resVendite.json();
        this.totalVendite = Array.isArray(vendite) ? vendite.length : 0;
      }
    } catch {
      console.error('[Profilo] Errore nel caricamento dei contatori.');
    }

    try {
      const salvati = localStorage.getItem('preferiti');
      this.totalPreferiti = salvati ? JSON.parse(salvati).length : 0;
    } catch {
      this.totalPreferiti = 0;
    }

    this.cdr.detectChanges();
  }

  async caricaStatoRecensione() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3000/api/recensioni/mia', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        this.miaRecensione = data.recensione || null;
      }
    } catch {
      console.error('[Profilo] Errore controllo recensione.');
    } finally {
      this.cdr.detectChanges();
    }
  }

  apriPopupRecensione() {
    if (this.miaRecensione) {
      this.recensioneForm.voto  = this.miaRecensione.voto;
      this.recensioneForm.testo = this.miaRecensione.testo;
    } else {
      this.recensioneForm = { voto: 0, testo: '' };
    }
    this.recensioneErrore   = '';
    this.recensioneSuccesso = false;
    this.mostraPopupRecensione = true;
    this.cdr.detectChanges();
  }

  chiudiPopupRecensione() {
    this.mostraPopupRecensione = false;
    this.recensioneErrore = '';
  }

  setVoto(v: number) {
    this.recensioneForm.voto = v;
  }

  async inviaRecensione() {
    this.recensioneErrore = '';
    if (this.recensioneForm.voto < 1 || this.recensioneForm.voto > 5) {
      this.recensioneErrore = 'Seleziona un voto tra 1 e 5 stelle.';
      return;
    }
    if (!this.recensioneForm.testo.trim()) {
      this.recensioneErrore = 'Scrivi qualcosa nella recensione.';
      return;
    }

    this.recensioneInvio = true;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3000/api/recensioni', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          voto:  this.recensioneForm.voto,
          testo: this.recensioneForm.testo.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        this.recensioneSuccesso = true;
        this.miaRecensione = {
          voto:  this.recensioneForm.voto,
          testo: this.recensioneForm.testo.trim()
        };
        setTimeout(() => {
          this.chiudiPopupRecensione();
          this.recensioneSuccesso = false;
          this.cdr.detectChanges();
        }, 1800);
      } else {
        this.recensioneErrore = data.error || 'Errore durante il salvataggio.';
      }
    } catch {
      this.recensioneErrore = 'Errore di rete. Riprova.';
    } finally {
      this.recensioneInvio = false;
      this.cdr.detectChanges();
    }
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
