import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { CoursesRoutingModule } from './courses-routing.module';
import { CreateCourseComponent } from './create-course/create-course.component';
import { ListCoursesComponent } from './list-courses/list-courses.component';
import { MenuModule } from "primeng/menu";
import { DialogModule } from "primeng/dialog";
import { DataViewModule } from "primeng/dataview";
import { DropdownModule } from "primeng/dropdown";
import { CourseChaptersComponent } from './course-chapters/course-chapters.component';
import { CardModule } from "primeng/card";
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';

@NgModule({
  declarations: [
    CreateCourseComponent,
    ListCoursesComponent,
    CourseChaptersComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    TableModule,
    CoursesRoutingModule,
    MenuModule,
    DialogModule,
    DataViewModule,
    DropdownModule,
    CardModule,
       
],

})
export class CoursesModule { }
