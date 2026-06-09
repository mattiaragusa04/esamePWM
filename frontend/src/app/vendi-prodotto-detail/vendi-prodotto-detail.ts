import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// Interfaccia per il prodotto, riutilizzata dal componente Prodotti
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

  // Definizione delle categorie di condizione e delle loro opzioni
  conditionCategories: ConditionCategory[] = [
    {
      name: 'Condizioni Disco/Cartuccia',
      options: [
        { value: 'ottime', label: 'Ottime condizioni (Presenza di piccoli graffi o assenza totale)', adjustment: 0 },
        { value: 'buone', label: 'Buone condizioni (Graffi superficiali che non compromettono il funzionamento)', adjustment: -0.10 },
        { value: 'sufficienti', label: 'Condizioni sufficienti (Graffi evidenti, ma ancora funzionante)', adjustment: -0.20 }
      ],
      selectedValue: 'ottime' // Selezione predefinita
    },
    {
      name: 'Condizioni Custodia',
      options: [
        { value: 'perfetta', label: 'Perfetta (Nessun segno di usura, completa di copertina originale)', adjustment: 0 },
        { value: 'buona', label: 'Buona (Piccoli segni di usura, copertina originale presente)', adjustment: -0.05 },
        { value: 'danneggiata', label: 'Danneggiata (Rotture, strappi o assenza della copertina)', adjustment: -0.10 }
      ],
      selectedValue: 'perfetta'
    },
    {
      name: 'Condizioni Manuale/Extra',
      options: [
        { value: 'completo', label: 'Completo (Manuale e/o altri extra presenti e in buone condizioni)', adjustment: 0 },
        { value: 'mancante', label: 'Mancante (Manuale e/o altri extra assenti o molto danneggiati)', adjustment: -0.05 }
      ],
      selectedValue: 'completo'
    },
    {
      name: 'Funzionamento',
      options: [
        { value: 'funzionante', label: 'Perfettamente funzionante', adjustment: 0 },
        { value: 'difettoso', label: 'Funzionamento difettoso (Non si avvia, blocchi, ecc.)', adjustment: -0.50 } // Riduzione significativa per articoli non funzionanti
      ],
      selectedValue: 'funzionante'
    }
  ];

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
        this.calculateEstimatedPrice(); // Calcola il prezzo iniziale
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
    this.conditionCategories.forEach(category => {
      const selectedOption = category.options.find(opt => opt.value === category.selectedValue);
      if (selectedOption) {
        totalAdjustment += selectedOption.adjustment;
      }
    });

    // Applica l'aggiustamento totale al prezzo base
    // Assicurati che totalAdjustment non renda il prezzo negativo o troppo alto
    totalAdjustment = Math.max(-0.99, Math.min(0.50, totalAdjustment)); // Limita gli aggiustamenti

    this.estimatedPrice = basePrice * (1 + totalAdjustment);

    // Assicurati che il prezzo non sia negativo e arrotonda a due cifre decimali
    this.estimatedPrice = Math.max(0, Math.round(this.estimatedPrice * 100) / 100);
  }

  async submitSellOffer() {
    if (!this.prodotto || this.estimatedPrice <= 0) {
      alert('Impossibile inviare l\'offerta. Prodotto non valido o prezzo stimato non calcolabile.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Sessione scaduta, effettua nuovamente il login per vendere il prodotto.');
      this.router.navigate(['/login']);
      return;
    }

    // Prepara i dati da inviare al backend
    const offerData = {
      prodottoId: this.prodotto.id,
      estimatedPrice: this.estimatedPrice,
      conditions: this.conditionCategories.map(cat => ({
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
