import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../shared/toast.service';
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

  constructor(private fb: FormBuilder, private router: Router, private toast: ToastService) {
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
      const response = await fetch('http://localhost:3000/api/auth/login', {
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
        const userToSave = data.utente || data;
        localStorage.setItem('user', JSON.stringify(userToSave));
        
        this.toast.success('Login effettuato con successo!');
        
        // Controlla il ruolo e reindirizza alla pagina corretta
        if (userToSave.ruolo === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/']); // Reindirizza alla home
        }
      } else {
        const errorData = await response.json();
        this.toast.error(errorData.message || errorData.error);
        this.errorMessage = errorData.message || errorData.error;
      }
    }catch(error){
      console.error('Errore durante il login:', error);
      this.errorMessage = 'Errore di connessione al server.';
    } finally {
      this.isLoading = false;
    }
  }
}