import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ Pour ngModel
import { UploadDocumentComponent } from './upload-document.component';
import { ButtonModule } from 'primeng/button'; // Si tu utilises pButton
import { InputTextModule } from 'primeng/inputtext'; // Si tu utilises pInputText
import { FileUploadModule } from 'primeng/fileupload'; // Si tu utilises p-fileUpload
import { ToastModule } from 'primeng/toast'; // Pour les notifications
import { UploadDocumentRoutingModule } from './upload-document-routing.module';

@NgModule({
  declarations: [UploadDocumentComponent],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    FileUploadModule,
    ToastModule,
    UploadDocumentRoutingModule 
  ],
  exports: [UploadDocumentComponent] // 👈 Pour pouvoir utiliser le composant ailleurs
})
export class UploadDocumentModule {}
