import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// Interfaccia per il prodotto, riutilizzata dal componente Prodotti
export interface Prodotto {
  id: number;
  categoria_id: number;
  categoria_nome: string; // Nome derivato dalla tabella Categoria (denominazione)
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
  selector: 'app-vendi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vendi.html',
  styleUrl: './vendi.css',
})
export class Vendi implements OnInit, OnDestroy {
  prodotti: Prodotto[] = [];
  prodottiFiltrati: Prodotto[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  searchTerm: string = '';
  categoriaSelezionata: string = 'Tutti';

  // Proprietà per la paginazione
  paginaCorrente: number = 1;
  elementiPerPagina: number = 9;

  private routeSub: Subscription | undefined;

  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.caricaProdotti();
    }
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  async caricaProdotti() {
    this.isLoading = true;
    this.errorMessage = '';
    this.prodotti = [];
    this.prodottiFiltrati = [];

    try {
      // Recupera tutti i prodotti dal backend
      const response = await fetch(`http://localhost:3000/api/prodotti`);
      if (response.ok) {
        const data = await response.json();
        const allowedCategories = ['Videogiochi', 'Console', 'Accessori', 'Elettronica'];
        
        // Filtriamo i prodotti basandoci sulla denominazione della categoria
        this.prodotti = data.filter((p: Prodotto) => allowedCategories.includes(p.categoria_nome));
        
        this.applicaFiltri();
        console.log('Prodotti caricati per la vendita:', this.prodotti);
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

  applicaFiltri() {
    let result = [...this.prodotti];

    // Filtro per categoria
    if (this.categoriaSelezionata !== 'Tutti') {
      result = result.filter(p => p.categoria_nome === this.categoriaSelezionata);
    }

    // Filtro per ricerca testuale
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p =>
        p.nome.toLowerCase().includes(term) ||
        (p.descrizione && p.descrizione.toLowerCase().includes(term))
      );
    }

    this.prodottiFiltrati = result;
    this.paginaCorrente = 1; // Resetta alla prima pagina quando si applica un filtro
    this.cdr.detectChanges();
  }

  impostaFiltro(categoria: string) {
    this.categoriaSelezionata = categoria;
    this.applicaFiltri();
  }

  selezionaProdottoPerVendita(prodottoId: number) {
    this.router.navigate(['/vendi', prodottoId]);
  }

  handleImageError(event: any) {
    event.target.src = 'https://via.placeholder.com/150?text=No+Image'; // Immagine di fallback
  }

  getProdottiPaginati(): Prodotto[] {
    const inizio = (this.paginaCorrente - 1) * this.elementiPerPagina;
    const fine = inizio + this.elementiPerPagina;
    return this.prodottiFiltrati.slice(inizio, fine);
  }

  getNumeroPagine(): number {
    return Math.ceil(this.prodottiFiltrati.length / this.elementiPerPagina);
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
