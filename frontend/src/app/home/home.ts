import { Component, OnDestroy, ViewChild, ElementRef, AfterViewInit, Inject, PLATFORM_ID, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CarrelloService } from '../carrello.service';
import { ToastService } from '../shared/toast.service';
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('particleCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('heroBox') heroBoxRef!: ElementRef<HTMLDivElement>;

  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animFrame!: number;
  private mouse = { x: -999, y: -999 };
  private numParticles = 200;
  private resizeListener?: () => void;

  private COLORS = ['#f86ded', '#a78bfa'];

  public prodottiConsigliati: any[] = [];
  public prezzoCondizione: { [id: number]: 'Nuovo' | 'Usato' } = {};
  public preferiti: number[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private cdr: ChangeDetectorRef, public carrelloService: CarrelloService, private toast: ToastService) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.caricaDatiCatalogo();
      this.caricaPreferiti();
    }
  }

  caricaPreferiti() {
    const salvati = localStorage.getItem('preferiti');
    if (salvati) {
      this.preferiti = JSON.parse(salvati);
    }
  }

  async caricaDatiCatalogo() {
    try {
      // Carica tutti i prodotti e mescolali per un effetto "consigliato"
      const response = await fetch('http://localhost:3000/api/prodotti');
      if (response.ok) {
        const tuttiIProdotti = await response.json();
        // Mescola l'array per un effetto casuale e ne prende 12
        this.prodottiConsigliati = tuttiIProdotti.sort(() => 0.5 - Math.random()).slice(0, 12);
        this.prodottiConsigliati.forEach((p: any) => this.prezzoCondizione[p.id] = 'Nuovo');
        // Sostituisci alcune card consigliate con prodotti reali cercati nel catalogo
        this.injectCustomReplacements(tuttiIProdotti);
      }

      this.cdr.detectChanges(); // Aggiorna la vista
    } catch (error) {
      console.error('Errore nel caricamento del catalogo dalla Home:', error);
    }
  }

  private injectCustomReplacements(tuttiIProdotti: any[]) {
    // Cerca i prodotti reali dal database per parole chiave
    const ps5 = tuttiIProdotti.find(p => p.nome.toLowerCase().includes('ps5') && !p.nome.toLowerCase().includes('ps4'));
    const xbox = tuttiIProdotti.find(p => p.nome.toLowerCase().includes('xbox series'));
    const gta = tuttiIProdotti.find(p => p.nome.toLowerCase().includes('gta') || p.nome.toLowerCase().includes('grand theft'));
    const spiderman = tuttiIProdotti.find(p => p.nome.toLowerCase().includes('spider'));

    const custom = [];
    if (ps5) custom.push(ps5);
    if (xbox) custom.push(xbox);
    if (gta) custom.push(gta);
    if (spiderman) custom.push(spiderman);

    // Sostituisci i primi elementi delle card consigliate con i prodotti trovati
    for (let i = 0; i < custom.length && i < this.prodottiConsigliati.length; i++) {
      this.prodottiConsigliati[i] = custom[i];
      this.prezzoCondizione[custom[i].id] = 'Nuovo';
    }

    this.cdr.detectChanges();
  }

  setCondizione(prodId: number, cond: 'Nuovo' | 'Usato') {
    this.prezzoCondizione[prodId] = cond;
  }

  getPrezzoVisualizzato(p: any): number {
    const cond = this.prezzoCondizione[p.id] || 'Nuovo';
    if (cond === 'Usato') {
      return Math.round((p.prezzoUnitarioVendita * 0.75) * 100) / 100;
    }
    return p.prezzoUnitarioVendita;
  }

  isPreferito(id: number): boolean {
    return this.preferiti.includes(id);
  }

  togglePreferito(prodotto: any) {
    const index = this.preferiti.indexOf(prodotto.id);
    if (index > -1) {
      this.preferiti.splice(index, 1); // Rimuove se c'è già
    } else {
      this.preferiti.push(prodotto.id); // Aggiunge se non c'è
    }
    localStorage.setItem('preferiti', JSON.stringify(this.preferiti));
  }

  async aggiungiAlCarrello(prodotto: any) {
    const condizioneScelta = this.prezzoCondizione[prodotto.id] || 'Nuovo';
    const prezzoFinale = this.getPrezzoVisualizzato(prodotto);

    // Delega tutta la logica (ospite/loggato e aggiornamento navbar) al CarrelloService
    const successo = await this.carrelloService.aggiungiProdotto(prodotto, 1, condizioneScelta, prezzoFinale);

    if (successo) {
      this.toast.success(`${prodotto.nome} (${condizioneScelta}) aggiunto al carrello a €${prezzoFinale}!`);
    }
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Diamo al browser un frame per applicare CSS/layout prima di leggere offsetWidth
    requestAnimationFrame(() => this.setupCanvas());
  }

  private setupCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    const box = this.heroBoxRef?.nativeElement;
    if (!canvas || !box) {
      console.warn('[Home] canvas o hero-box non trovati');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('[Home] impossibile ottenere il context 2D');
      return;
    }
    this.ctx = ctx;

    // Resize canvas al box (con device pixel ratio per nitidezza su retina)
    this.resizeListener = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = box.offsetWidth;
      const h = box.offsetHeight;
      if (w === 0 || h === 0) {
        // Layout non ancora pronto: ritenta al frame successivo
        requestAnimationFrame(() => this.resizeListener && this.resizeListener());
        return;
      }
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
      this.initParticles(w, h);
    };
    this.resizeListener();
    window.addEventListener('resize', this.resizeListener);

    box.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = box.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    box.addEventListener('mouseleave', () => {
      this.mouse = { x: -999, y: -999 };
    });

    this.animate();
  }

  private initParticles(width?: number, height?: number) {
    const canvas = this.canvasRef.nativeElement;
    // Lavoriamo in pixel CSS (lo scale dpr è applicato al context)
    const w = width ?? canvas.width;
    const h = height ?? canvas.height;
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 1.5 + 0.8,
        color: this.COLORS[Math.floor(Math.random() * this.COLORS.length)]
      });
    }
  }

  private animate() {
    if (!this.ctx) return;
    const box = this.heroBoxRef.nativeElement;
    const w = box.offsetWidth;
    const h = box.offsetHeight;
    this.ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;

      // Repulsione Antigravity
      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        const angle = Math.atan2(dy, dx);
        const force = (150 - dist) / 150;
        p.x -= Math.cos(angle) * force * 2;
        p.y -= Math.sin(angle) * force * 2;
      }

      // Bounce sui bordi (usiamo le dimensioni CSS del box)
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      // Disegno particella
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();

      // Connessioni
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const distP = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);

        if (distP < 110) {
          this.ctx.beginPath();
          const gradient = this.ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
          gradient.addColorStop(0, p.color);
          gradient.addColorStop(1, p2.color);
          this.ctx.strokeStyle = gradient;
          this.ctx.globalAlpha = (1 - distP / 110) * 0.4;
          this.ctx.lineWidth = 0.8;
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
          this.ctx.globalAlpha = 1;
        }
      }
    }

    this.animFrame = requestAnimationFrame(() => this.animate());
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.animFrame !== undefined) {
        cancelAnimationFrame(this.animFrame);
      }
      if (this.resizeListener) {
        window.removeEventListener('resize', this.resizeListener);
      }
    }
  }

}