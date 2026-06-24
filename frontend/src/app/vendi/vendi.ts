import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// Interfaccia per il prodotto, riutilizzata dal componente Prodotti
export interface Prodotto {
  id: number;
  categoria_id: number;
  categoria_nome: string; // Nome derivato dalla tabella Categoria (denominazione)
  nome: string;
  descrizione: string;
  giacenza: number;
  immagine: string;
  prezzoUnitarioAcquisto: number;
  PrezzoUnitarioVendita: number;
  pubblicatoAcquisto: boolean;
  pubblicatoVetrina: boolean;
  condizione: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

@Component({
  selector: 'app-vendi',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './vendi.html',
  styleUrl: './vendi.css',
})
export class Vendi implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('particleCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('heroBox') heroBoxRef!: ElementRef<HTMLDivElement>;

  prodotti: Prodotto[] = [];
  prodottiFiltrati: Prodotto[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  searchTerm: string = '';
  categoriaSelezionata: string = 'Tutti';

  // Proprietà per la paginazione
  paginaCorrente: number = 1;
  elementiPerPagina: number = 9;

  private routeSub: Subscription | undefined;

  // ── Canvas / rete neurale ─────────────────────────────────
  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animFrame!: number;
  private mouse = { x: -999, y: -999 };
  private numParticles = 200;
  private resizeListener?: () => void;
  private readonly COLORS = ['#f86ded', '#a78bfa'];

  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.caricaProdotti();
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    requestAnimationFrame(() => this.setupCanvas());
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    if (isPlatformBrowser(this.platformId)) {
      if (this.animFrame !== undefined) cancelAnimationFrame(this.animFrame);
      if (this.resizeListener) window.removeEventListener('resize', this.resizeListener);
    }
  }

  // ── Canvas logic (replicata da home.ts) ──────────────────
  private setupCanvas(): void {
    const canvas = this.canvasRef?.nativeElement;
    const box = this.heroBoxRef?.nativeElement;
    if (!canvas || !box) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;

    this.resizeListener = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = box.offsetWidth;
      const h = box.offsetHeight;
      if (w === 0 || h === 0) {
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

  private initParticles(width: number, height: number): void {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 1.5 + 0.8,
        color: this.COLORS[Math.floor(Math.random() * this.COLORS.length)]
      });
    }
  }

  private animate(): void {
    if (!this.ctx) return;
    const box = this.heroBoxRef.nativeElement;
    const w = box.offsetWidth;
    const h = box.offsetHeight;

    this.ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;

      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        const angle = Math.atan2(dy, dx);
        const force = (150 - dist) / 150;
        p.x -= Math.cos(angle) * force * 2;
        p.y -= Math.sin(angle) * force * 2;
      }

      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();

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

  // ── Logica prodotti (invariata) ───────────────────────────
  async caricaProdotti() {
    this.isLoading = true;
    this.errorMessage = '';
    this.prodotti = [];
    this.prodottiFiltrati = [];

    try {
      const response = await fetch(`http://localhost:3000/api/prodotti`);
      if (response.ok) {
        const data = await response.json();
        const allowedCategories = ['Videogiochi', 'Console', 'Accessori', 'Elettronica'];
        
        // Mostra tutte le righe del DB (sia Nuovo che Usato) senza deduplicare.
        // Questo permette all'utente di scegliere la versione specifica da vendere.
        this.prodotti = data
          .filter((p: Prodotto) => allowedCategories.includes(p.categoria_nome))
          .map((p: Prodotto) => ({ ...p, condizione: p.condizione === 'Usata' ? 'Usato' : p.condizione }));


        this.applicaFiltri();
        console.log('Prodotti caricati per la vendita:', this.prodotti);
      } else {
        this.errorMessage = 'Errore nel recupero dei prodotti.';
      }
    } catch (error) {
      console.error('Errore di connessione al server:', error);
      this.errorMessage = 'Impossibile contattare il server.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  applicaFiltri() {
    let result = [...this.prodotti];
    if (this.categoriaSelezionata !== 'Tutti') {
      result = result.filter(p => p.categoria_nome === this.categoriaSelezionata);
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p =>
        p.nome.toLowerCase().includes(term) ||
        (p.descrizione && p.descrizione.toLowerCase().includes(term))
      );
    }
    this.prodottiFiltrati = result;
    this.paginaCorrente = 1;
    this.cdr.detectChanges();
  }

  impostaFiltro(categoria: string) {
    this.categoriaSelezionata = categoria;
    this.applicaFiltri();
  }

  selezionaProdottoPerVendita(prodottoId: number) {
    this.router.navigate(['/vendi', prodottoId]);
  }

  handleImageError(event: any) {
    event.target.src = 'https://via.placeholder.com/150?text=No+Image';
  }

  getProdottiPaginati(): Prodotto[] {
    const inizio = (this.paginaCorrente - 1) * this.elementiPerPagina;
    const fine = inizio + this.elementiPerPagina;
    return this.prodottiFiltrati.slice(inizio, fine);
  }

  getNumeroPagine(): number {
    return Math.ceil(this.prodottiFiltrati.length / this.elementiPerPagina);
  }

  getPagineVisibili(): number[] {
    const numPagine = this.getNumeroPagine();
    const maxVisibili = 5;
    let inizio = Math.max(1, this.paginaCorrente - Math.floor(maxVisibili / 2));
    let fine = Math.min(numPagine, inizio + maxVisibili - 1);
    if (fine - inizio < maxVisibili - 1) inizio = Math.max(1, fine - maxVisibili + 1);
    return Array.from({ length: (fine - inizio) + 1 }, (_, i) => inizio + i);
  }

  cambiaPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.getNumeroPagine()) {
      this.paginaCorrente = pagina;
      if (isPlatformBrowser(this.platformId)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }
}
