import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';          // ✅ recommandé au niveau AppModule
import { HttpClientModule } from '@angular/common/http';            // ✅ utile si tu charges des .md via HTTP
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AppLayoutModule } from './layout/app.layout.module';

import { NotfoundComponent } from './demo/components/notfound/notfound.component';

// PrimeNG
import { ToastModule } from 'primeng/toast';
import { RatingModule } from 'primeng/rating';
import { MessageService } from 'primeng/api';

// Services démo
import { ProductService } from './demo/service/product.service';
import { CountryService } from './demo/service/country.service';
import { CustomerService } from './demo/service/customer.service';
import { EventService } from './demo/service/event.service';
import { IconService } from './demo/service/icon.service';
import { NodeService } from './demo/service/node.service';
import { PhotoService } from './demo/service/photo.service';

// Forms (si besoin ailleurs)
import { FormsModule } from '@angular/forms';

// Markdown (Angular 14 => ngx-markdown@14 + marked@4)
import { MarkdownModule } from 'ngx-markdown';
import { SharesComponent } from './demo/components/shares/shares.component';
import { ShareDialogComponent } from './demo/components/share-dialog/share-dialog.component';
import { ButtonModule } from "primeng/button";
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ShareDialogModule } from './demo/components/share-dialog/share-dialog.module';
import { ShareDetailComponent } from './demo/components/share-detail/share-detail.component';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { ShareResumeComponent } from './demo/components/share-resume/share-resume.component';
import { ShareResumeModule } from './demo/components/share-resume/share-resume.module';
import { ShareChapterComponent } from './demo/components/share-chapter/share-chapter.component';
import { ProfileComponent } from './demo/components/profile/profile.component';
import { ShareQuizComponent } from './demo/components/share-quiz/share-quiz.component';


@NgModule({
  declarations: [
    AppComponent,
    NotfoundComponent,
    ShareDetailComponent,
    
  
    
  
 
    
  ],
  imports: [
    BrowserModule, // ✅
    HttpClientModule, // ✅ nécessaire si tu utilises <markdown src="...">
    FormsModule, // optionnel
    AppRoutingModule,
    AppLayoutModule,
    ToastModule,
    RatingModule,
    MarkdownModule.forRoot(),
    ButtonModule,
    AutoCompleteModule,
    ShareDialogModule   ,
    ShareResumeModule,
    DynamicDialogModule   ,
    
],
  providers: [
    // Hash routing (optionnel mais cohérent avec Sakai)
    { provide: LocationStrategy, useClass: HashLocationStrategy },

    // Services démo
    CountryService, CustomerService, EventService, IconService,
    NodeService, PhotoService, ProductService, MessageService,
    DialogService        
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
    