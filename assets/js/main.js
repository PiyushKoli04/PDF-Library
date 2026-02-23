/**
 * PDF Library — main.js
 * Shared utilities and global behaviors
 */

'use strict';

/* ── Navbar scroll behavior ── */
(function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mark active link */
  const links = navbar.querySelectorAll('.navbar__link');
  const current = location.pathname.split('/').pop() || 'index.html';
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === current || href.includes(current))) {
      link.classList.add('active');
    }
  });
})();

/* ── Mobile hamburger menu ── */
(function initMobileMenu() {
  const burger = document.querySelector('.navbar__burger');
  const mobileNav = document.querySelector('.navbar__mobile');
  if (!burger || !mobileNav) return;

  burger.addEventListener('click', () => {
    const isOpen = burger.classList.toggle('open');
    mobileNav.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  /* Close on link click */
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();

/* ── Scroll reveal ── */
(function initReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();

/* ── Utility: fetch JSON ── */
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
  return res.json();
}

/* ── Utility: get query param ── */
function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

/* ── Utility: category icon map ── */
const CATEGORY_ICONS = {
  'Computer Science': '💻',
  'Mathematics':      '📐',
  'Physics':          '⚛️',
  'Chemistry':        '🧪',
  'History':          '📜',
  'Language':         '📝',
  'Biology':          '🧬',
  'Economics':        '📊',
  'AI / ML':          '🤖',
  'default':          '📄',
};

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS['default'];
}

/* ── Utility: build PDF card HTML ── */
function buildPdfCard(pdf, isPremium = false) {
  const icon = getCategoryIcon(pdf.category);
  const badgesHtml = `
    ${isPremium ? '<span class="badge badge-premium">Premium</span>' : ''}
    ${pdf.featured ? '<span class="badge badge-featured">Featured</span>' : ''}
  `.trim();

  const viewerUrl = `viewer.html?id=${encodeURIComponent(pdf.id)}`;

  return `
    <article class="pdf-card">
      <div class="pdf-card__thumb">
        <div class="pdf-card__thumb-placeholder">
          <span class="pdf-card__thumb-icon">${icon}</span>
        </div>
        ${badgesHtml ? `<div class="pdf-card__badges">${badgesHtml}</div>` : ''}
      </div>
      <div class="pdf-card__body">
        <span class="badge badge-category">${escapeHtml(pdf.category)}</span>
        <h3 class="pdf-card__title mt-8">${escapeHtml(pdf.title)}</h3>
        <p class="pdf-card__desc">${escapeHtml(pdf.description)}</p>
        <div class="pdf-card__meta">
          <span>${pdf.pages || '—'} pages</span>
          <span>${pdf.size || ''}</span>
        </div>
        <a href="${viewerUrl}" class="btn btn-primary btn-sm pdf-card__open">
          Open <span>→</span>
        </a>
      </div>
    </article>
  `;
}

/* ── Utility: escape HTML ── */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Expose globals ── */
window.PDFLib = { fetchJSON, getParam, buildPdfCard, escapeHtml, getCategoryIcon };
