import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-share-detail',
  templateUrl: './share-detail.component.html',
  styleUrls: ['./share-detail.component.scss'],
})
export class ShareDetailComponent implements OnInit {
  shareId!: number;

  // Résumé
  content = '';

  // Quiz
  type = '';
  quiz: any = null;
  quizId: number | null = null;
  answers: Record<string, number[]> = {};   // { "0": [1], "1": [0,2], ... }
  quizResult: { score: number; total: number; correct: number } | null = null;

  loading = false;

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    this.shareId = +this.route.snapshot.paramMap.get('shareId')!;
    this.loadContent();
  }

  loadContent() {
    this.loading = true;
    this.type = '';
    this.content = '';
    this.quiz = null;
    this.quizId = null;
    this.answers = {};
    this.quizResult = null;

    this.api.getShareContent(this.shareId).subscribe({
      next: (res: any) => {
        this.type = res.type;

        if (res.type === 'resume') {
          this.content = res.content || '';
        } else if (res.type === 'quiz') {
          this.quizId = res.quiz_id ?? null;
          this.quiz = res.quiz || null;

          // init structure des réponses
          if (this.quiz?.questions?.length) {
            this.quiz.questions.forEach((_q: any, i: number) => {
              this.answers[i] = []; // vide au départ
            });
          }
        }

        this.loading = false;
      },
      error: () => {
        this.type = '';
        this.content = 'Erreur lors du chargement du contenu partagé.';
        this.loading = false;
      }
    });
  }

  // ===== Résumé
  copy() {
    navigator.clipboard.writeText(this.content || '');
  }

  download() {
    const blob = new Blob([this.content || ''], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ===== Quiz helpers
  displayOption(opt: any): string {
    // supporte plusieurs structures : string | {text} | {label}
    if (typeof opt === 'string') return opt;
    return opt?.text ?? opt?.label ?? '';
  }

  isMultiple(q: any): boolean {
    // on gère différents schémas possibles
    if (!q) return false;
    if (q.multiple || q.allow_multiple || q.type === 'multiple') return true;
    // fallback : si le schéma a une notion de "is_correct" et qu'il y en a plusieurs
    const arr = q.answers || q.options || [];
    const correctCount = Array.isArray(arr) ? arr.filter((a: any) => a?.is_correct === true).length : 0;
    return correctCount > 1;
  }

  isSelected(qIndex: number, optionIndex: number): boolean {
    return (this.answers[qIndex] || []).includes(optionIndex);
  }

  toggleSelect(qIndex: number, optionIndex: number, multiple: boolean) {
    const current = this.answers[qIndex] || [];

    if (multiple) {
      // toggle
      if (current.includes(optionIndex)) {
        this.answers[qIndex] = current.filter(i => i !== optionIndex);
      } else {
        this.answers[qIndex] = [...current, optionIndex];
      }
    } else {
      // radio
      this.answers[qIndex] = [optionIndex];
    }
  }

  submitQuiz() {
    if (!this.quizId) return;
    this.api.submitQuiz(this.quizId, this.answers).subscribe({
      next: (r) => {
        this.quizResult = { score: r.score, total: r.total, correct: r.correct };
      },
      error: () => {
        this.quizResult = null;
        alert('❌ Soumission échouée');
      }
    });
  }
}
