export default class NotificationMessage {
  static subElements = null;

  constructor(message = '', {
    duration = 0,
    type = ''
  } = {}) {
    this.message = message;
    this.duration = duration;
    this.type = type;

    this.render();
  }

  get template() {
    return `
            <div class="notification" style="--value:${this.duration}ms">
                <div class="timer"></div>
                <div class="inner-wrapper">
                    <div class="notification-header">${this.type}</div>
                    <div class="notification-body">${this.message}</div>
                </div>
            </div>
        `;
  }

  render() {

    const element = document.createElement('div');

    element.innerHTML = this.template;

    this.element = element.firstElementChild;

    if(this.type === 'success')  {
      this.element.classList.add('success');
    }

    else if(this.type === 'error') {
      this.element.classList.add('error');
    }
  }

  show(targetElement) {

    if(NotificationMessage.subElements) {
      NotificationMessage.subElements.remove();
    }

    NotificationMessage.subElements = this.element;

    targetElement ? targetElement.append(this.element) : document.body.append(this.element);


    setTimeout(() => {
      this.destroy()
    }, this.duration);
  }

  remove() {
    if(this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
  }
}
