import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { MessageService } from 'primeng/api';
import { ShareDialogComponent } from '../../share-dialog/share-dialog.component';
import { DialogService } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-course-chapters',
  templateUrl: './course-chapters.component.html',
  styleUrls: ['./course-chapters.component.scss']
})
export class CourseChaptersComponent implements OnInit {
  courseId!: number;
  course: any = {};
  chapters: any[] = [];

  newChapter: any = { titre: '', description: '' };
  selectedFile!: File;
  selectedFileName: string = '';
  previewUrl: string | null = null;

  loading = false; // 🔥 état du bouton lors de la création

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private messageService: MessageService,
    private dialogService: DialogService,

  ) { }

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('courseId'));
    this.loadCourse();
    this.loadChapters();
  }

  loadCourse() {
    this.api.getCourse(this.courseId).subscribe({
      next: (res) => this.course = res,
      error: (err) => console.error(err)
    });
  }

  loadChapters() {
    this.api.getChapters(this.courseId).subscribe({
      next: (res) => {
        // 🔥 trie les chapitres du plus récent au plus ancien
        this.chapters = res.sort((a: any, b: any) => b.id - a.id);
      },
      error: (err) => console.error(err)
    });
  }

  openShareDialog(type: string, objectId: number) {
    const ref = this.dialogService.open(ShareDialogComponent, {
      header: 'Partager ce chapitre',
      width: '400px',
      data: { objectType: type, objectId }
    });

    ref.onClose.subscribe(result => {
      if (result) {
        this.messageService.add({
          severity: 'success',
          summary: 'Partage réussi',
          detail: 'Chapitre partagé avec succès ✅'
        });
      }
    });
  }


  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        this.messageService.add({
          severity: 'warn',
          summary: 'Type de fichier invalide',
          detail: 'Veuillez sélectionner uniquement un fichier PDF.'
        });
        this.removeSelectedFile(); // reset sélection
        return;
      }

      this.selectedFile = file;
      this.selectedFileName = file.name;
      this.previewUrl = null; // pas d'aperçu image pour PDF
    }
  }


  removeSelectedFile() {
    this.selectedFile = undefined!;
    this.selectedFileName = '';
    this.previewUrl = null;
  }

  createChapter() {
    if (!this.newChapter.titre.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Champ requis',
        detail: 'Le titre du chapitre est obligatoire.'
      });
      return;
    }

    this.loading = true;
    this.api.createChapter(this.courseId, this.newChapter, this.selectedFile).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Chapitre ajouté.'
        });

        this.newChapter = { titre: '', description: '' };
        this.removeSelectedFile();
        this.loadChapters();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Échec de l’ajout.'
        });
        this.loading = false;
      }
    });
  }

  isImage(filename: string): boolean {
    const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return extensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  confirmDeleteChapter(chapterId: number) {
    if (confirm("❗ Voulez-vous vraiment supprimer ce chapitre ?")) {
      this.api.deleteChapter(chapterId).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Supprimé',
            detail: 'Chapitre supprimé avec succès.'
          });
          this.loadChapters();
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'La suppression a échoué.'
          });
        }
      });
    }
  }
}
