import * as d3 from 'd3';
import { Component, Input, OnInit } from '@angular/core';
import { ChartMetadataModel } from 'src/app/models/charts';
import { FormatTimePipe } from 'src/app/modules/pipes';

@Component({
  selector: 'app-dot',
  templateUrl: './dot.component.html',
  styleUrls: ['./dot.component.scss'],
})
export class DotComponent implements OnInit {
  @Input() chartMetadata: ChartMetadataModel;
  @Input() data;
  highestValue = 400;
  renderData;

  constructor(protected formatTime: FormatTimePipe) {
    let i = 1;
    this.data = new Array(30).fill({} as any).map((r) => {
      const days = i * 86400000;
      i++;
      return {
        value: (Math.random() * 300).toString(),
        date: formatTime.transformShortened(
          (new Date().getTime() + days).toString()
        ),
      };
    });
    console.log(this.data);
  }

  ngOnInit(): void {
    this.renderData = d3
      .select('figure#dot')
      .append('svg')
      .attr('height', this.chartMetadata.height)
      .attr(
        'style',
        'width: calc(100% + 20px); height: 100%; margin-left: -10px; border-bottom: solid 1px white'
      );

    this.render();
  }

  sortHighestValue() {
    this.highestValue = this.data.sort((a, b) => {
      return b.value - a.value;
    })[0].value;
  }

  render() {
    const marginLeft = 80;
    const labelMarginLeft = 20;
    const labelMarginBottom = 30;
    const x = d3
      .scaleBand()
      .domain(this.data.map((d) => d.date))
      .range([0, this.chartMetadata.width - marginLeft]);

    const y = d3
      .scaleLinear()
      .domain([this.highestValue, 0])
      .range([0, this.chartMetadata.height]);

    // X Labels
    this.renderData
      .append('g')
      .attr('transform', 'translate(0,' + this.chartMetadata.height + ')')
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr(
        'transform',
        'translate(' + marginLeft + ',-' + labelMarginBottom + ')rotate(0)'
      )
      .style('text-anchor', 'end');

    // Y Labels
    this.renderData
      .append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .text((d) => d + ' ETH')
      .attr(
        'transform',
        'translate(' + labelMarginLeft + ',-' + labelMarginBottom + ')rotate(0)'
      )
      .style('text-anchor', 'start');

    // Dots
    this.renderData
      .selectAll('bars')
      .data(this.data)
      .enter()
      .append('circle')
      .attr('cx', (d) => marginLeft + 10 + x(d.date))
      .attr('cy', (d) => y(d.value) - labelMarginBottom)
      .attr('r', (d) => 2 + (13 - (13 / this.highestValue) * y(d.value)))
      .attr('fill', '#52a6f2')
      .attr('fill-opacity', 0.75);
  }
}
