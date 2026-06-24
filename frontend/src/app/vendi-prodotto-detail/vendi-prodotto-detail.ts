import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ToastService } from '../shared/toast.service';

export interface Prodotto {
  id: number;
  categoria_id: number;
  categoria_nome: string;
  nome: string;
  descrizione: string;
  giacenza: number;
  immagine: string;
  prezzoUnitarioAcquisto: number;
  PrezzoUnitarioVendita: number;
  pubblicatoAcquisto: boolean;
  visibile: boolean;
  condizione: string;
  puntiFedelta: number;
}

interface ConditionOption {
  value: string;
  label: string;
  adjustment: number;
}

interface ConditionCategory {
  name: string;
  options: ConditionOption[];
  selectedValue: string;
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
  imagePreviews: string[] = [];

  // Scelta compenso
  tipoCompenso: 'euro' | 'punti' = 'euro';
  // Punti calcolati: Math.round(prezzo_stimato / 5) + 5
  puntiFedeltatOfferti: number = 0;
  // Indica se l'utente ha almeno una carta salvata
  haCartaDiCredito: boolean = false;
  isLoadingCarte: boolean = false;

  allConditionCategories: { [key: string]: ConditionCategory[] } = {
    // --- Prodotti NUOVI / SIGILLATI ---
    'Nuovo': [
      {
        name: 'Stato della confezione',
        options: [
          { value: 'sigillato',           label: 'Sigillato (pellicola originale intatta)',      adjustment:  0     },
          { value: 'aperto_mai_usato',    label: 'Aperto ma mai usato',                          adjustment: -0.05  },
          { value: 'confezione_danneg',   label: 'Confezione danneggiata (ammaccature/strappi)', adjustment: -0.10  }
        ],
        selectedValue: 'sigillato'
      },
      {
        name: 'Contenuto della confezione',
        options: [
          { value: 'completo',    label: 'Completo (tutti gli accessori originali presenti)', adjustment:  0     },
          { value: 'incompleto', label: 'Incompleto (manca qualcosa: manuale, cavo, ecc.)',   adjustment: -0.10  }
        ],
        selectedValue: 'completo'
      },
      {
        name: 'Stato estetico esterno',
        options: [
          { value: 'perfetto',       label: 'Perfetto, nessun segno',                       adjustment:  0     },
          { value: 'segni_lievi',    label: 'Piccoli segni superficiali sulla confezione',  adjustment: -0.05  }
        ],
        selectedValue: 'perfetto'
      }
    ],
    // --- Prodotti USATI per categoria ---
    'Videogiochi': [
      {
        name: 'Condizioni Disco/Cartuccia',
        options: [
          { value: 'ottime',     label: 'Ottime condizioni (Piccoli graffi o assenza totale)',     adjustment:  0     },
          { value: 'buone',      label: 'Buone condizioni (Graffi superficiali, funzionante)',      adjustment: -0.10  },
          { value: 'sufficienti', label: 'Condizioni sufficienti (Graffi evidenti, funzionante)',  adjustment: -0.20  }
        ],
        selectedValue: 'ottime'
      },
      {
        name: 'Condizioni Custodia',
        options: [
          { value: 'perfetta',    label: 'Perfetta (Nessun segno di usura, copertina originale)', adjustment:  0     },
          { value: 'buona',       label: 'Buona (Piccoli segni di usura, copertina originale)',    adjustment: -0.05  },
          { value: 'danneggiata', label: 'Danneggiata (Rotture, strappi o assenza copertina)',     adjustment: -0.10  }
        ],
        selectedValue: 'perfetta'
      },
      {
        name: 'Condizioni Manuale e Inserti',
        options: [
          { value: 'completo',  label: 'Presente e integro', adjustment:  0     },
          { value: 'mancante', label: 'Mancante',             adjustment: -0.05  }
        ],
        selectedValue: 'completo'
      }
    ],
    'Console': [
      {
        name: 'Stato Estetico Console',
        options: [
          { value: 'pari_nuovo',   label: 'Pari al nuovo',           adjustment:  0     },
          { value: 'usato_ottimo', label: 'Ottimo (Segni minimi)',    adjustment: -0.10  },
          { value: 'usato_segni',  label: 'Usato (Graffi visibili)',  adjustment: -0.20  }
        ],
        selectedValue: 'pari_nuovo'
      },
      {
        name: 'Funzionamento Tecnico',
        options: [
          { value: 'perfetto',        label: 'Testata e funzionante',                   adjustment:  0     },
          { value: 'problemi_minori', label: 'Difetti minori (Esempio: porte USB)',      adjustment: -0.30  },
          { value: 'non_funzionante', label: 'Non funzionante / Per parti',              adjustment: -0.70  }
        ],
        selectedValue: 'perfetto'
      },
      {
        name: 'Cavi e Controller originali',
        options: [
          { value: 'tutti',    label: 'Tutti inclusi',     adjustment:  0     },
          { value: 'parziali', label: 'Alcuni mancanti',   adjustment: -0.15  }
        ],
        selectedValue: 'tutti'
      }
    ],
    'Accessori': [
      {
        name: 'Condizioni Estetiche',
        options: [
          { value: 'ottime',  label: 'Ottime',                                           adjustment:  0     },
          { value: 'buone',   label: "Buone (Segni d'usura)",                            adjustment: -0.15  },
          { value: 'usurato', label: 'Molto usurato (Esempio: gommini analogici)',        adjustment: -0.30  }
        ],
        selectedValue: 'ottime'
      },
      {
        name: 'Funzionamento Tasti/Sensori',
        options: [
          { value: 'perfetto',     label: 'Perfetto',                             adjustment:  0     },
          { value: 'drift_difetti', label: 'Difetti (Esempio: Drift analogico)',  adjustment: -0.50  }
        ],
        selectedValue: 'perfetto'
      }
    ],
    'Elettronica': [
      {
        name: 'Stato Estetico (Hardware)',
        options: [
          { value: 'perfetto', label: 'Perfetto / Come nuovo',         adjustment:  0     },
          { value: 'buono',    label: 'Buono (Graffi superficiali)',    adjustment: -0.10  },
          { value: 'usurato',  label: 'Usurato (Segni evidenti)',       adjustment: -0.25  }
        ],
        selectedValue: 'perfetto'
      },
      {
        name: 'Funzionamento Hardware',
        options: [
          { value: 'funzionante', label: 'Testato e funzionante', adjustment:  0     },
          { value: 'problemi',    label: 'Difetti funzionali',     adjustment: -0.50  }
        ],
        selectedValue: 'funzionante'
      }
    ]
  };

  currentConditionCategories: ConditionCategory[] = [];

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
      this.routeSub = this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.prodottoId = +id;
          this.caricaProdotto(this.prodottoId);
          this.verificaCartaDiCredito();
        } else {
          this.errorMessage = 'ID prodotto non fornito.';
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    // Revoca gli URL degli oggetti per liberare memoria
    this.imagePreviews.forEach(url => URL.revokeObjectURL(url));
  }

  async verificaCartaDiCredito() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.haCartaDiCredito = false;
      return;
    }
    this.isLoadingCarte = true;
    try {
      const response = await fetch('http://localhost:3000/api/carta/utente', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const carte = await response.json();
        this.haCartaDiCredito = Array.isArray(carte) && carte.length > 0;
      } else {
        this.haCartaDiCredito = false;
      }
    } catch {
      this.haCartaDiCredito = false;
    } finally {
      this.isLoadingCarte = false;
      // Se non ha carta, forza la scelta a 'punti'
      if (!this.haCartaDiCredito) {
        this.tipoCompenso = 'punti';
      }
      this.cdr.detectChanges();
    }
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

        // Se il prodotto è nuovo/sigillato usa le sezioni dedicate,
        // altrimenti usa le sezioni per usato in base alla categoria merceologica.
        const condizione    = this.prodotto?.condizione;
        const categoryName  = this.prodotto?.categoria_nome;

        if (condizione === 'Nuovo') {
          this.currentConditionCategories = JSON.parse(JSON.stringify(this.allConditionCategories['Nuovo']));
        } else if (categoryName && this.allConditionCategories[categoryName]) {
          this.currentConditionCategories = JSON.parse(JSON.stringify(this.allConditionCategories[categoryName]));
        } else {
          this.errorMessage = 'Categoria prodotto non riconosciuta o non supportata per la valutazione.';
          this.prodotto = null;
        }

        this.calculateEstimatedPrice();
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
      this.puntiFedeltatOfferti = 0;
      return;
    }

    let basePrice = this.prodotto.PrezzoUnitarioVendita * 0.60;

    let totalAdjustment = 0;
    this.currentConditionCategories.forEach(category => {
      const selectedOption = category.options.find(opt => opt.value === category.selectedValue);
      if (selectedOption) {
        totalAdjustment += selectedOption.adjustment;
      }
    });

    totalAdjustment = Math.max(-0.99, Math.min(0.50, totalAdjustment));
    this.estimatedPrice = basePrice * (1 + totalAdjustment);
    this.estimatedPrice = Math.max(0, Math.round(this.estimatedPrice * 2) / 2);

    // Calcola punti: Math.round(prezzo / 5) + 5
    this.puntiFedeltatOfferti = Math.round(this.estimatedPrice / 5) + 5;

    this.cdr.detectChanges();
  }

  onFileSelected(event: any) {
    const files: FileList | null = event.target.files;
    if (!files) return;

    const maxFiles = 5;
    const currentFilesCount = this.selectedFiles.length;
    const newFilesCount = files.length;

    if (currentFilesCount + newFilesCount > maxFiles) {
      this.toast.warning(`Puoi caricare al massimo ${maxFiles} immagini.`);
      // Resetta l'input per permettere una nuova selezione
      (event.target as HTMLInputElement).value = '';
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (this.selectedFiles.length < maxFiles) {
        this.selectedFiles.push(file);
        const url = URL.createObjectURL(file);
        this.imagePreviews.push(url);
      }
    }

    // Resetta l'input per permettere di aggiungere altri file in seguito
    (event.target as HTMLInputElement).value = '';
  }

  removeImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    const urlToRemove = this.imagePreviews.splice(index, 1)[0];
    URL.revokeObjectURL(urlToRemove);
  }

  async submitSellOffer() {
    if (this.selectedFiles.length === 0) {
      this.toast.warning('È obbligatorio caricare almeno una foto del prodotto.');
      return;
    }

    if (!this.prodotto || this.estimatedPrice <= 0) {
      this.toast.error("Impossibile inviare l'offerta. Prodotto non valido o prezzo stimato non calcolabile.");
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      this.toast.warning("Devi effettuare l'accesso o registrarti per poter inviare una proposta di vendita.");
      localStorage.setItem('redirectDopoLogin', this.router.url);
      this.router.navigate(['/login']);
      return;
    }

    const formData = new FormData();
    const offerDetails = {
      prodottoId: this.prodotto.id,
      estimatedPrice: this.estimatedPrice,
      tipoCompenso: this.tipoCompenso,
      conditions: this.currentConditionCategories.map(cat => ({
        category: cat.name,
        selectedOption: cat.selectedValue
      })),
    };

    formData.append('offer', JSON.stringify(offerDetails));
    this.selectedFiles.forEach(file => formData.append('images', file));

    try {
      const response = await fetch('http://localhost:3000/api/vendi/offerta', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const compensoMsg = this.tipoCompenso === 'punti'
          ? `${this.puntiFedeltatOfferti} punti fedeltà`
          : `€${this.estimatedPrice.toFixed(2)}`;
        this.toast.success(`Offerta per "${this.prodotto.nome}" inviata! Compenso proposto: ${compensoMsg}. Riceverai una conferma a breve.`);
        this.router.navigate(['/profilo/vendite']);
      } else {
        const errorData = await response.json();
        this.toast.error(`Errore nell'invio dell'offerta: ${errorData.error || errorData.message || 'Sconosciuto'}`);
      }
    } catch (error) {
      console.error("Errore di connessione durante l'invio dell'offerta:", error);
      this.toast.error("Errore di connessione al server durante l'invio dell'offerta.");
    }
  }

  handleImageError(event: any) {
    event.target.src = 'https://via.placeholder.com/300?text=No+Image';
  }
}
