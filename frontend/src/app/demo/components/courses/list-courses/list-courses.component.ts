import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { ShareDialogComponent } from '../../share-dialog/share-dialog.component';


type Category = { id: number; name: string; image_url?: string };

@Component({
  selector: 'app-list-courses',
  templateUrl: './list-courses.component.html',
  styleUrls: ['./list-courses.component.scss'],
  providers: [DialogService]   // ➕

})
export class ListCoursesComponent implements OnInit {
  courses: any[] = [];
  categories: Category[] = []; // 🆕

  displayDetailsDialog: boolean = false;
  selectedCourse: any = {};

  displayEditDialog: boolean = false;
  editCourseData: any = {};

  displayCreateDialog: boolean = false;
  newCourse: any = { titre: '', description: '', category_id: null, image_url: '' }; // 🆕

  constructor(
    private api: ApiService,
    private messageService: MessageService,
    private router: Router,
    private dialogService: DialogService     // ➕


  ) { }

  ngOnInit(): void {
    this.loadCourses();
    // charger catégories pour les dropdowns
    this.api.getCategories().subscribe({
      next: (cats) => (this.categories = cats),
      error: () => { }
    });
  }

  openShareDialog(type: string, objectId: number) {
    const ref = this.dialogService.open(ShareDialogComponent, {
      header: 'Partager ce cours',
      width: '400px',
      data: { objectType: type, objectId }
    });

    ref.onClose.subscribe((result: any) => {
      if (result) {
        this.messageService.add({
          severity: 'success',
          summary: 'Partage',
          detail: 'Cours partagé avec succès.'
        });
      }
    });
  }

  // Charger les cours
  loadCourses(): void {
    this.api.getCourses().subscribe({
      next: (data) => {
        this.courses = data.reverse(); // garde ton ordre précédent
        this.messageService.add({
          severity: 'info',
          summary: 'Chargement réussi ✅',
          detail: `${data.length} cours chargés.`,
          life: 3000
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les cours ❌',
          life: 3000
        });
      }
    });
  }

  // Voir les détails
  goToChapters(courseId: number): void {
    this.router.navigate(['/courses', courseId, 'chapters']);
  }

  getCategoryName(id?: number | null): string {
    if (!id) return '';
    const cat = this.categories.find(c => c.id === id);
    return cat?.name ?? '';
  }

  getCategoryImageUrl(id?: number | null): string | undefined {
    if (!id) return undefined;
    return this.categories.find(c => c.id === id)?.image_url || undefined;
  }

  // Ouvrir popup modification
  openEditDialog(course: any): void {
    this.editCourseData = {
      ...course,
      category_id: course.category_id ?? course.category?.id ?? null,
      image_url: course.image_url ?? ''
    };
    this.displayEditDialog = true;
  }

  // Sauvegarder la modification
  saveUpdatedCourse(): void {
    this.api.updateCourse(this.editCourseData.id, this.editCourseData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Modification réussie ✅',
          detail: 'Cours modifié avec succès.',
          life: 3000
        });
        this.displayEditDialog = false;
        this.loadCourses();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de modifier le cours ❌',
          life: 3000
        });
      }
    });
  }

  // Supprimer un cours
  deleteCourse(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer ce cours ?')) {
      this.api.deleteCourse(id).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Suppression réussie 🗑️',
            detail: 'Cours supprimé avec succès.',
            life: 3000
          });
          this.loadCourses();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de supprimer le cours ❌',
            life: 3000
          });
        }
      });
    }
  }

  // Créer un nouveau cours
  saveNewCourse(): void {
    if (!this.newCourse.titre?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Champs requis ⚠️',
        detail: 'Le titre du cours est obligatoire.',
        life: 3000
      });
      return;
    }

    const payload = {
      titre: this.newCourse.titre.trim(),
      category_id: this.newCourse.category_id ?? null,
      image_url: this.newCourse.image_url?.trim() || null
    };

    this.api.createCourse(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Création réussie ✅',
          detail: 'Cours ajouté avec succès.',
          life: 3000
        });
        this.displayCreateDialog = false;
        this.newCourse = { titre: '', description: '', category_id: null, image_url: '' };
        this.loadCourses();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible d’ajouter le cours ❌',
          life: 3000
        });
      }
    });
  }
}
