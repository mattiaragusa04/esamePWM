import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  tipoSelezionato: string = '';
  submitted: boolean = false;
  registerForm: FormGroup;

  constructor(private fb: FormBuilder) {
    // Definiamo la struttura del nostro form e le validazioni
    this.registerForm = this.fb.group({
      nome: ['', Validators.required],
      cognome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confermaPassword: ['', Validators.required],
      tipoIndirizzo: ['', Validators.required],
      via: ['', Validators.required],
      numeroCivico: ['', Validators.required],
      paese: ['', Validators.required],
      provincia: ['', Validators.required]
    });
  }

  impostaTipoIndirizzo(tipo: string) {
    this.tipoSelezionato = tipo;
    // Aggiorniamo il valore del tipo di indirizzo all'interno del form
    this.registerForm.patchValue({ tipoIndirizzo: tipo });
  }

  onSubmit() {
    this.submitted = true;
    
    if (this.registerForm.valid) {
      console.log('Dati pronti per essere inviati al server:', this.registerForm.value);
    } else {
      console.log('Attenzione: il form contiene errori di validazione.');
    }
  }
}
