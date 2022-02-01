export default class SortableTable {
  element;
  subElements;
  sortOrder = '';  // 'asc' or 'desc'
  sortField = '';
  constructor(headerConfig, {
    data = [],
    sorted = {
      id: headerConfig.find(item => item.sortable).id,
      order: 'asc'
    }
  } ) {
    this.headerConfig = headerConfig;
    this.data = Array.isArray(data) ? data : data.data;
    this.sortField = sorted.id;
    this.sortOrder = sorted.order;
    this.render();
    this.initListeners();
    this.sort(this.sortField, this.sortOrder);
  }

  get template() {
    return `
            <div data-element="productsContainer" class="products-list__container">
              <div class="sortable-table">
                <div data-element="header" class="sortable-table__header sortable-table__row">
                    ${this.createHeader(this.headerConfig)}
                </div>
                <div data-element="body" class="sortable-table__body">
                    ${this.createTableBody(this.data)}
                </div>
                <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
                <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
                  <div>
                    <p>No products satisfies your filter criteria</p>
                    <button type="button" class="button-primary-outline">Reset all filters</button>
                  </div>
                </div>
              </div>
            </div>
        `;
  }
//**********************************************************************************************************************
  initListeners() {
    document.addEventListener('pointerdown', this.onMouseClick);
  }

  onMouseClick = event => {
    const headerCell = event.target.closest('.sortable-table__cell');

    if (headerCell) {
      if (!headerCell.closest(  '.sortable-table__header')) {
        return;
      }
      if (headerCell.dataset.sortable !== 'false') {
        this.sortOrder = this.sortOrder ===  'asc' ?  'desc' : 'asc' ;
        this.sortField = headerCell.dataset.id;

        this.sort(this.sortField, this.sortOrder);
      }
    }
  }
//**********************************************************************************************************************
  get arrowTemplate() {
    return `
            <span data-element="arrow" class="sortable-table__sort-arrow">
                <span class="sort-arrow"></span>
            </span>
        `;
  }
  render() {
    const element = document.createElement('div');
    element.innerHTML = this.template;
    this.element = element.firstElementChild;
    this.subElements = this.getSubElements(this.element);
  }

  sort (fieldValue, orderValue) {
    // console.error(111);
    this.sortOrder = orderValue;
    this.sortField = fieldValue;

    this.data = this.sortData(this.data);
    this.subElements.header.innerHTML = this.createHeader(this.headerConfig);
    this.subElements.body.innerHTML = this.createTableBody(this.data);

    console.log('this.subElements.header', this.subElements.header);

    // const { children } = this.subElements.header;
    // const [_, price, sales] = children;
  }
  sortData (data) {
    const conf = this.headerConfig.find(item => item.id === this.sortField);
    if (!conf) {
      return;
    }
    let sortType = conf.sortType;
    const dataCopy = [...data];
    const direction = {asc: 1, desc: -1}[this.sortOrder];
    return dataCopy.sort((a,b) => {
      switch (sortType) {
        case 'number':
          return direction * (a[this.sortField] - b[this.sortField]);
        case 'string':
          return direction * a[this.sortField].localeCompare(b[this.sortField], ['ru', 'en'], {sensitivity: 'variant', caseFirst: 'upper'});
        default:
          return direction * (a[this.sortField] - b[this.sortField]);
      }
    });
  }
  createHeader(headerConfig) {
    let result = '';
    for (const columnHeaderConf of headerConfig) {
      result += `
                    <div class="sortable-table__cell" data-id="${columnHeaderConf.id}"
                                                      data-sortable="${columnHeaderConf.sortable}"
                                                      ${this.sortField === columnHeaderConf.id ? 'data-order="' + this.sortOrder + '"' : ''}>
                        <span>${columnHeaderConf.title}</span>
                        ${this.sortField === columnHeaderConf.id ? this.arrowTemplate : ''}
                    </div>
            `
    }
    return result;
  }
  createTableRow(productData) {
    let result = `<a href="/products/${productData.id}" class="sortable-table__row">`;
    for (const columnHeaderConf of this.headerConfig) {
      result += columnHeaderConf.template ?
        columnHeaderConf.template(productData[[columnHeaderConf.id]])
        :
        `<div class="sortable-table__cell">${productData[columnHeaderConf.id]}</div>`;
    }
    result += '</a>';
    return result;
  }
  createTableBody(data) {
    return data.map(item => {
      return this.createTableRow(item);
    }).join('');
  }
  getSubElements(element) {
    const result = {};
    const subElements = element.querySelectorAll('[data-element]');
    for (const subElement of subElements) {
      result[subElement.dataset.element] = subElement;
    }
    return result;
  }
  remove() {
    if (this.element) {
      this.element.remove();
    }
  }
  destroy() {
    document.removeEventListener('pointerdown', this.onMouseClick);
    this.remove();
    this.element = null;
    this.subElements = {};
  }
}
