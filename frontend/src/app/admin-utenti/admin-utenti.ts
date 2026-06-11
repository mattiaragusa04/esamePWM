import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';  

@Component({
  selector: 'app-admin-utenti',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-utenti.html',
  styleUrl: './admin-utenti.css',
})
export class AdminUtenti implements OnInit {
  utenti: any[] = [];
  isLoading = true;
  errorMessage = '';

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
    try{
      const response = await fetch('http://localhost:3000/api/auth/utenti');
      if (response.ok) {
        this.utenti = await response.json();
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

  
}
