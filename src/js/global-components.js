/**
 * CostFlowAI Global Components
 * Standardized header and footer for all pages
 */

class GlobalComponents {
    constructor() {
        this.currentPage = window.location.pathname;
        this.init();
    }

    init() {
        this.injectHeader();
        this.injectFooter();
        this.setupMobileMenu();
    }

    /**
     * Inject standardized header
     */
    injectHeader() {
        const headerElement = document.querySelector('header');
        if (!headerElement) return;

        const isActive = (path) => {
            if (path === '/' && this.currentPage === '/') return 'active';
            if (path !== '/' && this.currentPage.startsWith(path)) return 'active';
            return '';
        };

        headerElement.innerHTML = `
            <nav class="container">
                <a href="/" class="logo">CostFlowAI</a>
                <button class="mobile-menu-btn" aria-label="Toggle menu">☰</button>
                <ul class="nav-links">
                    <li><a href="/" class="${isActive('/')}">Home</a></li>
                    <li><a href="/calculators" class="${isActive('/calculators')}">Calculators</a></li>
                    <li><a href="/blog" class="${isActive('/blog')}">Blog</a></li>
                    <li><a href="#contact" onclick="scrollToContact(event)">Contact</a></li>
                    <li><a href="#contact" onclick="scrollToContact(event)">💬 Feedback</a></li>
                </ul>
            </nav>
        `;
    }

    /**
     * Inject standardized footer
     */
    injectFooter() {
        const footerElement = document.querySelector('footer');
        if (!footerElement) return;

        footerElement.innerHTML = `
            <div class="container">
                <div class="footer-content" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-bottom: 2rem;">
                    <div class="footer-section">
                        <h3 style="color: #667eea; margin-bottom: 1rem;">CostFlowAI</h3>
                        <p style="color: #6b7280; margin-bottom: 1rem;">AI-powered construction cost estimation with 95% accuracy. Get instant, reliable estimates for all your construction projects.</p>
                        <div style="display: flex; gap: 1rem;">
                            <a href="https://twitter.com/costflowai" target="_blank" rel="noopener" style="color: #667eea; text-decoration: none;">Twitter</a>
                            <a href="https://linkedin.com/company/costflowai" target="_blank" rel="noopener" style="color: #667eea; text-decoration: none;">LinkedIn</a>
                        </div>
                    </div>
                    
                    <div class="footer-section">
                        <h4 style="color: #374151; margin-bottom: 1rem;">Calculators</h4>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            <li style="margin-bottom: 0.5rem;"><a href="/calculators/residential-rom" style="color: #6b7280; text-decoration: none;">Residential ROM</a></li>
                            <li style="margin-bottom: 0.5rem;"><a href="/calculators/commercial-ti" style="color: #6b7280; text-decoration: none;">Commercial TI</a></li>
                            <li style="margin-bottom: 0.5rem;"><a href="/calculators/concrete" style="color: #6b7280; text-decoration: none;">Concrete Calculator</a></li>
                            <li style="margin-bottom: 0.5rem;"><a href="/calculators/roi-maximizer" style="color: #6b7280; text-decoration: none;">ROI Maximizer</a></li>
                            <li style="margin-bottom: 0.5rem;"><a href="/calculators" style="color: #667eea; text-decoration: none;">View All →</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-section">
                        <h4 style="color: #374151; margin-bottom: 1rem;">Resources</h4>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            <li style="margin-bottom: 0.5rem;"><a href="/blog" style="color: #6b7280; text-decoration: none;">Construction Blog</a></li>
                            <li style="margin-bottom: 0.5rem;"><a href="/about" style="color: #6b7280; text-decoration: none;">About CostFlowAI</a></li>
                            <li style="margin-bottom: 0.5rem;"><a href="/privacy" style="color: #6b7280; text-decoration: none;">Privacy Policy</a></li>
                            <li style="margin-bottom: 0.5rem;"><a href="/terms" style="color: #6b7280; text-decoration: none;">Terms of Service</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-section">
                        <h4 style="color: #374151; margin-bottom: 1rem;">Support</h4>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            <li style="margin-bottom: 0.5rem;"><a href="mailto:support@costflowai.com" style="color: #667eea; text-decoration: none;">📧 Contact Support</a></li>
                            <li style="margin-bottom: 0.5rem;"><a href="mailto:feedback@costflowai.com" style="color: #6b7280; text-decoration: none;">💬 Send Feedback</a></li>
                            <li style="margin-bottom: 0.5rem;"><a href="/" style="color: #6b7280; text-decoration: none;">Help & FAQ</a></li>
                            <li style="margin-bottom: 0.5rem;"><span style="color: #9ca3af; font-size: 0.875rem;">Free forever, no signup required</span></li>
                        </ul>
                    </div>
                </div>
                
                <div style="border-top: 1px solid #e5e7eb; padding-top: 2rem; text-align: center;">
                    <p style="color: #6b7280; margin: 0;">
                        © ${new Date().getFullYear()} CostFlowAI. All rights reserved. 
                        <span style="margin-left: 1rem;">Built with ❤️ for construction professionals</span>
                    </p>
                    <p style="color: #9ca3af; margin: 0.5rem 0 0; font-size: 0.875rem;">
                        Estimates for planning purposes only. Actual costs may vary based on local conditions, materials, and labor rates.
                    </p>
                </div>
            </div>
        `;
    }

    /**
     * Setup mobile menu functionality
     */
    setupMobileMenu() {
        const mobileBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');
        const header = document.querySelector('header');
        
        if (mobileBtn && navLinks) {
            mobileBtn.addEventListener('click', function() {
                navLinks.classList.toggle('active');
                mobileBtn.classList.toggle('active');
                mobileBtn.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', function(e) {
                if (!header.contains(e.target)) {
                    navLinks.classList.remove('active');
                    mobileBtn.classList.remove('active');
                    mobileBtn.textContent = '☰';
                }
            });
            
            // Close menu when clicking a link
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    mobileBtn.classList.remove('active');
                    mobileBtn.textContent = '☰';
                });
            });
        }
    }
}

/**
 * Scroll to contact section or footer
 */
function scrollToContact(event) {
    event.preventDefault();
    const contactSection = document.getElementById('contact') || document.querySelector('footer');
    if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Initialize when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    new GlobalComponents();
});

// Export for use in other scripts
window.GlobalComponents = GlobalComponents;