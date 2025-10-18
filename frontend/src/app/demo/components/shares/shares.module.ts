import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CardModule } from 'primeng/card';

import { SharesComponent } from './shares.component';
import { MarkdownModule } from "ngx-markdown";

const routes: Routes = [{ path: '', component: SharesComponent }];

@NgModule({
  declarations: [SharesComponent, ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    ButtonModule,
    RadioButtonModule,
    CardModule,
    MarkdownModule
],
})
export class SharesModule {}
