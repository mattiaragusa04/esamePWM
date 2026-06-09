import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
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
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './vendi.html',
  styleUrl: './vendi.css',
})
export class VendiComponent implements OnInit, OnDestroy {
  prodotti: Prodotto[] = [];
  prodottiFiltrati: Prodotto[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  searchTerm: string = '';

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
        const allowedCategories = ['Videogiochi', 'Console', 'Accessori'];
        
        // Filtriamo i prodotti basandoci sulla denominazione della categoria
        this.prodotti = data.filter((p: Prodotto) => allowedCategories.includes(p.categoria_nome));
        
        this.prodottiFiltrati = [...this.prodotti];
        console.log('Prodotti caricati per la vendita:', this.prodotti);
        this.cdr.detectChanges();
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

  cercaProdotti() {
    if (this.searchTerm.trim()) {
      const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
      this.prodottiFiltrati = this.prodotti.filter(p =>
        p.nome.toLowerCase().includes(lowerCaseSearchTerm) ||
        (p.descrizione && p.descrizione.toLowerCase().includes(lowerCaseSearchTerm))
      );
    } else {
      this.prodottiFiltrati = [...this.prodotti];
    }
  }

  selezionaProdottoPerVendita(prodottoId: number) {
    this.router.navigate(['/vendi', prodottoId]);
  }

  handleImageError(event: any) {
    event.target.src = 'https://via.placeholder.com/150?text=No+Image'; // Immagine di fallback
  }
}
