export default class SortableTable {
  sortedData = [];
  subElements = {};

  constructor(headersConfig = [], {
    data = [],
    sorted = {},
  } = {}) {
    this.headersConfig = headersConfig;
    this.data = data;
    this.sortedData = this.data;

    this.sorted = sorted;

    this.isSortLocally = true;

    this.onClickSortHandler = this.onClickSortHandler.bind(this);

    this.render();

    this.attachEvents();
  }

  render() {
    const tmpElement = document.createElement('div');

    tmpElement.innerHTML = this.template;

    this.element = tmpElement.firstElementChild;

    this.fillSubElements();

    this.buildHeader();

    if (this.sorted.id && this.sorted.order) {
      this.sort();
    } else {
      this.buildBody();
    }
  }

  get template() {
    return `
      <div data-element="productsContainer" class="products-list__container">
        <div class="sortable-table">
          <div data-element="header" class="sortable-table__header sortable-table__row"></div>
          <div data-element="body" class="sortable-table__body"></div>
        </div>
      </div>
    `;
  }

  fillSubElements() {
    const sections = this.element.querySelectorAll('[data-element]');

    sections.forEach((section) => {
      this.subElements[section.dataset.element] = section;
    });
  }

  buildHeader() {
    this.subElements.header.innerHTML = this.headersConfig.map((field) => {
      let arrow = '';
      let sortOrder = '';

      if (field.id === this.sorted.id) {
        arrow = `
          <span data-element="arrow" class="sortable-table__sort-arrow">
            <span class="sort-arrow"></span>
          </span>
        `;

        sortOrder = (this.sorted.order === 'asc') ? 'desc' : 'asc';
      }

      return `
        <div class="sortable-table__cell" data-id="${field.id}" data-sortable="${field.sortable}" data-order="${sortOrder || 'asc'}">
          <span>${field.title}</span>
          ${arrow}
        </div>
      `;
    }).join('');

    this.sort();
  }

  buildBody() {
    this.subElements.body.innerHTML = this.sortedData.map((product) => {
      let productMarkup = `<a href="/products/${product.id}" class="sortable-table__row">`;

      const productRow = this.headersConfig.map((field) => {
        if (field.id === 'images') {
          return field.template(product.images);
        }

        return `<div class="sortable-table__cell">${product[field.id]}</div>`;
      }).join('');

      productMarkup += productRow;

      productMarkup += `</a>`;

      return productMarkup;
    }).join('');
  }

  sort() {
    if (this.isSortLocally) {
      this.sortOnClient();
    } else {
      this.sortOnServer();
    }
  }

  sortOnClient() {
    const sortType = this.headersConfig.find(item => item.id === this.sorted.id)?.sortType;

    if (!sortType) {
      return;
    }

    switch (sortType) {
      case 'string':
        this.sortedData = this.data.sort((a, b) => {
          if (this.sorted.order === 'asc') {
            return a[this.sorted.id].localeCompare(b[this.sorted.id], ['ru', 'en'], {
              caseFirst: 'upper',
            });
          }

          if (this.sorted.order === 'desc') {
            return b[this.sorted.id].localeCompare(a[this.sorted.id], ['ru', 'en'], {
              caseFirst: 'upper',
            });
          }
        });
        break;
      case 'number':
        this.sortedData = this.data.sort((a, b) => {
          if (this.sorted.order === 'asc') {
            return a[this.sorted.id] - b[this.sorted.id];
          }

          if (this.sorted.order === 'desc') {
            return b[this.sorted.id] - a[this.sorted.id];
          }
        });
        break;
    }

    this.element.querySelector('[data-element="body"]');
    this.buildBody();
  }

  sortOnServer() {}

  onClickSortHandler({ target }) {
    const sortedHeading = target.closest('[data-sortable="true"]');

    if (!sortedHeading) {
      return;
    }

    sortedHeading.dataset.order = (this.sorted.order === 'asc') ? 'desc' : 'asc';

    this.sorted.id = sortedHeading.dataset.id;
    this.sorted.order = sortedHeading.dataset.order;

    this.sort();

    this.subElements.header.querySelector(`[data-id=${this.sorted.id}]`).append(this.subElements.header.querySelector('[data-element="arrow"]'));
  }

  attachEvents() {
    this.subElements.header.addEventListener('pointerdown', this.onClickSortHandler);
  }

  detachEvents() {
    this.subElements.header.removeEventListener('pointerdown', this.onClickSortHandler);
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.detachEvents();
    this.remove();
  }
}
