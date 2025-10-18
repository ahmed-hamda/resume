import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChapterResumeComponent } from './chapter-resume/chapter-resume.component';
import { ChapterResumeRoutingModule } from './chapter.routing.module';
import { MarkdownModule } from "ngx-markdown";
import { ButtonModule } from "primeng/button";
import { DialogService } from 'primeng/dynamicdialog';


@NgModule({
  declarations: [ChapterResumeComponent],
  imports: [
    CommonModule,
    ChapterResumeRoutingModule,
    MarkdownModule,
    ButtonModule
],
providers: [DialogService]

})
export class ChapterResumeModule { }
