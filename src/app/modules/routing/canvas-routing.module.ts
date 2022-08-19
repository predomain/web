import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CanvasComponent } from '../../pages/canvas/canvas.component';

const routes: Routes = [{ path: '', component: CanvasComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CanvasRoutingModule {}
