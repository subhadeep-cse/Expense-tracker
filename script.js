// State Management
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
const MONTHLY_BUDGET = 2000;

// DOM Elements
const form = document.getElementById('transactionForm');
const titleInput = document.getElementById('title');
const amountInput = document.getElementById('amount');
const typeSelect = document.getElementById('type');
const categorySelect = document.getElementById('category');
const dateInput = document.getElementById('date');
const editIdInput = document.getElementById('editId');
const submitBtn = document.getElementById('submitBtn');

const transactionList = document.getElementById('transactionList');
const emptyState = document.getElementById('emptyState');
const totalBalanceEl = document.getElementById('totalBalance');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const progressFill = document.getElementById('progressFill');
const budgetPercentEl = document.getElementById('budgetPercent');

const searchInput = document.getElementById('searchInput');
const filterCategory = document.getElementById('filterCategory');
const themeSwitch = document.getElementById('themeSwitch'); // Wait, the ID in HTML is theme-switch
const themeSwitchInput = document.getElementById('theme-switch');
const htmlElement = document.documentElement;

// Initialize App
function init() {
    // Set default date to today
    dateInput.valueAsDate = new Date();
    
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.setAttribute('data-theme', savedTheme);
    if(savedTheme === 'light') themeSwitchInput.checked = true;

    // Event Listeners
    form.addEventListener('submit', handleTransactionSubmit);
    typeSelect.addEventListener('change', handleTypeChange);
    searchInput.addEventListener('input', renderTransactions);
    filterCategory.addEventListener('change', renderTransactions);
    themeSwitchInput.addEventListener('change', toggleTheme);

    renderTransactions();
}

// Handle Theme Toggle
function toggleTheme(e) {
    const isLight = e.target.checked;
    const theme = isLight ? 'light' : 'dark';
    htmlElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// Handle Form Submission
function handleTransactionSubmit(e) {
    e.preventDefault();

    const title = titleInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const type = typeSelect.value;
    const category = categorySelect.value;
    const date = dateInput.value;
    const editId = editIdInput.value;

    if (!title || isNaN(amount) || amount <= 0 || !date) {
        alert('Please provide valid details.');
        return;
    }

    const transaction = {
        id: editId ? editId : generateID(),
        title,
        amount,
        type,
        category,
        date
    };

    if (editId) {
        transactions = transactions.map(t => t.id === editId ? transaction : t);
        submitBtn.innerHTML = "<i class='bx bx-plus-circle'></i> Add Transaction";
        editIdInput.value = '';
    } else {
        transactions.push(transaction);
    }

    // Reset form while keeping date
    form.reset();
    dateInput.valueAsDate = new Date();
    handleTypeChange(); // Reset category dropdown

    updateLocalStorage();
    renderTransactions();
}

// Form Helpers
function handleTypeChange() {
    const isIncome = typeSelect.value === 'income';
    const incomeOption = document.querySelector('.income-only');
    
    if (isIncome) {
        categorySelect.value = 'Salary';
        // Disable other options if desired, or just let them be. For now, selecting salary by default
    } else {
        if(categorySelect.value === 'Salary') {
            categorySelect.value = 'Food';
        }
    }
}

// Generate random ID
function generateID() {
    return Math.floor(Math.random() * 100000000).toString();
}

// Edit Transaction
function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    titleInput.value = transaction.title;
    amountInput.value = transaction.amount;
    typeSelect.value = transaction.type;
    handleTypeChange(); // Update UI based on type
    categorySelect.value = transaction.category;
    dateInput.value = transaction.date;
    editIdInput.value = transaction.id;

    submitBtn.innerHTML = "<i class='bx bx-edit'></i> Update Transaction";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Delete Transaction
function deleteTransaction(id) {
    if(confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        updateLocalStorage();
        renderTransactions();
    }
}

// Render Transactions to DOM
function renderTransactions() {
    transactionList.innerHTML = '';
    
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = filterCategory.value;

    let filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchTerm) || t.category.toLowerCase().includes(searchTerm);
        const matchesCategory = filterValue === 'All' || t.category === filterValue;
        return matchesSearch && matchesCategory;
    });

    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filteredTransactions.length === 0) {
        emptyState.classList.add('active');
    } else {
        emptyState.classList.remove('active');
        filteredTransactions.forEach(addTransactionDOM);
    }

    updateSummary();
}

// Add Single Transaction to DOM
function addTransactionDOM(transaction) {
    const sign = transaction.type === 'income' ? '+' : '-';
    const icon = getCategoryIcon(transaction.category);
    
    const li = document.createElement('li');
    li.classList.add('transaction-item', transaction.type);
    
    // Format Date
    const dateObj = new Date(transaction.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    li.innerHTML = `
        <div class="icon-bg">
            <i class='bx ${icon}'></i>
        </div>
        <div class="transaction-info">
            <h4>${transaction.title}</h4>
            <div class="transaction-meta">
                <span>${transaction.category}</span>
                <span>•</span>
                <span>${formattedDate}</span>
            </div>
        </div>
        <div class="transaction-amount">
            ${sign}$${transaction.amount.toFixed(2)}
        </div>
        <div class="transaction-actions">
            <button class="action-btn edit-btn" onclick="editTransaction('${transaction.id}')" title="Edit">
                <i class='bx bx-edit-alt'></i>
            </button>
            <button class="action-btn delete-btn" onclick="deleteTransaction('${transaction.id}')" title="Delete">
                <i class='bx bx-trash'></i>
            </button>
        </div>
    `;
    
    transactionList.appendChild(li);
}

// Get Icon based on Category
function getCategoryIcon(category) {
    const icons = {
        'Food': 'bx-restaurant',
        'Travel': 'bx-train',
        'Shopping': 'bx-shopping-bag',
        'Bills': 'bx-receipt',
        'Entertainment': 'bx-movie-play',
        'Health': 'bx-health',
        'Salary': 'bx-money',
        'Other': 'bx-category'
    };
    return icons[category] || 'bx-category';
}

// Update Summary Cards & Progress
function updateSummary() {
    const amounts = transactions.map(transaction => ({
        amount: transaction.amount,
        type: transaction.type
    }));

    const income = amounts
        .filter(item => item.type === 'income')
        .reduce((acc, item) => acc + item.amount, 0);

    const expense = amounts
        .filter(item => item.type === 'expense')
        .reduce((acc, item) => acc + item.amount, 0);

    const total = income - expense;

    totalBalanceEl.innerText = `$${total.toFixed(2)}`;
    totalIncomeEl.innerText = `$${income.toFixed(2)}`;
    totalExpenseEl.innerText = `$${expense.toFixed(2)}`;

    // Calculate progress (Expenses vs Budget)
    let percent = (expense / MONTHLY_BUDGET) * 100;
    if (percent > 100) percent = 100;
    
    progressFill.style.width = `${percent}%`;
    budgetPercentEl.innerText = `${percent.toFixed(0)}%`;

    // Change progress bar color if nearing or over limit
    if (percent > 85) {
        progressFill.style.background = 'linear-gradient(90deg, #ef4444, #b91c1c)';
    } else {
        progressFill.style.background = 'linear-gradient(90deg, var(--primary-color), #8b5cf6)';
    }
}

// Local Storage Function
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Run App
init();
