import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { BootstrapComponent } from '../../pages/bootstrap';

const routes: Routes = [{ path: '', component: BootstrapComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BootstrapRoutingModule {}
