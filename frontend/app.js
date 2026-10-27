// Altere a URL abaixo para o link do seu backend hospedado na nuvem (ex: Render) quando fizer o deploy
const API_URL = "https://seu-backend-na-nuvem.onrender.com/api";
let cart = [];
let allProducts = [];

document.addEventListener("DOMContentLoaded", () => {
    fetchProducts();
    setupEvents();
});

async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        allProducts = await response.json();
        renderProducts(allProducts);
    } catch (error) {
        console.error("Erro ao carregar produtos do banco:", error);
        document.getElementById("productsGrid").innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #ef4444;">Erro ao conectar com o backend Python. Certifique-se de que a API está rodando.</p>`;
    }
}

function renderProducts(products) {
    const grid = document.getElementById("productsGrid");
    if (products.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Nenhum produto encontrado.</p>`;
        return;
    }
    grid.innerHTML = products.map(product => `
        <div class="card">
            <img src="${product.image}" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'">
            <div class="card-info">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="card-footer">
                    <span class="price">R$ ${product.price.toFixed(2)}</span>
                    <button class="add-btn" onclick="addToCart(${product.id})">Adicionar</button>
                </div>
            </div>
        </div>
    `).join("");
}

function filterCategory(category) {
    document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
    event.target.classList.add("active");

    if (category === 'all') {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.category === category);
        renderProducts(filtered);
    }
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCartUI();
    
    const cartBtn = document.getElementById("openCart");
    cartBtn.style.transform = "scale(1.08)";
    setTimeout(() => cartBtn.style.transform = "scale(1)", 200);
}

function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== productId);
    }
    updateCartUI();
}

function updateCartUI() {
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    document.getElementById("cartCount").innerText = count;
    document.getElementById("cartTotal").innerText = `R$ ${total.toFixed(2)}`;
    
    const itemsContainer = document.getElementById("cartItems");
    const summarySection = document.getElementById("cartSummarySection");

    if (cart.length === 0) {
        itemsContainer.innerHTML = `<p class="empty-cart-msg">Seu carrinho está vazio.</p>`;
        summarySection.style.display = "none";
        return;
    }

    summarySection.style.display = "block";
    itemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
        </div>
    `).join("");
}

function setupEvents() {
    const cartModal = document.getElementById("cartModal");
    const successModal = document.getElementById("successModal");

    document.getElementById("openCart").onclick = () => cartModal.style.display = "flex";
    document.getElementById("closeCart").onclick = () => cartModal.style.display = "none";
    document.getElementById("closeSuccess").onclick = () => {
        successModal.style.display = "none";
        cartModal.style.display = "none";
    };

    window.onclick = (e) => {
        if (e.target === cartModal) cartModal.style.display = "none";
        if (e.target === successModal) successModal.style.display = "none";
    };

    document.getElementById("checkoutForm").onsubmit = async (e) => {
        e.preventDefault();
        if (cart.length === 0) return alert("Seu carrinho está vazio!");

        const orderData = {
            customer_name: document.getElementById("custName").value,
            customer_phone: document.getElementById("custPhone").value,
            address: document.getElementById("custAddress").value,
            payment_method: document.getElementById("custPayment").value,
            total_price: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
            items: cart.map(i => ({ product_name: i.name, quantity: i.quantity, price: i.price }))
        };

        try {
            const res = await fetch(`${API_URL}/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData)
            });
            
            if (res.ok) {
                const orderResponse = await res.json();
                
                document.getElementById("orderDetailsBox").innerHTML = `
                    <strong>Pedido #${orderResponse.id}</strong><br>
                    <strong>Cliente:</strong> ${orderResponse.customer_name}<br>
                    <strong>Endereço:</strong> ${orderResponse.address}<br>
                    <strong>Pagamento:</strong> ${orderResponse.payment_method}<br>
                    <strong>Total:</strong> R$ ${orderResponse.total_price.toFixed(2)}<br>
                    <strong>Status:</strong> ${orderResponse.status}
                `;

                cart = [];
                updateCartUI();
                document.getElementById("checkoutForm").reset();

                cartModal.style.display = "none";
                successModal.style.display = "flex";
            } else {
                alert("Erro ao processar o pedido. Verifique os dados.");
            }
        } catch (err) {
            console.error("Erro na requisição:", err);
            alert("Não foi possível conectar ao servidor backend.");
        }
    };
}
