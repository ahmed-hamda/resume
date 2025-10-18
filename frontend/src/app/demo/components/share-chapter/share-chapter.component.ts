import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-share-chapter',
  templateUrl: './share-chapter.component.html',
  styleUrls: ['./share-chapter.component.scss']
})
export class ShareChapterComponent implements OnInit {
  shareId!: number;
  chapter: any = null;
  loading = false;
  error = '';

  constructor(private route: ActivatedRoute, private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.shareId = +this.route.snapshot.paramMap.get('shareId')!;
    this.loadSharedChapter();
  }

  loadSharedChapter() {
    this.loading = true;
    this.api.getShareContent(this.shareId).subscribe({
      next: (res) => {
        if (res.type === 'chapter' && res.content) {
          this.chapter = res.content;
        } else {
          this.error = '❌ Ce partage ne contient pas de chapitre.';
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur chargement chapitre partagé.';
        this.loading = false;
      }
    });
  }

  goToResume() {
    if (this.chapter?.resume_id) {
      this.router.navigate(['/shares/resume', this.chapter.resume_id]);
    }
  }

  goToQuiz() {
    if (this.chapter?.quiz_id) {
      this.router.navigate(['/shares/quiz', this.chapter.quiz_id]);
    }
  }
}
