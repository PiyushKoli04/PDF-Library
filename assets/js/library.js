/**
 * PDF Library — library.js
 */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const gridEl         = document.getElementById('pdf-grid');
  const searchInput    = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const resultsInfo    = document.getElementById('results-info');
  const isPremiumPage  = document.body.dataset.page === 'premium';

  if (!gridEl) return;

  let allPdfs = [];

  /* ── Load JSON ── */
  try {
    const res  = await fetch('assets/data/pdfs.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allPdfs = isPremiumPage ? (data.premium_pdfs || []) : (data.public_pdfs || []);
  } catch (err) {
    gridEl.innerHTML = `
      <div class="no-results" style="grid-column:1/-1">
        <div class="no-results__icon">⚠️</div>
        <p>Unable to load library data. Please refresh the page.</p>
      </div>`;
    console.error('Library load error:', err);
    return;
  }

  /* ── Populate category filter ── */
  if (categoryFilter) {
    [...new Set(allPdfs.map(p => p.category))].sort().forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    });
  }

  /* ── Build card HTML ──
     Always uses our own markup so the thumbnail field from pdfs.json
     is always read correctly. We do NOT delegate to window.PDFLib.buildPdfCard
     because that function is unaware of the thumbnail field and causes
     images to be missing or wrong.                                    */
  function buildCard(pdf) {
    const href  = `viewer.html?id=${encodeURIComponent(pdf.id)}`;

    // Read thumbnail from every possible field name in pdfs.json
    const thumb = pdf.thumbnail || pdf.cover || pdf.image || pdf.thumb || '';

    const badge = isPremiumPage
      ? `<span class="pdf-card__badge pdf-card__badge--premium">★ Premium</span>`
      : (pdf.featured ? `<span class="pdf-card__badge">Featured</span>` : '');

    const coverContent = thumb
      ? `<img src="${thumb}"
              alt="${escapeHtml(pdf.title)}"
              loading="lazy"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
         <div class="pdf-card__cover-fallback" style="display:none">
           ${fileIcon()}
         </div>`
      : `<div class="pdf-card__cover-fallback">${fileIcon()}</div>`;

    return `
      <article class="pdf-card" role="listitem">
        <a href="${href}" class="pdf-card__cover-link" aria-label="Open ${escapeHtml(pdf.title)}">
          <div class="pdf-card__cover">
            ${coverContent}
            ${badge}
          </div>
        </a>
        <div class="pdf-card__body">
          <span class="pdf-card__category">${escapeHtml(pdf.category || '')}</span>
          <h3 class="pdf-card__title"><a href="${href}">${escapeHtml(pdf.title)}</a></h3>
          <p class="pdf-card__desc">${escapeHtml(pdf.description || '')}</p>
          <div class="pdf-card__meta">
            <span>${pdf.pages || '—'} pages</span>
            <span>${escapeHtml(pdf.size || '')}</span>
          </div>
          <a href="${href}" class="btn btn-primary btn-sm pdf-card__btn">Read Now →</a>
        </div>
      </article>`;
  }

  /* ── Render grid ── */
  function renderGrid(list) {
    if (list.length === 0) {
      gridEl.innerHTML = `
        <div class="no-results" style="grid-column:1/-1">
          <div class="no-results__icon">🔍</div>
          <p>No documents found matching your search.</p>
        </div>`;
    } else {
      gridEl.innerHTML = list.map(buildCard).join('');
    }
    if (resultsInfo) {
      resultsInfo.textContent = `Showing ${list.length} of ${allPdfs.length} documents`;
    }
  }

  /* ── Filters ── */
  function applyFilters() {
    const query = (searchInput    ? searchInput.value.trim().toLowerCase() : '');
    const cat   = (categoryFilter ? categoryFilter.value                   : '');
    const filtered = allPdfs.filter(pdf => {
      const matchQ = !query
        || (pdf.title       || '').toLowerCase().includes(query)
        || (pdf.description || '').toLowerCase().includes(query)
        || (pdf.category    || '').toLowerCase().includes(query);
      return matchQ && (!cat || pdf.category === cat);
    });
    renderGrid(filtered);
  }

  if (searchInput)    searchInput.addEventListener('input',  debounce(applyFilters, 250));
  if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);

  renderGrid(allPdfs);
});

/* ── Utilities ── */
function debounce(fn, delay) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); };
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fileIcon() {
  return `<svg width="40" height="40" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>`;
}