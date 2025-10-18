import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { DialogService } from 'primeng/dynamicdialog';
import { ShareDialogComponent } from '../../share-dialog/share-dialog.component';


@Component({
  selector: 'app-chapter-resume',
  templateUrl: './chapter-resume.component.html',
  styleUrls: ['./chapter-resume.component.scss']
})
export class ChapterResumeComponent implements OnInit {
  chapterId!: number;
  resumeText = '';
  resumeId!: number; // ✅ ajouter

  errorMsg = '';
  loading = false;
  regenLoading = false;

  constructor(private route: ActivatedRoute, private api: ApiService ,private router: Router , private dialogService: DialogService) {}

  ngOnInit(): void {
    this.chapterId = +this.route.snapshot.paramMap.get('chapterId')!;
    this.loadResume();
  }

  loadResume() {
    this.loading = true;
    this.errorMsg = '';
    this.api.getChapterResume(this.chapterId).subscribe({
      next: (res) => {
        this.resumeId = res.id;    
        this.resumeText = res.resume || '';
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = err.error?.msg || 'Erreur lors du chargement du résumé.';
        this.resumeText = '';
        this.loading = false;
      }
    });
  }

  regenerate() {
    this.regenLoading = true;
    this.errorMsg = '';
    this.api.getChapterResume(this.chapterId, true).subscribe({
      next: (res) => {
        this.resumeText = res.resume || '';
        this.regenLoading = false;
      },
      error: (err) => {
        this.errorMsg = err.error?.msg || 'Erreur lors de la régénération.';
        this.regenLoading = false;
      }
    });
  }

  copy() {
    navigator.clipboard.writeText(this.resumeText || '');
  }

  download() {
    const blob = new Blob([this.resumeText || ''], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  goToQuiz() {
  this.router.navigate(['/chapters', this.chapterId, 'quiz']);
}

openShareDialog(type: string, objectId: number) {
  const ref = this.dialogService.open(ShareDialogComponent, {
    header: 'Partager cet élément',
    width: '400px',
    data: { objectType: type, objectId }
  });

  ref.onClose.subscribe((result) => {
    if (result) {
      console.log('Partage créé:', result);
    }
  });
}
}
