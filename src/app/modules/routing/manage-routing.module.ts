import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { ManageComponent } from 'src/app/pages/manage/manage.component';

const routes: Routes = [{ path: '', component: ManageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManageRoutingModule {}
