import {
  Component,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CarrelloService } from '../carrello.service';
import { ToastService } from '../shared/toast.service';
import { NeuralCanvasService } from '../shared/neural-canvas.service';

type CarouselType = 'consigliati' | 'usato';
type CarouselDirection = 'left' | 'right';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('particleCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('heroBox') heroBoxRef!: ElementRef<HTMLDivElement>;
  @ViewChild('scrollContainer') scrollContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('scrollUsatoContainer') scrollUsatoContainerRef!: ElementRef<HTMLDivElement>;

  public prodottiConsigliati: any[] = [];
  public prodottiUsati: any[] = [];
  public prodottiConsigliatiLoop: any[] = [];
  public prodottiUsatiLoop: any[] = [];
  public preferiti: number[] = [];

  public recensioniPubbliche: any[] = [];

  private prezzoNuovoPerNome: Map<string, number> = new Map();

  private readonly carouselCloneCount = 4;
  private readonly autoplayDelay = 4800;
  private readonly autoplayRestartDelay = 6500;

  private consigliatiInterval: any = null;
  private usatoInterval: any = null;

  private consigliatiPaused = false;
  private usatoPaused = false;

  private consigliatiManualRestartTimeout: any = null;
  private usatoManualRestartTimeout: any = null;

  private RETRO_KEYWORDS = [
    'playstation 1', 'playstation 2', 'playstation 3', 'ps1', 'ps2', 'ps3',
    'black ops iii', 'uncharted 3', 'need for speed rivals', 'farcry 3', 'gran turismo 5'
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    public carrelloService: CarrelloService,
    private toast: ToastService,
    private neuralCanvas: NeuralCanvasService
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.caricaDatiCatalogo();
      this.caricaPreferiti();
      this.caricaRecensioniPubbliche();
    }
  }

  caricaPreferiti() {
    const salvati = localStorage.getItem('preferiti');
    if (salvati) {
      this.preferiti = JSON.parse(salvati);
    }
  }

  async caricaRecensioniPubbliche() {
    try {
      const res = await fetch('http://localhost:3000/api/recensioni');
      if (res.ok) {
        const tutte = await res.json();
        this.recensioniPubbliche = tutte
          .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())
          .slice(0, 6);
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Errore caricamento recensioni:', error);
    }
  }

  stelle(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i + 1);
  }

  async caricaDatiCatalogo() {
    try {
      const response = await fetch('http://localhost:3000/api/prodotti');

      if (response.ok) {
        const tuttiIProdotti = await response.json();

        tuttiIProdotti.forEach((p: any) => {
          if (p.condizione === 'Usata') p.condizione = 'Usato';
        });

        this.prezzoNuovoPerNome = new Map();
        tuttiIProdotti.forEach((p: any) => {
          if (p.condizione === 'Nuovo') {
            const key = (p.nome || '').trim().toLowerCase();
            this.prezzoNuovoPerNome.set(key, Number(p.prezzoUnitarioVendita));
          }
        });

        const disponibili = tuttiIProdotti.filter((p: any) => Number(p.giacenza) > 0);

        let selezione = disponibili.sort(() => 0.5 - Math.random()).slice(0, 12);
        selezione = this.applyCustomReplacements(selezione, disponibili);
        this.prodottiConsigliati = selezione.map((raw: any) => this.preferredVariant(raw));

        const usati = disponibili
          .filter((p: any) => p.condizione === 'Usato' || this.isRetrogaming(p))
          .sort(() => 0.5 - Math.random())
          .slice(0, 12);

        this.prodottiUsati = usati.map((raw: any) => this.usatoVariantConSconto(raw));

        this.prodottiConsigliatiLoop = this.buildLoopedProducts(this.prodottiConsigliati);
        this.prodottiUsatiLoop = this.buildLoopedProducts(this.prodottiUsati);
      }

      this.cdr.detectChanges();

      requestAnimationFrame(() => {
        this.initCarouselsIfReady();
      });
    } catch (error) {
      console.error('Errore nel caricamento del catalogo dalla Home:', error);
    }
  }

  private buildLoopedProducts(list: any[]): any[] {
    if (!list || list.length === 0) return [];
    const cloneCount = Math.min(this.carouselCloneCount, list.length);
    const head = list.slice(0, cloneCount);
    const tail = list.slice(-cloneCount);
    return [...tail, ...list, ...head];
  }

  private usatoVariantConSconto(raw: any): any {
    const prezzoDB = Number(raw.prezzoUnitarioVendita);
    const key = (raw.nome || '').trim().toLowerCase();
    const prezzoNuovoDb = this.prezzoNuovoPerNome.get(key);
    const prezzoOriginale =
      prezzoNuovoDb !== undefined && prezzoNuovoDb > prezzoDB
        ? prezzoNuovoDb
        : Math.round((prezzoDB / 0.75) * 100) / 100;
    return { ...raw, condizioneVariante: 'Usato', prezzoVariante: prezzoDB, prezzoOriginale };
  }

  private applyCustomReplacements(selezione: any[], tuttiIProdotti: any[]): any[] {
    const ps5 = tuttiIProdotti.find((p: any) => p.nome.toLowerCase().includes('ps5') && !p.nome.toLowerCase().includes('ps4'));
    const xbox = tuttiIProdotti.find((p: any) => p.nome.toLowerCase().includes('xbox series'));
    const gta = tuttiIProdotti.find((p: any) => p.nome.toLowerCase().includes('gta') || p.nome.toLowerCase().includes('grand theft'));
    const spiderman = tuttiIProdotti.find((p: any) => p.nome.toLowerCase().includes('spider'));
    const custom = [ps5, xbox, gta, spiderman].filter(Boolean);
    for (let i = 0; i < custom.length && i < selezione.length; i++) {
      selezione[i] = custom[i];
    }
    return selezione;
  }

  private isRetrogaming(p: any): boolean {
    const nome = (p?.nome || '').toLowerCase();
    return this.RETRO_KEYWORDS.some((kw) => nome.includes(kw));
  }

  private preferredVariant(raw: any): any {
    const prezzoDB = Number(raw.prezzoUnitarioVendita);
    if (this.isRetrogaming(raw) || raw.condizione === 'Usato' || raw.condizione === 'Usata') {
      return { ...raw, condizioneVariante: 'Usato', prezzoVariante: prezzoDB, prezzoOriginale: null };
    }
    return { ...raw, condizioneVariante: 'Nuovo', prezzoVariante: prezzoDB, prezzoOriginale: null };
  }

  getPrezzoVisualizzato(p: any): number {
    if (p?.prezzoVariante !== undefined) return Number(p.prezzoVariante);
    return Number(p.prezzoUnitarioVendita);
  }

  getPrezzoOriginale(p: any): number | null {
    if (!p || p.prezzoOriginale == null) return null;
    return Number(p.prezzoOriginale);
  }

  isVariantUsato(p: any): boolean {
    return p?.condizioneVariante === 'Usato';
  }

  isPreferito(id: number): boolean {
    return this.preferiti.includes(id);
  }

  togglePreferito(prodotto: any) {
    const index = this.preferiti.indexOf(prodotto.id);
    if (index > -1) {
      this.preferiti.splice(index, 1);
    } else {
      this.preferiti.push(prodotto.id);
    }
    localStorage.setItem('preferiti', JSON.stringify(this.preferiti));
  }

  async aggiungiAlCarrello(prodotto: any) {
    const condizioneScelta = prodotto.condizioneVariante || 'Nuovo';
    const prezzoFinale = this.getPrezzoVisualizzato(prodotto);
    const successo = await this.carrelloService.aggiungiProdotto(
      prodotto, 1, condizioneScelta, prezzoFinale
    );
    if (successo) {
      this.toast.success(`${prodotto.nome} (${condizioneScelta}) aggiunto al carrello a €${prezzoFinale}!`);
    }
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    requestAnimationFrame(() => {
      const canvas = this.canvasRef?.nativeElement;
      const heroBox = this.heroBoxRef?.nativeElement;
      if (canvas && heroBox) {
        this.neuralCanvas.init(canvas, heroBox);
      }
      setTimeout(() => {
        this.initCarouselsIfReady();
      }, 150);
    });
  }

  private initCarouselsIfReady(): void {
    if (this.prodottiConsigliati.length > 0 && this.scrollContainerRef?.nativeElement) {
      this.setInitialLoopPosition('consigliati');
      this.startAutoplay('consigliati');
    }
    if (this.prodottiUsati.length > 0 && this.scrollUsatoContainerRef?.nativeElement) {
      this.setInitialLoopPosition('usato');
      this.startAutoplay('usato');
    }
  }

  private getContainer(type: CarouselType): HTMLDivElement | null {
    if (type === 'consigliati') return this.scrollContainerRef?.nativeElement ?? null;
    return this.scrollUsatoContainerRef?.nativeElement ?? null;
  }

  private getSourceList(type: CarouselType): any[] {
    return type === 'consigliati' ? this.prodottiConsigliati : this.prodottiUsati;
  }

  private getCardStep(container: HTMLElement): number {
    const firstCard = container.querySelector('.horizontal-scroll-item') as HTMLElement | null;
    if (!firstCard) return 274;
    const style = window.getComputedStyle(firstCard);
    const marginRight = parseFloat(style.marginRight || '0');
    return firstCard.offsetWidth + marginRight;
  }

  private setInitialLoopPosition(type: CarouselType): void {
    const container = this.getContainer(type);
    const sourceList = this.getSourceList(type);
    if (!container || sourceList.length === 0) return;
    const cloneCount = Math.min(this.carouselCloneCount, sourceList.length);
    const step = this.getCardStep(container);
    container.scrollLeft = cloneCount * step;
  }

  private handleInfiniteLoop(type: CarouselType): void {
    const container = this.getContainer(type);
    const sourceList = this.getSourceList(type);
    if (!container || sourceList.length === 0) return;
    const cloneCount = Math.min(this.carouselCloneCount, sourceList.length);
    const step = this.getCardStep(container);
    const totalRealWidth = sourceList.length * step;
    const min = cloneCount * step;
    const max = min + totalRealWidth;
    if (container.scrollLeft <= step * 0.5) {
      container.scrollLeft = min + totalRealWidth - step;
    } else if (container.scrollLeft >= max - step * 0.5) {
      container.scrollLeft = min;
    }
  }

  private scrollOneStep(type: CarouselType, direction: CarouselDirection = 'right'): void {
    const container = this.getContainer(type);
    if (!container) return;
    const step = this.getCardStep(container);
    const delta = direction === 'right' ? step : -step;
    container.scrollBy({ left: delta, behavior: 'smooth' });
  }

  private startAutoplay(type: CarouselType): void {
    this.stopAutoplay(type);
    const interval = setInterval(() => {
      const isPaused = type === 'consigliati' ? this.consigliatiPaused : this.usatoPaused;
      if (!isPaused) this.scrollOneStep(type, 'right');
    }, this.autoplayDelay);
    if (type === 'consigliati') {
      this.consigliatiInterval = interval;
    } else {
      this.usatoInterval = interval;
    }
  }

  private stopAutoplay(type: CarouselType): void {
    if (type === 'consigliati' && this.consigliatiInterval) {
      clearInterval(this.consigliatiInterval);
      this.consigliatiInterval = null;
    }
    if (type === 'usato' && this.usatoInterval) {
      clearInterval(this.usatoInterval);
      this.usatoInterval = null;
    }
  }

  pauseCarousel(type: CarouselType): void {
    if (type === 'consigliati') { this.consigliatiPaused = true; }
    else { this.usatoPaused = true; }
  }

  resumeCarousel(type: CarouselType): void {
    if (type === 'consigliati') { this.consigliatiPaused = false; }
    else { this.usatoPaused = false; }
  }

  manualScroll(type: CarouselType, direction: CarouselDirection): void {
    this.scrollOneStep(type, direction);
    this.scheduleAutoplayRestart(type);
  }

  private scheduleAutoplayRestart(type: CarouselType): void {
    if (type === 'consigliati') {
      if (this.consigliatiManualRestartTimeout) clearTimeout(this.consigliatiManualRestartTimeout);
      this.stopAutoplay('consigliati');
      this.consigliatiManualRestartTimeout = setTimeout(() => this.startAutoplay('consigliati'), this.autoplayRestartDelay);
    } else {
      if (this.usatoManualRestartTimeout) clearTimeout(this.usatoManualRestartTimeout);
      this.stopAutoplay('usato');
      this.usatoManualRestartTimeout = setTimeout(() => this.startAutoplay('usato'), this.autoplayRestartDelay);
    }
  }

  onCarouselScroll(type: CarouselType): void {
    requestAnimationFrame(() => this.handleInfiniteLoop(type));
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.canvasRef?.nativeElement) {
        this.neuralCanvas.destroy(this.canvasRef.nativeElement);
      }
      this.stopAutoplay('consigliati');
      this.stopAutoplay('usato');
      if (this.consigliatiManualRestartTimeout) clearTimeout(this.consigliatiManualRestartTimeout);
      if (this.usatoManualRestartTimeout) clearTimeout(this.usatoManualRestartTimeout);
    }
  }
}
