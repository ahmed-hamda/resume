import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChapterResumeComponent } from './chapter-resume/chapter-resume.component';

const routes: Routes = [
  { path: '', component: ChapterResumeComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChapterResumeRoutingModule { }
