import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-shares',
  templateUrl: './shares.component.html',
  styleUrls: ['./shares.component.scss']
})
export class SharesComponent implements OnInit {
  shares: any[] = [];
  loading = false;


  constructor(private api: ApiService, private router: Router, private messageService: MessageService) { }

  ngOnInit(): void {
    this.loadShares();
  }

  loadShares() {
  this.loading = true;
  this.api.getReceivedShares().subscribe({
    next: (res) => {
      this.shares = res;
      this.loading = false;
    },
    error: () => {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les partages' });
      this.loading = false;
    }
  });
}


  deleteShare(id: number) {
    if (confirm("Supprimer ce partage ?")) {
      this.api.deleteShare(id).subscribe({
        next: () => {
          this.shares = this.shares.filter(s => s.id !== id);
          this.messageService.add({ severity: 'success', summary: 'Supprimé', detail: 'Partage supprimé' });
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Suppression échouée' });
        }
      });
    }
  }

  goToShare(shareId: number) {
    this.router.navigate(['/shares', shareId]); // ✅ redirection
  }

  viewShare(shareId: number) {
    this.router.navigate(['/shares', shareId]);
  }

  goToQuizFromShare(s: any) {
  this.router.navigate(['/shares/quiz', s.id]); // s.id = shareId
}



  goToCourseFromShare(share: any) {
    this.router.navigate(['/shares/course', share.id]);
  }

  goToChapterFromShare(share: any) {
    this.router.navigate(['/shares/chapter', share.id]);
  }




}
