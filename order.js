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
        const response = await fetch(`${API_ORDERS}/${orderId}`);
        if (!response.ok) throw new Error('Ошибка загрузки заказа');

        const order = await response.json();
        showEditModal(order);

    } catch (error) {
        console.error('Ошибка загрузки заказа для редактирования:', error);
        alert('Не удалось загрузить данные заказа.');
    }
}

function showEditModal(order) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
    <div class="modal">
    <h3>Редактирование заказа #${order.id}</h3>

    <div class="edit-form">
    <label>
    Статус заказа:
    <select id="edit-status" class="form-select">
    <option value="новый" ${order.status === 'новый' ? 'selected' : ''}>Новый</option>
    <option value="готовится" ${order.status === 'готовится' ? 'selected' : ''}>Готовится</option>
    <option value="в пути" ${order.status === 'в пути' ? 'selected' : ''}>В пути</option>
    <option value="доставлен" ${order.status === 'доставлен' ? 'selected' : ''}>Доставлен</option>
    <option value="отменен" ${order.status === 'отменен' ? 'selected' : ''}>Отменен</option>
    </select>
    </label>

    <label>
    Комментарий:
    <textarea id="edit-comment" class="form-control" rows="3">${order.comment || ''}</textarea>
    </label>

    <div class="modal-actions mt-4">
    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
    Отмена
    </button>
    <button class="btn btn-primary" onclick="saveOrderChanges('${order.id}')">
    Сохранить
    </button>
    </div>
    </div>
    </div>
    `;

    document.body.appendChild(modal);
}

async function saveOrderChanges(orderId) {
    const status = document.getElementById('edit-status').value;
    const comment = document.getElementById('edit-comment').value;

    try {
        // Сначала получаем текущий заказ
        const response = await fetch(`${API_ORDERS}/${orderId}`);
        if (!response.ok) throw new Error('Ошибка загрузки заказа');

        const order = await response.json();

        // Обновляем данные
        const updatedOrder = {
            ...order,
            status: status,
            comment: comment,
            updated_at: new Date().toISOString()
        };

        // Отправляем изменения
        const updateResponse = await fetch(`${API_ORDERS}/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedOrder)
        });

        if (!updateResponse.ok) throw new Error('Ошибка сохранения');

        // Закрываем модальное окно
        document.querySelector('.modal-overlay').remove();

        // Обновляем список заказов
        loadOrders();

        alert('Изменения сохранены!');

    } catch (error) {
        console.error('Ошибка сохранения изменений:', error);
        alert('Не удалось сохранить изменения. Пожалуйста, попробуйте позже.');
    }
}
