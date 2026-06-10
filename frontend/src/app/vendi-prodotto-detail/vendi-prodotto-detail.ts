import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// Interfaccia per il prodotto, riutilizzata dal componente Prodotti
export interface Prodotto {
  id: number;
  categoria_id: number;
  categoria_nome: string; // Aggiunto: nome della categoria per la logica di filtro
  nome: string;
  descrizione: string;
  giacenza: number;
  immagine: string;
  prezzoUnitarioAcquisto: number;
  prezzoUnitarioVendita: number;
  pubblicatoAcquisto: boolean;
  pubblicatoVetrina: boolean;
  condizione: string;
  puntiFedelta: number; // Nuovo campo per i punti fedeltà
}

// Interfaccia per le opzioni di condizione
interface ConditionOption {
  value: string;
  label: string;
  adjustment: number; // Percentuale di aggiustamento al prezzo base (es. 0 per nessun cambiamento, -0.05 per -5%)
}

// Interfaccia per le categorie di condizione
interface ConditionCategory {
  name: string;
  options: ConditionOption[];
  selectedValue: string; // Opzione selezionata per questa categoria
}

@Component({
  selector: 'app-vendi-prodotto-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './vendi-prodotto-detail.html',
  styleUrl: './vendi-prodotto-detail.css',
})
export class VendiProdottoDetailComponent implements OnInit, OnDestroy {
  prodotto: Prodotto | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  prodottoId: number | null = null;
  estimatedPrice: number = 0;
  selectedFiles: File[] = [];

  // Definizione delle categorie di condizione e delle loro opzioni
  allConditionCategories: { [key: string]: ConditionCategory[] } = {
    'Videogiochi': [
      {
        name: 'Condizioni Disco/Cartuccia',
        options: [
          { value: 'ottime', label: 'Ottime condizioni (Piccoli graffi o assenza totale)', adjustment: 0 },
          { value: 'buone', label: 'Buone condizioni (Graffi superficiali, funzionante)', adjustment: -0.10 },
          { value: 'sufficienti', label: 'Condizioni sufficienti (Graffi evidenti, funzionante)', adjustment: -0.20 }
        ],
        selectedValue: 'ottime'
      },
      {
        name: 'Condizioni Custodia',
        options: [
          { value: 'perfetta', label: 'Perfetta (Nessun segno di usura, copertina originale)', adjustment: 0 },
          { value: 'buona', label: 'Buona (Piccoli segni di usura, copertina originale)', adjustment: -0.05 },
          { value: 'danneggiata', label: 'Danneggiata (Rotture, strappi o assenza copertina)', adjustment: -0.10 }
        ],
        selectedValue: 'perfetta'
      },
      {
        name: 'Condizioni Manuale e Inserti',
        options: [
          { value: 'completo', label: 'Presente e integro', adjustment: 0 },
        { value: 'mancante', label: 'Mancante', adjustment: -0.05 }
        ],
        selectedValue: 'completo'
      }
    ],
    'Console': [
      {
        name: 'Stato Estetico Console',
      options: [
        { value: 'pari_nuovo', label: 'Pari al nuovo', adjustment: 0 },
        { value: 'usato_ottimo', label: 'Ottimo (Segni minimi)', adjustment: -0.10 },
        { value: 'usato_segni', label: 'Usato (Graffi visibili)', adjustment: -0.20 }
      ],
      selectedValue: 'pari_nuovo'
    },
    {
      name: 'Funzionamento Tecnico',
      options: [
        { value: 'perfetto', label: 'Testata e funzionante', adjustment: 0 },
        { value: 'problemi_minori', label: 'Difetti minori (Esempio: porte USB)', adjustment: -0.30 },
        { value: 'non_funzionante', label: 'Non funzionante / Per parti', adjustment: -0.70 }
      ],
      selectedValue: 'perfetto'
    },
    {
      name: 'Cavi e Controller originali',
      options: [
        { value: 'tutti', label: 'Tutti inclusi', adjustment: 0 },
        { value: 'parziali', label: 'Alcuni mancanti', adjustment: -0.15 }
      ],
      selectedValue: 'tutti'
    }
  ],
  'Accessori': [
    {
      name: 'Condizioni Estetiche',
      options: [
        { value: 'ottime', label: 'Ottime', adjustment: 0 },
        { value: 'buone', label: 'Buone (Segni d\'usura)', adjustment: -0.15 },
        { value: 'usurato', label: 'Molto usurato (Esempio: gommini analogici)', adjustment: -0.30 }
      ],
      selectedValue: 'ottime'
    },
    {
      name: 'Funzionamento Tasti/Sensori',
      options: [
        { value: 'perfetto', label: 'Perfetto', adjustment: 0 },
        { value: 'drift_difetti', label: 'Difetti (Esempio: Drift analogico)', adjustment: -0.50 }
      ],
      selectedValue: 'perfetto'
    }
  ],
  'Elettronica': [
    {
      name: 'Stato Estetico (Hardware)',
      options: [
        { value: 'perfetto', label: 'Perfetto / Come nuovo', adjustment: 0 },
        { value: 'buono', label: 'Buono (Graffi superficiali)', adjustment: -0.10 },
        { value: 'usurato', label: 'Usurato (Segni evidenti)', adjustment: -0.25 }
      ],
      selectedValue: 'perfetto'
    },
    {
      name: 'Funzionamento Hardware',
      options: [
        { value: 'funzionante', label: 'Testato e funzionante', adjustment: 0 },
        { value: 'problemi', label: 'Difetti funzionali', adjustment: -0.50 }
      ],
      selectedValue: 'funzionante'
    }
  ]
};


  currentConditionCategories: ConditionCategory[] = []; // Questo array conterrà le categorie di condizione attuali

  private routeSub: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.routeSub = this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.prodottoId = +id;
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

        // Determina quale set di condizioni visualizzare in base alla categoria del prodotto
        const categoryName = this.prodotto?.categoria_nome;
        console.log('DEBUG: Categoria del prodotto caricato:', categoryName); // Aggiunto per debugging
        if (categoryName && this.allConditionCategories[categoryName]) {
          // Deep copy per assicurare che ogni prodotto abbia il proprio set mutabile di valori selezionati
          this.currentConditionCategories = JSON.parse(JSON.stringify(this.allConditionCategories[categoryName]));
        } else {
          this.errorMessage = 'Categoria prodotto non riconosciuta o non supportata per la valutazione.';
          this.prodotto = null; // Impedisce la visualizzazione del prodotto se la categoria non è supportata
        }

        this.calculateEstimatedPrice(); // Calcola il prezzo iniziale dopo aver impostato le condizioni
        console.log('Prodotto caricato per la valutazione:', this.prodotto);
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

  onConditionChange() {
    this.calculateEstimatedPrice();
  }

  calculateEstimatedPrice() {
    if (!this.prodotto) {
      this.estimatedPrice = 0;
      return;
    }

    // Prezzo base: 40% in meno rispetto al prezzo di vendita originale
    let basePrice = this.prodotto.prezzoUnitarioVendita * 0.60; // 60% del valore originale

    let totalAdjustment = 0;
    this.currentConditionCategories.forEach(category => { // Usa currentConditionCategories
      const selectedOption = category.options.find(opt => opt.value === category.selectedValue);
      if (selectedOption) {
        totalAdjustment += selectedOption.adjustment;
      }
    });

    // Applica l'aggiustamento totale al prezzo base
    // Assicurati che totalAdjustment non renda il prezzo negativo o troppo alto
    totalAdjustment = Math.max(-0.99, Math.min(0.50, totalAdjustment)); // Limita gli aggiustamenti

    this.estimatedPrice = basePrice * (1 + totalAdjustment);

    // Arrotondamento al 0.50 più vicino (es. 28.42 -> 28.50, 28.04 -> 28.00)
    this.estimatedPrice = Math.max(0, Math.round(this.estimatedPrice * 2) / 2);
  }

  onFileSelected(event: any) {
    if (event.target.files) {
      this.selectedFiles = Array.from(event.target.files);
    }
  }

  async submitSellOffer() {
    if (!this.prodotto || this.estimatedPrice <= 0) {
      alert('Impossibile inviare l\'offerta. Prodotto non valido o prezzo stimato non calcolabile.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Devi effettuare l\'accesso o registrarti per poter inviare una proposta di vendita.');
      localStorage.setItem('redirectDopoLogin', this.router.url);
      this.router.navigate(['/login']);
      return;
    }

    // Prepara i dati da inviare al backend
    const offerData = {
      prodottoId: this.prodotto.id,
      estimatedPrice: this.estimatedPrice,
      conditions: this.currentConditionCategories.map(cat => ({ // Invia solo le condizioni attuali
        category: cat.name,
        selectedOption: cat.selectedValue
      }))
    };

    try {
      // Questo sarà un nuovo endpoint backend per inviare un'offerta di vendita
      const response = await fetch('http://localhost:3000/api/vendi/offerta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(offerData)
      });

      if (response.ok) {
        alert(`Offerta di vendita per "${this.prodotto.nome}" inviata con successo! Prezzo stimato: €${this.estimatedPrice.toFixed(2)}. Riceverai una conferma a breve.`);
        this.router.navigate(['/']); // Reindirizza alla home o a una pagina "le mie offerte"
      } else {
        const errorData = await response.json();
        console.error("Dettagli errore backend (offerta di vendita):", errorData);
        alert(`Errore nell'invio dell'offerta: ${errorData.error || errorData.message || 'Sconosciuto'}`);
      }
    } catch (error) {
      console.error('Errore di connessione durante l\'invio dell\'offerta:', error);
      alert('Errore di connessione al server durante l\'invio dell\'offerta.');
    }
  }

  handleImageError(event: any) {
    event.target.src = 'https://via.placeholder.com/300?text=No+Image'; // Immagine di fallback
  }
}
