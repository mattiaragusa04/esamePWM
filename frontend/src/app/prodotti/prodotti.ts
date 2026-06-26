import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CarrelloService } from '../carrello.service';

import { ToastService } from '../shared/toast.service';

export interface Prodotto {
  id: number;
  categoria_id: number;
  nome: string;
  descrizione: string;
  giacenza: number;
  immagine: string;
  prezzoUnitarioAcquisto: number;
  prezzoUnitarioVendita: number;
  pubblicatoAcquisto: boolean;
  pubblicatoVetrina: boolean;
  condizione: string;
  puntiFedelta: number;
  genere?: string;

  variantKey?: string;            
  condizioneVariante?: 'Nuovo' | 'Usato'; 
  prezzoVariante?: number;        
}

@Component({
  selector: 'app-prodotti',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './prodotti.html',
  styleUrl: './prodotti.css',
})
export class Prodotti implements OnInit, OnDestroy {
  categoriaDenominazione: string | null = null;

  prodotti: Prodotto[] = [];
  prodottiFiltrati: Prodotto[] = [];
  filtroAttivo: string = 'Tutti';
  isLoading: boolean = false;
  isAnimating: boolean = false;
  errorMessage: string = '';
  preferiti: number[] = [];


  paginaCorrente: number = 1;
  elementiPerPagina: number = 9;

  
  ordinamento: string = '';
  prezzoMin: number | null = null;
  prezzoMax: number | null = null;
  disponibilita: string = '';
  condizione: string = '';


  private prezzoNuovoPerNome: Map<string, number> = new Map();


  sottoCategorie: any[] = [];

 
  private categoriaMap: { [key: string]: number } = {
    'console': 1,
    'videogiochi': 2,
    'accessori': 3,
    'elettronica': 4
  };


  private genreMap: { [key: string]: string } = {
    '1': 'Azione',
    '2': 'Avventura',
    '3': 'Sport',
    '4': 'Sparatutto'
  };
  private routeSub: Subscription | undefined;

  constructor(
    private route: ActivatedRoute, 
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    public carrelloService: CarrelloService, private toast: ToastService) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.caricaPreferiti();
    }

    this.routeSub = this.route.paramMap.subscribe(params => {
      this.categoriaDenominazione = params.get('nome');
      console.log('Categoria selezionata:', this.categoriaDenominazione);
      
      if (this.categoriaDenominazione) {
        this.impostazioniSottoCategorie();
        this.caricaProdotti(this.categoriaDenominazione);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  async caricaProdotti(nomeCategoria: string) {
    this.isLoading = true;
    this.errorMessage = '';
    this.prodotti = [];
    this.prodottiFiltrati = [];
    this.filtroAttivo = 'Tutti';

    const categoriaId = this.categoriaMap[nomeCategoria.toLowerCase()];

    if (!categoriaId) {
      this.errorMessage = 'Categoria non trovata.';
      this.isLoading = false;
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/prodotti/categoria/${categoriaId}`);
      if (response.ok) {
        const data = await response.json();

        data.forEach((raw: Prodotto) => {
          if ((raw.condizione as any) === 'Usata') raw.condizione = 'Usato';
        });

        const condizioniPerNome = new Map<string, Set<string>>();
        this.prezzoNuovoPerNome = new Map();
        data.forEach((raw: Prodotto) => {
          const key = (raw.nome || '').trim().toLowerCase();
          if (!condizioniPerNome.has(key)) condizioniPerNome.set(key, new Set());
          condizioniPerNome.get(key)!.add(raw.condizione);
          if (raw.condizione === 'Nuovo') {
            this.prezzoNuovoPerNome.set(key, Number(raw.prezzoUnitarioVendita));
          }
        });

        const varianti: Prodotto[] = [];
        data.forEach((raw: Prodotto) => {
          varianti.push(...this.espandiInVarianti(raw, condizioniPerNome));
        });
        this.prodotti = varianti;
        this.prodottiFiltrati = [...this.prodotti];
        console.log('Prodotti caricati con successo (varianti):', this.prodotti);
        this.cdr.detectChanges();
      } else {
        this.errorMessage = 'Errore nel recupero dei prodotti.';
      }
    } catch (error) {
      console.error('Errore di connessione al server:', error);
      this.errorMessage = 'Impossibile contattare il server.';
    } finally {
      this.isLoading = false;
      this.isAnimating = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.isAnimating = false;
        this.cdr.detectChanges();
      }, 400);
    }
  }

  impostazioniSottoCategorie() {
    const cat = this.categoriaDenominazione?.toLowerCase();
    if (cat === 'console') {
      this.sottoCategorie = [
        { nome: 'PS5', keywords: ['ps5', 'playstation 5'], immagineUrl: 'http://localhost:3000/public/immagini/console/ps5.png', fallbackUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/38/PlayStation_5_logo.svg' },
        { nome: 'PS4', keywords: ['ps4', 'playstation 4'], immagineUrl: 'http://localhost:3000/public/immagini/console/ps4_pro.png', fallbackUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/87/PlayStation_4_logo_and_wordmark.svg' },
        { nome: 'Nintendo Switch', keywords: ['switch', 'nintendo'], immagineUrl: 'http://localhost:3000/public/immagini/console/nintendo_switch.png', fallbackUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Nintendo_Switch_Logo.svg' },
        { nome: 'Xbox', keywords: ['xbox'], immagineUrl: 'http://localhost:3000/public/immagini/console/xbox_one_x.png', fallbackUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/XBOX_logo_2012.svg' },
        { nome: 'Retrogaming', keywords: ['playstation 1', 'playstation 2', 'playstation 3', 'ps1', 'ps2', 'ps3'], immagineUrl: 'http://localhost:3000/public/immagini/console/trasferimento (11).jpg', fallbackUrl: 'https://it.wikipedia.org/wiki/PlayStation#/media/File:PSX-Console-wController.png' }
      ];
    } else if (cat === 'videogiochi') {
      this.sottoCategorie = [
        { nome: 'Azione', keywords: ['gta', 'theft', 'spider', 'god of war', 'far cry', 'farcry', 'assassin', 'bloodborne', 'red dead', 'cyberpunk', 'elden ring'], iconaBootstrap: 'bi-fire text-danger' },
        { nome: 'Avventura', keywords: ['zelda', 'mario', 'tomb raider', 'uncharted', 'horizon', 'minecraft', 'ratchet', 'clank', 'the last of us', 'crash', 'spyro', 'pokemon'], iconaBootstrap: 'bi-map text-success' },
        { nome: 'Sport', keywords: ['calcio', 'fifa', 'pes', 'fc 24', 'fc 26', 'ea sports', 'nba', 'gran turismo', 'need for speed', 'racing', 'f1', 'motogp', 'wwe', 'tennis'], iconaBootstrap: 'bi-trophy text-warning' },
        { nome: 'Sparatutto', keywords: ['call of duty', 'black ops', 'battlefield', 'halo', 'doom', 'destiny', 'overwatch', 'gears'], iconaBootstrap: 'bi-bullseye text-primary' }
      ];
    } else if (cat === 'accessori') {
      this.sottoCategorie = [
        { nome: 'Cover e Custodie', keywords: ['cover', 'custodi', 'case', 'protezion', 'bumper'], iconaBootstrap: 'bi-shield-fill text-info' },
        { nome: 'Cavi e Adattatori', keywords: ['cavo', 'adattatore', 'hdmi', 'usb'], iconaBootstrap: 'bi-usb-drive text-secondary' },
        { nome: 'Pulizia', keywords: ['pulizia', 'spazzola', 'kit', 'estrattore', 'panno'], iconaBootstrap: 'bi-stars text-success' }
      ];
    } else if (cat === 'elettronica') {
      this.sottoCategorie = [
        { nome: 'Smartwatch', keywords: ['smartwatch', 'orologio', 'apple watch', 'galaxy watch', 'band'], iconaBootstrap: 'bi-smartwatch text-dark' },
        { nome: 'Cuffie e Audio', keywords: ['cuffie', 'auricolari', 'headset', 'earbuds', 'audio', 'jbl', 'razer'], iconaBootstrap: 'bi-headset text-info' },
        { nome: 'Tastiere e Mouse', keywords: ['tastier', 'keyboard', 'mouse', 'mice', 'logitech'], iconaBootstrap: 'bi-pc-display text-primary' },
        { nome: 'Gaming', keywords: ['camera', 'webcam', 'microfono', 'streaming', 'gaming', 'playstation'], iconaBootstrap: 'bi-camera-video text-danger' }
      ];
    } else {
      this.sottoCategorie = [];
    }
  }

  handleImageError(event: any, fallbackUrl: string) {
    if (event.target.src !== fallbackUrl) {
      event.target.src = fallbackUrl;
    }
  }


  private espandiInVarianti(raw: Prodotto, condizioniPerNome: Map<string, Set<string>>): Prodotto[] {
    const result: Prodotto[] = [];
    const prezzoDB = Number(raw.prezzoUnitarioVendita);

    if (this.isRetrogaming(raw)) {
      result.push({
        ...raw,
        condizioneVariante: 'Usato',
        variantKey: `${raw.id}-Usato`,
        prezzoVariante: prezzoDB,
      });
      return result;
    }

    const cond: 'Nuovo' | 'Usato' = raw.condizione === 'Usato' ? 'Usato' : 'Nuovo';
    result.push({
      ...raw,
      condizioneVariante: cond,
      variantKey: `${raw.id}-${cond}`,
      prezzoVariante: prezzoDB,
    });
    return result;
  }

  isRetrogaming(prodotto: Prodotto): boolean {
    const nomeLower = prodotto.nome.toLowerCase();
    const retroKeywords = [
      'playstation 1', 'playstation 2', 'playstation 3', 'ps1', 'ps2', 'ps3',
      'black ops iii', 'uncharted 3', 'need for speed rivals', 'farcry 3', 'gran turismo 5'
    ];
    return retroKeywords.some(kw => nomeLower.includes(kw));
  }

  getSottoCategoria(prodotto: Prodotto): string | null {

    if (prodotto.genere) {
      const genere = prodotto.genere.trim();

      if (this.genreMap[genere]) {
        return this.genreMap[genere];
      }
      return genere;
    }
    if (!this.sottoCategorie || this.sottoCategorie.length === 0) return null;
    
    const nomeLower = prodotto.nome.toLowerCase();
    const descLower = prodotto.descrizione ? prodotto.descrizione.toLowerCase() : '';

    
    if (this.isRetrogaming(prodotto)) {
      return 'Retrogaming';
    }

    
    for (const sub of this.sottoCategorie) {

      if (sub.nome === 'Retrogaming') continue;

      if (sub.keywords) {
        if (sub.keywords.some((kw: string) => nomeLower.includes(kw) || descLower.includes(kw))) {
          if (sub.nome === 'Tastiere e Mouse') {
            const isTastiera = ['Tastiere', 'keyboard'].some(kw => nomeLower.includes(kw) || descLower.includes(kw));
            const isMouse = ['Mouse', 'mice'].some(kw => nomeLower.includes(kw) || descLower.includes(kw));
            if (isTastiera) return 'Tastiera';
            if (isMouse) return 'Mouse';
          }
          return sub.nome;
        }
      } else {
        const f = sub.nome.toLowerCase();
        if (nomeLower.includes(f) || descLower.includes(f)) {
          return sub.nome;
        }
      }
    }
    return null;
  }

  resetFiltri() {
    this.ordinamento = '';
    this.prezzoMin = null;
    this.prezzoMax = null;
    this.disponibilita = '';
    this.condizione = '';
    this.impostaFiltro('Tutti');
  }

  impostaCondizione(val: string) {
    this.condizione = val;
    this.applicaFiltriAvanzati();
  }

  impostaFiltro(filtro: string) {
    this.filtroAttivo = filtro;
    this.applicaFiltriAvanzati();
  }

  applicaFiltriAvanzati(resetPaginazione: boolean = true, animate: boolean = true) {
    let result = [...this.prodotti];


    if (this.filtroAttivo !== 'Tutti') {
      result = result.filter(p => {
        const appartenenza = this.getSottoCategoria(p);
        return appartenenza === this.filtroAttivo;
      });
    }

    if (this.prezzoMin !== null && this.prezzoMin !== undefined) {
      result = result.filter(p => this.getPrezzoVisualizzato(p) >= this.prezzoMin!);
    }
    if (this.prezzoMax !== null && this.prezzoMax !== undefined) {
      result = result.filter(p => this.getPrezzoVisualizzato(p) <= this.prezzoMax!);
    }

    if (this.disponibilita === 'immediata') {
      result = result.filter(p => p.giacenza > 0);
    } else if (this.disponibilita === 'esaurito') {
      result = result.filter(p => p.giacenza <= 0);
    }


    if (this.ordinamento === 'prezzoCrescente') {
      result.sort((a, b) => this.getPrezzoVisualizzato(a) - this.getPrezzoVisualizzato(b));
    } else if (this.ordinamento === 'prezzoDecrescente') {
      result.sort((a, b) => this.getPrezzoVisualizzato(b) - this.getPrezzoVisualizzato(a));
    } else if (this.ordinamento === 'nomeCrescente') {
      result.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (this.ordinamento === 'nomeDecrescente') {
      result.sort((a, b) => b.nome.localeCompare(a.nome));
    }


    if (this.condizione === 'Nuovo') {
      result = result.filter(p => p.condizioneVariante === 'Nuovo');
    } else if (this.condizione === 'Usato') {
      result = result.filter(p => p.condizioneVariante === 'Usato');
    }
    
    this.prodottiFiltrati = result;
    if (resetPaginazione) {
      this.paginaCorrente = 1; 
    }

   
    if (animate) {
      this.isAnimating = false;
      this.cdr.detectChanges(); 
      setTimeout(() => {
        this.isAnimating = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.isAnimating = false;
          this.cdr.detectChanges();
        }, 400);
      }, 10);
    }
  }


  getPrezzoVisualizzato(p: Prodotto): number {
    if (p.prezzoVariante !== undefined) return Number(p.prezzoVariante);
    return Number(p.prezzoUnitarioVendita);
  }


  getPrezzoOriginale(p: Prodotto): number | null {
    if (p.condizioneVariante !== 'Usato') return null;
    const prezzoUsato = this.getPrezzoVisualizzato(p);
    if (!prezzoUsato || prezzoUsato <= 0) return null;
    const key = (p.nome || '').trim().toLowerCase();
    const prezzoNuovoDb = this.prezzoNuovoPerNome.get(key);
    if (prezzoNuovoDb !== undefined && prezzoNuovoDb > prezzoUsato) {
      return prezzoNuovoDb;
    }

    return Math.round((prezzoUsato / 0.75) * 100) / 100;
  }

  isVariantUsato(p: Prodotto): boolean {
    return p.condizioneVariante === 'Usato';
  }

  trackByVariant = (_: number, p: Prodotto) => p.variantKey || p.id;

  caricaPreferiti() {
    const salvati = localStorage.getItem('preferiti');
    if (salvati) {
      this.preferiti = JSON.parse(salvati);
    }
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

  async aggiungiAlCarrello(prodotto: Prodotto) {
    const condizioneScelta: 'Nuovo' | 'Usato' = prodotto.condizioneVariante || 'Nuovo';
    const prezzoFinale = this.getPrezzoVisualizzato(prodotto);

    const successo = await this.carrelloService.aggiungiProdotto(
      prodotto, 1, condizioneScelta, prezzoFinale
    );

    if (successo) {
      this.toast.success(`${prodotto.nome} (${condizioneScelta}) aggiunto al carrello a €${prezzoFinale.toFixed(2)}!`);
    }
  }


  getProdottiPaginati(): Prodotto[] {
    const inizio = (this.paginaCorrente - 1) * this.elementiPerPagina;
    const fine = inizio + this.elementiPerPagina;
    return this.prodottiFiltrati.slice(inizio, fine);
  }

  getNumeroPagine(): number {
    return Math.ceil(this.prodottiFiltrati.length / this.elementiPerPagina);
  }

  getPagine(): number[] {
    const numPagine = this.getNumeroPagine();
    return Array.from({ length: numPagine }, (_, i) => i + 1);
  }


  getPagineVisibili(): number[] {
    const numPagine = this.getNumeroPagine();
    const maxVisibili = 5; 
    let inizio = Math.max(1, this.paginaCorrente - Math.floor(maxVisibili / 2));
    let fine = Math.min(numPagine, inizio + maxVisibili - 1);

    if (fine - inizio < maxVisibili - 1) {
      inizio = Math.max(1, fine - maxVisibili + 1);
    }

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
