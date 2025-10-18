import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-share-course',
  templateUrl: './share-course.component.html',
  styleUrls: ['./share-course.component.scss']
})
export class ShareCourseComponent implements OnInit {
  shareId!: number;
  course: any = null;
  loading = false;
  error = '';

  constructor(private route: ActivatedRoute, private api: ApiService) { }

  ngOnInit(): void {
    this.shareId = +this.route.snapshot.paramMap.get('shareId')!;
    this.loadSharedCourse();
  }

  loadSharedCourse() {
    this.loading = true;
    this.api.getSharedCourse(this.shareId).subscribe({
      next: (res) => {
        if (res.type === 'course' && res.content) {
          this.course = res.content;
        } else {
          this.error = '❌ Ce partage ne contient pas de cours.';
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur chargement cours partagé.';
        this.loading = false;
      }
    });
  }

}
