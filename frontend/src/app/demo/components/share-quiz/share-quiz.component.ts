import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';

type QType = 'boolean' | 'single' | 'multi';

export interface Q {
  id: string;
  type: QType;
  text: string;
  options?: string[];
  // côté client, on n’utilise pas "answer" (réponses correctes) — laissé pour compat
  answer?: number[];
  explanation?: string;
}

type QuizResult = {
  score?: number;          // pourcentage (si le backend le renvoie)
  total?: number;          // nombre de questions
  correct?: number;        // nombre correct (si dispo)
  details?: Array<{
    id?: string;                   // id question (si dispo)
    index?: number;                // index question (si pas d’id)
    questionIndex?: number;        // idem
    ok?: boolean;                  // correct ?
    correct?: boolean;             // variante
    selected?: number[];           // réponses choisies
    user_answers?: number[];       // variante
    correct_answers?: number[];    // bonnes réponses
    answers?: number[];            // variante
    explanation?: string;          // explication
    note?: string;                 // variante
  }>;
};

@Component({
  selector: 'app-share-quiz',
  templateUrl: './share-quiz.component.html',
  styleUrls: ['./share-quiz.component.scss']
})
export class ShareQuizComponent implements OnInit {
  id!: number;                 // peut être shareId OU quizId (route unique /shares/quiz/:id)
  isShared = false;            // true si on a trouvé un quiz via le partage

  quizId: number | null = null;
  questions: Q[] = [];

  loading = false;
  error = '';

  // état utilisateur
  answers: Record<string, number[]> = {};
  submitted = false;

  // feedback
  result: QuizResult | null = null;
  detailsMap: Record<string, { ok: boolean; explanation?: string }> = {};

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    this.id = +(
      this.route.snapshot.paramMap.get('id') ||
      this.route.snapshot.paramMap.get('shareId') ||
      this.route.snapshot.paramMap.get('quizId') ||
      '0'
    );
    this.loadSmartQuiz();
  }

  /** tente d'abord via partage, sinon quiz direct */
  loadSmartQuiz(): void {
    this.loading = true;
    this.resetLocalState(true);

    // 1) Essayer comme shareId
    this.api.getShareQuiz(this.id).subscribe({
      next: (res) => {
        if (res?.type === 'quiz' && res.quiz) {
          this.isShared = true;
          this.quizId = res.quiz_id ?? null;
          this.questions = this.normalizeQuestions(res.quiz?.questions ?? []);
          this.finishLoadOk();
        } else {
          this.loadDirectQuiz(); // fallback
        }
      },
      error: () => this.loadDirectQuiz()
    });
  }

  /** fallback : charger un quiz directement par son ID */
  private loadDirectQuiz(): void {
    this.api.getQuizById(this.id).subscribe({
      next: (res) => {
        if (res?.quiz) {
          this.isShared = false;
          this.quizId = res.quiz_id ?? this.id;
          this.questions = this.normalizeQuestions(res.quiz?.questions ?? []);
          this.finishLoadOk();
        } else {
          this.finishLoadErr('❌ Quiz introuvable.');
        }
      },
      error: () => this.finishLoadErr('❌ Quiz introuvable.')
    });
  }

  // --- helpers de chargement
  private finishLoadOk() {
    this.prepareAnswers();
    this.loading = false;
  }
  private finishLoadErr(msg: string) {
    this.error = msg;
    this.loading = false;
  }

  /** normalise les questions vers {id, type, text, options[]} */
  private normalizeQuestions(raw: any[]): Q[] {
    return (raw || []).map((q: any, idx: number) => {
      const id = q?.id ? String(q.id) : `q${idx}`;
      const text = q?.text ?? q?.question ?? '';

      // options -> tableau de strings
      const rawOpts = q?.options ?? q?.answers ?? [];
      const options: string[] = Array.isArray(rawOpts)
        ? rawOpts.map((opt: any) => {
            if (typeof opt === 'string') return opt;
            return opt?.text ?? opt?.label ?? String(opt ?? '');
          })
        : [];

      // deviner le type
      let type: QType = 'single';
      const qType = (q?.type || '').toString().toLowerCase();
      const multiple = q?.multiple || q?.allow_multiple || qType === 'multiple';

      if (qType === 'boolean' || qType === 'bool') {
        type = 'boolean';
      } else if (multiple) {
        type = 'multi';
      } else if (!multiple && Array.isArray(options)) {
        // heuristique : si >1 bonne réponse flags -> multi
        const correctFlags = Array.isArray(rawOpts)
          ? rawOpts.filter((o: any) => o?.is_correct === true).length
          : 0;
        type = correctFlags > 1 ? 'multi' : 'single';
      }

      // boolean sans options ➜ impose "Vrai/Faux"
      const finalOptions =
        type === 'boolean' && options.length === 0 ? ['Faux', 'Vrai'] : options;

      return { id, type, text, options: finalOptions };
    });
  }

  /** initialise les réponses vides */
  private prepareAnswers() {
    this.answers = {};
    this.submitted = false;
    this.result = null;
    this.detailsMap = {};
    this.questions.forEach(q => (this.answers[q.id] = []));
  }

  /** réinitialise tout (bouton Réinitialiser) */
  reset(): void {
    this.prepareAnswers();
  }

  /** reset “brut” avant (ré)chargement */
  private resetLocalState(keepIds = false) {
    if (!keepIds) this.quizId = null;
    this.questions = [];
    this.answers = {};
    this.submitted = false;
    this.result = null;
    this.detailsMap = {};
    this.error = '';
  }

  // ------- sélection -------

  selectBoolean(q: Q, value: boolean) {
    // convention: index 1 = Vrai, 0 = Faux (comme ton code)
    this.answers[q.id] = [value ? 1 : 0];
  }

  selectSingle(q: Q, idx: number) {
    this.answers[q.id] = [idx];
  }

  toggleMulti(q: Q, idx: number) {
    const set = new Set(this.answers[q.id] ?? []);
    set.has(idx) ? set.delete(idx) : set.add(idx);
    this.answers[q.id] = Array.from(set).sort((a, b) => a - b);
  }

  isSelected(q: Q, idx: number): boolean {
    return (this.answers[q.id] ?? []).includes(idx);
  }

  // ------- soumission -------

  submit(): void {
    if (!this.quizId) return;

    // le backend attend généralement { "0": [..], "1": [..] } indexés
    const payload: Record<string, number[]> = {};
    this.questions.forEach((q, i) => {
      payload[String(i)] = this.answers[q.id] ?? [];
    });

    this.api.submitQuiz(this.quizId, payload).subscribe({
      next: (res) => {
        this.submitted = true;
        this.result = res as QuizResult;

        // construire un lookup par id normalisé
        this.detailsMap = {};
        (res?.details ?? []).forEach((d, idx) => {
          const qIndex = (d.questionIndex ?? d.index ?? idx) as number;
          const qId = this.questions[qIndex]?.id ?? `q${qIndex}`;
          const ok = !!(d.ok ?? d.correct);
          const explanation = d.explanation ?? d.note ?? '';
          this.detailsMap[qId] = { ok, explanation };
        });
      },
      error: () => {
        this.error = 'Échec de la soumission.';
      }
    });
  }

  // ------- infos affichage -------

  get total(): number {
    return this.questions.length;
  }

  get correctCount(): number {
    if (this.result?.details?.length) {
      return this.result.details.filter(d => !!(d.ok ?? d.correct)).length;
    }
    // fallback si l’API renvoie directement “correct”
    return this.result?.correct ?? 0;
  }
}
