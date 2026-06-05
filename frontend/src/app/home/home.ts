import { Component, OnDestroy, ViewChild, ElementRef, AfterViewInit, Inject, PLATFORM_ID, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';

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

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.caricaDatiCatalogo();
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
      }

      this.cdr.detectChanges(); // Aggiorna la vista
    } catch (error) {
      console.error('Errore nel caricamento del catalogo dalla Home:', error);
    }
  }
  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const canvas = this.canvasRef.nativeElement;
      const box = this.heroBoxRef.nativeElement;
      this.ctx = canvas.getContext('2d')!;

      // Resize canvas al box
      this.resizeListener = () => {
        canvas.width = box.offsetWidth;
        canvas.height = box.offsetHeight;
        this.initParticles();
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
  }

  private initParticles() {
    const canvas = this.canvasRef.nativeElement;
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 1.5 + 0.5,
        color: this.COLORS[Math.floor(Math.random() * this.COLORS.length)]
      });
    }
  }

  private animate() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

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

      // Bounce sui bordi
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

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