import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class SortableTable {
  constructor(headersConfig = [], {
    data = [],
    sorted = {},
    url = '',
    step = 30,
    start = 0,
    end = 30,
    isSortLocally = false,

  } = {}) {

    this.step = step;
    this.start = start;
    this.end = end;
    this.isSortLocally = isSortLocally;
    this.headerConfig = headersConfig;
    this.data = Array.isArray(data) ? data : data.data;
    this.sortOrder = sorted.order || 'asc';
    this.sortField = sorted.id || 'title';
    this.isLoading = true;
    this.url = new URL(url, BACKEND_URL);

    this.render();
  }

  async render() {
    const element = document.createElement("div");
    element.innerHTML = this.getTemplate();
    this.element = element.firstElementChild;
    this.subElements = this.getSubElements();

    this.setLoading(true);
    this.data = await this.fetchData(this.sortField, this.sortOrder, this.start, this.end);
    this.updateBody(this.data);
    this.setLoading(false);

    this.addHandlers();
  }

  remove() {
    this.element.remove();
    this.subElements = {};
  }

  destroy() {
    this.remove();
    document.removeEventListener("scroll", this.windowScrollHandler);
  }

  addHandlers() {
    this.subElements.header.addEventListener('pointerdown', this.sortControlClicked);
    document.addEventListener("scroll", this.windowScrollHandler);
  }

  windowScrollHandler = async (event) => {
    const bottomReached = this.element.getBoundingClientRect().bottom < document.documentElement.clientHeight;


    if (this.isLoading || !bottomReached) {
      return;
    }

    this.setLoading(true);

    this.start = this.end;
    this.end = this.start + this.step;

    const data = await this.fetchData(this.sortField, this.sortOrder, this.start, this.end);
    const newRows = document.createElement('div');
    newRows.innerHTML = this.getBody(data);

    this.subElements.body.append(...newRows.childNodes);

    this.setLoading(false);

    this.data = [...data, this.data];
  }

  async fetchData(sortField, sortOrder, start, end) {
    this.url.searchParams.set('_sort', sortField);
    this.url.searchParams.set('_order', sortOrder);
    this.url.searchParams.set('_start', start);
    this.url.searchParams.set('_end', end);

    return await fetchJson(this.url);
  }

  setLoading(isLoading = false) {
    this.isLoading = isLoading;
    this.element.classList.toggle('sortable-table_loading', isLoading);
  }

  sortControlClicked = (event) => {
    const item = event.target.closest('[data-sortable="true"]');
    if (!item) {
      return;
    }
    const sortField = item.dataset.id;
    const sortOrder = this.revertSortOrder(this.sortOrder);
    this.sort(sortField, sortOrder);
  }

  revertSortOrder(order = '') {
    const reverted = {
      asc: 'desc',
      desc: 'asc'
    };
    return reverted[order];
  }

  sort(field = '', order = '') {
    this.sortField = field;
    this.sortOrder = order;

    if (this.isSortLocally) {
      this.sortOnClient(field, order);
    } else {
      this.sortOnServer(field, order);
    }
  }

  async sortOnServer(field, order) {
    this.data = await this.fetchData(this.sortField, this.sortOrder, this.start, this.end);
    this.updateSubElements();
  }

  sortOnClient(field, order) {
    const arrCopy = [...this.data];

    const sortType = (this.headerConfig.find(obj => obj.id === field)).sortType;

    this.data = arrCopy.sort((a, b) => this.getSortFunction(a, b));

    this.updateSubElements();
  }

  getSortFunction = (a, b) => {
    const directions = {
      asc: 1,
      desc: -1
    };
    const direction = directions[order];

    if (sortType === "string") {
      return this.sortByStringFunction(a, b, direction);
    } else {
      return this.sortByNumberFunction(a, b, direction);
    }
  };

  sortByStringFunction = (a, b, direction) => {
    const locales = ['ru', 'en'];
    return direction * a[field].localeCompare(b[field], locales, { caseFirst: 'upper' });
  };

  sortByNumberFunction = (a, b, direction) => {
    return direction * (a[field] - b[field]);
  };

  updateSubElements() {
    this.updateBody();
    this.updateHeader();
  }

  updateBody() {
    if (this.data.length === 0) {
      this.element.classList.add('sortable-table_empty');
      return;
    }

    this.element.classList.remove('sortable-table_empty');
    this.subElements.body.innerHTML = this.getBody(this.data);
  }

  updateHeader() {
    const cells = this.subElements.header.children;
    for (let item of cells) {
      if (item.dataset.sortable && item.dataset.id === this.sortField) {
        item.dataset.order = this.sortOrder;
        item.append(this.subElements.arrow);
      }
    }
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
              ${this.getArrowTemplate(item.id)}
          </div>
        `;
    }).join('');
  }

  getArrowTemplate(id) {
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
    if (data.length === 0) {
      return;
    }

    return data.map(item => {
      //const imageUrl = item.images ? item.images[0].url : 'https://via.placeholder.com/32';
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
          <div data-element="body" class="sortable-table__body"></div>
          <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
          <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
            <div>
              <p>No products satisfies your filter criteria</p>
              <button type="button" class="button-primary-outline">Reset all filters</button>
            </div>
          </div>
        </div>
      `;
  }
}
