import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ColumnChart {
  subElements = {}
  constructor({
                url = '',
                range = {
                  from: new Date(),
                  to: new Date(),
                },
                data = [],
                label = '',
                link = '',
                value = 0,
                formatHeading = data => data
              } = {}
  ) {
    this.options = {};
    this.options.range = range;
    this.options.label = label;
    this.options.link = link;
    this.options.formatHeading = formatHeading;

    this.chartHeight = 50;
    this.url = new URL(url, BACKEND_URL);

    this.render();
    this.update(this.options.range.from, this.options.range.to);
  }

  async fetchData(from, to) {
    this.url.searchParams.set('from', from.toISOString());
    this.url.searchParams.set('to', to.toISOString());
    return await fetchJson(this.url);
  }

  async update(from = new Date(), to = new Date()) {
    this.element.classList.add('column-chart_loading');

    const data = await this.fetchData(from, to);

    if (!data || Object.values(data).length === 0) {
      return;
    }

    this.options.data = data;
    this.options.range.from = from;
    this.options.range.to = to;

    this.subElements.header.innerHTML = this.getHeading(data);
    this.subElements.body.innerHTML = this.getColumns();

    this.element.classList.remove('column-chart_loading');

    return data;
  }

  render() {
    const element = document.createElement('div');
    element.innerHTML = this.getTemplate();
    this.element = element.firstElementChild;
    this.subElements = this.getSubElements();
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
  }

  getTemplate() {
    return `
        <div class="column-chart column-chart_loading" style="--chart-height: ${this.chartHeight}">
          <div class="column-chart__title">
            Total ${this.options.label}
            <a href="${this.options.link}" class="column-chart__link">View all</a>
          </div>
          <div class="column-chart__container">
            <div data-element="header" class="column-chart__header"></div>
            <div data-element="body" class="column-chart__chart"></div>
          </div>
        </div>
    `;
  }

  getSubElements() {
    const dataElements = this.element.querySelectorAll("[data-element]");
    let result = {};
    dataElements.forEach((item) => {
      result[item.dataset.element] = item;
    });
    return result;
  }

  getHeading(data) {
    return this.options.formatHeading(Object.values(data).reduce((accum, item) => (accum + item), 0));
  }

  getColumns() {
    let result = '';

    this.getColumnProps(this.options.data).forEach(columnProps => {
      result += this.getColumn(columnProps);
    });

    return result;
  }

  getColumnProps(data) {
    const maxValue = Math.max(...Object.values(data));
    const scale = this.chartHeight / maxValue;

    return Object.entries(data).map(([key, item]) => {
      return {
        percent: (item / maxValue * 100).toFixed(0) + '%',
        value: String(Math.floor(item * scale))
      };
    });
  }

  getColumn = (columnProps) =>
    `<div style="--value: ${columnProps.value}" data-tooltip="${columnProps.percent}"></div>`

}
