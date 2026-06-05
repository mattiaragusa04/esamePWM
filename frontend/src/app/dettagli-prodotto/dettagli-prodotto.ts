import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dettagli-prodotto',
  imports: [CommonModule, FormsModule],
  templateUrl: './dettagli-prodotto.html',
  styleUrl: './dettagli-prodotto.css',
})
export class DettagliProdotto {
  prodotto: any = null;
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.caricaDettagliProdotto(id);
      }
    });
  }

  async caricaDettagliProdotto(id: string) {
    this.isLoading = true;
    try {
      const response = await fetch(`http://localhost:3000/api/prodotti/${id}`);
      if (response.ok) {
        this.prodotto = await response.json();
      } else {
        this.errorMessage = 'Prodotto non trovato.';
      }
    } catch (error) {
      console.error('Errore nel caricamento del prodotto:', error);
      this.errorMessage = 'Errore di connessione al server.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  aggiungiAlCarrello() {
    if (!this.prodotto) return;
    
    let carrello = JSON.parse(localStorage.getItem('carrello') || '[]');
    const index = carrello.findIndex((item: any) => item.id === this.prodotto.id);
    
    if (index > -1) {
      carrello[index].quantita += 1;
    } else {
      carrello.push({ ...this.prodotto, quantita: 1 });
    }
    
    localStorage.setItem('carrello', JSON.stringify(carrello));
    alert(`${this.prodotto.nome} aggiunto al carrello!`);
  }

}
