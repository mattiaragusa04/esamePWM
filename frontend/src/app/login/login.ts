import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  submitted: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  email: string = '';
  password: string = '';
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }
  async onSubmit() {
    this.submitted = true;
    this.errorMessage = '';

    if (!this.loginForm.valid) {
      return;
    }

    this.isLoading = true;
    try{
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.loginForm.value)
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Login riuscito:', data);
        
        // Salva l'utente nella sessione
        if (data.token) localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.utente || data));
        
        alert('Login effettuato con successo!');
        this.router.navigate(['/']); // Reindirizza alla home
      } else {
        alert(this.errorMessage);
        this.errorMessage = 'Credenziali non valide. Riprova.';
      }
    }catch(error){
      console.error('Errore durante il login:', error);
      this.errorMessage = 'Errore di connessione al server.';
    } finally {
      this.isLoading = false;
    }
  }
}