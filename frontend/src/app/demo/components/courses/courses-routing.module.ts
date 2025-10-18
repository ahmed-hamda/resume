import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateCourseComponent } from './create-course/create-course.component';
import { ListCoursesComponent } from './list-courses/list-courses.component';
import { CourseChaptersComponent } from './course-chapters/course-chapters.component';

const routes: Routes = [
  { path: 'create', component: CreateCourseComponent },
  { path: 'list', component: ListCoursesComponent },
  // ✅ Route vers CourseChaptersComponent directement
  { path: ':courseId/chapters', component: CourseChaptersComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CoursesRoutingModule { }
