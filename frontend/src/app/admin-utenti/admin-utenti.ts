import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-utenti',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-utenti.html',
  styleUrl: './admin-utenti.css',
})
export class AdminUtenti implements OnInit {
  utenti: any[] = [];
  utentiFiltrati: any[] = [];
  isLoading = true;
  errorMessage = '';
  searchQuery = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.caricaUtenti();
    }
  }

  async caricaUtenti() {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      const response = await fetch('http://localhost:3000/api/auth/utenti');
      if (response.ok) {
        this.utenti = await response.json();
        this.utentiFiltrati = [...this.utenti];
      } else {
        this.errorMessage = 'Errore nel caricamento degli utenti.';
      }
    } catch (error) {
      console.error('Errore di rete:', error);
      this.errorMessage = 'Impossibile connettersi al server.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  filtraUtenti() {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.utentiFiltrati = [...this.utenti];
      return;
    }
    this.utentiFiltrati = this.utenti.filter(u =>
      u.nome?.toLowerCase().includes(q) ||
      u.cognome?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.ruolo?.toLowerCase().includes(q)
    );
  }
}
