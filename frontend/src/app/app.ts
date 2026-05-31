import { Component, signal, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, RouterLink, Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterModule, RouterLink, CommonModule,],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('PAwerUP');
  utenteLoggato: any = null;

  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {
    // Questo permette alla navbar di aggiornarsi automaticamente
    // ogni volta che si cambia pagina (ad esempio dopo la registrazione)
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.checkSession();
      }
    });
  }

  ngOnInit() {
    this.checkSession();
  }

  checkSession() {
    // Controlla se il codice è in esecuzione nel browser prima di usare localStorage
    if (isPlatformBrowser(this.platformId)) {
      const userString = localStorage.getItem('user');
      if (userString) {
        this.utenteLoggato = JSON.parse(userString);
      } else {
        this.utenteLoggato = null;
      }
    }
  }

  logout() {
    //pulisce la sessione
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    //Aggiorna lo stato locale e reindirizza alla home
    this.utenteLoggato = null;
    alert('Logout effettuato con successo!');
    this.router.navigate(['/']);
  }
}
