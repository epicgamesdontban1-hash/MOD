// ============================================
// MOD - Midgets Out for Delivery
// Frontend JavaScript
// ============================================

// ============ PAGE NAVIGATION ============
function showPage(pageName) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const page = document.getElementById('page-' + pageName);
  if (page) {
    page.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(pageName)) {
      link.classList.add('active');
    }
  });

  // Check URL params on tracking page
  if (pageName === 'tracking') {
    const urlParams = new URLSearchParams(window.location.search);
    const trackId = urlParams.get('id');
    if (trackId) {
      document.getElementById('trackInput').value = trackId;
      trackPackage();
    }
  }
}

// ============ MOBILE MENU ============
function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('open');
}

// ============ TOAST NOTIFICATIONS ============
let toastTimer;
function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

// ============ LOADING ============
function showLoading() { document.getElementById('loadingOverlay').classList.add('show'); }
function hideLoading() { document.getElementById('loadingOverlay').classList.remove('show'); }

// ============ COUNTER ANIMATION ============
function animateCounters() {
  document.querySelectorAll('.stat-number').forEach(el => {
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current).toLocaleString();
    }, 16);
  });
}

// ============ TRACKING ============
function quickTrack() {
  const id = document.getElementById('heroTrackInput').value.trim();
  if (!id) { showToast('🐾 Enter a tracking number first!'); return; }
  showPage('tracking');
  document.getElementById('trackInput').value = id;
  trackPackage();
}

async function trackPackage() {
  const id = document.getElementById('trackInput').value.trim().toUpperCase();
  const resultDiv = document.getElementById('trackResult');

  if (!id) {
    showToast('🐾 Please enter a tracking number!');
    return;
  }

  showLoading();

  try {
    const response = await fetch(`/api/tracking/${id}`);
    const data = await response.json();
    hideLoading();

    if (data.success) {
      resultDiv.innerHTML = buildPackageCard(data.package);
    } else {
      resultDiv.innerHTML = `
        <div class="not-found">
          <span class="nf-icon">🔍</span>
          <h2>Package Not Found</h2>
          <p style="color:var(--gray);">${data.message}</p>
          <p style="margin-top:15px;font-size:13px;color:var(--gray);">
            Try sample IDs: <span class="sample-id" onclick="document.getElementById('trackInput').value='MOD-2024-001';trackPackage()">MOD-2024-001</span>
          </p>
        </div>
      `;
    }
  } catch (err) {
    hideLoading();
    resultDiv.innerHTML = `
      <div class="not-found">
        <span class="nf-icon">⚠️</span>
        <h2>Connection Error</h2>
        <p style="color:var(--gray);">Could not connect to MOD servers. Beertjie is investigating! 🐾</p>
      </div>
    `;
  }
}

function buildPackageCard(pkg) {
  const statusColor = {
    'Delivered': '#10B981',
    'In Transit': '#F59E0B',
    'Processing': '#6B7280',
    'Out for Delivery': '#FF6B35'
  }[pkg.status] || '#FF6B35';

  const timelineHTML = pkg.timeline.map((t, i) => `
    <div class="timeline-item">
      <span class="timeline-icon">${t.icon}</span>
      <div class="timeline-status">${t.status}</div>
      <div class="timeline-location">📍 ${t.location}</div>
      <div class="timeline-date">🕐 ${t.date}</div>
    </div>
  `).reverse().join('');

  const pawRating = pkg.pawRating ? '🐾'.repeat(pkg.pawRating) : 'Pending delivery';

  return `
    <div class="package-card">
      <div class="package-header">
        <div>
          <div style="font-size:12px;opacity:0.8;margin-bottom:5px;">TRACKING NUMBER</div>
          <div class="package-id">${pkg.id}</div>
        </div>
        <div class="package-status" style="background:${statusColor};">
          ${pkg.status === 'Delivered' ? '✅' : pkg.status === 'In Transit' ? '🚚' : '⏳'} ${pkg.status}
        </div>
      </div>
      <div class="package-details">
        <div class="detail-item">
          <label>From</label>
          <span>${pkg.sender}</span>
        </div>
        <div class="detail-item">
          <label>To</label>
          <span>${pkg.recipient}</span>
        </div>
        <div class="detail-item">
          <label>Destination</label>
          <span>📍 ${pkg.destination}</span>
        </div>
        <div class="detail-item">
          <label>Weight</label>
          <span>⚖️ ${pkg.weight}</span>
        </div>
        <div class="detail-item">
          <label>Est. Delivery</label>
          <span>📅 ${pkg.estimatedDelivery}</span>
        </div>
        <div class="detail-item">
          <label>Delivered By</label>
          <span>🐾 ${pkg.deliveredBy}</span>
        </div>
        <div class="detail-item">
          <label>Description</label>
          <span>${pkg.description}</span>
        </div>
        <div class="detail-item">
          <label>Paw Rating</label>
          <span>${pawRating}</span>
        </div>
      </div>
      <div class="timeline-section">
        <h3>📍 Delivery Timeline</h3>
        <div class="timeline">
          ${timelineHTML}
        </div>
      </div>
      <div class="beertjie-note">
        <span class="note-dog">🐕</span>
        <p>"<em>${getBeertjieMessage(pkg.status)}</em>" — Beertjie</p>
      </div>
    </div>
  `;
}

function getBeertjieMessage(status) {
  const messages = {
    'Delivered': 'Package delivered with maximum fluffiness and zero chewed corners! Woof! 🐾',
    'In Transit': 'My tiny legs are carrying your package as fast as I can run! Almost there! 🐾',
    'Processing': 'I sniff-inspected your package and it passed! Getting ready to run! 🐾',
    'Out for Delivery': 'I AM ON MY WAY! Hide behind the door — I love delivery surprises! 🐾'
  };
  return messages[status] || 'Working on your delivery with all my fluffiness! 🐾';
}

// ============ ORDER FORM ============
// Price calculator
document.addEventListener('DOMContentLoaded', () => {
  const weightInput = document.querySelector('input[name="packageWeight"]');
  const serviceSelect = document.querySelector('select[name="serviceType"]');

  if (weightInput && serviceSelect) {
    const updatePrice = () => {
      const weight = parseFloat(weightInput.value);
      const service = serviceSelect.value;

      if (!weight || weight <= 0) {
        document.getElementById('priceDisplay').textContent = 'Enter weight to calculate';
        return;
      }

      const base = 50;
      const weightCost = weight * 15;
      const multiplier = service === 'Express Paw' ? 2 : service === 'Priority Sniff' ? 1.5 : 1;
      const total = (base + weightCost) * multiplier;

      document.getElementById('priceDisplay').textContent = `R${total.toFixed(2)}`;
    };

    weightInput.addEventListener('input', updatePrice);
    serviceSelect.addEventListener('change', updatePrice);
  }

  // Start counter animation on page load
  setTimeout(animateCounters, 500);
});

async function placeOrder(event) {
  event.preventDefault();
  showLoading();

  const formData = new FormData(event.target);
  const orderData = Object.fromEntries(formData.entries());

  try {
    const response = await fetch('/api/orders/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    const data = await response.json();
    hideLoading();

    if (data.success) {
      const orderDiv = document.getElementById('orderResult');
      orderDiv.innerHTML = `
        <div class="order-result-card">
          <span class="result-icon">🎉</span>
          <h2>Order Placed Successfully!</h2>
          <p>Beertjie is already excited to deliver your package!</p>
          <p style="color:var(--gray);font-size:14px;margin-top:5px;">A confirmation email has been sent to <strong>${orderData.customerEmail}</strong></p>
          <div class="tracking-id-display">${data.order.orderId}</div>
          <p style="color:var(--gray);font-size:13px;">Save this tracking number!</p>
          <div style="margin-top:25px;display:flex;gap:15px;justify-content:center;flex-wrap:wrap;">
            <button class="btn-primary" onclick="document.getElementById('trackInput').value='${data.order.orderId}';showPage('tracking');trackPackage()">
              🔍 Track Package
            </button>
            <button class="btn-secondary" style="color:var(--dark);border-color:var(--gray-light);" onclick="document.getElementById('orderForm').reset();document.getElementById('orderResult').innerHTML='';document.getElementById('priceDisplay').textContent='Enter weight to calculate'">
              📦 New Order
            </button>
          </div>
          <div style="margin-top:20px;padding:15px;background:var(--secondary);border-radius:var(--radius);">
            <p style="font-size:14px;color:var(--dark);">💰 Total: <strong style="color:var(--primary);font-size:1.2em;">${data.order.price}</strong></p>
            <p style="font-size:14px;color:var(--gray);">📅 Est. Delivery: <strong>${data.order.estimatedDelivery}</strong></p>
            <p style="font-size:14px;color:var(--gray);">🚀 Service: <strong>${data.order.serviceType}</strong></p>
          </div>
        </div>
      `;
      event.target.reset();
      document.getElementById('priceDisplay').textContent = 'Enter weight to calculate';
      orderDiv.scrollIntoView({ behavior: 'smooth' });
      showToast('🐾 Order placed! Beertjie is on the case!');
    } else {
      showToast('❌ ' + data.message);
    }
  } catch (err) {
    hideLoading();
    showToast('⚠️ Connection error. Please try again!');
  }
}

// ============ CONTACT FORM ============
async function sendContact(event) {
  event.preventDefault();
  showLoading();

  const formData = new FormData(event.target);
  const contactData = Object.fromEntries(formData.entries());

  try {
    const response = await fetch('/api/email/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData)
    });

    const data = await response.json();
    hideLoading();

    if (data.success) {
      document.getElementById('contactResult').innerHTML = `
        <div style="background:#D1FAE5;border:2px solid #10B981;border-radius:var(--radius);padding:20px;margin-top:20px;text-align:center;">
          <p style="font-size:2rem;">✅</p>
          <p style="font-weight:700;color:#065F46;">Message Sent!</p>
          <p style="color:#047857;font-size:14px;">Beertjie will get back to you faster than his tiny legs can carry him! 🐾</p>
        </div>
      `;
      event.target.reset();
      showToast('📬 Message sent! Beertjie will respond! 🐾');
    } else {
      showToast('❌ ' + data.message);
    }
  } catch (err) {
    hideLoading();
    showToast('⚠️ Connection error. Please try again!');
  }
}

// ============ NEWSLETTER SUBSCRIBE ============
async function subscribe() {
  const name = document.getElementById('subName').value.trim();
  const email = document.getElementById('subEmail').value.trim();

  if (!email) { showToast('🐾 Email address is required!'); return; }

  showLoading();

  try {
    const response = await fetch('/api/email/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });

    const data = await response.json();
    hideLoading();

    if (data.success) {
      document.getElementById('subName').value = '';
      document.getElementById('subEmail').value = '';
      showToast('🐾 Welcome to Beertjie\'s pack! Check your email!', 4000);
    } else {
      showToast('❌ ' + data.message);
    }
  } catch (err) {
    hideLoading();
    showToast('⚠️ Something went wrong. Try again!');
  }
}

// ============ DISCORD ============
function openDiscord() {
  showToast('🎮 Redirecting to MOD Discord... (Add your invite link in app.js!)');
  // Replace with your actual Discord invite: window.open('https://discord.gg/YOUR_INVITE', '_blank');
}

// ============ SMOOTH SCROLL ============
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
  } else {
    navbar.style.boxShadow = 'none';
  }
});

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const menu = document.getElementById('mobileMenu');
    if (menu.classList.contains('open')) toggleMenu();
  }
});

// ============ PAGE LOAD ============
window.addEventListener('load', () => {
  const path = window.location.hash.replace('#', '') || 'home';
  showPage(path);
});
