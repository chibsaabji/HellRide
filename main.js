import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createIcons, Heart, Calculator, Zap, Gauge, Sparkles, X, Globe, LogOut, Menu } from 'lucide';

let userWishlist = [];
const userToken = localStorage.getItem('ag_user_token');

// Update Navbar if logged in as User
if (userToken) {
  const navBtn = document.getElementById('nav-login-btn');
  if (navBtn) {
    navBtn.innerHTML = '<i data-lucide="log-out" style="width: 16px; height: 16px;"></i> Logout';
    navBtn.onclick = (e) => {
      e.preventDefault();
      localStorage.removeItem('ag_user_token');
      window.location.reload();
    };
  }
}

// Mobile Menu Toggle
const mobileBtn = document.getElementById('mobile-menu-btn');
const navContainer = document.querySelector('.nav-container');
const navLinks = document.querySelectorAll('.nav-links a');

if (mobileBtn && navContainer) {
  mobileBtn.addEventListener('click', () => {
    navContainer.classList.toggle('mobile-menu-active');
  });

  // Close menu when a link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navContainer.classList.remove('mobile-menu-active');
    });
  });
}

gsap.registerPlugin(ScrollTrigger);

// Initialize Lucide Icons
createIcons({
  icons: {
    Heart,
    Calculator,
    Zap,
    Gauge,
    Sparkles,
    X,
    Globe,
    LogOut,
    Menu
  }
});

const lenis = new Lenis({
  lerp: 0.05,
  wheelMultiplier: 1,
  smoothWheel: true,
  smoothTouch: false,
});



// Integrate GSAP with Lenis
lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

// Navbar Scroll Effect
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Canvas Image Sequence
const canvas = document.getElementById('hero-canvas');
if (canvas) {
  const context = canvas.getContext('2d');

  const frameCount = 240;
  const currentFrame = index => (
    `./Hero Webp/Hero (${index + 1}).webp`
  );

  const images = [];
  const carSequence = {
    frame: 0
  };

  // Set canvas dimensions
  canvas.width = 1920;
  canvas.height = 1080;

  // Preload Images
  for (let i = 0; i < frameCount; i++) {
    const img = new Image();
    img.src = currentFrame(i);
    images.push(img);
  }

  // Draw first frame when loaded
  images[0].onload = () => {
    context.drawImage(images[0], 0, 0, canvas.width, canvas.height);
  };

  // Segmented Canvas Scroll Animation & Beats Logic
  const beats = gsap.utils.toArray('.beat');
  const segments = Math.max(1, beats.length - 1);
  const framesPerBeat = Math.floor((frameCount - 1) / segments);

  const drawFrame = () => {
    if (images[carSequence.frame] && images[carSequence.frame].complete) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(images[carSequence.frame], 0, 0, canvas.width, canvas.height);
    }
  };

  beats.forEach((beat, i) => {
    const content = beat.querySelector('.content');

    // Pin the beat so the text "takes a hold"
    ScrollTrigger.create({
      trigger: beat,
      start: 'top top',
      end: '+=100%',
      pin: true,
      pinSpacing: true,
    });

    // Text fade in
    gsap.fromTo(content, 
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        scrollTrigger: {
          trigger: beat,
          start: 'top 70%',
          end: 'top 30%',
          scrub: true,
        }
      }
    );
    
    // Text fade out
    gsap.to(content, {
      opacity: 0,
      y: -50,
      scrollTrigger: {
        trigger: beat,
        start: 'bottom 30%',
        end: 'bottom 0%',
        scrub: true,
      }
    });

  });

  // Master Timeline for smooth backwards/forwards scrolling without breaks
  const masterTl = gsap.timeline({
    scrollTrigger: {
      trigger: '.scrolly-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
    }
  });

  const numBeats = beats.length;
  const framesPerSegment = Math.floor((frameCount - 1) / numBeats);

  beats.forEach((beat, i) => {
    const timeStart = i * 2; // Each beat takes 2 phases: scroll up (1s) + pinned hold (1s)
    
    // Phase 1: Scroll Up into view (Car rotates)
    if (i === 0) {
      masterTl.to('#static-hero-img', { opacity: 0, scale: 1.15, duration: 1 }, timeStart)
              .to('#hero-canvas', { opacity: 1, duration: 1 }, timeStart)
              .to(carSequence, { frame: framesPerSegment, snap: 'frame', ease: 'power1.inOut', onUpdate: drawFrame, duration: 1 }, timeStart);
    } else {
      const nextFrame = (i === numBeats - 1) ? frameCount - 1 : (i + 1) * framesPerSegment;
      masterTl.to(carSequence, { frame: nextFrame, snap: 'frame', ease: 'power1.inOut', onUpdate: drawFrame, duration: 1 }, timeStart);
    }

    // Phase 2: Pinned (Car holds)
    const holdFrame = (i === numBeats - 1) ? frameCount - 1 : (i + 1) * framesPerSegment;
    masterTl.to(carSequence, { frame: holdFrame, duration: 1 }, timeStart + 1);

    // Phase 3: Unpin of the last element (Crossfade back to static)
    if (i === numBeats - 1) {
      masterTl.to('#static-hero-img', { opacity: 1, scale: 1, duration: 1 }, timeStart + 2)
              .to('#hero-canvas', { opacity: 0, duration: 1 }, timeStart + 2);
    }
  });
}

// Floating Calculator Logic
const calcSlider = document.querySelector('.floating-calculator .slider');
const calcResult = document.querySelector('.floating-calculator .calc-result');
const floatingCalculator = document.querySelector('.floating-calculator');
const closeCalcBtn = document.querySelector('.close-calc');
const basePrice = 45000000; // Antigravity Apex base price
const interestRate = 0.05; // 5% yearly

if (closeCalcBtn && floatingCalculator) {
  closeCalcBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    floatingCalculator.style.transform = 'translateY(150%)';
    floatingCalculator.style.opacity = '0';
    setTimeout(() => {
      floatingCalculator.style.display = 'none';
    }, 400);
  });
}

if (calcSlider && calcResult) {
  calcSlider.addEventListener('input', (e) => {
    const months = parseInt(e.target.value);
    // Simple loan calculation
    const totalWithInterest = basePrice * (1 + interestRate * (months / 12));
    const monthlyPayment = Math.round(totalWithInterest / months);
    
    // Format to string with commas
    calcResult.innerHTML = `<small>Est.</small> ${monthlyPayment.toLocaleString('ru-RU')} ₽ / mo`;
  });
  
  // Initialize
  calcSlider.dispatchEvent(new Event('input'));
}

// Wishlist Toggle
const initWishlistButtons = () => {
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    // avoid double bindings if called again
    btn.removeEventListener('click', wishlistToggleFn);
    btn.addEventListener('click', wishlistToggleFn);
  });
};

const wishlistToggleFn = async function() {
  if (!userToken) {
    alert('Please login with Google to save cars to your wishlist!');
    window.location.href = '/login.html';
    return;
  }

  const carId = this.dataset.id;
  const icon = this.querySelector('svg');
  
  // Optimistic UI update
  this.classList.toggle('active');
  if (this.classList.contains('active')) {
    icon.style.fill = 'var(--accent-olive)';
  } else {
    icon.style.fill = 'none';
  }

  try {
    const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/wishlist/${carId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    
    if (!res.ok) {
      // Revert on failure
      this.classList.toggle('active');
      icon.style.fill = this.classList.contains('active') ? 'var(--accent-olive)' : 'none';
      if (res.status === 401 || res.status === 403) {
        alert('Session expired. Please log in again.');
        localStorage.removeItem('ag_user_token');
        window.location.reload();
      } else {
        alert('Failed to update wishlist. Please try again later.');
      }
    }
  } catch (err) {
    console.error('Wishlist toggle error:', err);
  }
};

initWishlistButtons();

// Dynamic Inventory Fetch & Render
const inventoryGrid = document.getElementById('inventory-grid');

if (inventoryGrid) {
  const fetchInventory = async () => {
    try {
      if (userToken) {
        const wlRes = await fetch( (import.meta.env.VITE_API_URL || '') + '/api/wishlist', {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (wlRes.ok) userWishlist = await wlRes.json();
      }

      const response = await fetch( (import.meta.env.VITE_API_URL || '') + '/api/inventory');
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const cars = await response.json();
      renderInventory(cars);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      inventoryGrid.innerHTML = '<p style="color:var(--text-muted);">Failed to load inventory.</p>';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  const renderInventory = (cars) => {
    inventoryGrid.innerHTML = '';
    
    if (cars.length === 0) {
      inventoryGrid.innerHTML = '<p style="color:var(--text-muted);">No vehicles in stock.</p>';
      return;
    }

    cars.forEach(car => {
      const card = document.createElement('div');
      card.className = 'car-card';
      card.dataset.hp = car.hp || 0;
      card.dataset.price = car.price || 0;
      card.dataset.brand = car.brand || 'Antigravity';
      
      const images = car.images ? car.images : (car.image ? [car.image] : []);
      const mainImg = images.length > 0 ? images[0] : '';
      let imgUrl = mainImg;
      if (imgUrl.startsWith('./') || imgUrl.startsWith('/')) {
        imgUrl = (import.meta.env.VITE_API_URL || '') + imgUrl.replace(/^\.\//, '/');
      }
      
      const isVideo = (url) => url && url.toLowerCase().match(/\.(mp4|webm|ogg)$/i);
      const mediaHtml = isVideo(imgUrl)
        ? `<video src="${imgUrl}" autoplay loop muted playsinline></video>`
        : `<img src="${imgUrl}" alt="${car.name}">`;

      const desc = car.description ? (car.description.substring(0, 75) + '...') : '';
      const kmText = car.km ? `${car.km.toLocaleString('ru-RU')} KM` : '';

      const isWishlisted = userWishlist.includes(String(car.id));

      card.innerHTML = `
        <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" data-id="${car.id}">
          <i data-lucide="heart" style="${isWishlisted ? 'fill: var(--accent-olive);' : ''}"></i>
        </button>
        <div class="car-img-wrapper" style="position: relative; cursor: pointer;" onclick="window.location.href='/car-details.html?id=${car.id}'">
          ${mediaHtml}
          ${images.length > 1 ? `<span style="position:absolute; bottom:10px; right:10px; background:rgba(0,0,0,0.6); padding:0.25rem 0.5rem; border-radius:12px; font-size:0.75rem;">+${images.length - 1} media</span>` : ''}
        </div>
        <div class="car-info">
          <h4 style="margin-bottom: 0.25rem; font-size: 1.25rem;">${car.name}</h4>
          <p style="font-size: 0.875rem; color: var(--accent-olive); margin-bottom: 1rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">
            ${car.brand || 'Antigravity'} &bull; ${car.hp ? car.hp + ' HP' : 'Standard'}
          </p>
          
          ${desc ? `<p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1.25rem; line-height: 1.5; flex-grow: 1;">${desc}</p>` : '<div style="flex-grow: 1;"></div>'}
          
          <div style="display: flex; gap: 1rem; margin-bottom: 0.75rem; font-size: 0.875rem; color: var(--text-muted);">
            ${kmText ? `<span><i data-lucide="gauge" style="width:16px; height:16px; vertical-align:middle; margin-right:4px;"></i> ${kmText}</span>` : '<span><i data-lucide="sparkles" style="width:16px; height:16px; vertical-align:middle; margin-right:4px;"></i> New Vehicle</span>'}
          </div>
          
          <p class="card-price" style="margin-bottom: 1.5rem; font-size: 1.35rem; font-weight: 700; color: #fff;">
            ${formatPrice(car.price)}
          </p>
          
          <button class="btn primary full" style="margin-top: auto; padding: 1rem;" onclick="window.location.href='/car-details.html?id=${car.id}'">Get Quote / Details</button>
        </div>
      `;
      inventoryGrid.appendChild(card);
    });
    
    // Re-initialize icons for dynamically added elements
    createIcons({
      icons: {
        Heart,
        Zap,
        Gauge,
        Calculator,
        Sparkles,
        X,
        Globe,
        LogOut,
        Menu
      }
    });
    initWishlistButtons();
  };

  // Advanced Filtering Logic
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    const priceSlider = sidebar.querySelector('.slider'); // First slider is price
    const brandPills = sidebar.querySelectorAll('.brand-pill');
    let activeBrand = 'All';

    const filterCars = () => {
      const maxPrice = priceSlider ? parseInt(priceSlider.value) : 100000000;
      
      const cards = document.querySelectorAll('.car-card');
      cards.forEach(card => {
        const price = parseInt(card.dataset.price);
        const brand = card.dataset.brand;
        
        const priceMatch = price <= maxPrice;
        const brandMatch = activeBrand === 'All' || brand === activeBrand;
        
        if (priceMatch && brandMatch) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    };

    if (priceSlider) {
      priceSlider.addEventListener('input', filterCars);
    }

    brandPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        brandPills.forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        activeBrand = e.currentTarget.dataset.brand;
        filterCars();
      });
    });
  }

  // Initial fetch
  fetchInventory();
}

