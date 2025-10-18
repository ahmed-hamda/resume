import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareChapterComponent } from './share-chapter.component';

describe('ShareChapterComponent', () => {
  let component: ShareChapterComponent;
  let fixture: ComponentFixture<ShareChapterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShareChapterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShareChapterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
