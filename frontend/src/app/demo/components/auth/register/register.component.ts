import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  user = {
    nom: '',
    email: '',
    type: '',
    password: ''
  };

  confirmPassword: string = '';

  types = [
    { label: 'Étudiant', value: 'etudiant' },
    { label: 'Enseignant', value: 'enseignant' }
  ];
  layoutService: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private messageService: MessageService
  ) { }


  onSubmit() {
    if (this.user.password !== this.confirmPassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Les mots de passe ne correspondent pas.'
      });
      return;
    }

    this.http.post('http://localhost:5000/api/register', this.user).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Inscription réussie ! Redirection...'
        });
        // ✅ Redirection après 2 secondes
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 1000);
      },
      error: err => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err.error?.message || 'Erreur lors de l\'inscription'
        });
      }
    });
  }
}
