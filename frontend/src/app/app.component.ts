import { Component, OnInit } from '@angular/core';
import { ApiService } from './services/api.service'; // adapte le chemin si besoin

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title(title: any) {
    throw new Error('Method not implemented.');
  }

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.api.getMessage().subscribe(date => {
      console.log(date.message);
    });
  }
}
