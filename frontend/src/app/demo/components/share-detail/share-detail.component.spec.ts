import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareDetailComponent } from './share-detail.component';

describe('ShareDetailComponent', () => {
  let component: ShareDetailComponent;
  let fixture: ComponentFixture<ShareDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShareDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShareDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
