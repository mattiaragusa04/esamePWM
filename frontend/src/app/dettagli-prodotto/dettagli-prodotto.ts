import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ToastService } from '../shared/toast.service';

// Assicurati che questa interfaccia sia definita nel tuo progetto
export interface Prodotto {
  id: number;
  categoria_id: number;
  categoria_nome: string;
  nome: string;
  descrizione: string;
  giacenza: number;
  immagine: string;
  prezzoUnitarioAcquisto: number;
  vendibile: number;
  pubblicatoAcquisto: boolean;
  pubblicatoVetrina: boolean;
  condizione: string;
  puntiFedelta: number;
}

@Component({
  selector: 'app-dettagli-prodotto', // Assicurati che il selettore sia corretto
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink], // Aggiungi RouterLink se non c'è
  templateUrl: './dettagli-prodotto.html',
  styleUrl: './dettagli-prodotto.css', // Assicurati di avere un file CSS per questo componente
})
export class DettagliProdotto implements OnInit, OnDestroy {
  prodotto: Prodotto | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  prodottoId: number | null = null;
  preferiti: number[] = []; // Array per memorizzare gli ID dei prodotti preferiti
  prezzoCondizione: 'Nuovo' | 'Usato' = 'Nuovo'; // Condizione effettiva mostrata
  /** Variante esplicitamente richiesta dall'utente (via query param ?cond=Nuovo|Usato). */
  varianteScelta: 'Nuovo' | 'Usato' | null = null;

  private routeSub: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.caricaPreferiti();
      this.routeSub = this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.prodottoId = +id;
          // Legge la variante (Nuovo/Usato) eventualmente passata via query param,
          // per arrivare al dettaglio dalla card corretta.
          const cond = this.route.snapshot.queryParamMap.get('cond');
          this.varianteScelta = (cond === 'Usato' || cond === 'Nuovo') ? cond : null;
          this.caricaProdotto(this.prodottoId);
        } else {
          this.errorMessage = 'ID prodotto non fornito.';
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  async caricaProdotto(id: number) {
    this.isLoading = true;
    this.errorMessage = '';
    this.prodotto = null;

    try {
      const response = await fetch(`http://localhost:3000/api/prodotti/${id}`);
      if (response.ok) {
        const data = await response.json();
        this.prodotto = data;
        // Determina la variante effettiva da mostrare:
        // 1) Retro -> sempre Usato
        // 2) Variante esplicita via query param se compatibile con la condizione DB
        // 3) Condizione DB altrimenti
        if (this.prodotto && this.isRetrogaming(this.prodotto)) {
          this.prezzoCondizione = 'Usato';
        } else if (this.prodotto && this.prodotto.condizione === 'Usato') {
          this.prezzoCondizione = 'Usato';
        } else if (this.prodotto && this.prodotto.condizione === 'Nuovo') {
          // DB Nuovo: l'utente può atterrare sulla variante Nuovo o Usato (-25%)
          this.prezzoCondizione = this.varianteScelta || 'Nuovo';
        } else {
          this.prezzoCondizione = 'Nuovo';
        }
        console.log('Prodotto caricato:', this.prodotto);
      } else {
        this.errorMessage = 'Errore nel recupero del prodotto.';
      }
    } catch (error) {
      console.error('Errore di connessione al server:', error);
      this.errorMessage = 'Impossibile contattare il server.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  isRetrogaming(prodotto: Prodotto): boolean {
    const nomeLower = prodotto.nome.toLowerCase();
    const retroKeywords = [
      'playstation 1', 'playstation 2', 'playstation 3', 'ps1', 'ps2', 'ps3',
      'black ops iii', 'uncharted 3', 'need for speed rivals', 'farcry 3', 'gran turismo 5'
    ];
    return retroKeywords.some(kw => nomeLower.includes(kw));
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

  togglePreferito(event: Event) {
    event.stopPropagation(); // Evita che l'evento si propaghi ad altri elementi (es. click sulla card)
    if (!this.prodotto) return;
    
    const index = this.preferiti.indexOf(this.prodotto.id);
    if (index > -1) {
      this.preferiti.splice(index, 1); // Rimuove se c'è già
    } else {
      this.preferiti.push(this.prodotto.id); // Aggiunge se non c'è
    }
    localStorage.setItem('preferiti', JSON.stringify(this.preferiti));
    this.cdr.detectChanges(); // Aggiorna la vista per mostrare il cambio dell'icona
  }

  setCondizione(cond: 'Nuovo' | 'Usato') {
    this.prezzoCondizione = cond;
    this.cdr.detectChanges();
  }

  /**
   * Condizione effettivamente mostrata in questa pagina (Nuovo o Usato).
   * Coincide con prezzoCondizione, calcolata in caricaProdotto.
   */
  getCondizioneEffettiva(): 'Nuovo' | 'Usato' {
    return this.prezzoCondizione;
  }

  isUsato(): boolean {
    return this.prezzoCondizione === 'Usato';
  }

  /**
   * Prezzo "originale" da mostrare barrato accanto al prezzo Usato.
   * Grafica uniforme: ogni variante Usato (anche retrogaming e Usato "standalone"
   * dal DB) mostra sempre il barrato + -25%.
   *  - DB Nuovo visualizzato come Usato -> barrato = prezzo DB
   *  - DB Usato (o retrogaming)         -> barrato = prezzo_usato / 0.75
   */
  getPrezzoOriginale(): number | null {
    if (!this.prodotto) return null;
    if (this.prezzoCondizione !== 'Usato') return null;
    const prezzoUsato = this.getPrezzoVisualizzato();
    if (!prezzoUsato || prezzoUsato <= 0) return null;
    if (this.prodotto.condizione === 'Nuovo') {
      return Number(this.prodotto.vendibile);
    }
    return Math.round((prezzoUsato / 0.75) * 100) / 100;
  }

  getPuntiFedeltaVisualizzati(): number {
    if (!this.prodotto) return 0;
    const prezzoAttuale = this.getPrezzoVisualizzato();
    return Math.round(prezzoAttuale / 5);
  }

  getPrezzoVisualizzato(): number {
    if (!this.prodotto) return 0;
    
    if (this.isRetrogaming(this.prodotto)) {
      return Number(this.prodotto.vendibile);
    }

    if (this.prodotto.condizione === 'Usato') {
      if (this.prezzoCondizione === 'Nuovo') {
        return Math.round((Number(this.prodotto.vendibile) / 0.75) * 100) / 100;
      }
      return Number(this.prodotto.vendibile);
    }

    if (this.prezzoCondizione === 'Usato') {
      return Math.round((Number(this.prodotto.vendibile) * 0.75) * 100) / 100;
    }
    
    return Number(this.prodotto.vendibile);
  }

  getPrezzoPermutaBase(): number {
    if (!this.prodotto) return 0;
    // Valutazione base: 40% in meno rispetto al prezzo di vendita (quindi il 60% del valore)
    return Math.round((this.prodotto.vendibile * 0.60) * 2) / 2;
  }

  async aggiungiAlCarrello(prodotto: Prodotto) {
    const token = localStorage.getItem('token');
    const condizioneScelta = this.getCondizioneEffettiva();
    const prezzoFinale = this.getPrezzoVisualizzato();

    if (token) {
      // Utente loggato: invia al database
      try {
        const response = await fetch('http://localhost:3000/api/carrello/aggiungi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ prodottoId: prodotto.id, quantita: 1, condizione: condizioneScelta, prezzo: Number(prezzoFinale) })
        });
        if (response.ok) {
          this.toast.success(`${prodotto.nome} (${condizioneScelta}) aggiunto al carrello a €${prezzoFinale.toFixed(2)}!`);
        } else {
          const errorData = await response.json();
          console.error("Dettagli errore backend:", JSON.stringify(errorData, null, 2));
          this.toast.error(`Errore: ${errorData.error || errorData.message || 'Sconosciuto'}`);
        }
      } catch (error) {
        console.error('Errore di connessione:', error);
        this.toast.error('Errore di connessione al server.');
      }
    } else {
      // Utente ospite: salva in localStorage
      let carrello = JSON.parse(localStorage.getItem('carrello') || '[]');
        
        // Cerchiamo un elemento che abbia lo stesso ID E la stessa condizione
          const index = carrello.findIndex((item: any) => 
          (item.id || item.prodotto_id) === prodotto.id && item.condizione === condizioneScelta
        );

      if (index > -1) {
        carrello[index].quantita += 1;
      } else {
          // Creiamo una voce distinta per questa condizione
          carrello.push({ 
            ...prodotto, 
            quantita: 1, 
            condizione: condizioneScelta, 
            prezzoSelezionato: prezzoFinale 
          });
        }
      localStorage.setItem('carrello', JSON.stringify(carrello));
      this.toast.success(`${prodotto.nome} (${condizioneScelta}) aggiunto al carrello a €${prezzoFinale.toFixed(2)}!`);
    }
  }

  handleImageError(event: any) {
    event.target.src = 'https://via.placeholder.com/400?text=No+Image'; // Immagine di fallback
  }
}
