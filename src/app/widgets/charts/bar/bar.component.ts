import * as d3 from 'd3';
import { Component, Input, OnInit } from '@angular/core';
import { ChartMetadataModel } from 'src/app/models/charts';

@Component({
  selector: 'app-bar',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.scss'],
})
export class BarComponent implements OnInit {
  @Input() chartMetadata: ChartMetadataModel;
  private data = new Array(150).fill({} as any).map((r) => {
    return {
      Framework: (Math.random() * 99999).toString(),
      Stars: Math.random() * 99999,
      Released: Math.random() * 2022,
    };
  });
  renderData;

  constructor() {}

  ngOnInit(): void {
    this.renderData = d3
      .select('figure#bar')
      .append('svg')
      .attr('width', this.chartMetadata.width)
      .attr('height', this.chartMetadata.height)
      .append('g');
    this.render();
  }

  render() {
    // Create the X-axis band scale
    const x = d3
      .scaleBand()
      .range([0, this.chartMetadata.width])
      .domain(this.data.map((d) => d.Framework))
      .padding(0.2);

    // Draw the X-axis on the DOM
    this.renderData
      .append('g')
      .attr('transform', 'translate(0,' + this.chartMetadata.height + ')')
      .selectAll('text')
      .attr('transform', 'translate(-40,20)rotate(-180)')
      .style('text-anchor', 'end');

    // Create the Y-axis band scale
    const y = d3
      .scaleLinear()
      .domain([0, 200000])
      .range([this.chartMetadata.height, 0]);

    // Create and fill the bars
    this.renderData
      .selectAll('bars')
      .data(this.data)
      .enter()
      .append('rect')
      .attr('x', (d) => x(d.Framework))
      .attr('y', (d) => y(d.Stars))
      .attr('width', x.bandwidth())
      .attr('height', (d) => this.chartMetadata.height - y(d.Stars))
      .attr('fill', '#52a6f2');
  }
}
