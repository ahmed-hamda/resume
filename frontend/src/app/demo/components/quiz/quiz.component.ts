import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { ShareDialogComponent } from '../share-dialog/share-dialog.component';
import { DialogService } from 'primeng/dynamicdialog';


type QType = 'boolean' | 'single' | 'multi';

export interface Q {
  id: string;
  type: QType;
  text: string;
  options?: string[];
  answer: number[];            // correct indices
  explanation?: string;
}

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss']
})
export class QuizComponent implements OnInit {
  chapterId!: number;

  loading = false;
  error = '';

  quizId!: number;
  questions: Q[] = [];

  // user state
  answers: Record<string, number[]> = {};
  submitted = false;
  score = 0;
  total = 0;
  isShared = false; // 👈 par défaut


  // feedback from server
  details: { id: string; ok: boolean; expected: number[]; given: number[]; explanation?: string }[] = [];
  // ✅ PUBLIC et inclut l'explication
  detailsMap: Record<string, { ok: boolean; explanation?: string }> = {};

  constructor(private route: ActivatedRoute, private api: ApiService, private dialogService: DialogService) { }

  ngOnInit(): void {
  const quizIdParam = this.route.snapshot.paramMap.get('quizId');

  if (quizIdParam) {
    this.isShared = true;              // 👈 mode quiz partagé
    this.loadQuizByQuizId(+quizIdParam);  // ✅ nouvelle méthode
  } else {
    this.chapterId = +this.route.snapshot.paramMap.get('chapterId')!;
    this.loadQuizByChapter(this.chapterId);
  }
}

/** Mode normal: charger par chapitre (existant) */
loadQuizByChapter(chapterId: number, force = false) {
  this.loading = true;
  this.error = '';
  this.api.getQuiz(chapterId, force).subscribe({
    next: (res) => {
      this.quizId = res.quiz_id;
      this.questions = (res.quiz?.questions ?? []) as Q[];
      this.resetLocalState();
      this.loading = false;
    },
    error: (err) => {
      this.error = err?.error?.msg || 'Impossible de charger le quiz.';
      this.loading = false;
    }
  });
}

/** ✅ Nouveau : charger un quiz directement par son ID (quiz partagé via resume) */
loadQuizByQuizId(quizId: number) {
  this.loading = true;
  this.error = '';
  this.api.getQuizById(quizId).subscribe({
    next: (res) => {
      this.quizId = res.quiz_id || quizId;
      this.questions = (res.quiz?.questions ?? []) as Q[];
      this.resetLocalState();
      this.loading = false;
    },
    error: () => {
      this.error = 'Erreur chargement quiz partagé.';
      this.loading = false;
    }
  });
}



  /** Reset l’état local */
  private resetLocalState() {
    this.answers = {};
    this.submitted = false;
    this.details = [];
    this.detailsMap = {};
    this.score = 0;
    this.total = this.questions.length;
  }


  // ------- template helpers -------

  trackByIndex = (_: number, __: unknown) => _;

  // boolean questions
  selectBooleanGeneric(q: Q, value: boolean) {
    this.answers[q.id] = [value ? 1 : 0];
  }

  // single choice (one index)
  selectSingle(q: Q, idx: number) {
    this.answers[q.id] = [idx];
  }

  // multi choice (toggle idx)
  toggleMulti(q: Q, idx: number) {
    const current = new Set(this.answers[q.id] ?? []);
    current.has(idx) ? current.delete(idx) : current.add(idx);
    this.answers[q.id] = Array.from(current).sort((a, b) => a - b);
  }

  isSelected(q: Q, idx: number): boolean {
    return (this.answers[q.id] ?? []).includes(idx);
  }

  okFor(id: string): boolean {
    return !!this.detailsMap[id]?.ok;
  }

  // ------- submit / reset -------

  submit() {
    if (!this.quizId) return;
    this.api.submitQuiz(this.quizId, this.answers).subscribe({
      next: (res) => {
        this.submitted = true;
        this.score = res.score;
        this.total = res.total;
        this.details = res.details || [];
        // build quick lookup for template
        this.detailsMap = this.details.reduce<Record<string, { ok: boolean; explanation?: string }>>((acc, d) => {
          acc[d.id] = { ok: !!d.ok, explanation: d.explanation || '' };
          return acc;
        }, {});

      },
      error: () => {
        this.error = 'Échec de la soumission.';
      }
    });
  }

  reset() {
    this.answers = {};
    this.submitted = false;
    this.details = [];
    this.detailsMap = {};
    this.score = 0;
  }

  get correctCount(): number {
    return this.details.filter(d => d.ok).length;
  }

  openShareDialog(type: string, objectId: number) {
    const ref = this.dialogService.open(ShareDialogComponent, {
      header: 'Partager ce quiz',
      width: '400px',
      data: { objectType: type, objectId }
    });

    ref.onClose.subscribe((result: any) => {
      if (result) {
        console.log('Quiz partagé:', result);
      }
    });
  }


}
