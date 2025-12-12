const API_ORDERS = 'https://6939a0a0c8d59937aa088b2d.mockapi.io/api/v1/orders';

document.addEventListener('DOMContentLoaded', loadOrders);

async function loadOrders() {
    const container = document.getElementById('orders-container');
    if (!container) return;

    container.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Загрузка заказов...</p></div>';

    try {
        const response = await fetch(API_ORDERS);
        if (!response.ok) throw new Error('Ошибка загрузки заказов');

        const orders = await response.json();

        if (!orders.length) {
            container.innerHTML = `
            <div class="text-center py-5">
            <h3>Заказов пока нет</h3>
            <p>Сделайте свой первый заказ!</p>
            <a href="lunch.html" class="btn btn-primary">Собрать заказ</a>
            </div>
            `;
            return;
        }

        // Сортируем по дате (новые сверху)
        orders.sort((a, b) => new Date(b.created_at || b.id) - new Date(a.created_at || a.id));

        container.innerHTML = orders.map(order => renderOrderCard(order)).join('');

    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        container.innerHTML = `
        <div class="alert alert-danger">
        <h4>Ошибка загрузки</h4>
        <p>Не удалось загрузить заказы. Пожалуйста, попробуйте позже.</p>
        <p><small>${error.message}</small></p>
        </div>
        `;
    }
}

function renderOrderCard(order) {
    const items = (order.items || [])
    .map(item => `<li>${item.name} — ${item.quantity} × ${item.price} ₽</li>`)
    .join('');

    const total = order.total || (order.items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const statusColors = {
        'новый': 'primary',
        'готовится': 'warning',
        'в пути': 'info',
        'доставлен': 'success',
        'отменен': 'danger'
    };

    const statusClass = statusColors[order.status] || 'secondary';

    return `
    <div class="order-card" data-order-id="${order.id}">
    <div class="order-header">
    <h3>Заказ #${order.id}</h3>
    <span class="badge bg-${statusClass}">${order.status || 'новый'}</span>
    </div>

    <div class="order-body">
    <div class="row">
    <div class="col-md-6">
    <p><strong>Клиент:</strong> ${order.customer_name || '—'}</p>
    <p><strong>Телефон:</strong> ${order.phone || '—'}</p>
    <p><strong>Адрес:</strong> ${order.address || '—'}</p>
    </div>
    <div class="col-md-6">
    <p><strong>Дата:</strong> ${formatDate(order.created_at)}</p>
    <p><strong>Время доставки:</strong> ${order.delivery_time === 'scheduled' ? order.specific_time : 'Как можно скорее'}</p>
    <p><strong>Сумма:</strong> <span class="price-highlight">${total} ₽</span></p>
    </div>
    </div>

    <details class="mt-3">
    <summary>Состав заказа</summary>
    <ul class="mt-2">
    ${items || '<li>Нет информации о составе</li>'}
    </ul>
    </details>
    </div>

    <div class="order-actions mt-3">
    <button class="btn-edit" onclick="editOrder('${order.id}')">
    <i class="bi bi-pencil"></i> Редактировать
    </button>
    <button class="btn-delete" onclick="deleteOrder('${order.id}')">
    <i class="bi bi-trash"></i> Удалить
    </button>
    </div>
    </div>
    `;
}

function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
}

async function deleteOrder(orderId) {
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) return;

    try {
        const response = await fetch(`${API_ORDERS}/${orderId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Ошибка удаления');

        alert('Заказ успешно удален!');
        loadOrders(); // Перезагружаем список

    } catch (error) {
        console.error('Ошибка удаления заказа:', error);
        alert('Не удалось удалить заказ. Пожалуйста, попробуйте позже.');
    }
}

async function editOrder(orderId) {
    try {
        console.log('Запрос заказа:', orderId);
        const url = `${API_ORDERS}/${orderId}`;
        const response = await fetch(url);

        // Логируем статус и заголовки (поможет в отладке CORS/ошибок)
        console.log('Ответ сервера:', response.status, response.statusText);
        console.log('Response headers:', Array.from(response.headers.entries()));

        if (!response.ok) {
            // Попытка прочитать тело ответа для более подробной ошибки
            let bodyText = '';
            try {
                bodyText = await response.text();
            } catch (e) {
                bodyText = '<не удалось прочитать тело ответа>';
            }
            console.error('Ошибка при загрузке заказа:', response.status, bodyText);
            throw new Error(`HTTP ${response.status} ${response.statusText} — ${bodyText}`);
        }

        // Пытаемся распарсить JSON (ловим ошибки парсинга отдельно)
        let order;
        try {
            order = await response.json();
        } catch (e) {
            console.error('Ошибка парсинга JSON для заказа', orderId, e);
            throw new Error('Получен ответ не в формате JSON');
        }

        // Дополнительно логируем полученный объект
        console.log('Данные заказа загружены:', order);

        showEditModal(order);

    } catch (error) {
        console.error('Ошибка загрузки заказа для редактирования:', error);
        // Показываем пользователю более подробное сообщение (без утечки внутреннего стека)
        alert('Не удалось загрузить данные заказа. ' + (error.message || 'Смотрите консоль для деталей.'));
    }
}


function showEditModal(order) {
    // Один модал — уникальные id с префиксом по order.id
    const id = order.id;
    const prefix = `order-${id}`;

    // Удобная функция для безопасного отображения пустых значений
    const safe = (v) => (v === undefined || v === null) ? '' : v;

    // Рендерим таблицу позиций (кол-во редактируемое, есть чекбокс для удаления)
    const items = (order.items || []).map((item, idx) => {
        return `
        <tr data-idx="${idx}">
            <td>${item.name}</td>
            <td>${item.price} ₽</td>
            <td>
                <input type="number" min="0" step="1" class="form-control edit-item-qty"
                    id="${prefix}-qty-${idx}" value="${item.quantity}" style="width:90px;">
            </td>
            <td>
                <input type="checkbox" class="form-check-input edit-item-remove" id="${prefix}-remove-${idx}">
                <label class="form-check-label" for="${prefix}-remove-${idx}">Удалить</label>
            </td>
        </tr>
        `;
    }).join('') || `<tr><td colspan="4">Нет информации о составе</td></tr>`;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
    <div class="modal">
      <h3>Редактирование заказа #${safe(order.id)}</h3>

      <div class="edit-form">
        <div class="row">
          <div class="col-md-6 mb-2">
            <label class="form-label">Имя</label>
            <input id="${prefix}-name" type="text" class="form-control" value="${escapeHtml(safe(order.customer_name))}">
          </div>
          <div class="col-md-6 mb-2">
            <label class="form-label">Телефон</label>
            <input id="${prefix}-phone" type="tel" class="form-control" value="${escapeHtml(safe(order.phone))}">
          </div>
        </div>

        <div class="mb-2">
            <label class="form-label">Email</label>
            <input id="${prefix}-email" type="email" class="form-control" value="${escapeHtml(safe(order.email))}">
        </div>

        <div class="mb-2">
          <label class="form-label">Адрес</label>
          <input id="${prefix}-address" type="text" class="form-control" value="${escapeHtml(safe(order.address))}">
        </div>

        <div class="mb-2">
          <legend class="form-label">Время доставки</legend>
          <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="${prefix}-delivery_time" id="${prefix}-asap" value="asap" ${order.delivery_time !== 'scheduled' ? 'checked' : ''}>
            <label class="form-check-label" for="${prefix}-asap">Как можно скорее</label>
          </div>
          <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="${prefix}-delivery_time" id="${prefix}-scheduled" value="scheduled" ${order.delivery_time === 'scheduled' ? 'checked' : ''}>
            <label class="form-check-label" for="${prefix}-scheduled">Ко времени</label>
          </div>
        </div>

        <div class="mb-2">
          <label class="form-label">Указать точное время</label>
          <input id="${prefix}-specific_time" type="time" class="form-control" min="10:00" max="23:00" value="${safe(order.specific_time || '')}" ${order.delivery_time === 'scheduled' ? '' : 'disabled'}>
        </div>

        <div class="mb-3">
          <label class="form-label">Статус</label>
          <select id="${prefix}-status" class="form-select">
            <option value="новый" ${order.status === 'новый' ? 'selected' : ''}>Новый</option>
            <option value="готовится" ${order.status === 'готовится' ? 'selected' : ''}>Готовится</option>
            <option value="в пути" ${order.status === 'в пути' ? 'selected' : ''}>В пути</option>
            <option value="доставлен" ${order.status === 'доставлен' ? 'selected' : ''}>Доставлен</option>
            <option value="отменен" ${order.status === 'отменен' ? 'selected' : ''}>Отменен</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">Комментарий</label>
          <textarea id="${prefix}-comment" class="form-control" rows="2">${escapeHtml(safe(order.comment))}</textarea>
        </div>

        <div class="modal-actions mt-3 d-flex flex-column gap-2">
          <button class="btn btn-secondary" type="button" id="${prefix}-cancel">Отмена</button>
          <button class="btn btn-primary" type="button" id="${prefix}-save">Сохранить</button>
        </div>
      </div>
    </div>
    `;

    document.body.appendChild(modal);

    // Включаем/отключаем поле specific_time при переключении radio
    const asapRadio = modal.querySelector(`#${prefix}-asap`);
    const scheduledRadio = modal.querySelector(`#${prefix}-scheduled`);
    const specificInput = modal.querySelector(`#${prefix}-specific_time`);

    function updateSpecificState() {
        if (scheduledRadio.checked) {
            specificInput.disabled = false;
            if (!specificInput.value) {
                // если пусто — ставим текущее +1 час
                const now = new Date();
                now.setHours(now.getHours() + 1);
                specificInput.value = now.toTimeString().slice(0,5);
            }
        } else {
            specificInput.disabled = true;
        }
    }

    asapRadio.addEventListener('change', updateSpecificState);
    scheduledRadio.addEventListener('change', updateSpecificState);
    updateSpecificState();

    // Отмена
    modal.querySelector(`#${prefix}-cancel`).addEventListener('click', () => {
        modal.remove();
    });

    // Сохранение — вызывает глобальную функцию, передаём id (она в следующем блоке)
    modal.querySelector(`#${prefix}-save`).addEventListener('click', () => {
        saveOrderChanges(id);
    });
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

async function saveOrderChanges(orderId) {
    const prefix = `order-${orderId}`;
    const modalOverlay = document.querySelector('.modal-overlay');
    if (!modalOverlay) {
        alert('Модальное окно не найдено.');
        return;
    }

    // Берём значения полей
    const name = document.getElementById(`${prefix}-name`).value.trim();
    const phone = document.getElementById(`${prefix}-phone`).value.trim();
    const address = document.getElementById(`${prefix}-address`).value.trim();
    const email = document.getElementById(`${prefix}-email`).value.trim();
    const delivery_time = document.querySelector(`input[name="${prefix}-delivery_time"]:checked`).value;
    const specific_time = document.getElementById(`${prefix}-specific_time`).value;
    const status = document.getElementById(`${prefix}-status`).value;
    const comment = document.getElementById(`${prefix}-comment`).value.trim();

    // Простая валидация
    if (!name || !phone || !address) {
        alert('Поля имя, телефон и адрес обязательны.');
        return;
    }

    try {
        // Получаем текущие данные заказа (чтобы взять оригинальные items и другие поля)
        const resp = await fetch(`${API_ORDERS}/${orderId}`);
        if (!resp.ok) throw new Error('Ошибка загрузки заказа');

        const order = await resp.json();

        // Обрабатываем редактирование позиций:
        const itemsTable = document.getElementById(`${prefix}-items-table`);
        const newItems = [];
        const rows = itemsTable ? Array.from(itemsTable.querySelectorAll('tr[data-idx]')) : [];

        rows.forEach(row => {
            const idx = parseInt(row.dataset.idx, 10);
            const original = (order.items || [])[idx];
            if (!original) return; // защита

            const qtyInput = document.getElementById(`${prefix}-qty-${idx}`);
            const remCheckbox = document.getElementById(`${prefix}-remove-${idx}`);

            const remove = remCheckbox && remCheckbox.checked;
            const qty = qtyInput ? parseInt(qtyInput.value, 10) || 0 : original.quantity;

            if (remove) {
                // пропускаем — позиция помечена для удаления
                return;
            }

            if (qty <= 0) {
                // если 0 — тоже пропускаем
                return;
            }

            // Собираем обновлённую позицию
            newItems.push({
                category: original.category,
                name: original.name,
                price: original.price,
                quantity: qty,
                keyword: original.keyword
            });
        });

        // Если пользователь удалил все позиции — можно либо запретить, либо разрешить (зависит от политики).
        // Здесь мы разрешаем, но дальше в validateOrder это может отфильтроваться.
        // Пересчитываем сумму
        const total = newItems.reduce((s, it) => s + (it.price * it.quantity), 0);

        // Формируем обновлённый объект
        const updatedOrder = {
            ...order,
            customer_name: name,
            phone: phone,
            address: address,
            email: email,
            delivery_time: delivery_time,
            specific_time: delivery_time === 'scheduled' ? specific_time : '',
            items: newItems,
            total: total,
            status: status,
            comment: comment,
            updated_at: new Date().toISOString()
        };

        // Отправляем PUT
        const updateResponse = await fetch(`${API_ORDERS}/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedOrder)
        });

        if (!updateResponse.ok) throw new Error('Ошибка сохранения');

        // Закрываем модал и обновляем список
        modalOverlay.remove();
        await loadOrders();
        alert('Изменения сохранены.');

    } catch (error) {
        console.error('Ошибка сохранения изменений:', error);
        alert('Не удалось сохранить изменения. ' + (error.message || ''));
    }
}
