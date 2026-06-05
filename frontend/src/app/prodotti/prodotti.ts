import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './prodotti.html',
  styleUrl: './prodotti.css',
})
export class Prodotti implements OnInit {
  categoriaDenominazione: string | null = null;
  prodotti: Prodotto[] = new Array<Prodotto>();
  prodottiFiltrati: Prodotto[] = new Array<Prodotto>();
  filtroAttivo: string = 'Tutti';
  isLoading: boolean = false;
  errorMessage: string = '';

  // Mappatura tra il nome nella URL e l'ID della categoria nel DB
  private categoriaMap: { [key: string]: number } = {
    'console': 1,
    'videogiochi': 2,
    'accessori': 3,
    'elettronica': 4
  };

  constructor(private route: ActivatedRoute, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.categoriaDenominazione = params.get('nome');
      console.log('Categoria selezionata:', this.categoriaDenominazione);
      
      if (this.categoriaDenominazione) {
        this.caricaProdotti(this.categoriaDenominazione);
      }
    });
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
        this.prodotti = await response.json();
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

  impostaFiltro(filtro: string) {
    this.filtroAttivo = filtro;
    if (filtro === 'Tutti') {
      this.prodottiFiltrati = [...this.prodotti];
    } else {
      const f = filtro.toLowerCase();
      this.prodottiFiltrati = this.prodotti.filter(p => 
        p.nome.toLowerCase().includes(f) || p.descrizione.toLowerCase().includes(f)
      );
    }
  }
}
