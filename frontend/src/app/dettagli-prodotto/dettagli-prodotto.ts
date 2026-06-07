import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-dettagli-prodotto',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dettagli-prodotto.html',
  styleUrl: './dettagli-prodotto.css',
})
export class DettagliProdotto {
  prodotto: any = null;
  prodottoDisplayName: string = '';
  prodottoDescrizioneCombined: string = '';
  isLoading: boolean = true;
  errorMessage: string = '';
  selectedCondition: 'Nuovo' | 'Usato' = 'Nuovo';

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
        const nomeRaw = this.prodotto?.nome || '';

        const abbreviateProductName = (name: string) => {
          const separatorMatch = name.match(/^(.*?)(?:\s*[\/\-,–:\|\(\,]\s*)(.*)$/);
          if (separatorMatch) {
            return {
              display: separatorMatch[1].trim(),
              remainder: separatorMatch[2].trim()
            };
          }

          if (name.length > 45) {
            const words = name.split(/\s+/);
            const splitIndex = Math.min(6, Math.max(3, Math.ceil(words.length / 2)));
            return {
              display: words.slice(0, splitIndex).join(' ').trim(),
              remainder: words.slice(splitIndex).join(' ').trim()
            };
          }

          return { display: name.trim(), remainder: '' };
        };

        const { display, remainder } = abbreviateProductName(nomeRaw);
        const descFromProd = this.prodotto?.descrizione && this.prodotto.descrizione !== 'Nessuna descrizione disponibile' ? this.prodotto.descrizione : '';
        this.prodottoDisplayName = display;
        this.prodottoDescrizioneCombined = [remainder, descFromProd].filter(Boolean).join(' ').trim();
        if (!this.prodottoDescrizioneCombined) this.prodottoDescrizioneCombined = descFromProd || '';
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
    const prezzoSelezionato = this.getPrezzoVisualizzato(this.prodotto);
    const index = carrello.findIndex((item: any) => item.id === this.prodotto.id && item.condizione === this.selectedCondition);
    
    if (index > -1) {
      carrello[index].quantita += 1;
    } else {
      carrello.push({ ...this.prodotto, quantita: 1, condizione: this.selectedCondition, prezzoSelezionato });
    }
    
    localStorage.setItem('carrello', JSON.stringify(carrello));
    alert(`${this.prodotto.nome} aggiunto al carrello!`);
  }

  setCondizione(cond: 'Nuovo' | 'Usato') {
    this.selectedCondition = cond;
  }

  getPrezzoVisualizzato(p: any): number {
    if (!p) return 0;
    if (this.selectedCondition === 'Usato') {
      return Math.round((p.prezzoUnitarioVendita * 0.75) * 100) / 100;
    }
    return p.prezzoUnitarioVendita;
  }

}
