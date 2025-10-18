import { Component } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ApiService } from 'src/app/services/api.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-share-dialog',
  templateUrl: './share-dialog.component.html',
  styleUrls: ['./share-dialog.component.scss']
})
export class ShareDialogComponent {
  query = '';
  filteredUsers: any[] = [];
  selectedUser: any = null;
  loading = false;

  constructor(
    private api: ApiService,
    private messageService: MessageService,  // ✅ injecte le service
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  search(event: any) {
    this.api.searchUsers(event.query).subscribe({
      next: (users) => this.filteredUsers = users,
      error: () => this.filteredUsers = []
    });
  }

  share() {
    if (!this.selectedUser) return;
    this.loading = true;

    this.api.createShare(this.selectedUser.id, this.config.data.objectType, this.config.data.objectId).subscribe({
      next: (res) => {
        this.loading = false;
        this.messageService.add({               // ✅ notification succès
          severity: 'success',
          summary: 'Partage créé',
          detail: `L’élément a été partagé avec ${this.selectedUser.nom || this.selectedUser.email}`
        });
        this.ref.close(res);
      },
      error: () => {
        this.loading = false;
        this.messageService.add({              // ✅ notification erreur
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de créer le partage.'
        });
      }
    });
  }

  cancel() {
    this.ref.close();
  }
}
