import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CardModule } from 'primeng/card';

import { QuizComponent } from './quiz.component';
import { DialogService } from 'primeng/dynamicdialog';

const routes: Routes = [{ path: '', component: QuizComponent }];

@NgModule({
  declarations: [QuizComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    ButtonModule,
    RadioButtonModule,
    CardModule
  ],
  providers: [DialogService]
})
export class QuizModule {}
