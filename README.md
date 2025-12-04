# CavaYo - Short-Term Rental Platform

## Feature Checklist: Short-Term Rental PWA (Airbnb-style)

### Success Criteria & Current Status

* [x] **PWA installable on mobile devices with offline capability**

  * Uses `vite-plugin-pwa` and `workbox-window` for manifest, offline support, and installability (see `vite.config.ts`).
* [x] **Role-based authentication with smooth transitions between guest and host**

  * Role-based auth (`guest`, `host`) with protected routes and context (`AuthContext`, `authService`, `AppRoutes.tsx`).
* \[\~] **Real-time social feed with stay discovery**

  * Feed includes property highlights, reviews, and experiences for discovery (`propertyService`, `Feed`, `Discover`, `Property`, `Profile`), but real-time (websocket) updates are not yet implemented.
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
* [x] **Real-time chat system with Firebase**

  * Complete Firebase Realtime Database integration for booking-based chat between guests and hosts with typing indicators, presence, and unread counts.

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

---

## Chat System (Firebase Integration)

This application uses **Firebase Realtime Database** for real-time chat functionality between guests and hosts.

### Quick Setup

1. **Install dependencies**: `npm install`
2. **Set up Firebase project** (see [FIREBASE_SETUP.md](FIREBASE_SETUP.md))
3. **Configure environment variables** in `.env.development`
4. **Set up backend** for custom token generation
5. **Follow the migration guide** in [FIREBASE_CHAT_MIGRATION.md](FIREBASE_CHAT_MIGRATION.md)

### Chat Features

- ✅ Real-time messaging between guests and hosts
- ✅ Typing indicators
- ✅ Presence status (online/offline)
- ✅ Unread message counts
- ✅ Multi-window chat support
- ✅ Booking-scoped conversations
- ✅ Message persistence
- ✅ Offline support

### Documentation

- **[QUICK_START_CHECKLIST.md](QUICK_START_CHECKLIST.md)** - Quick reference for setup
- **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)** - Detailed setup guide
- **[FIREBASE_CHAT_MIGRATION.md](FIREBASE_CHAT_MIGRATION.md)** - Technical implementation details
- **[MIGRATION_STATUS.md](MIGRATION_STATUS.md)** - Migration progress tracker
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What's been implemented

### Environment Variables

```env
# Firebase Configuration (Required for Chat)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

See `.env.example` for complete configuration.

---