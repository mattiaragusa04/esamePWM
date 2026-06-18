import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

@Injectable({ providedIn: 'root' })
export class NeuralCanvasService {
  private ctx!: CanvasRenderingContext2D;
  private canvas!: HTMLCanvasElement;
  private container!: HTMLElement;
  private particles: Particle[] = [];
  private animFrame!: number;
  private mouse = { x: -999, y: -999 };
  private resizeListener?: () => void;
  private mouseMoveListener?: (e: MouseEvent) => void;
  private readonly numParticles = 200;
  private readonly COLORS = ['#f86ded', '#a78bfa'];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  /**
   * Inizializza il canvas neurale dentro il container indicato.
   * @param canvas  - l'elemento <canvas> del componente
   * @param container - il wrapper hero/banner che fa da riferimento dimensionale
   */
  init(canvas: HTMLCanvasElement, container: HTMLElement): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.canvas = canvas;
    this.container = container;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;

    this.setupCanvas();
    this.initParticles();
    this.animate();

    this.resizeListener = () => {
      this.setupCanvas();
      this.initParticles();
    };
    window.addEventListener('resize', this.resizeListener);

    this.mouseMoveListener = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    };
    this.canvas.addEventListener('mousemove', this.mouseMoveListener);
  }

  /** Ferma l'animazione e rimuove i listener. Da chiamare in ngOnDestroy. */
  destroy(): void {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.resizeListener) window.removeEventListener('resize', this.resizeListener);
    if (this.mouseMoveListener && this.canvas) {
      this.canvas.removeEventListener('mousemove', this.mouseMoveListener);
    }
    this.particles = [];
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private setupCanvas(): void {
    this.canvas.width  = this.container.offsetWidth;
    this.canvas.height = this.container.offsetHeight;
  }

  private initParticles(): void {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x:     Math.random() * this.canvas.width,
        y:     Math.random() * this.canvas.height,
        vx:    (Math.random() - 0.5) * 0.6,
        vy:    (Math.random() - 0.5) * 0.6,
        size:  Math.random() * 2 + 1,
        color: this.COLORS[Math.floor(Math.random() * this.COLORS.length)],
      });
    }
  }

  private animate(): void {
    this.animFrame = requestAnimationFrame(() => this.animate());

    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    // Connessioni tra particelle vicine
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx   = this.particles[i].x - this.particles[j].x;
        const dy   = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 90) {
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(168,139,250,${1 - dist / 90})`;
          this.ctx.lineWidth   = 0.4;
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }

    // Disegno e movimento particelle
    for (const p of this.particles) {
      // Repulsione dal mouse
      const mdx  = p.x - this.mouse.x;
      const mdy  = p.y - this.mouse.y;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mdist < 80) {
        p.vx += (mdx / mdist) * 0.3;
        p.vy += (mdy / mdist) * 0.3;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Rimbalzo sui bordi
      if (p.x < 0 || p.x > width)  p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      // Attrito lieve per evitare velocità crescente
      p.vx *= 0.99;
      p.vy *= 0.99;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.fill();
    }
  }
}
