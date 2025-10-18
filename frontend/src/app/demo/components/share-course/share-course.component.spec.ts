import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareCourseComponent } from './share-course.component';

describe('ShareCourseComponent', () => {
  let component: ShareCourseComponent;
  let fixture: ComponentFixture<ShareCourseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShareCourseComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShareCourseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
