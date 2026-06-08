import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-ricerca',
  imports: [CommonModule, RouterLink],
  templateUrl: './ricerca.html',
  styleUrl: './ricerca.css',
})
export class Ricerca implements OnInit {
  termineRicerca: string = '';
  prodottiTrovati: any[] = [];
  isLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.termineRicerca = params['q'] || '';
      if (this.termineRicerca) {
        this.eseguiRicerca(this.termineRicerca);
      } else {
        this.prodottiTrovati = [];
      }
    });
  }

  async eseguiRicerca(query: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    
    this.isLoading = true;
    try {
      const response = await fetch(`http://localhost:3000/api/prodotti/ricerca?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        this.prodottiTrovati = await response.json();
      } else {
        this.prodottiTrovati = [];
      }
    } catch (err) {
      console.error('Errore durante la ricerca:', err);
      this.prodottiTrovati = [];
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}
