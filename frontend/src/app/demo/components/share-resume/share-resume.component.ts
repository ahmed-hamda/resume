import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-share-resume',
  templateUrl: './share-resume.component.html',
  styleUrls: ['./share-resume.component.scss']
})
export class ShareResumeComponent implements OnInit {
  resumeId!: number;
  resumeText: string = '';
  loading = false;
  error = '';
  quizId?: number;   // ✅ récupéré si dispo
  hasQuiz = false;  // ✅


  constructor(private route: ActivatedRoute, private api: ApiService, private router: Router) { }

  ngOnInit(): void {
    this.resumeId = +this.route.snapshot.paramMap.get('resumeId')!;
    this.quizId = +this.route.snapshot.queryParamMap.get('quizId')!; // ✅ récupéré
    this.loadResume();
  }

  loadResume() {
    this.loading = true;
    this.api.getSharedResume(this.resumeId).subscribe({
      next: (res) => {
        this.resumeText = res.content || '';
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur chargement résumé partagé.';
        this.loading = false;
      }
    });
  }

  goToQuiz() {
    if (this.quizId) {
      this.router.navigate(['/shares/quiz', this.quizId]);
    }
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
}
