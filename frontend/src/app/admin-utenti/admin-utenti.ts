import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

type AzioneConferma = 'elimina' | 'admin' | 'utente' | 'operatore';

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

  // --- Stato modale conferma ---
  modaleVisible = false;
  modaleUtente: any = null;
  modaleAzione: AzioneConferma | null = null;
  modaleLoading = false;

  // --- Stato pannello dettaglio ---
  panelloVisible = false;
  panelloUtente: any = null;
  // panelloDettaglio contiene SOLO indirizzi e carte.
  // I dati aggiornati dell'utente (inclusi punti_fedelta) sono in panelloUtente,
  // che viene sovrascritto con data.utente al completamento della chiamata /dettaglio.
  panelloDettaglio: { indirizzi: any[]; carte: any[] } | null = null;
  panelloLoading = false;
  panelloErrore = '';

  // --- Form modifica indirizzo ---
  editIndirizzoId: number | null = null;
  editIndirizzo: any = {};

  // --- Punti fedeltà ---
  deltaPunti: number = 0;
  notaPunti: string = '';
  puntiLoading = false;
  puntiMessaggio = '';

  // --- Reset password ---
  resetLoading = false;
  resetMessaggio = '';

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
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/auth/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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

  // ── Pannello dettaglio ───────────────────────────────────────────────
  async apriPannello(utente: any) {
    this.panelloUtente = utente;
    this.panelloVisible = true;
    this.panelloDettaglio = null;
    this.panelloErrore = '';
    this.panelloLoading = true;
    this.editIndirizzoId = null;
    this.editIndirizzo = {};
    this.deltaPunti = 0;
    this.notaPunti = '';
    this.puntiMessaggio = '';
    this.resetMessaggio = '';
    this.cdr.detectChanges();

    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(`http://localhost:3000/api/auth/${utente.id}/dettaglio`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        // Sovrascrive panelloUtente con i dati freschi dal DB (include punti_fedelta aggiornati)
        this.panelloUtente = data.utente;
        // panelloDettaglio contiene solo indirizzi e carte
        this.panelloDettaglio = { indirizzi: data.indirizzi, carte: data.carte };
      } else {
        this.panelloErrore = 'Errore nel caricamento del dettaglio.';
      }
    } catch (err) {
      this.panelloErrore = 'Impossibile connettersi al server.';
    } finally {
      this.panelloLoading = false;
      this.cdr.detectChanges();
    }
  }

  chiudiPannello() {
    this.panelloVisible = false;
    this.panelloUtente = null;
    this.panelloDettaglio = null;
    this.editIndirizzoId = null;
    this.cdr.detectChanges();
  }

  // ── Modifica indirizzo ───────────────────────────────────────────────
  avviaEditIndirizzo(ind: any) {
    this.editIndirizzoId = ind.id;
    this.editIndirizzo = { ...ind };
    this.cdr.detectChanges();
  }

  annullaEditIndirizzo() {
    this.editIndirizzoId = null;
    this.editIndirizzo = {};
    this.cdr.detectChanges();
  }

  async salvaIndirizzo() {
    const token = localStorage.getItem('token');
    try {
      const resp = await fetch(`http://localhost:3000/api/auth/indirizzi/${this.editIndirizzoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(this.editIndirizzo)
      });
      if (resp.ok) {
        const idx = this.panelloDettaglio!.indirizzi.findIndex(i => i.id === this.editIndirizzoId);
        if (idx !== -1) this.panelloDettaglio!.indirizzi[idx] = { ...this.editIndirizzo, id: this.editIndirizzoId };
        this.editIndirizzoId = null;
        this.editIndirizzo = {};
      }
    } catch (err) {
      console.error('Errore salvataggio indirizzo:', err);
    } finally {
      this.cdr.detectChanges();
    }
  }

  // ── Punti fedeltà ─────────────────────────────────────────────────
  async modificaPunti(delta: number) {
    if (!this.panelloUtente) return;
    this.puntiLoading = true;
    this.puntiMessaggio = '';
    const token = localStorage.getItem('token');
    try {
      const resp = await fetch(`http://localhost:3000/api/auth/${this.panelloUtente.id}/punti`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ delta, nota: this.notaPunti })
      });
      if (resp.ok) {
        // Aggiorna panelloUtente localmente per mostrare il nuovo valore senza ricaricare
        this.panelloUtente.punti_fedelta = (this.panelloUtente.punti_fedelta ?? 0) + delta;
        this.puntiMessaggio = `Punti aggiornati: ${delta >= 0 ? '+' : ''}${delta}`;
        this.deltaPunti = 0;
        this.notaPunti = '';
        // Aggiorna anche la riga nella tabella principale
        const u = this.utenti.find(x => x.id === this.panelloUtente.id);
        if (u) u.punti_fedelta = this.panelloUtente.punti_fedelta;
      } else {
        this.puntiMessaggio = 'Errore durante la modifica dei punti.';
      }
    } catch (err) {
      this.puntiMessaggio = 'Impossibile connettersi al server.';
    } finally {
      this.puntiLoading = false;
      this.cdr.detectChanges();
    }
  }

  // ── Reset password admin ────────────────────────────────────────────
  async inviaResetPassword() {
    if (!this.panelloUtente) return;
    this.resetLoading = true;
    this.resetMessaggio = '';
    const token = localStorage.getItem('token');
    try {
      const resp = await fetch(`http://localhost:3000/api/auth/${this.panelloUtente.id}/reset-password-admin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      this.resetMessaggio = data.message ?? (resp.ok ? 'Email inviata.' : 'Errore invio email.');
    } catch (err) {
      this.resetMessaggio = 'Impossibile connettersi al server.';
    } finally {
      this.resetLoading = false;
      this.cdr.detectChanges();
    }
  }

  // ── Modale conferma ─────────────────────────────────────────────────
  apriModale(utente: any, azione: AzioneConferma) {
    this.modaleUtente = utente;
    this.modaleAzione = azione;
    this.modaleVisible = true;
    this.cdr.detectChanges();
  }

  chiudiModale() {
    this.modaleVisible = false;
    this.modaleUtente = null;
    this.modaleAzione = null;
    this.modaleLoading = false;
    this.cdr.detectChanges();
  }

  get modaleConfig(): { titolo: string; testo: string; btnLabel: string; btnClass: string; icon: string } {
    const email = this.modaleUtente?.email ?? '';
    switch (this.modaleAzione) {
      case 'elimina':
        return { titolo: 'Elimina utente', testo: `Stai per eliminare definitivamente l'account di <strong>${email}</strong>. L'operazione non è reversibile.`, btnLabel: 'Elimina', btnClass: 'btn-danger', icon: 'bi-trash-fill' };
      case 'admin':
        return { titolo: 'Promuovi ad Amministratore', testo: `Stai per assegnare i privilegi di <strong>Amministratore</strong> a <strong>${email}</strong>.`, btnLabel: 'Promuovi', btnClass: 'btn-warning', icon: 'bi-person-gear' };
      case 'utente':
        return { titolo: 'Imposta come Utente', testo: `Stai per rimuovere eventuali privilegi speciali da <strong>${email}</strong> impostando il ruolo a <strong>Utente</strong>.`, btnLabel: 'Conferma', btnClass: 'btn-secondary', icon: 'bi-person' };
      case 'operatore':
        return { titolo: 'Promuovi ad Operatore', testo: `Stai per assegnare il ruolo di <strong>Operatore</strong> a <strong>${email}</strong>.`, btnLabel: 'Promuovi', btnClass: 'btn-info', icon: 'bi-headset' };
      default:
        return { titolo: '', testo: '', btnLabel: 'Conferma', btnClass: 'btn-primary', icon: 'bi-check' };
    }
  }

  async confermaAzione() {
    if (!this.modaleUtente || !this.modaleAzione) return;
    this.modaleLoading = true;
    this.cdr.detectChanges();
    switch (this.modaleAzione) {
      case 'elimina':   await this._eliminaUtente(this.modaleUtente);  break;
      case 'admin':     await this._rendiAdmin(this.modaleUtente);     break;
      case 'utente':    await this._rendiUtente(this.modaleUtente);    break;
      case 'operatore': await this._rendiOperatore(this.modaleUtente); break;
    }
    this.chiudiModale();
  }

  private async _eliminaUtente(utente: any) {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3000/api/auth/${utente.id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) await this.caricaUtenti();
      else this.errorMessage = "Errore durante l'eliminazione.";
    } catch { this.errorMessage = 'Impossibile connettersi al server.'; }
  }

  private async _rendiAdmin(utente: any) {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3000/api/auth/${utente.id}/admin`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ruolo: 'admin' })
      });
      if (response.ok) await this.caricaUtenti();
      else this.errorMessage = "Errore durante l'aggiornamento del ruolo.";
    } catch { this.errorMessage = 'Impossibile connettersi al server.'; }
  }

  private async _rendiUtente(utente: any) {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3000/api/auth/${utente.id}/user`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ruolo: 'utente' })
      });
      if (response.ok) await this.caricaUtenti();
      else this.errorMessage = "Errore durante l'aggiornamento del ruolo.";
    } catch { this.errorMessage = 'Impossibile connettersi al server.'; }
  }

  private async _rendiOperatore(utente: any) {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3000/api/auth/${utente.id}/operatore`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ruolo: 'operatore' })
      });
      if (response.ok) await this.caricaUtenti();
      else this.errorMessage = "Errore durante l'aggiornamento del ruolo.";
    } catch { this.errorMessage = 'Impossibile connettersi al server.'; }
  }
}
