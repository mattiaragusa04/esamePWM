import { Component, signal, OnInit, Inject, PLATFORM_ID, HostListener, ViewChild, ElementRef } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('PAwerUP');
  utenteLoggato: any = null;
  termineRicerca: string = '';
  mostraRicerca: boolean = false;
  isMenuCollapsed: boolean = true;

  @ViewChild('searchContainer') searchContainer!: ElementRef;
  @ViewChild('searchInput') searchInput!: ElementRef;


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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.mostraRicerca && this.searchContainer && !this.searchContainer.nativeElement.contains(event.target)) {
        this.mostraRicerca = false;
      }
    }
  }

  toggleRicerca(event: Event): void {
    if (isPlatformBrowser(this.platformId)) {
      event.stopPropagation();
      this.mostraRicerca = !this.mostraRicerca;
      if (this.mostraRicerca) {
        setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
      }
    }
  }

  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

  cerca(){
    if (this.termineRicerca.trim()) {
      this.router.navigate(['/ricerca'], { queryParams: { q: this.termineRicerca } });
    }
    this.mostraRicerca = false;
  }

  
}
