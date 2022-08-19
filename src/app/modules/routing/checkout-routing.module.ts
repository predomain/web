import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CheckoutComponent } from '../../pages/checkout';

const routes: Routes = [{ path: '', component: CheckoutComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CheckoutRoutingModule {}
