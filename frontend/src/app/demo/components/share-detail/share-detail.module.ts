import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ShareDetailComponent } from './share-detail.component';

const routes: Routes = [{ path: '', component: ShareDetailComponent }];


@NgModule({
  declarations: [],
  imports: [
   CommonModule,
       FormsModule,
       RouterModule.forChild(routes),
       ButtonModule,
       RadioButtonModule,
       CardModule,
       
  ]
})
export class ShareDetailModule { }
