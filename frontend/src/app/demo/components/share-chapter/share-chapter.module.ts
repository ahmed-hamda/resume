import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ShareChapterComponent } from './share-chapter.component';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RadioButtonModule } from 'primeng/radiobutton';


const routes: Routes = [{ path: '', component: ShareChapterComponent }];


@NgModule({
  declarations: [ShareChapterComponent], // 👈 ajoute ton composant
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    ButtonModule,
    RadioButtonModule,
    CardModule,
    MarkdownModule
  ]
})
export class ShareChapterModule { }

