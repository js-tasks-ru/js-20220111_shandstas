export default class ColumnChart {

  constructor(columnChartData) {
    this.data = columnChartData?.data || [];
    this.label = columnChartData?.label || '';
    this.link = columnChartData?.link || '';
    this.value = columnChartData?.value || 0;
    this.formatHeading = columnChartData?.formatHeading || function(data) { return data };

    this.chartHeight = 50;

    this.render();
  }

  getValue() {
    return this.formatHeading(this.value);
  }

  getColumnProps() {
    const maxValue = Math.max(...this.data);
    const scale = this.chartHeight / maxValue;

    return this.data.map(item => {
      return {
        percent: (item / maxValue * 100).toFixed(0) + '%',
        value: String(Math.floor(item * scale))
      };
    });
  }

  getTemplate() {
    return `
            <div class="column-chart" style="--chart-height: ${this.chartHeight}">
                <div class="column-chart__title">
                    ${this.label}
                    <a href="/sales" class="column-chart__link">View all</a>
                </div>
                <div class="column-chart__container">
                    <div data-element="header" class="column-chart__header">${this.getValue()}</div>
                    <div data-element="body" class="column-chart__chart"></div>
                </div>
            </div>
        `
  }

  render() {
    const element = document.createElement('div');

    element.innerHTML = this.getTemplate();

    this.element = element.firstElementChild;

    this.createHistogram(this.data);
  }

  createHistogram(data) {
    if(!data.length)  {
      this.element.classList.add('column-chart_loading');
      return;
    }
    const histogram = this.element.querySelector('[data-element="body"]');
    histogram.innerHTML = '';
    const arr = this.getColumnProps();
    for(let item of arr) {
      const bar = document.createElement('div');
      bar.style.setProperty('--value', item.value);
      bar.setAttribute('data-tooltip', item.percent);
      histogram.append(bar)
    }
  }

  update(data) {
    this.createHistogram(data);
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
}
