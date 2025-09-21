# StayFinder - Short-Term Rental Platform

## Feature Checklist: Short-Term Rental PWA (Airbnb-style)

### Success Criteria & Current Status

* [x] **PWA installable on mobile devices with offline capability**

  * Uses `vite-plugin-pwa` and `workbox-window` for manifest, offline support, and installability (see `vite.config.ts`).
* [x] **Role-based authentication with smooth transitions between guest and host**

  * Role-based auth (`guest`, `host`) with protected routes and context (`AuthContext`, `authService`, `AppRoutes.tsx`).
* \[\~] **Real-time social feed with stay discovery**

  * Feed includes property highlights, reviews, and experiences for discovery (`propertyService`, `Home`, `Discover`, `Property`, `Profile`), but real-time (websocket) updates are not yet implemented.
* [x] **Interactive map showing nearby rentals and availability**

  * `PropertyMap` uses `react-leaflet` and geolocation to show available properties and the user's location.
* \[\~] **Complete booking flow from request to confirmation and stay tracking**

  * Booking requests, confirmations, and stay tracking logic/services/routes exist, but some UI/API hooks are marked as TODO.
* [x] **Host dashboard with listing management and analytics**

  * Host dashboard includes property listings, booking management, analytics, and profile pages.
* [x] **Responsive design optimized for mobile-first usage**

  * Uses Tailwind CSS, mobile-first breakpoints, and responsive layouts throughout.
* \[\~] **Integration-ready for Laravel Breeze backend**

  * API layer (`api.ts`, `authService.ts`, `propertyService.ts`) is set up for `/api` endpoints, CSRF, and Laravel Sanctum, but Inertia.js integration is not yet implemented.

Legend: \[x] = Complete, \[\~] = Partial, \[ ] = Not started

---

## How to Integrate with Laravel 12 + Inertia.js Backend

This project is designed as a React PWA frontend for short-term rentals (Airbnb-style), ready to connect to a Laravel backend using Inertia.js for a seamless full-stack SPA experience.

### 1. **Set Up Laravel 12 Backend**

* Install Laravel 12:
  [Official Docs: Installation](https://laravel.com/docs/12.x/installation)
* Install Laravel Breeze with Inertia.js + React stack:
  [Breeze Docs: Inertia + React](https://laravel.com/docs/12.x/starter-kits#breeze-and-inertia)

  ```sh
  composer require laravel/breeze --dev
  php artisan breeze:install react
  npm install && npm run dev
  php artisan migrate
  ```
* Configure `.env` for database, mail, payments, and other services as needed.

### 2. **Configure Inertia.js**

* Inertia.js allows Laravel to serve React pages as SPA views with server-side routing and props.
* [Inertia.js Docs: Laravel Adapter](https://inertiajs.com/server-side-setup)
* Ensure Laravel routes use `Inertia::render()` for guest and host pages.

### 3. **API & Auth Integration**

* This PWA expects `/api` endpoints for authentication, rentals, bookings, reviews, and payments.
* Use Laravel’s `routes/api.php` for backend logic.
* Sanctum is already referenced in the frontend for CSRF/auth.
  [Sanctum Docs](https://laravel.com/docs/12.x/sanctum)
* Configure CORS to allow your frontend origin.
  [CORS Docs](https://laravel.com/docs/12.x/sanctum#cors-and-spas)

### 4. **Connect React Frontend to Laravel Backend**

* In production, serve the React build (`npm run build`) as static assets from Laravel’s `public/` directory, or deploy separately and set API URLs accordingly.
* In development, use the Vite dev server and set up a proxy in `vite.config.ts`:

  ```js
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    }
  }
  ```
* Update `API_BASE_URL` in the frontend if your API is not at `/api`.

### 6. **Best Practices & References**

* Always consult the [Laravel 12.x Documentation](https://laravel.com/docs/12.x/) for backend guidance.
* For upgrades, see the [Upgrade Guide](https://laravel.com/docs/12.x/upgrade).
* Use `^12.0` in `composer.json`.
* Backup your database/code before migrations or upgrades.
* Run tests after integration.

---

## Notes

* This project is frontend-only and expects a Laravel backend for full functionality.
* The core idea is **short-term rentals**, where **guests discover and book stays**, and **hosts manage their properties and bookings**.
* For backend changes, always follow Laravel official documentation and upgrade guides.


