import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { MessageService } from 'primeng/api';

type Category = { id: number; name: string; image_url?: string };

@Component({
  selector: 'app-create-course',
  templateUrl: './create-course.component.html',
  styleUrls: ['./create-course.component.scss'],
  providers: [MessageService]
})
export class CreateCourseComponent implements OnInit {
  titre = '';
  // 🆕 pour la catégorie
  categories: Category[] = [];
  category_id: number | null = null;
  image_url: string = '';

  constructor(
    private api: ApiService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // charger la liste des catégories
    this.api.getCategories().subscribe({
      next: (cats) => (this.categories = cats),
      error: () => {}
    });
  }

  createCourse() {
    const titreClean = this.titre?.trim();

    if (!titreClean || titreClean.length < 3) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Le titre doit contenir au moins 3 caractères.'
      });
      return;
    }

    // 🆕 on envoie category_id et image_url (optionnelle)
    const payload = {
      titre: titreClean,
      category_id: this.category_id,
      image_url: this.image_url?.trim() || null
    };

    this.api.createCourse(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Cours créé avec succès !'
        });
        this.titre = '';
        this.category_id = null;
        this.image_url = '';
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err?.error?.msg || 'Erreur lors de la création du cours.'
        });
      }
    });
  }
}
