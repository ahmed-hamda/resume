import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { ShareQuizComponent } from './share-quiz.component';

@NgModule({
  declarations: [ShareQuizComponent],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ProgressSpinnerModule,
    RouterModule.forChild([
      { path: '', component: ShareQuizComponent } // /shares/quiz/:id
    ])
  ]
})
export class ShareQuizModule {}
