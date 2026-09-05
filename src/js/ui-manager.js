/**
 * UI Manager
 * Управление интерфейсом и компонентами
 */

export class UIManager {
  constructor() {
    this.components = new Map();
    this.modals = new Map();
    this.notifications = new Map();
    this.tooltips = new Map();
    this.activeModal = null;
  }

  /**
   * Регистрировать компонент
   * @param {string} id - уникальный ID компонента
   * @param {HTMLElement} element - DOM элемент
   * @param {Object} options - опции компонента
   */
  registerComponent(id, element, options = {}) {
    this.components.set(id, {
      id,
      element,
      options,
      state: options.initialState || {},
      listeners: []
    });
    return this.components.get(id);
  }

  /**
   * Получить компонент
   */
  getComponent(id) {
    return this.components.get(id);
  }

  /**
   * Обновить состояние компонента
   */
  updateComponentState(id, newState) {
    const component = this.components.get(id);
    if (!component) return false;

    component.state = { ...component.state, ...newState };
    this._notifyListeners(id, component.state);
    return true;
  }

  /**
   * Подписаться на изменения состояния
   */
  onComponentStateChange(id, callback) {
    const component = this.components.get(id);
    if (!component) return;

    component.listeners.push(callback);
  }

  /**
   * Уведомить слушателей об изменениях
   * @private
   */
  _notifyListeners(id, state) {
    const component = this.components.get(id);
    if (!component) return;

    component.listeners.forEach(callback => callback(state));
  }

  // ==================== МОДАЛЬНЫЕ ОКНА ====================

  /**
   * Открыть модальное окно
   * @param {string} id - ID модального окна
   * @param {Object} options - опции окна
   */
  openModal(id, options = {}) {
    // Закрыть предыдущее активное модальное окно
    if (this.activeModal) {
      this.closeModal(this.activeModal);
    }

    let modal = this.modals.get(id);
    
    if (!modal) {
      // Создать новое модальное окно
      modal = this._createModal(id, options);
      this.modals.set(id, modal);
    }

    modal.element.classList.add('active');
    modal.backdrop.classList.add('active');
    this.activeModal = id;

    // Отключить прокрутку
    document.body.style.overflow = 'hidden';

    // Запустить callback
    if (options.onOpen) {
      options.onOpen(modal);
    }
  }

  /**
   * Закрыть модальное окно
   * @param {string} id - ID модального окна
   */
  closeModal(id) {
    const modal = this.modals.get(id);
    if (!modal) return;

    modal.element.classList.remove('active');
    modal.backdrop.classList.remove('active');

    if (this.activeModal === id) {
      this.activeModal = null;
      document.body.style.overflow = '';
    }

    // Запустить callback
    if (modal.options.onClose) {
      modal.options.onClose();
    }
  }

  /**
   * Создать модальное окно
   * @private
   */
  _createModal(id, options) {
    // Создать backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.id = `${id}-backdrop`;

    // Создать само модальное окно
    const modal = document.createElement('div');
    modal.className = `modal ${options.size || 'modal-md'}`;
    modal.id = id;

    // Заголовок
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <h2 class="modal-title">${options.title || 'Modal'}</h2>
      <button class="modal-close" aria-label="Close">×</button>
    `;

    // Тело
    const body = document.createElement('div');
    body.className = 'modal-body';
    if (options.content) {
      body.innerHTML = options.content;
    }

    // Подвал (опционально)
    let footer = null;
    if (options.showFooter !== false) {
      footer = document.createElement('div');
      footer.className = 'modal-footer';
      if (options.footerContent) {
        footer.innerHTML = options.footerContent;
      } else {
        footer.innerHTML = `
          <button class="btn btn-ghost modal-cancel-btn">Отмена</button>
          <button class="btn btn-primary modal-confirm-btn">Ок</button>
        `;
      }
    }

    // Собрать модальное окно
    modal.appendChild(header);
    modal.appendChild(body);
    if (footer) {
      modal.appendChild(footer);
    }

    // Добавить в DOM
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    // Добавить слушатели
    const closeBtn = header.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => this.closeModal(id));

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop && !options.backdrop) {
        this.closeModal(id);
      }
    });

    if (footer) {
      const cancelBtn = footer.querySelector('.modal-cancel-btn');
      const confirmBtn = footer.querySelector('.modal-confirm-btn');

      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => this.closeModal(id));
      }

      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
          if (options.onConfirm) {
            options.onConfirm();
          }
          this.closeModal(id);
        });
      }
    }

    return {
      id,
      element: modal,
      backdrop,
      body,
      header,
      footer,
      options
    };
  }

  // ==================== УВЕДОМЛЕНИЯ ====================

  /**
   * Показать уведомление
   * @param {string} message - сообщение
   * @param {string} type - тип ('success', 'error', 'warning', 'info')
   * @param {number} duration - длительность в мс (0 = не закрывается)
   */
  showNotification(message, type = 'info', duration = 3000) {
    const id = `notification-${Date.now()}-${Math.random()}`;
    
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button class="alert-close" aria-label="Close">×</button>
    `;

    // Контейнер для уведомлений
    let container = document.getElementById('notifications-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notifications-container';
      container.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1070;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 400px;
      `;
      document.body.appendChild(container);
    }

    container.appendChild(notification);
    this.notifications.set(id, { element: notification, type });

    // Кнопка закрытия
    const closeBtn = notification.querySelector('.alert-close');
    closeBtn.addEventListener('click', () => {
      this.closeNotification(id);
    });

    // Автоматическое закрытие
    if (duration > 0) {
      setTimeout(() => {
        this.closeNotification(id);
      }, duration);
    }

    return id;
  }

  /**
   * Закрыть уведомление
   */
  closeNotification(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    notification.element.style.animation = 'slideInDown 0.3s ease-in reverse';
    setTimeout(() => {
      notification.element.remove();
      this.notifications.delete(id);
    }, 300);
  }

  /**
   * Показать успешное уведомление
   */
  success(message, duration = 3000) {
    return this.showNotification(message, 'success', duration);
  }

  /**
   * Показать ошибку
   */
  error(message, duration = 5000) {
    return this.showNotification(message, 'error', duration);
  }

  /**
   * Показать предупреждение
   */
  warning(message, duration = 4000) {
    return this.showNotification(message, 'warning', duration);
  }

  /**
   * Показать информацию
   */
  info(message, duration = 3000) {
    return this.showNotification(message, 'info', duration);
  }

  // ==================== ВСПЛЫВАЮЩИЕ ПОДСКАЗКИ ====================

  /**
   * Создать подсказку
   * @param {HTMLElement} element - элемент, к которому привязана подсказка
   * @param {string} text - текст подсказки
   * @param {string} position - позиция ('top', 'bottom', 'left', 'right')
   */
  createTooltip(element, text, position = 'top') {
    const id = `tooltip-${Date.now()}`;

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
      position: absolute;
      background: var(--bg-tertiary);
      color: var(--text-primary);
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      white-space: nowrap;
      z-index: var(--z-tooltip);
      pointer-events: none;
      opacity: 0;
      transition: opacity var(--transition-fast);
    `;

    document.body.appendChild(tooltip);
    this.tooltips.set(id, { element: tooltip, target: element, text, position });

    // Показать при наведении
    element.addEventListener('mouseenter', () => {
      this._showTooltip(id);
    });

    element.addEventListener('mouseleave', () => {
      this._hideTooltip(id);
    });

    return id;
  }

  /**
   * Показать подсказку
   * @private
   */
  _showTooltip(id) {
    const tooltip = this.tooltips.get(id);
    if (!tooltip) return;

    const { element, target, position } = tooltip;
    const rect = target.getBoundingClientRect();
    const tooltipRect = element.getBoundingClientRect();

    let top = 0;
    let left = 0;
    const offset = 8;

    switch (position) {
      case 'top':
        top = rect.top - tooltipRect.height - offset;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = rect.bottom + offset;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.left - tooltipRect.width - offset;
        break;
      case 'right':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.right + offset;
        break;
    }

    element.style.top = `${top}px`;
    element.style.left = `${left}px`;
    element.style.opacity = '1';
  }

  /**
   * Скрыть подсказку
   * @private
   */
  _hideTooltip(id) {
    const tooltip = this.tooltips.get(id);
    if (!tooltip) return;

    tooltip.element.style.opacity = '0';
  }

  /**
   * Удалить подсказку
   */
  removeTooltip(id) {
    const tooltip = this.tooltips.get(id);
    if (!tooltip) return;

    tooltip.element.remove();
    this.tooltips.delete(id);
  }

  // ==================== ФОРМЫ ====================

  /**
   * Получить данные формы
   * @param {HTMLFormElement} form - форма
   * @returns {Object} данные формы
   */
  getFormData(form) {
    const formData = new FormData(form);
    const data = {};

    for (const [key, value] of formData) {
      if (data[key]) {
        // Если ключ уже существует, преобразовать в массив
        if (!Array.isArray(data[key])) {
          data[key] = [data[key]];
        }
        data[key].push(value);
      } else {
        data[key] = value;
      }
    }

    return data;
  }

  /**
   * Валидировать форму
   * @param {HTMLFormElement} form - форма
   * @returns {boolean}
   */
  validateForm(form) {
    return form.checkValidity();
  }

  /**
   * Очистить форму
   * @param {HTMLFormElement} form - форма
   */
  clearForm(form) {
    form.reset();
  }

  /**
   * Показать ошибку валидации
   */
  showFieldError(fieldElement, message) {
    fieldElement.classList.add('is-invalid');
    
    let errorElement = fieldElement.nextElementSibling;
    if (!errorElement || !errorElement.classList.contains('error-message')) {
      errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      fieldElement.parentNode.insertBefore(errorElement, fieldElement.nextSibling);
    }

    errorElement.textContent = message;
  }

  /**
   * Очистить ошибку валидации
   */
  clearFieldError(fieldElement) {
    fieldElement.classList.remove('is-invalid');
    
    const errorElement = fieldElement.nextElementSibling;
    if (errorElement && errorElement.classList.contains('error-message')) {
      errorElement.remove();
    }
  }

  // ==================== ТАБЫ ====================

  /**
   * Инициализировать табы
   * @param {HTMLElement} tabsContainer - контейнер с табами
   */
  initTabs(tabsContainer) {
    const buttons = tabsContainer.querySelectorAll('.tab-button');
    const contents = tabsContainer.querySelectorAll('.tab-content');

    buttons.forEach((button, index) => {
      button.addEventListener('click', () => {
        // Удалить активный класс со всех
        buttons.forEach(b => b.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        // Добавить активный класс выбранному
        button.classList.add('active');
        contents[index].classList.add('active');
      });
    });

    // Активировать первый таб по умолчанию
    if (buttons.length > 0) {
      buttons[0].classList.add('active');
      contents[0].classList.add('active');
    }
  }

  // ==================== ПРОГРЕСС ====================

  /**
   * Обновить прогресс-бар
   * @param {HTMLElement} progressElement - элемент прогресса
   * @param {number} percentage - процент (0-100)
   */
  updateProgress(progressElement, percentage) {
    const bar = progressElement.querySelector('.progress-bar');
    if (!bar) return;

    percentage = Math.max(0, Math.min(100, percentage));
    bar.style.width = `${percentage}%`;
  }

  /**
   * Создать спиннер
   * @returns {HTMLElement}
   */
  createSpinner(size = 'md') {
    const spinner = document.createElement('div');
    spinner.className = `spinner spinner-${size}`;
    return spinner;
  }

  // ==================== УТИЛИТЫ ====================

  /**
   * Показать элемент
   */
  show(element) {
    element.classList.remove('hidden');
  }

  /**
   * Скрыть элемент
   */
  hide(element) {
    element.classList.add('hidden');
  }

  /**
   * Переключить видимость
   */
  toggle(element) {
    element.classList.toggle('hidden');
  }

  /**
   * Добавить класс
   */
  addClass(element, className) {
    element.classList.add(className);
  }

  /**
   * Удалить класс
   */
  removeClass(element, className) {
    element.classList.remove(className);
  }

  /**
   * Проверить, есть ли класс
   */
  hasClass(element, className) {
    return element.classList.contains(className);
  }

  /**
   * Установить HTML
   */
  setHTML(element, html) {
    element.innerHTML = html;
  }

  /**
   * Установить текст
   */
  setText(element, text) {
    element.textContent = text;
  }

  /**
   * Получить значение атрибута
   */
  getAttribute(element, attr) {
    return element.getAttribute(attr);
  }

  /**
   * Установить атрибут
   */
  setAttribute(element, attr, value) {
    element.setAttribute(attr, value);
  }

  /**
   * Установить стиль
   */
  setStyle(element, styles) {
    Object.assign(element.style, styles);
  }

  /**
   * Добавить слушателя события
   */
  on(element, event, handler) {
    element.addEventListener(event, handler);
  }

  /**
   * Удалить слушателя события
   */
  off(element, event, handler) {
    element.removeEventListener(event, handler);
  }

  /**
   * Триггер события
   */
  trigger(element, eventName) {
    const event = new Event(eventName, { bubbles: true });
    element.dispatchEvent(event);
  }

  /**
   * Получить родителя с селектором
   */
  closest(element, selector) {
    return element.closest(selector);
  }

  /**
   * Найти элементы
   */
  query(selector, context = document) {
    return context.querySelector(selector);
  }

  /**
   * Найти все элементы
   */
  queryAll(selector, context = document) {
    return context.querySelectorAll(selector);
  }

  /**
   * Удалить элемент из DOM
   */
  remove(element) {
    element.remove();
  }

  /**
   * Добавить элемент в контейнер
   */
  append(container, element) {
    container.appendChild(element);
  }

  /**
   * Готов ли DOM к использованию
   */
  ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  /**
   * Очистить все модальные окна
   */
  clearModals() {
    this.modals.forEach((modal) => {
      modal.element.remove();
      modal.backdrop.remove();
    });
    this.modals.clear();
    this.activeModal = null;
    document.body.style.overflow = '';
  }

  /**
   * Очистить все уведомления
   */
  clearNotifications() {
    this.notifications.forEach((notification) => {
      notification.element.remove();
    });
    this.notifications.clear();
  }

  /**
   * Очистить все подсказки
   */
  clearTooltips() {
    this.tooltips.forEach((tooltip) => {
      tooltip.element.remove();
    });
    this.tooltips.clear();
  }
}

/**
 * Глобальный экземпляр UIManager
 */
export const uiManager = new UIManager();
