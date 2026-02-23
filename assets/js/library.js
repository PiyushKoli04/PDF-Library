/**
 * PDF Library — library.js
 * Dynamic PDF grid rendering for library.html and premium.html
 */

'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const gridEl       = document.getElementById('pdf-grid');
  const searchInput  = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const resultsInfo  = document.getElementById('results-info');
  const isPremiumPage = document.body.dataset.page === 'premium';

  if (!gridEl) return;

  /* ── Load data ── */
  let allPdfs = [];

  try {
    const data = await window.PDFLib.fetchJSON('assets/data/pdfs.json');

    if (isPremiumPage) {
      allPdfs = data.premium_pdfs || [];
    } else {
      allPdfs = data.public_pdfs || [];
    }
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
    const cats = [...new Set(allPdfs.map(p => p.category))].sort();
    cats.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    });
  }

  /* ── Render filtered grid ── */
  function renderGrid(list) {
    if (list.length === 0) {
      gridEl.innerHTML = `
        <div class="no-results" style="grid-column:1/-1">
          <div class="no-results__icon">🔍</div>
          <p>No documents found matching your search.</p>
        </div>`;
    } else {
      gridEl.innerHTML = list
        .map(pdf => window.PDFLib.buildPdfCard(pdf, isPremiumPage))
        .join('');
    }

    if (resultsInfo) {
      resultsInfo.textContent = `Showing ${list.length} of ${allPdfs.length} documents`;
    }
  }

  /* ── Filter logic ── */
  function applyFilters() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const cat   = categoryFilter ? categoryFilter.value : '';

    const filtered = allPdfs.filter(pdf => {
      const matchQuery = !query
        || pdf.title.toLowerCase().includes(query)
        || pdf.description.toLowerCase().includes(query)
        || pdf.category.toLowerCase().includes(query);

      const matchCat = !cat || pdf.category === cat;

      return matchQuery && matchCat;
    });

    renderGrid(filtered);
  }

  /* ── Events ── */
  if (searchInput) {
    searchInput.addEventListener('input', debounce(applyFilters, 250));
  }
  if (categoryFilter) {
    categoryFilter.addEventListener('change', applyFilters);
  }

  /* ── Initial render ── */
  renderGrid(allPdfs);
});

/* ── Utility: debounce ── */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
