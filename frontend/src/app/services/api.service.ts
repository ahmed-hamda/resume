import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  apiUrl = 'http://localhost:5000/api'; // ✅ API backend

  constructor(private http: HttpClient) { }

  getMessage() {
    return this.http.get<{ message: string }>(`${this.apiUrl}/message`);
  }

  // ✅ Cours
  getCourse(courseId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/courses/${courseId}`, { headers: this.getAuthHeaders() });
  }
  getCourses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/courses`, { headers: this.getAuthHeaders() });
  }
  createCourse(data: { titre: string; category_id?: number | null; image_url?: string | null }): Observable<any> {
  return this.http.post(`${this.apiUrl}/courses`, data, { headers: this.getAuthHeaders() });
}

  deleteCourse(courseId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/courses/${courseId}`, { headers: this.getAuthHeaders() });
  }
  updateCourse(courseId: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/courses/${courseId}`, data, { headers: this.getAuthHeaders() });
  }

  // ✅ Chapitres
  getChapters(courseId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/courses/${courseId}/chapters`, { headers: this.getAuthHeaders() });
  }
  createChapter(courseId: number, chapter: any, file?: File): Observable<any> {
    const formData = new FormData();
    formData.append('titre', chapter.titre);
    formData.append('description', chapter.description || '');
    if (file) formData.append('file', file);

    return this.http.post(`${this.apiUrl}/courses/${courseId}/chapters`, formData, {
      headers: this.getAuthHeadersForFormData(),
    });
  }
  getChapter(chapterId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/chapters/${chapterId}`, { headers: this.getAuthHeaders() });
  }
  uploadDocument(chapterId: number, file: File, description: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);

    return this.http.post(`${this.apiUrl}/chapters/${chapterId}/documents`, formData, {
      headers: this.getAuthHeadersForFormData(),
    });
  }
  deleteChapter(chapterId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/chapters/${chapterId}`, { headers: this.getAuthHeaders() });
  }

  // ✅ Résumé (avec option de régénération)
  getChapterResume(chapterId: number, force = false) {
    const q = force ? '?force=1' : '';
    return this.http.get<{
      id: number; resume: string;
    }>(
      `${this.apiUrl}/chapters/${chapterId}/resume${q}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getSharedResume(resumeId: number) {
    return this.http.get<{ id: number; type: string; content: string, quiz_id: number }>(
      `${this.apiUrl}/shared-resume/${resumeId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getQuizById(quizId: number) {
  return this.http.get<{ quiz_id: number; quiz: any }>(
    `${this.apiUrl}/quizzes/${quizId}`,
    { headers: this.getAuthHeaders() }
  );
}

  // (facultatif) méthode dédiée pour la régénération
  regenerateChapterResume(chapterId: number) {
    return this.getChapterResume(chapterId, true);
  }

  // 🔑 Helpers
  private getToken(): string | null {
    return localStorage.getItem('jwt');
  }
  private getAuthHeaders(isJson: boolean = true): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    if (isJson) {
      headers = headers.set('Content-Type', 'application/json');
    }
    return headers;
  }

  private getAuthHeadersForFormData(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    // ⚠️ pas de Content-Type pour FormData
    return headers;
  }

  // 🔽 Générer / récupérer le quiz d’un chapitre
  getQuiz(chapterId: number, force = false) {
    const q = force ? '?force=1' : '';
    return this.http.get<{
      questions: never[]; quiz_id: number; quiz: any
    }>(
      `${this.apiUrl}/chapters/${chapterId}/quiz${q}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // 🔽 Soumettre les réponses
  submitQuiz(quizId: number, answers: Record<string, number[]>) {
    return this.http.post<{ score: number; total: number; correct: number; details: any[] }>(
      `${this.apiUrl}/quizzes/${quizId}/submit`,
      { answers },
      { headers: this.getAuthHeaders() }
    );
  }



  // ✅ Récupérer les objets partagés avec moi
  getReceivedShares() {
    return this.http.get<any[]>(`${this.apiUrl}/shares/received`, {
      headers: this.getAuthHeaders(),
    });
  }

  // ✅ Supprimer un partage
  deleteShare(shareId: number) {
    return this.http.delete(`${this.apiUrl}/shares/${shareId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  // 🔍 Recherche user par email
  searchUsers(query: string) {
    return this.http.get<{ id: number; email: string; nom: string }[]>(
      `${this.apiUrl}/users/search?q=${encodeURIComponent(query)}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ➕ Création d’un partage (par userId)
  createShare(targetUserId: number, objectType: string, objectId: number) {
    return this.http.post(`${this.apiUrl}/shares`, {
      target_user_id: targetUserId,
      object_type: objectType,
      object_id: objectId
    }, { headers: this.getAuthHeaders() });
  }

  getShareContent(shareId: number) {
    return this.http.get<any>(`${this.apiUrl}/shares/${shareId}/content`, {
      headers: this.getAuthHeaders()
    });
  }


  getShareQuiz(shareId: number) {
  return this.http.get<{ type: 'quiz'; quiz_id: number; quiz: any }>(
    `${this.apiUrl}/shares/${shareId}/content`,
    { headers: this.getAuthHeaders() }
  );
}


  // api.service.ts
  getSharedCourse(shareId: number) {
    return this.http.get<any>(`${this.apiUrl}/shares/${shareId}/content`, {
      headers: this.getAuthHeaders()
    });
  }


  getCurrentUser() {
    return this.http.get<any>(`${this.apiUrl}/profile`, { headers: this.getAuthHeaders() });
  }

  updateProfile(user: any, file?: File) {
    // ⚠️ Si un fichier est fourni → utiliser FormData
    if (file) {
      const formData = new FormData();
      formData.append('nom', user.nom);
      formData.append('email', user.email);
      if (user.password) {
        formData.append('password', user.password);
      }
      formData.append('file', file);

      // ⚠️ Ne pas fixer Content-Type, Angular le gère pour FormData
      return this.http.put<any>(`${this.apiUrl}/profile`, formData, {
        headers: this.getAuthHeaders(false) // <-- sans "Content-Type: application/json"
      });
    }

    // ✅ Sinon on reste en JSON classique
    return this.http.put<any>(`${this.apiUrl}/profile`, user, {
      headers: this.getAuthHeaders()
    });
  }



  getCategories() {
    return this.http.get<Array<{ id: number; name: string; image_url?: string }>>(
      `${this.apiUrl}/categories`,
      { headers: this.getAuthHeaders() }
    );
  }

  createCategory(data: { name: string; description?: string; image_url?: string }) {
    return this.http.post(`${this.apiUrl}/categories`, data, { headers: this.getAuthHeaders() });
  }

  seedCategories() {
    return this.http.post(`${this.apiUrl}/categories/seed`, {}, { headers: this.getAuthHeaders() });
  }



}

