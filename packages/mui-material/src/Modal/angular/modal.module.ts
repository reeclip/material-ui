// This module is provided for backward compatibility.
// Prefer importing MuiModalComponent directly as a standalone component.
import { NgModule } from '@angular/core';
import { MuiModalComponent } from './modal.component';

@NgModule({
  imports: [MuiModalComponent],
  exports: [MuiModalComponent],
})
export class MuiModalModule {}
