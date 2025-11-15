class Navigation {
  constructor() {
    this.currentPage = 'dashboard';
    this.pages = {};
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Navigation click handlers
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        this.navigateTo(page);
      });
    });
  }

  registerPage(name, renderer) {
    this.pages[name] = renderer;
  }

  navigateTo(pageName) {
    if (!this.pages[pageName]) {
      console.error(`Page "${pageName}" not found`);
      return;
    }

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === pageName) {
        item.classList.add('active');
      }
    });

    // Render page
    this.currentPage = pageName;
    const container = document.getElementById('content-container');
    container.innerHTML = '';

    try {
      this.pages[pageName]();
    } catch (error) {
      console.error(`Error rendering page "${pageName}":`, error);
      container.innerHTML = `
        <div class="alert alert-error">
          <strong>Error loading page:</strong> ${error.message}
        </div>
      `;
    }
  }

  refresh() {
    this.navigateTo(this.currentPage);
  }
}

// Initialize navigation
document.addEventListener('DOMContentLoaded', () => {
  window.navigation = new Navigation();
});
