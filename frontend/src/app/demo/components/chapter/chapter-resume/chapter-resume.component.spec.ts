import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChapterResumeComponent } from './chapter-resume.component';

describe('ChapterResumeComponent', () => {
  let component: ChapterResumeComponent;
  let fixture: ComponentFixture<ChapterResumeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChapterResumeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChapterResumeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
