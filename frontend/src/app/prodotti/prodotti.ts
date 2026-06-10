import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// Interfaccia allineata al database SQLite
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

  sottoCategorie: any[] = [];

  // Stato di selezione condizione per ogni prodotto (nuovo | usato)
  prezzoCondizione: { [id: number]: 'Nuovo' | 'Usato' } = {};

  // Mappatura tra il nome nella URL e l'ID della categoria nel DB
  private categoriaMap: { [key: string]: number } = {
    'console': 1,
    'videogiochi': 2,
    'accessori': 3,
    'elettronica': 4
  };

  private routeSub: Subscription | undefined;

  constructor(
    private route: ActivatedRoute, 
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

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
        this.prodotti = data.map((p: Prodotto) => {
          this.prezzoCondizione[p.id] = 'Nuovo';
          return p;
        });
        this.prodottiFiltrati = [...this.prodotti];
        console.log('Prodotti caricati con successo:', this.prodotti);
        this.cdr.detectChanges(); // Forza l'aggiornamento dell'HTML
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

  impostazioniSottoCategorie() {
    const cat = this.categoriaDenominazione?.toLowerCase();
    if (cat === 'console') {
      this.sottoCategorie = [
        { nome: 'PS5', keywords: ['ps5', 'playstation 5'], immagineUrl: 'http://localhost:3000/public/immagini/console/ps5.png', fallbackUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/38/PlayStation_5_logo.svg' },
        { nome: 'PS4', keywords: ['ps4', 'playstation 4'], immagineUrl: 'http://localhost:3000/public/immagini/console/ps4_pro.png', fallbackUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/87/PlayStation_4_logo_and_wordmark.svg' },
        { nome: 'Nintendo Switch', keywords: ['switch', 'nintendo'], immagineUrl: 'http://localhost:3000/public/immagini/console/nintendo_switch.png', fallbackUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Nintendo_Switch_Logo.svg' },
        { nome: 'Xbox', keywords: ['xbox'], immagineUrl: 'http://localhost:3000/public/immagini/console/xbox_one_x.png', fallbackUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/XBOX_logo_2012.svg' }
      ];
    } else if (cat === 'videogiochi') {
      this.sottoCategorie = [
        { nome: 'Azione', keywords: ['azione', 'action', 'gta', 'spider', 'the last of us', 'god of war', 'assassin', 'bloodborne', 'red dead', 'cyberpunk', 'elden ring'], iconaBootstrap: 'bi-fire text-danger' },
        { nome: 'Avventura', keywords: ['avventura', 'adventure', 'zelda', 'mario', 'tomb raider', 'uncharted', 'horizon', 'minecraft', 'crash', 'spyro', 'pokemon'], iconaBootstrap: 'bi-map text-success' },
        { nome: 'Sport', keywords: ['sport', 'calcio', 'fifa', 'pes', 'fc 24', 'nba', 'gran turismo', 'racing', 'f1', 'motogp', 'wwe', 'tennis'], iconaBootstrap: 'bi-trophy text-warning' },
        { nome: 'Sparatutto', keywords: ['sparatutto', 'shooter', 'call of duty', 'battlefield', 'halo', 'doom', 'destiny', 'overwatch', 'gears', 'far cry'], iconaBootstrap: 'bi-bullseye text-primary' }
      ];
    } else if (cat === 'accessori') {
      this.sottoCategorie = [
        { nome: 'Controller', keywords: ['controller', 'pad', 'joypad', 'dualshock', 'dualsense', 'remote'], iconaBootstrap: 'bi-controller text-dark' },
        { nome: 'Cuffie', keywords: ['cuffie', 'headset', 'auricolari', 'earbuds'], iconaBootstrap: 'bi-headset text-info' },
        { nome: 'Tastiere', keywords: ['tastier', 'keyboard'], iconaBootstrap: 'bi-keyboard text-secondary' },
        { nome: 'Mouse', keywords: ['mouse', 'mice'], iconaBootstrap: 'bi-mouse text-primary' }
      ];
    } else if (cat === 'elettronica') {
      this.sottoCategorie = [
        { nome: 'Smartwatch', keywords: ['smartwatch', 'orologio', 'apple watch', 'galaxy watch', 'band'], iconaBootstrap: 'bi-smartwatch text-dark' },
        { nome: 'Cover', keywords: ['cover', 'custodi', 'pellicol', 'case', 'protezion'], iconaBootstrap: 'bi-shield-fill text-info' }
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

  getSottoCategoria(prodotto: Prodotto): string | null {
    if (!this.sottoCategorie || this.sottoCategorie.length === 0) return null;
    
    const nomeLower = prodotto.nome.toLowerCase();
    const descLower = prodotto.descrizione ? prodotto.descrizione.toLowerCase() : '';

    for (const sub of this.sottoCategorie) {
      if (sub.keywords) {
        for (const kw of sub.keywords) {
          if (nomeLower.includes(kw) || descLower.includes(kw)) {
            return sub.nome;
          }
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
    this.impostaFiltro('Tutti');
  }

  impostaFiltro(filtro: string) {
    this.filtroAttivo = filtro;
    this.applicaFiltriAvanzati();
  }

  applicaFiltriAvanzati() {
    let result = [...this.prodotti];

    // 1. Filtro per Sottocategoria (Azione, PS5, Sport, etc.)
    if (this.filtroAttivo !== 'Tutti') {
      const subCat = this.sottoCategorie.find(s => s.nome === this.filtroAttivo);
      if (subCat && subCat.keywords) {
        result = result.filter(p => {
          const n = p.nome.toLowerCase();
          const d = p.descrizione ? p.descrizione.toLowerCase() : '';
          return subCat.keywords.some((kw: string) => n.includes(kw) || d.includes(kw));
        });
      } else {
        const f = this.filtroAttivo.toLowerCase();
        result = result.filter(p => p.nome.toLowerCase().includes(f) || (p.descrizione && p.descrizione.toLowerCase().includes(f)));
      }
    }

    // 2. Filtro per Range di Prezzo
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

    this.prodottiFiltrati = result;
    this.paginaCorrente = 1; // Ritorna alla prima pagina quando cambia un filtro
  }


  setCondizione(prodId: number, cond: 'Nuovo' | 'Usato') {
    this.prezzoCondizione[prodId] = cond;
    this.applicaFiltriAvanzati(); // Ricalcola i filtri per ri-ordinare se il prezzo cambia
  }

  getPrezzoVisualizzato(p: Prodotto): number {
    const cond = this.prezzoCondizione[p.id] || 'Nuovo';
    if (cond === 'Usato') {
      // Applichiamo uno sconto del 25% sul prezzo di vendita per l'usato
      return Math.round((p.prezzoUnitarioVendita * 0.75) * 100) / 100;
    }
    return p.prezzoUnitarioVendita;

  }

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
          alert(`${prodotto.nome} (${condizioneScelta}) aggiunto al carrello a €${prezzoFinale.toFixed(2)}!`);
        } else {
          const errorData = await response.json();
          console.error("Dettagli errore backend:", errorData);
          alert(`Errore: ${errorData.error || errorData.message || 'Sconosciuto'}`);
        }
      } catch (error) {
        console.error('Errore di connessione:', error);
        alert('Errore di connessione al server.');
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
      alert(`${prodotto.nome} (${condizioneScelta}) aggiunto al carrello a €${prezzoFinale.toFixed(2)}!`);
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
