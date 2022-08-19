import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { DomainComponent } from 'src/app/pages/domain/domain.component';

const routes: Routes = [{ path: '', component: DomainComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DomainRoutingModule {}
