import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-admin-prodotti',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-prodotti.html',
  styleUrl: './admin-prodotti.css'
})
export class AdminProdotti implements OnInit {
  availableGenres : any[] = ['Azione ', 'Avventura', 'Sport', 'Sparatutto'];
  prodotti: any[] = [];
  prodottiFiltrati: any[] = [];
  searchQuery: string = '';
  isLoading: boolean = true;
  errorMessage: string = '';
  mostraModale: boolean = false;
  isDragging: boolean = false;
  fileImmagine: File | null = null;
  immaginePreview: string | ArrayBuffer | null = null;
  isModifica: boolean = false;
  prodottoInModificaId: number | null = null;

  // Stato riepilogo pre-salvataggio (solo creazione)
  mostraRiepilogo: boolean = false;
  prezzoNuovoCalcolato: number = 0;
  
  prezzoUsatoCalcolato: number = 0;

  nuovoProdotto: any = {
    nome: '',
    categoria_id: '',
    descrizione: '',
    prezzoUnitarioVendita: 0,
    giacenzaNuovo: 0,
    giacenzaUsato: 0,
    condizione: '',
    genere: '',
    immagine: ''
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.caricaProdotti();
    }
  }

  async caricaProdotti() {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      const response = await fetch('http://localhost:3000/api/prodotti');
      if (response.ok) {
        this.prodotti = await response.json();
        this.prodottiFiltrati = [...this.prodotti];
      } else {
        this.errorMessage = 'Errore nel caricamento dei prodotti.';
      }
    } catch (error) {
      console.error('Errore di rete:', error);
      this.errorMessage = 'Impossibile connettersi al server.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  filtraProdotti() {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.prodottiFiltrati = [...this.prodotti];
      return;
    }
    this.prodottiFiltrati = this.prodotti.filter(p =>
      p.nome?.toLowerCase().includes(q) ||
      p.condizione?.toLowerCase().includes(q) ||
      p.id?.toString().includes(q)
    );
  }

  async eliminaProdotto(id: number) {
    if (!confirm('Sei sicuro di voler eliminare il prodotto #' + id + '?')) return;
    try {
      const response = await fetch(`http://localhost:3000/api/prodotti/${id}`, { method: 'DELETE' });
      if (response.ok) {
        this.caricaProdotti();
      } else {
        this.errorMessage = 'Errore durante l\'eliminazione.';
      }
    } catch (error) {
      console.error('Errore di rete:', error);
      this.errorMessage = 'Impossibile connettersi al server.';
    }
  }

  apriModale(prodotto?: any) {
    this.mostraRiepilogo = false;
    if (prodotto) {
      this.isModifica = true;
      this.prodottoInModificaId = prodotto.id;
      this.nuovoProdotto = { ...prodotto, categoria_id: prodotto.categoria_id.toString() };
      if (prodotto.immagine) {
        this.immaginePreview = prodotto.immagine.includes('http') ? prodotto.immagine : 'http://localhost:3000/' + prodotto.immagine;
      } else {
        this.immaginePreview = null;
      }
    } else {
      this.isModifica = false;
      this.prodottoInModificaId = null;
      this.nuovoProdotto = {
        nome: '',
        categoria_id: '',
        descrizione: '',
        prezzoUnitarioVendita: 0,
        giacenzaNuovo: 0,
        giacenzaUsato: 0,
        condizione: '',
        genere: '',
        immagine: ''
      };
      this.immaginePreview = null;
    }
    this.fileImmagine = null;
    this.mostraModale = true;
  }

  chiudiModale() {
    this.mostraModale = false;
    this.mostraRiepilogo = false;
    this.rimuoviImmagine();
    this.isModifica = false;
    this.prodottoInModificaId = null;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.gestisciFile(event.dataTransfer.files[0]);
    }
  }

  // Chiamato dal submit del form: mostra il riepilogo invece di salvare subito
  richiediConferma(form: any) {
    if (form.invalid || (!this.fileImmagine && !this.nuovoProdotto.immagine)) return;

    const gNuovo = Number(this.nuovoProdotto.giacenzaNuovo) || 0;
    const gUsato = Number(this.nuovoProdotto.giacenzaUsato) || 0;
    if (gNuovo < 0 || gUsato < 0) {
      this.toast.error('Le giacenze non possono essere negative.');
      return;
    }
    if (gNuovo === 0 && gUsato === 0) {
      this.toast.error('Inserisci almeno una giacenza maggiore di 0.');
      return;
    }

    const { prezzoNuovo, prezzoUsato } = this.calcolaPrezzi();
    this.prezzoNuovoCalcolato = prezzoNuovo;
    this.prezzoUsatoCalcolato = prezzoUsato;
    this.mostraRiepilogo = true;
  }

  async salvaNuovoProdotto(form: any) {
    if (form.invalid || (!this.fileImmagine && !this.nuovoProdotto.immagine)) return;

    // Validazione: in creazione almeno una giacenza deve essere > 0
    if (!this.isModifica) {
      const gNuovo = Number(this.nuovoProdotto.giacenzaNuovo) || 0;
      const gUsato = Number(this.nuovoProdotto.giacenzaUsato) || 0;
      if (gNuovo < 0 || gUsato < 0) {
        this.toast.error('Le giacenze non possono essere negative.');
        return;
      }
      if (gNuovo === 0 && gUsato === 0) {
        this.toast.error('Inserisci almeno una giacenza maggiore di 0.');
        return;
      }
    }

    const formData = new FormData();
    formData.append('nome', this.nuovoProdotto.nome);
    formData.append('categoria_id', this.nuovoProdotto.categoria_id);
    formData.append('descrizione', this.nuovoProdotto.descrizione);
    formData.append('prezzoUnitarioVendita', this.nuovoProdotto.prezzoUnitarioVendita);
    formData.append('pubblicatoVetrina', this.nuovoProdotto.pubblicatoVetrina !== undefined ? (this.nuovoProdotto.pubblicatoVetrina ? '1' : '0') : '1');

    if (this.isModifica) {
      // In modifica: usa il campo giacenza singolo e condizione esistente
      formData.append('giacenza', this.nuovoProdotto.giacenza);
      formData.append('condizione', this.nuovoProdotto.condizione);
    } else {
      // In creazione: invia le due giacenze separate, il backend crea le due righe
      formData.append('giacenzaNuovo', this.nuovoProdotto.giacenzaNuovo);
      formData.append('giacenzaUsato', this.nuovoProdotto.giacenzaUsato);
    }

    if (this.nuovoProdotto.categoria_id == 2 && this.nuovoProdotto.genere) {
      formData.append('genere', this.nuovoProdotto.genere);
    }

    if (this.fileImmagine) {
      formData.append('immagine', this.fileImmagine);
    } else if (this.isModifica && this.nuovoProdotto.immagine) {
      formData.append('immagine', this.nuovoProdotto.immagine);
    }

    try {
      const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('token') : '';

      const url = this.isModifica
        ? `http://localhost:3000/api/prodotti/${this.prodottoInModificaId}`
        : 'http://localhost:3000/api/prodotti/create';
      const method = this.isModifica ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (response.ok) {
        this.caricaProdotti();
        form.resetForm();
        this.nuovoProdotto = { nome: '', categoria_id: '', descrizione: '', prezzoUnitarioVendita: 0, giacenzaNuovo: 0, giacenzaUsato: 0, condizione: '', genere: '', immagine: '' };
        this.rimuoviImmagine();
        this.mostraRiepilogo = false;
        this.toast.success('Prodotto salvato con successo!');
        this.chiudiModale();
      } else {
        const errorData = await response.json();
        this.errorMessage = errorData.error || errorData.message || 'Errore durante l\'aggiunta.';
        this.mostraRiepilogo = false;
      }
    } catch (error) {
      console.error('Errore di rete:', error);
      this.errorMessage = 'Impossibile connettersi al server.';
      this.mostraRiepilogo = false;
    }
  }
}
