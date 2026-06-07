import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-ordini',
  imports: [CommonModule, RouterLink, Sidebar],
  templateUrl: './ordini.html',
  styleUrl: './ordini.css',
})
export class Ordini implements OnInit {
  ordini: any[] = [];
  isLoading: boolean = true;
  utente: any = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const userString = localStorage.getItem('user');
      if (userString) {
        this.utente = JSON.parse(userString);
      }
      this.caricaOrdini();
    }
  }

  async caricaOrdini() {
    this.isLoading = true;
    const token = localStorage.getItem('token');

    if (!token) {
      this.isLoading = false;
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/ordine/utente', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        this.ordini = await response.json();
        // Ordiniamo la lista per mostrare gli acquisti più recenti in alto
        this.ordini.sort((a, b) => b.id - a.id);
      } else {
        console.error('Errore nel caricamento degli ordini');
      }
    } catch (error) {
      console.error('Errore di rete:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }


}
