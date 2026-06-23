import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NeuralCanvasService } from '../shared/neural-canvas.service';

@Component({
  selector: 'app-ordini',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './ordini.html',
  styleUrls: ['./ordini.css', '../vendite/vendite.css'],
})
export class Ordini implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('ordiniCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ordiniHero')   heroRef!:   ElementRef<HTMLDivElement>;

  ordini: any[] = [];
  isLoading: boolean = true;
  utente: any = null;

  // Dettaglio ordine
  ordineSelezionato: any = null;
  dettagliOrdine: any[] = [];
  isLoadingDettagli: boolean = false;

  // ── Recensione ─────────────────────────────────────────────────────────────
  mostraPopupRecensione: boolean = false;
  miaRecensione: any = null;          // null = non ha ancora recensito
  recensioneForm = { voto: 0, testo: '' };
  stelleHover: number = 0;            // per l'effetto hover sulle stelle
  recensioneInvio: boolean = false;
  recensioneErrore: string = '';
  recensioneSuccesso: boolean = false;
  // ---------------------------------------------------------------------------

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private neuralCanvas: NeuralCanvasService
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const userString = localStorage.getItem('user');
      if (userString) {
        this.utente = JSON.parse(userString);
      }
      this.caricaOrdini();
    }
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

  async caricaOrdini() {
    this.isLoading = true;
    const token = localStorage.getItem('token');
    if (!token) { this.isLoading = false; return; }
    try {
      const response = await fetch('http://localhost:3000/api/ordine/utente', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        this.ordini = await response.json();
        this.ordini.sort((a, b) => b.id - a.id);

        // Dopo aver caricato gli ordini, controlla se mostrare il popup
        await this.controllaPopupRecensione();
      }
    } catch (error) {
      console.error('Errore di rete:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Mostra il popup automaticamente se:
   * 1) l'utente ha almeno un ordine con statoOrdine === 'Consegnato'
   * 2) l'utente non ha ancora lasciato una recensione
   */
  async controllaPopupRecensione() {
    const haOrdineConsegnato = this.ordini.some(o => o.statoOrdine === 'Consegnato');
    if (!haOrdineConsegnato) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:3000/api/recensioni/mia', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        this.miaRecensione = data.recensione;
        // Apri automaticamente il popup solo se non ha ancora recensito
        if (!this.miaRecensione) {
          this.mostraPopupRecensione = true;
        }
      }
    } catch (e) {
      console.error('Errore controllo recensione:', e);
    }
  }

  /** Apre manualmente il popup (dal bottone nella lista ordini) */
  apriPopupRecensione() {
    // Precompila il form se sta modificando la recensione esistente
    if (this.miaRecensione) {
      this.recensioneForm.voto = this.miaRecensione.voto;
      this.recensioneForm.testo = this.miaRecensione.testo;
    } else {
      this.recensioneForm = { voto: 0, testo: '' };
    }
    this.recensioneErrore = '';
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
          voto: this.recensioneForm.voto,
          testo: this.recensioneForm.testo.trim()
        })
      });

      const data = await res.json();

      if (res.ok) {
        this.recensioneSuccesso = true;
        // Aggiorna la recensione locale
        this.miaRecensione = {
          voto: this.recensioneForm.voto,
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
    } catch (e) {
      this.recensioneErrore = 'Errore di rete. Riprova.';
    } finally {
      this.recensioneInvio = false;
      this.cdr.detectChanges();
    }
  }

  // ── Dettaglio ordine ────────────────────────────────────────────────────────

  async apriDettaglio(ordine: any) {
    this.ordineSelezionato = ordine;
    this.dettagliOrdine = [];
    this.isLoadingDettagli = true;
    this.cdr.detectChanges();

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3000/api/ordine/${ordine.id}/prodotti`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        this.dettagliOrdine = await res.json();
      } else {
        console.error('Errore risposta prodotti ordine:', res.status, await res.text());
      }
    } catch (e) {
      console.error('Errore caricamento dettagli:', e);
    } finally {
      this.isLoadingDettagli = false;
      this.cdr.detectChanges();
    }
  }

  chiudiDettaglio() {
    this.ordineSelezionato = null;
    this.dettagliOrdine = [];
  }

  /**
   * True se TUTTI i prodotti dell'ordine sono stati pagati con punti fedeltà.
   */
  get ordinePagatoConPunti(): boolean {
    if (!this.dettagliOrdine.length) return false;
    return this.dettagliOrdine.every(item => item.pagato_con_punti == 1);
  }

  get totalePuntiSpesi(): number {
    return this.dettagliOrdine.reduce((acc, item) => {
      return acc + ((item.puntiFedelta ?? 0) * (item.quantita ?? 1));
    }, 0);
  }

  get puntiFedeltaOrdine(): number {
    if (this.ordineSelezionato?.punti_fedelta != null) {
      return this.ordineSelezionato.punti_fedelta;
    }
    const totale = this.ordineSelezionato?.totale_scontato ?? this.ordineSelezionato?.totale ?? 0;
    return Math.floor(totale / 5);
  }

  get subtotaleDettaglio(): number {
    return this.dettagliOrdine.reduce((acc, item) => acc + (item.prezzoUnitario * item.quantita), 0);
  }

  /** True se almeno uno degli ordini è stato consegnato (per mostrare il banner) */
  get haOrdineConsegnato(): boolean {
    return this.ordini.some(o => o.statoOrdine === 'Consegnato');
  }
}
