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
  public prezzoCondizione: { [id: number]: 'Nuovo' | 'Usato' } = {};
  public preferiti: number[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private cdr: ChangeDetectorRef) {}

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
    const token = localStorage.getItem('token');
    const condizioneScelta = this.prezzoCondizione[prodotto.id] || 'Nuovo';
    const prezzoFinale = this.getPrezzoVisualizzato(prodotto);

    if (token) {
      // Utente loggato: invia al database
      try {
        const response = await fetch('http://localhost:3000/api/carrello/aggiungi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ prodottoId: prodotto.id, quantita: 1, condizione: condizioneScelta, prezzo: prezzoFinale })
        });
        if (response.ok) {
          alert(`${prodotto.nome} (${condizioneScelta}) aggiunto al carrello a €${prezzoFinale}!`);
        } else {
          const errorData = await response.json();
          console.error("Dettagli errore backend:", errorData);
          alert(`Errore: ${errorData.error || errorData.message || 'Sconosciuto'}`);
        }
      } catch (error) {
        console.error('Errore di connessione:', error);
      }
    } else {
      // Utente ospite: salva in localStorage
      let carrello = JSON.parse(localStorage.getItem('carrello') || '[]');
      const index = carrello.findIndex((item: any) => (item.id || item.prodotto_id) === prodotto.id && item.condizione === condizioneScelta);
      if (index > -1) {
        carrello[index].quantita += 1;
      } else {
        carrello.push({ ...prodotto, quantita: 1, condizione: condizioneScelta, prezzoSelezionato: prezzoFinale });
      }
      localStorage.setItem('carrello', JSON.stringify(carrello));
      alert(`${prodotto.nome} (${condizioneScelta}) aggiunto al carrello a €${prezzoFinale}!`);
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