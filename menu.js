(async function () {
    /* ===== 1) ЗАГРУЗКА ДАННЫХ ИЗ API ===== */
    const API_URL = 'https://6939a0a0c8d59937aa088b2d.mockapi.io/api/v1/dishes';
    const API_ORDERS = 'https://6939a0a0c8d59937aa088b2d.mockapi.io/api/v1/orders';

    let DISHES = [];

    try {
        console.log('Загружаем данные из API...');
        const res = await fetch(API_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        DISHES = await res.json();
        console.log('Данные получены из API:', DISHES);
    } catch (e) {
        console.error('Ошибка загрузки данных из API:', e);
        DISHES = [];
        const apiError = document.createElement('div');
        apiError.className = 'alert alert-danger';
        apiError.innerHTML = `
        <h4>Ошибка загрузки меню</h4>
        <p>Не удалось загрузить данные меню. API может быть недоступно.</p>
        <p><small>${e.message}</small></p>
        `;
        document.querySelector('main')?.prepend(apiError);
    }

    // Если API вернуло пустой массив
    if (!DISHES.length) {
        console.log('API вернул пустой массив или данные не загрузились');
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'alert alert-warning text-center';
        emptyMsg.textContent = 'Меню временно недоступно. Пожалуйста, попробуйте позже.';
        document.querySelector('main')?.prepend(emptyMsg);
    }

    // ---- 2) ЭЛЕМЕНТЫ ДОМА =====
    const byId = (id) => document.getElementById(id);

    const CATEGORIES = {
        hot: {
            title: 'Горячее',
            grid: byId('grid-hot'),
 hidden: document.getElementById('hidden-hot') || createHiddenInput('hidden-hot'),
 kindFilters: document.querySelector('.kind-filters[data-category="hot"]')
        },
        snack: {
            title: 'Закуски',
            grid: byId('grid-snack'),
 hidden: document.getElementById('hidden-snack') || createHiddenInput('hidden-snack'),
 kindFilters: document.querySelector('.kind-filters[data-category="snack"]')
        },
        dessert: {
            title: 'Десерты',
            grid: byId('grid-dessert'),
 hidden: document.getElementById('hidden-dessert') || createHiddenInput('hidden-dessert'),
 kindFilters: document.querySelector('.kind-filters[data-category="dessert"]')
        },
        drink: {
            title: 'Напитки',
            grid: byId('grid-drink'),
 hidden: document.getElementById('hidden-drink') || createHiddenInput('hidden-drink'),
 kindFilters: document.querySelector('.kind-filters[data-category="drink"]')
        },
        combo: {
            title: 'Комбо-наборы',
            grid: byId('grid-combo'),
 hidden: document.getElementById('hidden-combo') || createHiddenInput('hidden-combo'),
 kindFilters: document.querySelector('.kind-filters[data-category="combo"]')
        }
    };

    function createHiddenInput(id) {
        const el = document.createElement('input');
        el.type = 'hidden';
        el.id = id;
        el.name = id.replace('hidden-', '');
        document.querySelector('form')?.appendChild(el);
        return el;
    }

    // ---- 3) СОСТОЯНИЕ ПРИЛОЖЕНИЯ =====
    const selected = {
        hot: { items: [] },
        snack: { items: [] },
        dessert: { items: [] },
        drink: { items: [] },
        combo: { items: [] }
    };

    // Состояние активных фильтров по kind для каждой категории
    const activeKindFilters = {
        hot: null,
        snack: null,
        dessert: null,
        drink: null,
        combo: null
    };

    const LS_KEY = 'eatdrink:cart';

    function saveCart() {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(selected));
        } catch (e) {
            console.warn('Ошибка сохранения в localStorage:', e);
        }
    }

    function loadCart() {
        try {
            const saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
            if (saved) {
                Object.keys(selected).forEach(cat => {
                    if (Array.isArray(saved[cat]?.items)) {
                        selected[cat].items = saved[cat].items;
                    }
                });
            }
        } catch (e) {
            console.warn('Ошибка загрузки из localStorage:', e);
        }
    }

    // ---- 4) ГРУППИРОВКА БЛЮД ПО КАТЕГОРИЯМ И СОЗДАНИЕ ФИЛЬТРОВ =====
    const dishesByCategory = {
        hot: [],
        snack: [],
        dessert: [],
        drink: [],
        combo: [],
        other: []
    };

    // Маппинг значений kind на человекочитаемые названия
    const kindLabels = {
        'meat': 'Мясные',
        'veg': 'Вегетарианские',
        'sweet': 'Сладкие',
        'colddrink': 'Холодные',
        'hotdrink': 'Горячие',
        'combo': 'Все комбо',
        'small': 'Мал. порции',
        'medium': 'Ср. порции'
    };

    // Группируем блюда напрямую по категориям из API
    DISHES.forEach(dish => {
        const category = dish.category; // hot, snack, dessert, drink, combo
        if (dishesByCategory[category]) {
            dishesByCategory[category].push(dish);
        } else {
            dishesByCategory.other.push(dish);
        }
    });

    console.log('Блюда по категориям:', dishesByCategory);

    // ---- 5) СОЗДАНИЕ ФИЛЬТРОВ ПО KIND =====
    function createKindFilters(category) {
        const filtersContainer = CATEGORIES[category].kindFilters;
        if (!filtersContainer) return;

        // Получаем все уникальные значения kind для данной категории
        const kindValues = [...new Set(dishesByCategory[category].map(dish => dish.kind))];

        if (kindValues.length <= 1) {
            filtersContainer.style.display = 'none';
            return;
        }

        filtersContainer.innerHTML = '';

        // Создаем кнопку "Все"
        const allButton = document.createElement('button');
        allButton.type = 'button';
        allButton.className = 'kind-filter-btn active';
        allButton.dataset.kind = 'all';
        allButton.textContent = 'Все';
        allButton.addEventListener('click', () => {
            setKindFilter(category, 'all');
        });
        filtersContainer.appendChild(allButton);

        // Создаем кнопки для каждого значения kind
        kindValues.forEach(kind => {
            if (!kind) return;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'kind-filter-btn';
            button.dataset.kind = kind;
            button.textContent = kindLabels[kind] || kind;
            button.addEventListener('click', () => {
                setKindFilter(category, kind);
            });
            filtersContainer.appendChild(button);
        });
    }

    function setKindFilter(category, kind) {
        // Сбрасываем активное состояние всех кнопок в этой категории
        const filterContainer = CATEGORIES[category].kindFilters;
        if (filterContainer) {
            const buttons = filterContainer.querySelectorAll('.kind-filter-btn');
            buttons.forEach(btn => btn.classList.remove('active'));

            // Активируем выбранную кнопку
            const activeButton = filterContainer.querySelector(`[data-kind="${kind}"]`);
            if (activeButton) {
                activeButton.classList.add('active');
            }
        }

        // Устанавливаем активный фильтр
        activeKindFilters[category] = kind === 'all' ? null : kind;

        // Перерендериваем категорию
        renderCategory(category);
    }

    // ---- 6) РЕНДЕРИНГ КАРТОЧЕК С УЧЕТОМ ФИЛЬТРОВ =====
    function renderCategory(category) {
        const config = CATEGORIES[category];
        if (!config || !config.grid) {
            console.warn(`Не найдена конфигурация для категории: ${category}`);
            return;
        }

        // Фильтруем блюда по активному фильтру kind
        let dishes = dishesByCategory[category];
        const activeFilter = activeKindFilters[category];

        if (activeFilter) {
            dishes = dishes.filter(dish => dish.kind === activeFilter);
        }

        const grid = config.grid;

        if (!dishes || dishes.length === 0) {
            grid.innerHTML = `<div class="text-center p-4">
            <p class="text-muted">В этой категории пока нет блюд</p>
            </div>`;
            return;
        }

        let html = '';

        dishes.forEach(dish => {
            const isSelected = selected[category].items.some(item =>
            item.keyword === dish.keyword
            );
            const selectedItem = isSelected ?
            selected[category].items.find(item => item.keyword === dish.keyword) :
            null;

            let imageUrl = '';
            if (dish.image) {
                if (dish.image.startsWith('http') || dish.image.startsWith('data:')) {
                    imageUrl = dish.image;
                } else if (dish.image.includes('.')) {
                    imageUrl = `Assets/${dish.image}`;
                } else {
                    imageUrl = `Assets/${dish.image}.jpg`;
                }
            } else {
                imageUrl = 'Assets/placeholder.png';
            }

            html += `
            <div class="plate-card ${isSelected ? 'selected' : ''}"
            data-dish="${dish.keyword}"
            data-category="${category}"
            data-kind="${dish.kind || ''}">
            <img src="${imageUrl}"
            alt="${dish.name}"
            class="plate-img"
            onerror="this.src='Assets/placeholder.png'">
            <div class="plate-info">
            <p class="plate-title">${dish.name}</p>
            <p class="plate-desc">${dish.desc || ''}</p>
            <p class="plate-meta">${dish.count || ''}</p>
            <p class="plate-price">${dish.price} ₽</p>

            <div class="qty" style="display: ${isSelected ? 'flex' : 'none'}">
            <button type="button" class="btn-qty" data-delta="-1">−</button>
            <span class="qty-num">${selectedItem ? selectedItem.qty : 1}</span>
            <button type="button" class="btn-qty" data-delta="1">+</button>
            </div>

            <button type="button" class="btn-primary"
            style="display: ${isSelected ? 'none' : 'block'}">
            Добавить
            </button>
            </div>
            </div>
            `;
        });

        grid.innerHTML = html;

        attachCardEventHandlers(category);
    }

    function attachCardEventHandlers(category) {
        const cards = document.querySelectorAll(`.plate-card[data-category="${category}"]`);

        cards.forEach(card => {
            const dishKeyword = card.dataset.dish;
            const dish = DISHES.find(d => d.keyword === dishKeyword);
            if (!dish) return;

            // Кнопка "Добавить"
            const addBtn = card.querySelector('.btn-primary');
            if (addBtn) {
                addBtn.addEventListener('click', () => addToCart(category, dish, card));
            }

            // Кнопки количества
            const qtyButtons = card.querySelectorAll('.btn-qty');
            qtyButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const delta = parseInt(e.target.dataset.delta);
                    adjustQty(category, dish, delta, card);
                });
            });
        });
    }

    // ---- 7) ФУНКЦИИ КОРЗИНЫ =====
    function addToCart(category, dish, card) {
        const existing = selected[category].items.find(item => item.keyword === dish.keyword);

        if (existing) {
            existing.qty += 1;
        } else {
            selected[category].items.push({
                keyword: dish.keyword,
                name: dish.name,
                price: dish.price,
                qty: 1
            });
        }

        updateCardUI(category, dish, card, true);
        saveCart();
        renderSummary();
        renderTotal();
    }

    function adjustQty(category, dish, delta, card) {
        const index = selected[category].items.findIndex(item => item.keyword === dish.keyword);

        if (index === -1) {
            addToCart(category, dish, card);
            return;
        }

        selected[category].items[index].qty += delta;

        if (selected[category].items[index].qty <= 0) {
            selected[category].items.splice(index, 1);
            updateCardUI(category, dish, card, false);
        } else {
            updateCardUI(category, dish, card, true);
        }

        saveCart();
        renderSummary();
        renderTotal();
    }

    function updateCardUI(category, dish, card, isInCart) {
        const addBtn = card.querySelector('.btn-primary');
        const qtyDiv = card.querySelector('.qty');
        const qtyNum = card.querySelector('.qty-num');

        if (isInCart) {
            const item = selected[category].items.find(i => i.keyword === dish.keyword);
            if (item && qtyNum) {
                qtyNum.textContent = item.qty;
            }

            card.classList.add('selected');
            if (addBtn) addBtn.style.display = 'none';
            if (qtyDiv) qtyDiv.style.display = 'flex';
        } else {
            card.classList.remove('selected');
            if (addBtn) {
                addBtn.style.display = 'block';
                addBtn.textContent = 'Добавить';
            }
            if (qtyDiv) qtyDiv.style.display = 'none';
        }
    }

    // ---- 8) РЕНДЕРИНГ СВОДКИ =====
    function renderSummary() {
        Object.keys(CATEGORIES).forEach(category => {
            const list = document.querySelector(`.summary-block[data-sum="${category}"] .summary-list`);
            if (!list) {
                console.log(`Не найден список для категории: ${category}`);
                return;
            }

            const items = selected[category].items;
            const hiddenInput = CATEGORIES[category].hidden;

            if (!items.length) {
                list.innerHTML = `<li class="empty">Не выбрано</li>`;
                if (hiddenInput) hiddenInput.value = '';
                return;
            }

            list.innerHTML = '';
            items.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `${item.name} × ${item.qty} — <span class="price-highlight">${item.price * item.qty} ₽</span>`;
                list.appendChild(li);
            });

            if (hiddenInput) {
                hiddenInput.value = JSON.stringify(items);
            }
        });
    }

    function renderTotal() {
        const totalEl = document.getElementById('summary-total');
        if (!totalEl) return;

        const total = Object.keys(selected).reduce((sum, category) => {
            return sum + selected[category].items.reduce((catSum, item) => {
                return catSum + (item.price * item.qty);
            }, 0);
        }, 0);

        totalEl.textContent = `${total} ₽`;
    }

    // ---- 9) ОБРАБОТКА ФОРМЫ =====
    function setupFormHandlers() {
        const form = document.querySelector('form');
        if (!form) return;

        // Переключение времени доставки
        const timeRadios = form.querySelectorAll('input[name="delivery_time"]');
        const timeInput = form.querySelector('input[name="specific_time"]');

        if (timeRadios.length && timeInput) {
            timeRadios.forEach(radio => {
                radio.addEventListener('change', () => {
                    timeInput.disabled = radio.value !== 'scheduled';
                    if (!timeInput.disabled && !timeInput.value) {
                        // Устанавливаем текущее время + 1 час как значение по умолчанию
                        const now = new Date();
                        now.setHours(now.getHours() + 1);
                        const hours = now.getHours().toString().padStart(2, '0');
                        const minutes = now.getMinutes().toString().padStart(2, '0');
                        timeInput.value = `${hours}:${minutes}`;
                    }
                });
            });
        }

        // Сброс формы
        form.addEventListener('reset', () => {
            setTimeout(() => {
                Object.keys(selected).forEach(category => {
                    selected[category].items = [];
                    const hiddenInput = CATEGORIES[category].hidden;
                    if (hiddenInput) hiddenInput.value = '';
                });

                    saveCart();
                    renderSummary();
                    renderTotal();

                    // Перерендериваем все карточки
                    Object.keys(CATEGORIES).forEach(category => {
                        renderCategory(category);
                    });
            }, 0);
        });

        // Отправка формы
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Проверка наличия товаров
            const hasItems = Object.keys(selected).some(category =>
            selected[category].items.length > 0
            );

            if (!hasItems) {
                showModal('Пожалуйста, выберите хотя бы одно блюдо!');
                return;
            }

            // Проверка обязательных полей
            const name = form.querySelector('input[name="name"]')?.value.trim();
            const phone = form.querySelector('input[name="phone"]')?.value.trim();
            const address = form.querySelector('input[name="address"]')?.value.trim();

            if (!name || !phone || !address) {
                showModal('Пожалуйста, заполните все обязательные поля: имя, телефон и адрес доставки.');
                return;
            }

            // Подготовка данных заказа
            const orderItems = [];
            Object.keys(selected).forEach(category => {
                selected[category].items.forEach(item => {
                    orderItems.push({
                        category: category,
                        name: item.name,
                        price: item.price,
                        quantity: item.qty,
                        keyword: item.keyword
                    });
                });
            });

            const total = Object.keys(selected).reduce((sum, category) => {
                return sum + selected[category].items.reduce((catSum, item) =>
                catSum + (item.price * item.qty), 0);
            }, 0);

            const orderData = {
                customer_name: name,
                phone: phone,
                address: address,
                email: form.querySelector('input[name="email"]')?.value.trim() || '',
                              delivery_time: form.querySelector('input[name="delivery_time"]:checked')?.value || 'asap',
                              specific_time: timeInput?.value || '',
                              items: orderItems,
                              total: total,
                              status: 'новый',
                              created_at: new Date().toISOString()
            };

            try {
                // Отправка заказа в API
                const response = await fetch(API_ORDERS, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                if (!response.ok) throw new Error('Ошибка сервера при оформлении заказа');

                              const result = await response.json();
                showModal(`✅ Заказ оформлен! Номер заказа: #${result.id || '0000'}\nСумма: ${total} ₽\nОжидайте доставку!`);

                // Очистка формы и корзины
                form.reset();
                              Object.keys(selected).forEach(category => {
                                  selected[category].items = [];
                              });

                saveCart();
                renderSummary();
                renderTotal();
                Object.keys(CATEGORIES).forEach(category => {
                    renderCategory(category);
                });

            } catch (error) {
                console.error('Ошибка оформления заказа:', error);
                showModal('❌ Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте еще раз или позвоните нам.');
            }
        });
    }

    // ---- 10) ФИЛЬТРЫ КАТЕГОРИЙ =====
    function setupFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;

                // Обновляем активную кнопку
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Показываем/скрываем секции
                Object.keys(CATEGORIES).forEach(cat => {
                    const section = CATEGORIES[cat].grid?.closest('.menu-section');
                    if (section) {
                        if (category === 'all' || cat === category) {
                            section.style.display = 'block';
                        } else {
                            section.style.display = 'none';
                        }
                    }
                });
            });
        });
    }

    // ---- 11) МОДАЛЬНЫЕ ОКНА =====
    function showModal(message) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
        <div class="modal">
        <p>${message}</p>
        <button class="ok" type="button">ОК</button>
        </div>
        `;

        document.body.appendChild(overlay);

        const closeModal = () => overlay.remove();

        overlay.querySelector('.ok').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

            document.addEventListener('keydown', function escHandler(e) {
                if (e.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', escHandler);
                }
            });
    }

    // ---- 12) ИНИЦИАЛИЗАЦИЯ =====
    function init() {
        console.log('Инициализация приложения...');

        // Загружаем сохраненную корзину
        loadCart();

        // Создаем фильтры по kind для каждой категории
        Object.keys(CATEGORIES).forEach(category => {
            createKindFilters(category);
        });

        // Рендерим все категории
        Object.keys(CATEGORIES).forEach(category => {
            renderCategory(category);
        });

        // Рендерим сводку
        renderSummary();
        renderTotal();

        // Настраиваем фильтры категорий
        setupFilters();

        // Настраиваем обработчики формы
        setupFormHandlers();

        console.log('Приложение инициализировано');
    }

    // Запускаем инициализацию
    init();
})();
