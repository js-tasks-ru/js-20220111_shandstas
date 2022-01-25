export default class ColumnChart {
  constructor(options) {
    this.link = options?.link;
    this.data = options?.data || [];
    this.label = options?.label || '';
    this.value = options?.value || '';
    this.chartHeight = options?.chartHeight || 50;
    this.formatHeading = options?.formatHeading;

    this.render();
  }

  getTemplate () {
    return `
      <div class="column-chart" style="--chart-height: ${this.chartHeight}">
        <div class="column-chart__title">
          Total ${this.label}
        </div>
        <div class="column-chart__container">
          <div data-element="header" class="column-chart__header">${this.getHeading()}</div>
          <div data-element="body" class="column-chart__chart"></div>
        </div>
      </div>
    `;
  }

  render() {
    const div = document.createElement('div');

    div.innerHTML = this.getTemplate();

    this.element = div.firstElementChild;

    this.toLink();
    this.update(this.data);
  }


  getHeading() {
    if (typeof this.formatHeading === 'function') {
      return this.formatHeading.call(this, this.value);
    }

    return this.value;
  }

  toLink() {
    if (!this.link) {
      return;
    }

    const parent = this.element.querySelector('.column-chart__title');
    parent.insertAdjacentHTML('beforeend', `<a href="${this.link}" class="column-chart__link">View all</a>`);
  }

  update(data) {
    this.element.classList.add('column-chart_loading');

    if (data.length) {
      this.element.classList.remove('column-chart_loading');
    }

    const dataRoot = this.element.querySelector('[data-element="body"]');

    dataRoot.innerHTML = '';

    const maxValue = Math.max(...data);

    data.forEach((value) => {
      const barElement = document.createElement('div');

      const percentValue = Math.round(value / maxValue * 100) + '%';
      //const numberValue = Math.round(this.chartHeight / 100 * value);
      const numberValue = Math.floor(this.chartHeight / maxValue * value) + '';

      barElement.style.setProperty('--value', numberValue);
      barElement.dataset.tooltip = percentValue;

      dataRoot.append(barElement);
    });
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
}
