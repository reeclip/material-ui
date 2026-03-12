import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MuiModalComponent } from './modal.component';

@NgModule({
  declarations: [MuiModalComponent],
  imports: [CommonModule],
  exports: [MuiModalComponent],
})
export class MuiModalModule {}
