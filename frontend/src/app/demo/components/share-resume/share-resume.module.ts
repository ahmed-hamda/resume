import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ShareResumeComponent } from './share-resume.component';

const routes: Routes = [{ path: '', component: ShareResumeComponent }];


@NgModule({
  declarations: [ShareResumeComponent,],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    ButtonModule,
    RadioButtonModule,
    CardModule,
    MarkdownModule
  ],
})
export class ShareResumeModule { }
