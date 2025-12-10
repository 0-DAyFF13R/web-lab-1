// Данные блюд для шаурмичной "ЕшьДаПей"
// Категории: 'shaurma', 'snacks', 'drinks', 'combos'

window.DISHES = [
    // Шаурма
    {
        keyword: 'classic_shaurma',
        name: 'Шаурма классическая',
        price: 250,
        category: 'shaurma',
        count: '350г',
        image: 'Assets/shaurma-classic.jpg',
        desc: 'Курица, свежие овощи, фирменный соус, лаваш',
        kind: 'meat'
    },

{
    keyword: 'xxl_shaurma',
    name: 'Шаурма XXL',
    price: 350,
    category: 'shaurma',
    count: '500г',
    image: 'Assets/shaurma-xxl.jpg',
    desc: 'Больше мяса, больше овощей, двойная порция соуса',
    kind: 'meat'
},

{
    keyword: 'vegan_shaurma',
    name: 'Шаурма вегетарианская',
    price: 220,
    category: 'shaurma',
    count: '300г',
    image: 'Assets/shaurma-vegan.jpg',
    desc: 'Овощи, грибы, сыр, соус на выбор',
    kind: 'veg'
},

{
    keyword: 'beef_shaurma',
    name: 'Шаурма с говядиной',
    price: 320,
    category: 'shaurma',
    count: '380г',
    image: 'Assets/shaurma-beef.jpg',
    desc: 'Нежная говядина, овощи, острый соус',
    kind: 'meat'
},

// Закуски
{
    keyword: 'fries',
    name: 'Картофель фри',
    price: 120,
    category: 'snacks',
    count: '200г',
    image: 'Assets/fries.jpg',
    desc: 'Хрустящий картофель с соусом на выбор',
    kind: 'veg'
},

{
    keyword: 'nuggets',
    name: 'Куриные наггетсы',
    price: 180,
    category: 'snacks',
    count: '250г',
    image: 'Assets/nuggets.jpg',
    desc: '6 сочных куриных наггетсов',
    kind: 'meat'
},

{
    keyword: 'salad',
    name: 'Овощной салат',
    price: 150,
    category: 'snacks',
    count: '300г',
    image: 'Assets/salad.jpg',
    desc: 'Свежие овощи с оливковым маслом',
    kind: 'veg'
},

// Напитки
{
    keyword: 'homemade_lemonade',
    name: 'Лимонад домашний',
    price: 120,
    category: 'drinks',
    count: '500мл',
    image: 'Assets/lemonade.jpg',
    desc: 'Освежающий напиток',
    kind: 'cold'
},

{
    keyword: 'cola',
    name: 'Кола',
    price: 100,
    category: 'drinks',
    count: '500мл',
    image: 'Assets/cola.jpg',
    desc: 'Coca-Cola',
    kind: 'cold'
},

{
    keyword: 'coffee',
    name: 'Кофе',
    price: 80,
    category: 'drinks',
    count: '250мл',
    image: 'Assets/coffee.jpg',
    desc: 'Свежесваренный кофе',
    kind: 'hot'
},

// Комбо-наборы
{
    keyword: 'combo_classic',
    name: 'Комбо Классик',
    price: 350,
    category: 'combos',
    count: 'набор',
    image: 'Assets/combo-classic.jpg',
    desc: 'Шаурма классическая + Картофель фри + Напиток'
},

{
    keyword: 'combo_xxl',
    name: 'Комбо XXL',
    price: 450,
    category: 'combos',
    count: 'набор',
    image: 'Assets/combo-xxl.jpg',
    desc: 'Шаурма XXL + Наггетсы + Напиток'
},

{
    keyword: 'combo_family',
    name: 'Семейное комбо',
    price: 850,
    category: 'combos',
    count: 'набор',
    image: 'Assets/combo-family.jpg',
    desc: '2 шаурмы + 2 картофеля фри + 2 напитка'
}
];
