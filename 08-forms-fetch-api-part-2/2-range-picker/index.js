export default class RangePicker {
  element;
  subElements = {};
  isShown = false;
  firstMonth;
  secondMonth;
  selected;

  constructor({
                from = new Date(),
                to = new Date()
              } = {}) {
    this.from = from;
    this.to = to;
    this.render();
  }

  render() {
    const element = document.createElement('div');
    element.innerHTML = this.getTemplate();
    this.element = element.firstElementChild;
    this.subElements = this.getSubElements();
    this.firstMonth = new Date(this.from.getFullYear(), this.from.getMonth());
    this.secondMonth = new Date(this.from.getFullYear(), this.from.getMonth());
    this.secondMonth.setMonth(this.secondMonth.getMonth() + 1);
    this.getInputs();
    this.initEventListeners();
  }

  getTemplate() {
    return `
        <div class="rangepicker">
          <div class="rangepicker__input" data-element="input">
            <span data-element="from"></span> -
            <span data-element="to"></span>
          </div>
          <div class="rangepicker__selector" data-element="selector"></div>
    </div>
    `;
  }

  getSubElements() {
    const result = {};
    const elements = this.element.querySelectorAll('[data-element]');

    for (const subElement of elements) {
      const name = subElement.dataset.element;
      result[name] = subElement;
    }
    return result;
  }

  getInputs() {
    const from = this.from.toLocaleString("ru-RU", { year: 'numeric', month: '2-digit', day: '2-digit'});
    const to = this.to.toLocaleString("ru-RU", { year: 'numeric', month: '2-digit', day: '2-digit'});
    this.subElements.from.innerHTML = from;
    this.subElements.to.innerHTML = to;
  }

  initEventListeners() {
    this.subElements.input.addEventListener('click', this.toggleOpened);
  }

  toggleOpened = () => {
    if (!this.isShown) {
      this.initSelector();
      this.isShown = true;
    }
    this.element.classList.toggle('rangepicker_open');
  };

  initSelector() {
    let selector = `
        <div class="rangepicker__selector-arrow"></div>
        <div class="rangepicker__selector-control-left"></div>
        <div class="rangepicker__selector-control-right"></div>
        ${this.renderMonth(this.firstMonth)}
        ${this.renderMonth(this.secondMonth)}
      `;

    this.subElements.selector.insertAdjacentHTML('afterbegin', selector);

    const prevBtn = this.element.querySelector('.rangepicker__selector-control-left');
    const nextBtn = this.element.querySelector('.rangepicker__selector-control-right');

    prevBtn.addEventListener('click', this.toggleMonth);
    nextBtn.addEventListener('click', this.toggleMonth);

    this.subElements.selector.addEventListener('click', this.select);
  }

  renderMonth(month) {
    let monthRus = month.toLocaleString('ru-RU', {month: 'long'});
    let monthEng = month.toLocaleString('en-EN', {month: 'long'});

    return `
        <div class="rangepicker__calendar">
            <div class="rangepicker__month-indicator">
                <time datetime="${monthEng}">${monthRus}</time>
            </div>
            ${this.getWeekTemplate()}
           <div class="rangepicker__date-grid">
                ${this.getDateTemplate(month)}
           </div>
        </div>
    `;
  }

  getWeekTemplate() {
    return `
      <div class="rangepicker__day-of-week">
        <div>Пн</div>
        <div>Вт</div>
        <div>Ср</div>
        <div>Чт</div>
        <div>Пт</div>
        <div>Сб</div>
        <div>Вс</div>
      </div>
    `;
  }

  getDateTemplate(month) {
    let firstDate = new Date(month.getFullYear(), month.getMonth());
    const arr = [];

    while (firstDate.getMonth() === month.getMonth()) {
      arr.push(new Date(month.getFullYear(), month.getMonth(), firstDate.getDate()));
      firstDate.setDate(firstDate.getDate() + 1);
    }

    return arr.map((item, index) => {
      return `
        <button type="button" class="${this.getClass(item)}"
                data-value="${item.toISOString()}"
                ${index === 0 ? this.getDayOfWeek(item) : ''}>
                    ${item.getDate()}
        </button>
      `;
    }).join('');
  }

  getDayOfWeek(item) {
    return `style="--start-from: ${item.getDay()}"`;
  }

  getClass(item) {
    let classStr = 'rangepicker__cell';

    if (+item === +this.from) {
      classStr += ' rangepicker__selected-from';
    } else if (+item > +this.from && +item < +this.to) {
      classStr += ' rangepicker__selected-between';
    } else if (+item === +this.to) {
      classStr += ' rangepicker__selected-to';
    }
    return classStr;
  }

  toggleMonth = (e) => {
    const direction = e.currentTarget.classList.contains('rangepicker__selector-control-left') ? -1 : 1;
    this.subElements.selector.innerHTML = '';

    this.firstMonth.setMonth(this.firstMonth.getMonth() + direction);
    this.secondMonth.setMonth(this.secondMonth.getMonth() + direction);

    this.initSelector();
  };

  select = (event) => {
    const active = event.target.closest('.rangepicker__cell');

    if (!active) {
      return;
    }

    if (!this.selected) {
      [...this.subElements.selector.querySelectorAll('.rangepicker__cell')].forEach(item => {
        item.className = 'rangepicker__cell';
      });

      this.selected = active;
      this.selected.classList.add('rangepicker__selected-from');
      this.from = new Date(Date.parse(this.selected.dataset.value));
    } else {
      this.to = new Date(Date.parse(active.dataset.value));
      active.classList.add('rangepicker__selected-to');
      if (this.to - this.from < 0) {
        this.from = this.to;
        this.to = new Date(Date.parse(this.selected.dataset.value));
      }
      this.setNewRange();

      this.element.dispatchEvent(new CustomEvent("date-select", {
        detail: 'Successfully selected'
      }));
    }
  };

  setNewRange() {
    this.element.classList.remove('rangepicker_open');
    this.getInputs();

    [...this.subElements.selector.querySelectorAll('.rangepicker__cell')].forEach(item => {
      if (Date.parse(item.dataset.value) > this.from.getTime() && Date.parse(item.dataset.value) < this.to.getTime()) {
        item.classList.add('rangepicker__selected-between');
      }
    });

    this.selected = null;
  }

  destroy() {
    this.remove();
  }

  remove() {
    this.element.remove();
    this.subElements = {};
  }
}
