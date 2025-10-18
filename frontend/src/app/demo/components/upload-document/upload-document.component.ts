import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-upload-document',
  templateUrl: './upload-document.component.html',
  styleUrls: ['./upload-document.component.scss'],
})
export class UploadDocumentComponent implements OnInit {
  @Input() chapterId!: number; // l'ID du chapitre reçu en paramètre
  selectedFile!: File;
  description: string = '';
  documents: any[] = []; // Liste des documents déjà uploadés

  constructor(
    private api: ApiService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadDocuments();
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  upload() {
    if (!this.selectedFile) {
      this.messageService.add({ severity: 'warn', summary: 'Fichier requis', detail: 'Sélectionnez un fichier.' });
      return;
    }

    this.api.uploadDocument(this.chapterId, this.selectedFile, this.description).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Document uploadé.' });
        this.selectedFile = undefined!;
        this.description = '';
        this.loadDocuments();
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de l’upload.' });
      }
    });
  }

  loadDocuments() {
    this.api.getDocuments(this.chapterId).subscribe({
      next: (docs) => {
        this.documents = docs;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
}
