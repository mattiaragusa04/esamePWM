import { Component, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

interface FeaturedProduct {
  nome: string;
  immagine: string;
  prezzo: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home implements AfterViewInit, OnDestroy {

  @ViewChild('particleCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('heroBox') heroBoxRef!: ElementRef<HTMLDivElement>;

  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animFrame!: number;
  private mouse = { x: -999, y: -999 };
  private numParticles = 200;

  private COLORS = ['#f86ded', '#a78bfa'];

  public featuredProducts: FeaturedProduct[] = [
    { nome: 'PlayStation 5', immagine: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-product-thumbnail-01-en-14sep21?$facebook$', prezzo: '499,99€' },
    { nome: 'Xbox Series X', immagine: 'https://www.businessinsider.com/microsoft-xbox-series-x-photos-2019-12', prezzo: '499,99€' },
    { nome: 'Nintendo Switch', immagine: 'https://assets.nintendo.com/image/upload/f_auto/q_auto/dpr_2.0/c_scale,w_400/ncom/en_US/switch/system/nintendo-switch-oled-model-white-set', prezzo: '349,99€' },
    { nome: 'DualSense Edge', immagine: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-edge-image-block-01-en-24aug22?$native$', prezzo: '239,99€' }
  ];

  public upcomingGames: FeaturedProduct[] = [
    { nome: 'GTA VI', immagine: 'https://media-rockstargames-com.akamaized.net/rockstargames-newsite/img/global/games/fob/640/GTAVI.jpg', prezzo: '2025' },
    { nome: 'Death Stranding 2', immagine: 'https://image.api.playstation.com/vulcan/ap/rnd/202401/3011/5069a531f9872e420211367098e94e77699d63f044738596.png', prezzo: 'TBA' },
    { nome: 'Monster Hunter Wilds', immagine: 'https://image.api.playstation.com/vulcan/ap/rnd/202405/2203/c02f066b57956976839b20b69101d2d0f507b51f041496a8.png', prezzo: '2025' },
    { nome: 'Indiana Jones', immagine: 'https://gaming-cdn.com/images/products/15729/orig/indiana-jones-and-the-great-circle-pc-gioco-steam-cover.jpg', prezzo: 'Dic 2024' }
  ];

  public bestAccessories: FeaturedProduct[] = [
    { nome: 'Pulse Elite Wireless', immagine: 'https://gmedia.playstation.com/is/image/SIEPDC/pulse-elite-image-block-01-en-24aug23?$native$', prezzo: '149,99€' },
    { nome: 'Xbox Elite Series 2', immagine: 'https://m.media-amazon.com/images/I/71m6pS6S-pL._AC_SL1500_.jpg', prezzo: '179,99€' },
    { nome: 'Razer Kishi V2', immagine: 'https://m.media-amazon.com/images/I/61N+U9+l04L._AC_SL1500_.jpg', prezzo: '119,99€' },
    { nome: 'Logitech G Cloud', immagine: 'https://m.media-amazon.com/images/I/51-mF27xZpL._AC_SL1500_.jpg', prezzo: '359,00€' }
  ];

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    const box = this.heroBoxRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    // Resize canvas al box
    const resize = () => {
      canvas.width = box.offsetWidth;
      canvas.height = box.offsetHeight;
      this.initParticles();
    };
    resize();
    window.addEventListener('resize', resize);

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
    cancelAnimationFrame(this.animFrame);
  }
}