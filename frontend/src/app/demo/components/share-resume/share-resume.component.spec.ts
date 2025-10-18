import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareResumeComponent } from './share-resume.component';

describe('ShareResumeComponent', () => {
  let component: ShareResumeComponent;
  let fixture: ComponentFixture<ShareResumeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShareResumeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShareResumeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
