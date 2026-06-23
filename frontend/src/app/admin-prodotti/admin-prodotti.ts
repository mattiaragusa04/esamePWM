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
  nuovoProdotto: any = {
    nome: '',
    categoria_id: '',
    descrizione: '',
    prezzoUnitarioVendita: 0,
    giacenza: 0,
    condizione: '',
    genere: '',
    immagine: ''
  };

  // Array dei generi disponibili per la categoria "Videogiochi"
  availableGenres: string[] = ['Azione', 'Avventura', 'Sport', 'Sparatutto'];
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef, private toast: ToastService) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.caricaProdotti();
    }
  }

  async caricaProdotti() {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      // Richiama l'API per ottenere tutti i prodotti (la stessa usata per il catalogo pubblico, ma senza filtri restrittivi)
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

    try{
      const response = await fetch(`http://localhost:3000/api/prodotti/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        this.caricaProdotti(); // Ricarica la lista dopo l'eliminazione
      } else {
        this.errorMessage = 'Errore durante l\'eliminazione.';
      }
    } catch (error) {
      console.error('Errore di rete:', error);
      this.errorMessage = 'Impossibile connettersi al server.';
    }
  }

  apriModale(prodotto?: any) {
    if (prodotto) {
      this.isModifica = true;
      this.prodottoInModificaId = prodotto.id;
      // Clona l'oggetto per non sovrascrivere direttamente la riga della tabella se si annulla
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
        giacenza: 0,
        condizione: 'Nuovo',
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
    this.rimuoviImmagine();
    this.isModifica = false;
    this.prodottoInModificaId = null;
  }

  // --- Gestione Drag & Drop ---
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

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.gestisciFile(event.target.files[0]);
    }
  }

  gestisciFile(file: File) {
    if (!file.type.match(/image\/*/)) {
      this.toast.error("Formato non supportato. Carica un'immagine.");
      return;
    }
    this.fileImmagine = file;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.immaginePreview = reader.result;
    };
  }

  rimuoviImmagine() {
    this.fileImmagine = null;
    this.immaginePreview = null;
    if (this.nuovoProdotto) {
      this.nuovoProdotto.immagine = '';
    }
  }

  async salvaNuovoProdotto(form: any){
    // Controlla che ci sia un file immagine nuovo OPPURE un'immagine preesistente mantenuta
    if (form.invalid || (!this.fileImmagine && !this.nuovoProdotto.immagine)) return;
    
    const formData = new FormData();
    formData.append('nome', this.nuovoProdotto.nome);
    formData.append('categoria_id', this.nuovoProdotto.categoria_id);
    formData.append('descrizione', this.nuovoProdotto.descrizione);
    formData.append('prezzoUnitarioVendita', this.nuovoProdotto.prezzoUnitarioVendita);
    formData.append('giacenza', this.nuovoProdotto.giacenza);
    formData.append('condizione', this.nuovoProdotto.condizione);
    formData.append('pubblicatoVetrina', this.nuovoProdotto.pubblicatoVetrina !== undefined ? (this.nuovoProdotto.pubblicatoVetrina ? '1' : '0') : '1');
    if (this.nuovoProdotto.categoria_id == 2 && this.nuovoProdotto.genere) {
      formData.append('genere', this.nuovoProdotto.genere);
    }
    
    // Aggiunge la nuova immagine se caricata, altrimenti reinvia il link della vecchia al database
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
          // Non impostare il Content-Type manualmente, `fetch` lo fa in automatico per il FormData
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });
      if (response.ok) {
        this.caricaProdotti(); // Ricarica la lista dopo il salvataggio
        form.resetForm();
        this.nuovoProdotto = { nome: '', categoria_id: '', descrizione: '', prezzoUnitarioVendita: 0, giacenza: 0, condizione: 'Nuovo', genere: '', immagine: '' };
        this.rimuoviImmagine();
        this.toast.success('Prodotto salvato con successo!');
        this.chiudiModale();
      } else {
        const errorData = await response.json();
        this.errorMessage = errorData.error || errorData.message || 'Errore durante l\'aggiunta.';
      }
    } catch (error) {
      console.error('Errore di rete:', error);
      this.errorMessage = 'Impossibile connettersi al server.';
    }
  }
}