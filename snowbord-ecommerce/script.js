// Product data and application state
let products = [];
let filteredProducts = [];
let cart = [];

// API endpoint
const API_URL = 'https://interveiw-mock-api.vercel.app/api/getProducts';

// DOM elements
const productsGrid = document.getElementById('productsGrid');
const loadingSpinner = document.getElementById('loadingSpinner');
const noProducts = document.getElementById('noProducts');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const vendorFilter = document.getElementById('vendorFilter');
const priceFilter = document.getElementById('priceFilter');
const clearFilters = document.getElementById('clearFilters');
const cartToggle = document.getElementById('cartToggle');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const emptyCart = document.getElementById('emptyCart');
const cartSummary = document.getElementById('cartSummary');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.getElementById('cartCount');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileMenu = document.getElementById('mobileMenu');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    setupEventListeners();
    loadCartFromStorage();
});

// Setup event listeners
function setupEventListeners() {
    searchInput.addEventListener('input', debounce(filterProducts, 300));
    sortSelect.addEventListener('change', filterProducts);
    vendorFilter.addEventListener('change', filterProducts);
    priceFilter.addEventListener('change', filterProducts);
    clearFilters.addEventListener('click', clearAllFilters);
    
    cartToggle.addEventListener('click', toggleCart);
    closeCart.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);
    
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
}

// Load products from API
async function loadProducts() {
    try {
        loadingSpinner.style.display = 'block';
        productsGrid.style.display = 'none';
        noProducts.style.display = 'none';

        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data.status === 'success' && data.data) {
            products = data.data.map(item => item.product);
            filteredProducts = [...products];
            
            populateVendorFilter();
            renderProducts();
            
            loadingSpinner.style.display = 'none';
            productsGrid.style.display = 'grid';
        } else {
            throw new Error('Failed to load products');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        loadingSpinner.style.display = 'none';
        noProducts.style.display = 'block';
        noProducts.innerHTML = `
            <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-600 mb-2">Error loading products</h3>
            <p class="text-gray-500">Please try again later</p>
        `;
    }
}

// Populate vendor filter dropdown
function populateVendorFilter() {
    const vendors = [...new Set(products.map(product => product.vendor))];
    vendorFilter.innerHTML = '<option value="">All Vendors</option>';
    vendors.forEach(vendor => {
        const option = document.createElement('option');
        option.value = vendor;
        option.textContent = vendor;
        vendorFilter.appendChild(option);
    });
}

// Filter products based on search and filters
function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedVendor = vendorFilter.value;
    const selectedPriceRange = priceFilter.value;
    const sortBy = sortSelect.value;

    filteredProducts = products.filter(product => {
        const matchesSearch = product.title.toLowerCase().includes(searchTerm) ||
                            product.vendor.toLowerCase().includes(searchTerm) ||
                            (product.tags && product.tags.toLowerCase().includes(searchTerm));
        
        const matchesVendor = !selectedVendor || product.vendor === selectedVendor;
        
        const price = parseFloat(product.variants[0].price);
        let matchesPrice = true;
        
        if (selectedPriceRange) {
            if (selectedPriceRange === '0-500') {
                matchesPrice = price < 500;
            } else if (selectedPriceRange === '500-750') {
                matchesPrice = price >= 500 && price < 750;
            } else if (selectedPriceRange === '750-1000') {
                matchesPrice = price >= 750 && price < 1000;
            } else if (selectedPriceRange === '1000-2000') {
                matchesPrice = price >= 1000 && price < 2000;
            } else if (selectedPriceRange === '2000+') {
                matchesPrice = price >= 2000;
            }
        }
        
        return matchesSearch && matchesVendor && matchesPrice;
    });

    // Sort products
    sortProducts(sortBy);
    renderProducts();
}

// Sort products
function sortProducts(sortBy) {
    switch (sortBy) {
        case 'name-asc':
            filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'price-asc':
            filteredProducts.sort((a, b) => parseFloat(a.variants[0].price) - parseFloat(b.variants[0].price));
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => parseFloat(b.variants[0].price) - parseFloat(a.variants[0].price));
            break;
    }
}

// Render products
function renderProducts() {
    if (filteredProducts.length === 0) {
        productsGrid.style.display = 'none';
        noProducts.style.display = 'block';
        return;
    }

    productsGrid.style.display = 'grid';
    noProducts.style.display = 'none';

    productsGrid.innerHTML = filteredProducts.map(product => {
        const variant = product.variants[0];
        const hasDiscount = variant.compare_at_price && parseFloat(variant.compare_at_price) > parseFloat(variant.price);
        const imageUrl = product.image ? product.image.src : 'https://via.placeholder.com/300x300?text=No+Image';
        
        return `
            <div class="product-card bg-white rounded-lg shadow-md overflow-hidden">
                <div class="relative">
                    <img src="${imageUrl}" alt="${product.title}" class="w-full h-64 object-cover">
                    ${hasDiscount ? '<div class="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-sm rounded">Sale</div>' : ''}
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-gray-800 mb-2 line-clamp-2">${product.title}</h3>
                    <p class="text-sm text-gray-600 mb-2">${product.vendor}</p>
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <span class="text-lg font-bold text-blue-600">₹${variant.price}</span>
                            ${hasDiscount ? `<span class="text-sm price-strike ml-2">₹${variant.compare_at_price}</span>` : ''}
                        </div>
                    </div>
                    <button onclick="addToCart('${product.id}')" class="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                        <i class="fas fa-cart-plus mr-2"></i>Add to Cart
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Clear all filters
function clearAllFilters() {
    searchInput.value = '';
    sortSelect.value = 'name-asc';
    vendorFilter.value = '';
    priceFilter.value = '';
    filterProducts();
}

// Add to cart
function addToCart(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id == productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: parseFloat(product.variants[0].price),
            image: product.image ? product.image.src : 'https://via.placeholder.com/100x100?text=No+Image',
            quantity: 1
        });
    }

    updateCartUI();
    saveCartToStorage();
    
    // Show success message
    showNotification('Product added to cart!', 'success');
}

// Remove from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id != productId);
    updateCartUI();
    saveCartToStorage();
}

// Update cart quantity
function updateCartQuantity(productId, quantity) {
    const item = cart.find(item => item.id == productId);
    if (item) {
        item.quantity = quantity;
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCartUI();
            saveCartToStorage();
        }
    }
}

// Update cart UI
function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    cartCount.textContent = totalItems;
    cartTotal.textContent = `₹${totalPrice.toFixed(2)}`;

    if (cart.length === 0) {
        emptyCart.style.display = 'block';
        cartSummary.classList.add('hidden');
        cartItems.innerHTML = '';
    } else {
        emptyCart.style.display = 'none';
        cartSummary.classList.remove('hidden');
        
        cartItems.innerHTML = cart.map(item => `
            <div class="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
                <img src="${item.image}" alt="${item.title}" class="w-16 h-16 object-cover rounded">
                <div class="flex-1">
                    <h4 class="font-medium text-gray-800 line-clamp-2">${item.title}</h4>
                    <p class="text-blue-600 font-semibold">₹${item.price}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})" class="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300">
                        <i class="fas fa-minus text-xs"></i>
                    </button>
                    <span class="w-8 text-center">${item.quantity}</span>
                    <button onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})" class="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300">
                        <i class="fas fa-plus text-xs"></i>
                    </button>
                </div>
                <button onclick="removeFromCart('${item.id}')" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }
}

// Toggle cart sidebar
function toggleCart() {
    cartSidebar.classList.toggle('open');
    cartOverlay.classList.toggle('active');
}

// Toggle mobile menu
function toggleMobileMenu() {
    mobileMenu.classList.toggle('hidden');
}

// Save cart to localStorage
function saveCartToStorage() {
    localStorage.setItem('snowboard_cart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('snowboard_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
