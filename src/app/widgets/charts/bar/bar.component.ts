import { Component, Input, OnInit } from '@angular/core';
import { ChartMetadataModel } from 'src/app/models/charts';

@Component({
  selector: 'app-bar',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.scss'],
})
export class BarComponent implements OnInit {
  @Input() chartMetadata: ChartMetadataModel;
  @Input() data;
  chartRendered = false;
  constructor() {}

  ngOnInit(): void {}
}
