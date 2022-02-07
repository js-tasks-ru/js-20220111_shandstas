import escapeHtml from './utils/escape-html.js';
import fetchJson from './utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ProductForm {
  element = null;
  subElements = {};
  defaultProduct = {
    id: '',
    title: '',
    description: '',
    brand: '',
    quantity: 0,
    subcategory: '',
    status: 0,
    characteristics: '',
    price: 0,
    rating: 0,
    discount: 0,
    images: [],
  };

  constructor (productId) {
    this.productId = productId;
  }

  async render () {
    const element = document.createElement('div');
    element.innerHTML = this.getTemplate();
    this.element = element.firstElementChild;
    this.subElements = this.getSubElements();
    [this.categories, [this.product]] = await this.fetchData();

    if (this.categories) {
      this.renderCategories(this.categories);
    }

    if (this.product) {
      this.renderProduct(this.product);
    }

    if (this.product.images && this.product.images.length) {
      this.renderImages(this.product.images);
    }

    this.addHandlers();

    return this.element;
  }

  async fetchData() {
    return await Promise.all([this.fetchCategories(), this.fetchProduct()]);
  }

  async fetchProduct () {
    if (!this.productId) {
      return Promise.resolve([this.defaultProduct]);
    }

    const url = new URL('api/rest/products', BACKEND_URL);
    url.searchParams.set('id', this.productId);
    return await fetchJson(url);
  }

  async fetchCategories () {
    const url = new URL('api/rest/categories', BACKEND_URL);
    url.searchParams.set('_sort', 'weight');
    url.searchParams.set('_refs', 'subcategory');
    return await fetchJson(url);
  }

  renderCategories(categories = []) {
    categories.forEach(category => {
      category.subcategories.forEach(subcategory => {
        const option = new Option(category.title + ' > ' + subcategory.title, subcategory.id);
        this.subElements.categoriesSelect.append(option);
      });
    });
  }

  renderProduct(product = {}) {
    Object.keys(product).forEach(item => {
      if (item === 'images') {
        return;
      }

      const field = this.subElements.productForm.querySelector(`.form-control[name="${item}"]`);
      if (field) {
        field.value = this.product[item];
      }

    });
  }

  renderImages(images = []) {
    images.forEach(item => {
      this.subElements.imageListContainer.append(this.getImageItem(item.url, item.source));
    });
  }

  addHandlers() {
    this.subElements.productForm.addEventListener('submit', this.onSubmit);
    this.subElements.uploadImageButton.addEventListener('click', this.uploadImage);
  }

  onSubmit = (event) => {
    event.preventDefault();
    this.save();
  }

  async save() {
    const product = this.getProductData();

    try {
      const result = await fetchJson(`${BACKEND_URL}/api/rest/products`, {
        method: this.productId ? 'PATCH' : 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(product)
      });

      this.dispatchEvent(result.id);
    } catch (error) {
      console.error('something went wrong', error);
    }
  }

  getProductData() {
    const numFields = ['price', 'quantity', 'discount', 'status'];
    const product = {};
    product.id = this.productId;

    Object.keys(this.defaultProduct).forEach(item => {
      if (item === 'images') {
        return;
      }

      const field = this.subElements.productForm.querySelector(`.form-control[name="${item}"]`);
      if (!field) {
        return;
      }
      const value = field.value;

      if (numFields.includes(item)) {
        product[item] = parseInt(value);
      } else {
        product[item] = value;
      }
    });

    product.images = this.getImagesData();
    return product;
  }

  getImagesData() {
    const imageElements = this.subElements.imageListContainer.querySelectorAll('.sortable-table__cell-img');

    return [...imageElements].map(item => {
      return { url: item.src, source: item.alt};
    });

  }

  uploadImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    const setLoading = (loading = true) => {
      this.subElements.uploadImageButton.classList.toggle('is-loading', loading);
      this.subElements.uploadImageButton.disabled = !loading;
    };
    const imageInputHandler = async (e) => {
      const [file] = input.files;

      if (!file) {
        return;
      }

      const formData = new FormData();
      formData.append('image', file);

      setLoading(true);
      const result = await fetchJson('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
          Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
        },
        body: formData,
        referrer: ''
      });
      this.subElements.imageListContainer.append(this.getImageItem(result.data.link, file.name));
      setLoading(false);

      input.remove();
    };

    input.addEventListener('change', imageInputHandler);
    input.click();
  };

  dispatchEvent (id) {
    const event = this.productId
      ? new CustomEvent('product-updated', { detail: id })
      : new CustomEvent('product-saved');

    this.element.dispatchEvent(event);
  }

  destroy () {
    this.remove();
    this.element = null;
    this.subElements = {};
  }

  remove () {
    this.element.remove();
  }

  getSubElements() {
    const subElements = {};
    const elements = this.element.querySelectorAll('[data-element]');

    for (const item of elements) {
      subElements[item.dataset.element] = item;
    }

    return subElements;
  }

  getImageItem (url, name) {
    const wrapper = document.createElement('div');

    wrapper.innerHTML = `
      <li class="products-edit__imagelist-item sortable-list__item">
        <span>
          <img src="./icon-grab.svg" data-grab-handle alt="grab">
          <img class="sortable-table__cell-img" alt="${escapeHtml(name)}" src="${escapeHtml(url)}">
          <span>${escapeHtml(name)}</span>
        </span>
        <button type="button">
          <img src="./icon-trash.svg" alt="delete" data-delete-handle>
        </button>
      </li>`;

    return wrapper.firstElementChild;
  }

  getTemplate() {
    return `
      <div class="product-form">
        <form data-element="productForm" class="form-grid">
          <div class="form-group form-group__half_left">
            <fieldset>
              <label class="form-label">Название товара</label>
              <input required="" type="text" name="title" id="title" class="form-control" placeholder="Название товара">
            </fieldset>
          </div>
          <div class="form-group form-group__wide">
            <label class="form-label">Описание</label>
            <textarea required="" class="form-control" name="description" id="description" data-element="productDescription" placeholder="Описание товара"></textarea>
          </div>
          <div class="form-group form-group__wide" data-element="sortable-list-container">
            <label class="form-label">Фото</label>
            <div>
              <ul data-element="imageListContainer" class="sortable-list">
              </ul>
            </div>
            <button type="button" name="uploadImage" data-element="uploadImageButton" class="button-primary-outline"><span>Загрузить</span></button>
          </div>
          <div class="form-group form-group__half_left">
            <label class="form-label">Категория</label>
            <select class="form-control" name="subcategory" id="subcategory" data-element="categoriesSelect"></select>
          </div>
          <div class="form-group form-group__half_left form-group__two-col">
            <fieldset>
              <label class="form-label">Цена ($)</label>
              <input required="" type="number" name="price" id="price" class="form-control" placeholder="100">
            </fieldset>
            <fieldset>
              <label class="form-label">Скидка ($)</label>
              <input required="" type="number" name="discount" id="discount" class="form-control" placeholder="0">
            </fieldset>
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Количество</label>
            <input required="" type="number" class="form-control" name="quantity" id="quantity" placeholder="1">
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Статус</label>
            <select class="form-control" name="status" id="status">
              <option value="1">Активен</option>
              <option value="0">Неактивен</option>
            </select>
          </div>
          <div class="form-buttons">
            <button type="submit" name="save" class="button-primary-outline">
              Сохранить товар
            </button>
          </div>
        </form>
      </div>
    `;
  }
}
