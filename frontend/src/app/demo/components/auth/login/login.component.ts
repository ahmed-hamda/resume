import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styles: [`
        :host ::ng-deep .p-password input {
            width: 100%;
            padding:1rem;
        }
        :host ::ng-deep .pi-eye,
        :host ::ng-deep .pi-eye-slash {
            transform:scale(1.6);
            margin-right: 1rem;
            color: var(--primary-color) !important;
        }
    `]
})
export class LoginComponent {

    valCheck: string[] = ['remember'];

    email: string = '';
    password: string = '';

    constructor(
        public layoutService: LayoutService,
        private http: HttpClient,
        private router: Router,
        private messageService: MessageService
    ) { }

   onSubmit() {
    if (!this.email || !this.password) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Champs requis',
        detail: 'Veuillez remplir tous les champs.'
      });
      return;
    }

    const loginData = { email: this.email, password: this.password };

    this.http.post('http://localhost:5000/api/login', loginData).subscribe({
      next: (response: any) => {
        localStorage.setItem('jwt', response.token);

        this.messageService.add({
          severity: 'success',
          summary: 'Connexion réussie',
          detail: 'Bienvenue ! Redirection en cours...'
        });

        setTimeout(() => {
          this.router.navigate(['/courses/list']);
        }, 1000);
      },
      error: err => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur de connexion',
          detail: err.error?.message || 'Identifiants invalides.'
        });
      }
    });
  }
}