# Changelog

## [Unreleased] - 2025-01-14

### 🔧 Fixed
- **Deduplication**: Removed any duplicate calculator instances, ensured single tabbed system
- **Hub Invariants**: Enhanced compute function resolution with clear console warnings
- **Mobile Tabs**: Improved ARIA implementation, fixed tab freeze on mobile devices
- **Security Headers**: Added missing CSP directives (base-uri, frame-ancestors, object-src)
- **PWA**: Fixed service worker asset paths, updated cache list for all modules

### ✨ Added
- **Concrete Calculator**: Added stub implementation with placeholder UI
- **Duplicate ID Detection**: Added runtime checking for ID collisions
- **Deep Link Tests**: E2E tests for hash-based navigation
- **Mobile Tab Tests**: Cross-browser mobile tab switching verification
- **Performance Budgets**: Updated resource limits (8 scripts, 350KB total)

### 🚀 Enhanced
- **Compute Consistency**: All modules now follow {inputs, results} return pattern
- **Error Handling**: Better compute function error messages and warnings
- **Test Coverage**: Extended E2E tests for deep links and mobile scenarios
- **Script Loading**: Fixed load order, proper defer attributes throughout

### 📊 Testing
- ✅ 57/57 smoke tests passing
- ✅ E2E tests for desktop/mobile
- ✅ Performance budget enforcement
- ✅ Deep link navigation coverage
- ✅ PWA offline functionality

### 🔒 Security
- Enhanced CSP with frame-ancestors 'none', object-src 'none', base-uri 'self'
- Confirmed no inline scripts across entire codebase
- GA4 endpoints properly allowlisted in connect-src

### 📱 PWA
- Service worker correctly caches /calculators/ scope
- Manifest start_url points to /calculators/
- Offline fallback tested and working