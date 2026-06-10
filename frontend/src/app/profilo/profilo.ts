import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profilo',
  imports: [CommonModule],
  templateUrl: './profilo.html',
  styleUrl: './profilo.css',
})
export class Profilo implements OnInit, OnDestroy {
  utente: any = null;
  private routerSub!: Subscription;

  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {
    this.routerSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.caricaUtente(); 
      }
    });
  }

  ngOnInit() {
    this.caricaUtente();
    this.caricaDatiProfilo();
  }

  ngOnDestroy() {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  caricaUtente() {
    if (isPlatformBrowser(this.platformId)) {
      const userString = localStorage.getItem('user');
      if (userString) {
        this.utente = JSON.parse(userString);
      } else {
        this.utente = null;
      }
    }
  }


  async caricaDatiProfilo(){
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (!token) return; // Se non c'è il token, non facciamo la chiamata

      try {
        const response = await fetch('http://localhost:3000/api/auth/profilo', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          this.utente = await response.json();
          // Aggiorna anche il localStorage per mantenere la sessione sincronizzata ovunque
          localStorage.setItem('user', JSON.stringify(this.utente));
        } else {
          console.error('Errore nel caricamento del profilo');
        }
      } catch (error) {
        console.error('Errore di rete:', error);
      }
    }
  }
}
