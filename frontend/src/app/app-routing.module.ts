import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app.layout.component';
import { NotfoundComponent } from './demo/components/notfound/notfound.component';
import { AuthGuard } from './core/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', loadChildren: () => import('./demo/components/dashboard/dashboard.module').then(m => m.DashboardModule) },
      { path: 'uikit', loadChildren: () => import('./demo/components/uikit/uikit.module').then(m => m.UikitModule) },
      { path: 'utilities', loadChildren: () => import('./demo/components/utilities/utilities.module').then(m => m.UtilitiesModule) },

      // Courses
      { path: 'courses', loadChildren: () => import('./demo/components/courses/courses.module').then(m => m.CoursesModule) },
      { path: 'courses/:courseId/chapters', loadChildren: () => import('./demo/components/courses/courses.module').then(m => m.CoursesModule) },

      // Resume d’un chapitre
      { path: 'chapter-resume/:chapterId', loadChildren: () => import('./demo/components/chapter/chapter.module').then(m => m.ChapterResumeModule) },

      // Quiz “normal” (depuis un chapter)
      { path: 'chapters/:chapterId/quiz', loadChildren: () => import('./demo/components/quiz/quiz.module').then(m => m.QuizModule) },

      // -------- SHARES (spécifiques AVANT la route 'shares' générique) --------
      { path: 'shares/course/:shareId', loadChildren: () => import('./demo/components/share-course/share-course.module').then(m => m.ShareCourseModule) },
      { path: 'shares/resume/:resumeId', loadChildren: () => import('./demo/components/share-resume/share-resume.module').then(m => m.ShareResumeModule) },
      { path: 'shares/chapter/:shareId', loadChildren: () => import('./demo/components/share-chapter/share-chapter.module').then(m => m.ShareChapterModule) },

      // ✅ Route unique “intelligente” pour quiz partagé OU direct
      { path: 'shares/quiz/:id', loadChildren: () => import('./demo/components/share-quiz/share-quiz.module').then(m => m.ShareQuizModule) },

      // Liste des partages
      { path: 'shares', loadChildren: () => import('./demo/components/shares/shares.module').then(m => m.SharesModule) },

      // Détail générique (en dernier)
      { path: 'shares/:shareId', loadChildren: () => import('./demo/components/share-detail/share-detail.module').then(m => m.ShareDetailModule) },

      // Profil
      { path: 'profile', loadChildren: () => import('./demo/components/profile/profile.module').then(m => m.ProfileModule), canActivate: [AuthGuard] },
    ]
  },

  // Auth
  { path: 'auth', loadChildren: () => import('./demo/components/auth/auth.module').then(m => m.AuthModule) },

  // Public
  { path: 'landing', loadChildren: () => import('./demo/components/landing/landing.module').then(m => m.LandingModule) },

  { path: 'pages/notfound', component: NotfoundComponent },

  // Fallback
  { path: '**', redirectTo: 'pages/notfound' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',
      useHash: true
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
