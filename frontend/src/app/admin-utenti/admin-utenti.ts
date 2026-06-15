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

  async eliminaUtente(utente : any) {
    if (!confirm('Sei sicuro di voler eliminare l\'utente ' + utente.email + '?')) return;
    
    const token = localStorage.getItem('token');
    try{
      const response = await fetch(`http://localhost:3000/api/auth/${utente.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        this.caricaUtenti(); // Ricarica la lista dopo l'eliminazione
      } else {
        this.errorMessage = 'Errore durante l\'eliminazione.';
      }
    } catch (error) {
      console.error('Errore di rete:', error);
      this.errorMessage = 'Impossibile connettersi al server.';
    }
  }

  async rendiAdmin(utente : any){
    if (!confirm('Sei sicuro di voler rendere amministratore l\'utente ' + utente.email + '?')) return;
    
    const token = localStorage.getItem('token');
    try{
      const response = await fetch(`http://localhost:3000/api/auth/${utente.id}/admin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ruolo: 'admin' }) // Invia il dato nel caso il backend lo richieda
      });
      
      if (response.ok) {
        this.caricaUtenti(); // Ricarica la lista per mostrare il nuovo ruolo "admin"
      } else {
        this.errorMessage = 'Errore durante l\'aggiornamento del ruolo.';
      }
    }catch(error){
      console.error('Errore di rete:', error);
      this.errorMessage = 'Impossibile connettersi al server.';
    }
  }

  async rendiUtente(utente : any){
    if (!confirm('Sei sicuro di voler rendere utente l\'utente ' + utente.email + '?')) return;
    
    const token = localStorage.getItem('token');
    try{
      const response = await fetch(`http://localhost:3000/api/auth/${utente.id}/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ruolo: 'utente' }) // Invia il dato nel caso il backend lo richieda
      });
      
      if (response.ok) {
        this.caricaUtenti(); // Ricarica la lista per mostrare il nuovo ruolo "utente"
      } else {
        this.errorMessage = 'Errore durante l\'aggiornamento del ruolo.';
      }
    }catch(error){
      console.error('Errore di rete:', error);
      this.errorMessage = 'Impossibile connettersi al server.';
    }
  }

  async rendiOperatore(utente: any){
    if (!confirm('Sei sicuro di voler rendere operatore l\'utente ' + utente.email + '?')) return;
    
    const token = localStorage.getItem('token');
    try{
      const response = await fetch(`http://localhost:3000/api/auth/${utente.id}/operatore`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ruolo: 'operatore' }) // Invia il dato nel caso il backend lo richieda
      });
      
      if (response.ok) {
        this.caricaUtenti(); // Ricarica la lista per mostrare il nuovo ruolo "operatore"
      } else {
        this.errorMessage = 'Errore durante l\'aggiornamento del ruolo.';
      }
    }catch(error){
      console.error('Errore di rete:', error);
      this.errorMessage = 'Impossibile connettersi al server.';
    }
  }
}
