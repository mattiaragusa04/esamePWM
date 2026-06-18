import { Injectable } from '@angular/core';

export interface NeuralCanvasOptions {
  colors?: string[];
  numParticles?: number;
  repulsionRadius?: number;
  connectionRadius?: number;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; color: string;
}

interface CanvasState {
  ctx: CanvasRenderingContext2D;
  particles: Particle[];
  animFrame: number;
  mouse: { x: number; y: number };
  resizeListener: () => void;
  mouseMoveListener: (e: MouseEvent) => void;
  mouseLeaveListener: () => void;
  options: Required<NeuralCanvasOptions>;
  heroBox: HTMLElement;
}

@Injectable({ providedIn: 'root' })
export class NeuralCanvasService {
  private readonly DEFAULT_OPTIONS: Required<NeuralCanvasOptions> = {
    colors: ['#f86ded', '#a78bfa'],
    numParticles: 200,
    repulsionRadius: 150,
    connectionRadius: 110,
  };

  private states = new Map<HTMLCanvasElement, CanvasState>();

  init(canvas: HTMLCanvasElement, heroBox: HTMLElement, options?: NeuralCanvasOptions): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) { console.warn('[NeuralCanvas] impossibile ottenere context 2D'); return; }

    const opts: Required<NeuralCanvasOptions> = { ...this.DEFAULT_OPTIONS, ...options };
    const mouse = { x: -999, y: -999 };
    const particles: Particle[] = [];

    const resizeListener = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = heroBox.offsetWidth;
      const h = heroBox.offsetHeight;
      if (w === 0 || h === 0) { requestAnimationFrame(resizeListener); return; }
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      this.initParticles(particles, w, h, opts);
    };

    const mouseMoveListener = (e: MouseEvent) => {
      const rect = heroBox.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const mouseLeaveListener = () => { mouse.x = -999; mouse.y = -999; };

    resizeListener();
    window.addEventListener('resize', resizeListener);
    heroBox.addEventListener('mousemove', mouseMoveListener);
    heroBox.addEventListener('mouseleave', mouseLeaveListener);

    const state: CanvasState = {
      ctx, particles, animFrame: 0, mouse,
      resizeListener, mouseMoveListener, mouseLeaveListener,
      options: opts, heroBox,
    };
    this.states.set(canvas, state);
    this.animate(canvas, state);
  }

  destroy(canvas: HTMLCanvasElement): void {
    const state = this.states.get(canvas);
    if (!state) return;
    cancelAnimationFrame(state.animFrame);
    window.removeEventListener('resize', state.resizeListener);
    state.heroBox.removeEventListener('mousemove', state.mouseMoveListener);
    state.heroBox.removeEventListener('mouseleave', state.mouseLeaveListener);
    this.states.delete(canvas);
  }

  private initParticles(
    particles: Particle[],
    w: number,
    h: number,
    opts: Required<NeuralCanvasOptions>
  ): void {
    particles.length = 0;
    for (let i = 0; i < opts.numParticles; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 1.5 + 0.8,
        color: opts.colors[Math.floor(Math.random() * opts.colors.length)],
      });
    }
  }

  private animate(canvas: HTMLCanvasElement, state: CanvasState): void {
    const { ctx, particles, mouse, options, heroBox } = state;
    const w = heroBox.offsetWidth;
    const h = heroBox.offsetHeight;

    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < options.repulsionRadius) {
        const angle = Math.atan2(dy, dx);
        const force = (options.repulsionRadius - dist) / options.repulsionRadius;
        p.x -= Math.cos(angle) * force * 2;
        p.y -= Math.sin(angle) * force * 2;
      }

      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const distP = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
        if (distP < options.connectionRadius) {
          ctx.beginPath();
          const gradient = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
          gradient.addColorStop(0, p.color);
          gradient.addColorStop(1, p2.color);
          ctx.strokeStyle = gradient;
          ctx.globalAlpha = (1 - distP / options.connectionRadius) * 0.4;
          ctx.lineWidth = 0.8;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
    state.animFrame = requestAnimationFrame(() => this.animate(canvas, state));
  }
}
