import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-carte-di-credito',
  imports: [CommonModule, RouterLink, Sidebar],
  templateUrl: './carte-di-credito.html',
  styleUrl: './carte-di-credito.css',
})
export class CarteDiCredito {
  carte: any[] = [];
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
        this.caricaCarte();
      } else {
        this.router.navigate(['/login']);
      }
    }
  }

  async caricaCarte() {
    this.isLoading = true;
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:3000/api/carta/utente', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        this.carte = await response.json();
      } else {
        console.error('Errore nel caricamento delle carte');
      }
    } catch (error) {
      console.error('Errore di rete:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async eliminaCarta(id: number) {
    if (!confirm('Sei sicuro di voler eliminare questa carta?')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3000/api/carta/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        this.carte = this.carte.filter(c => c.id !== id);
        this.cdr.detectChanges();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Errore durante l\'eliminazione della carta');
      }
    } catch (error) {
      console.error('Errore:', error);
    }
  }

}
