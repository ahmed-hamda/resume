import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { ShareDialogComponent } from './share-dialog.component';




@NgModule({
  declarations: [ShareDialogComponent],
  imports: [
    CommonModule,
    FormsModule,
    AutoCompleteModule,
    ButtonModule
  ],
  exports: [ShareDialogComponent]
})
export class ShareDialogModule {}
