import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: any = {
    nom: '',
    email: '',
    password: ''
  };

  confirmPassword: string = '';
  profileImage: string | null = null;   // URL de l’image (serveur ou preview)
  selectedFile: File | null = null;
  previewUrl: string | null = null;     // preview temporaire
  loading = false;

  constructor(private api: ApiService, private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  /** Charger profil */
  loadProfile() {
    this.api.getCurrentUser().subscribe({
      next: (res) => {
        this.user = { ...res, password: '' }; // pas de vrai mdp
        this.profileImage = res.image_url || 'assets/images/user-icon.png'; // icône par défaut
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger le profil'
        });
      }
    });
  }

  /** Enregistrer profil */
  updateProfile() {
    if (this.user.password && this.user.password !== this.confirmPassword) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Mot de passe',
        detail: 'Les mots de passe ne correspondent pas'
      });
      return;
    }

    this.loading = true;

    this.api.updateProfile(this.user, this.selectedFile || undefined).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Profil mis à jour ✅'
        });

        this.user = { ...res, password: '' };
        this.profileImage = res.image_url || 'assets/images/user-icon.png';

        this.confirmPassword = '';
        this.selectedFile = null;
        this.previewUrl = null;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Échec de la mise à jour'
        });
        this.loading = false;
      }
    });
  }

  /** Annuler */
  cancelEdit() {
    this.resetForm();
  }

  /** Reset */
  resetForm() {
    this.confirmPassword = '';
    this.selectedFile = null;
    this.previewUrl = null;
    this.loadProfile();
  }

  /** Gestion upload image */
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
        this.profileImage = this.previewUrl;
      };
      reader.readAsDataURL(file);
    }
  }
}
