import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShareCourseComponent } from './share-course.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RadioButtonModule } from 'primeng/radiobutton';


const routes: Routes = [{ path: '', component: ShareCourseComponent }];

@NgModule({
  declarations: [
    ShareCourseComponent
  ],
    imports: [
      CommonModule,
      FormsModule,
      RouterModule.forChild(routes),
      ButtonModule,
      RadioButtonModule,
      CardModule,
      MarkdownModule]
})
export class ShareCourseModule { }
