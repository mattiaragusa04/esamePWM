import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CarrelloService } from '../carrello.service';

import { ToastService } from '../shared/toast.service';
// Interfaccia allineata al database SQLite
export interface Prodotto {
  id: number;
  categoria_id: number;
  nome: string;
  descrizione: string;
  giacenza: number;
  immagine: string;
  prezzoUnitarioAcquisto: number;
  PrezzoUnitarioVendita: number;
  pubblicatoAcquisto: boolean;
  pubblicatoVetrina: boolean;
  condizione: string;
  puntiFedelta: number;
  genere?: string;
  // Campi virtuali aggiunti lato client per generare le varianti Nuovo/Usato
  variantKey?: string;            // chiave univoca = id + '-' + condizioneVariante
  condizioneVariante?: 'Nuovo' | 'Usato'; // condizione effettiva mostrata nella card
  prezzoVariante?: number;        // prezzo calcolato per questa variante
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
  // 'prodotti' contiene le VARIANTI (es. un prodotto Nuovo genera 2 elementi: Nuovo + Usato)
  prodotti: Prodotto[] = [];
  prodottiFiltrati: Prodotto[] = [];
  filtroAttivo: string = 'Tutti';
  isLoading: boolean = false;
  isAnimating: boolean = false;
  errorMessage: string = '';
  preferiti: number[] = [];

  // Paginazione
  paginaCorrente: number = 1;
  elementiPerPagina: number = 9;

  // Nuovi stati per i filtri della barra laterale
  ordinamento: string = '';
  prezzoMin: number | null = null;
  prezzoMax: number | null = null;
  disponibilita: string = '';
  condizione: string = '';

  // Per ogni "prodotto logico" (chiave = nome normalizzato) memorizziamo il
  // prezzo della riga DB Nuovo, se esiste. Serve per mostrare il prezzo barrato
  // sulla card Usato quando esistono entrambe le condizioni nel DB.
  private prezzoNuovoPerNome: Map<string, number> = new Map();


  sottoCategorie: any[] = [];

  // Mappatura tra il nome nella URL e l'ID della categoria nel DB
  private categoriaMap: { [key: string]: number } = {
    'console': 1,
    'videogiochi': 2,
    'accessori': 3,
    'elettronica': 4
  };

  // Mappatura inversa per gestire eventuali dati legacy nel DB
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
        // Normalizza eventuali refusi nel campo condizione
        data.forEach((raw: Prodotto) => {
          if ((raw.condizione as any) === 'Usata') raw.condizione = 'Usato';
        });
        // Mappa: per ogni "prodotto logico" (raggruppato per nome normalizzato)
        // tracciamo quali condizioni esistono realmente nel DB e il prezzo Nuovo (se presente).
        const condizioniPerNome = new Map<string, Set<string>>();
        this.prezzoNuovoPerNome = new Map();
        data.forEach((raw: Prodotto) => {
          const key = (raw.nome || '').trim().toLowerCase();
          if (!condizioniPerNome.has(key)) condizioniPerNome.set(key, new Set());
          condizioniPerNome.get(key)!.add(raw.condizione);
          if (raw.condizione === 'Nuovo') {
            this.prezzoNuovoPerNome.set(key, Number(raw.PrezzoUnitarioVendita));
          }
        });
        // Costruiamo le varianti mostrando SOLO le condizioni realmente presenti nel DB.
        // Se per uno stesso nome esiste sia Nuovo che Usato, l'Usato avrà comunque il -25%
        // calcolato dal prezzo del Nuovo (per coerenza visiva); altrimenti viene usato
        // il prezzo della riga DB corrispondente.
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

  /**
   * Costruisce le varianti visualizzabili a partire da una riga del DB.
   * Regola: si mostrano SOLO le condizioni effettivamente presenti nel DB
   * (raggruppando i record per nome). Nessuna variante “fantasma” viene generata.
   *
   * - Retrogaming      -> SOLO variante Usato (prezzo DB)
   * - Riga DB Usato    -> variante Usato col prezzo della riga DB Usato
   * - Riga DB Nuovo    -> variante Nuovo col prezzo della riga DB Nuovo
   *
   * Per evitare di duplicare l’elenco quando per lo stesso nome esistono sia
   * il record Nuovo sia il record Usato, ogni riga DB genera SOLO la variante
   * della propria condizione.
   */
  private espandiInVarianti(raw: Prodotto, condizioniPerNome: Map<string, Set<string>>): Prodotto[] {
    const result: Prodotto[] = [];
    const prezzoDB = Number(raw.PrezzoUnitarioVendita);

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
    // Se il prodotto possiede già il campo 'genere' assegnato dal database (es. Videogiochi), lo restituiamo direttamente
    if (prodotto.genere) {
      const genere = prodotto.genere.trim();
      // Se il genere è un numero (dato legacy), lo convertiamo nel nome corretto.
      if (this.genreMap[genere]) {
        return this.genreMap[genere];
      }
      // Altrimenti, se è già una stringa corretta, la restituiamo.
      return genere;
    }
    if (!this.sottoCategorie || this.sottoCategorie.length === 0) return null;
    
    const nomeLower = prodotto.nome.toLowerCase();
    const descLower = prodotto.descrizione ? prodotto.descrizione.toLowerCase() : '';

    // REGOLA 1: Identificazione prioritaria ed esclusiva delle console Retrogaming
    if (this.isRetrogaming(prodotto)) {
      return 'Retrogaming';
    }

    // REGOLA 2: Se non è Retrogaming, cerca le altre sottocategorie
    for (const sub of this.sottoCategorie) {
      // Salta la categoria 'Retrogaming' perché già gestita (e per evitare false-positive)
      if (sub.nome === 'Retrogaming') continue;

      if (sub.keywords) {
        if (sub.keywords.some((kw: string) => nomeLower.includes(kw) || descLower.includes(kw))) {
          // Specializzazione visiva del badge per Tastiere e Mouse
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

  /**
   * Imposta il filtro condizione (chiamato dai 3 bottoni Tutti/Nuovo/Usato nella sidebar).
   * 'val' = '' (Tutti), 'Nuovo', 'Usato'.
   */
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

    // 1. Filtro per Sottocategoria (Azione, PS5, Sport, etc.)
    if (this.filtroAttivo !== 'Tutti') {
      result = result.filter(p => {
        const appartenenza = this.getSottoCategoria(p);
        return appartenenza === this.filtroAttivo;
      });
    }

    // 2. Filtro per Range di Prezzo (usa prezzoVariante)
    if (this.prezzoMin !== null && this.prezzoMin !== undefined) {
      result = result.filter(p => this.getPrezzoVisualizzato(p) >= this.prezzoMin!);
    }
    if (this.prezzoMax !== null && this.prezzoMax !== undefined) {
      result = result.filter(p => this.getPrezzoVisualizzato(p) <= this.prezzoMax!);
    }

    // 3. Filtro Disponibilità
    if (this.disponibilita === 'immediata') {
      result = result.filter(p => p.giacenza > 0);
    } else if (this.disponibilita === 'esaurito') {
      result = result.filter(p => p.giacenza <= 0);
    }

    // 4. Ordinamento
    if (this.ordinamento === 'prezzoCrescente') {
      result.sort((a, b) => this.getPrezzoVisualizzato(a) - this.getPrezzoVisualizzato(b));
    } else if (this.ordinamento === 'prezzoDecrescente') {
      result.sort((a, b) => this.getPrezzoVisualizzato(b) - this.getPrezzoVisualizzato(a));
    } else if (this.ordinamento === 'nomeCrescente') {
      result.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (this.ordinamento === 'nomeDecrescente') {
      result.sort((a, b) => b.nome.localeCompare(a.nome));
    }

    // 5. Filtro per Condizione (usa la condizione della variante)
    if (this.condizione === 'Nuovo') {
      result = result.filter(p => p.condizioneVariante === 'Nuovo');
    } else if (this.condizione === 'Usato') {
      result = result.filter(p => p.condizioneVariante === 'Usato');
    }
    
    this.prodottiFiltrati = result;
    if (resetPaginazione) {
      this.paginaCorrente = 1; // Ritorna alla prima pagina solo quando cambia un vero filtro
    }

    // Se richiesto, forza un riavvio pulito dell'animazione CSS
    if (animate) {
      this.isAnimating = false;
      this.cdr.detectChanges(); // Rimuove la classe dal DOM
      setTimeout(() => {
        this.isAnimating = true;
        this.cdr.detectChanges(); // Reinserisce la classe dopo 10ms per forzare l'animazione
        setTimeout(() => {
          this.isAnimating = false;
          this.cdr.detectChanges();
        }, 400);
      }, 10);
    }
  }


  /**
   * Prezzo visualizzato per la variante (Nuovo: prezzo DB, Usato non-retro: -25%, retro: prezzo DB).
   */
  getPrezzoVisualizzato(p: Prodotto): number {
    if (p.prezzoVariante !== undefined) return Number(p.prezzoVariante);
    return Number(p.PrezzoUnitarioVendita);
  }

  /**
   * Prezzo "originale" usato per il barrato sulla card Usato.
   * Mostriamo SEMPRE il barrato + badge -25% su ogni card Usato (compreso retrogaming
   * e Usato “standalone”) per una grafica uniforme:
   *  - se per lo stesso nome esiste il record Nuovo nel DB con prezzo maggiore,
   *    usiamo quel prezzo come barrato;
   *  - altrimenti calcoliamo il prezzo "pieno" come prezzo_usato / 0.75
   *    (cioè il prezzo dal quale il -25% restituirebbe esattamente il prezzo Usato).
   */
  getPrezzoOriginale(p: Prodotto): number | null {
    if (p.condizioneVariante !== 'Usato') return null;
    const prezzoUsato = this.getPrezzoVisualizzato(p);
    if (!prezzoUsato || prezzoUsato <= 0) return null;
    const key = (p.nome || '').trim().toLowerCase();
    const prezzoNuovoDb = this.prezzoNuovoPerNome.get(key);
    if (prezzoNuovoDb !== undefined && prezzoNuovoDb > prezzoUsato) {
      return prezzoNuovoDb;
    }
    // Fallback: ricostruiamo il prezzo "originale" dal prezzo Usato.
    return Math.round((prezzoUsato / 0.75) * 100) / 100;
  }

  isVariantUsato(p: Prodotto): boolean {
    return p.condizioneVariante === 'Usato';
  }

  /** Identificatore stabile per *ngFor sulle varianti */
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
      this.preferiti.splice(index, 1); // Rimuove se c'è già
    } else {
      this.preferiti.push(prodotto.id); // Aggiunge se non c'è
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

  // --- Paginazione ---
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

  // Mostra un massimo di 5 pagine alla volta, scorrendo man mano
  getPagineVisibili(): number[] {
    const numPagine = this.getNumeroPagine();
    const maxVisibili = 5; // Puoi cambiare questo numero per mostrare più o meno pallini
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
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Torna all'inizio in modo fluido
      }
    }
  }
}
