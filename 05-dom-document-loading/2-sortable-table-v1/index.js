export default class SortableTable {
  constructor(headerConfig = [], data = []) {
    this.headerConfig = headerConfig;
    this.data = Array.isArray(data) ? data : data.data;
    this.sortOrder = '';
    this.sortField = '';

    this.render();
    this.subElements = this.getSubElements();
  }

  render() {
    const element = document.createElement("div");
    element.innerHTML = this.getTemplate();
    this.element = element.firstElementChild;
  }

  remove() {
    this.element.remove();
    this.subElements = {};
  }

  destroy() {
    this.remove();
  }

  sort(field = '', order = '') {
    this.sortField = field;
    this.sortOrder = order;
    this.data = this.sortData(field, order);
    this.updateSubElements();
  }

  sortData(field, order) {
    const directions = {
      asc: 1,
      desc: -1
    };
    const direction = directions[order];
    const arrCopy = [...this.data];
    const locales = ['ru', 'en'];
    const sortType = (this.headerConfig.find(obj => obj.id === field)).sortType;

    const getSortFunction = (a, b) => {
      if (sortType === "string") {
        return sortByStringFunction(a, b);
      } else {
        return sortByNumberFunction(a, b);
      }
    };

    const sortByStringFunction = (a, b) => {
      return direction * a[field].localeCompare(b[field], locales, { caseFirst: 'upper' });
    };

    const sortByNumberFunction = (a, b) => {
      return direction * (a[field] - b[field]);
    };

    return arrCopy.sort((a, b) => getSortFunction(a, b));
  }

  updateSubElements() {
    this.subElements.body.innerHTML = this.getBody(this.data);
    this.subElements.header.innerHTML = this.getHeader(this.headerConfig);
  }

  getSubElements() {
    const dataElements = this.element.querySelectorAll("[data-element]");
    let result = {};
    dataElements.forEach((item) => {
      result[item.dataset.element] = item;
    });
    return result;
  }

  getHeader(headerConfig = []) {
    return headerConfig.map(item => {
      return `
        <div class="sortable-table__cell" data-id="${item.id}" data-sortable="${item.sortable}" data-order="${this.sortOrder}">
            <span>${item.title}</span>
            ${this.getArrow(item.id)}
        </div>
      `;
    }).join('');
  }

  getArrow(id) {
    if (this.sortField === id) {
      return `
        <span data-element="arrow" class="sortable-table__sort-arrow">
          <span class="sort-arrow"></span>
        </span>
    `;
    }
    return '';
  }

  getBody(data = []) {
    return data.map(item => {
      const imageUrl = item.images ? item.images[0].url : 'https://via.placeholder.com/32';
      return `
        <a href="/products/${item.id}" class="sortable-table__row">${this.getRow(item)}</a>
      `;
    }).join('');
  }

  getRow(dataItem) {
    return this.headerConfig.map(headerItem => {
      const item = dataItem[headerItem.id];
      if (headerItem.template) {
        return headerItem.template(item);
      }
      return `
        <div class="sortable-table__cell">${item}</div>
      `;
    }).join('');
  }

  getTemplate() {
    return `
      <div class="sortable-table">
        <div data-element="header" class="sortable-table__header sortable-table__row">
            ${this.getHeader(this.headerConfig)}
        </div>
        <div data-element="body" class="sortable-table__body">
            ${this.getBody(this.data)}
        </div>
      </div>
    `;
  }
}
