## Plan: Require Auth For Writes

TL;DR: Prevent unauthenticated users from performing write actions (booking or wishlist toggles) by adding an auth check before handlers run. Implement a minimal, low-risk UI-level guard across key call sites, plus an optional reusable helper and an optional context-level hardening path for later.

### Steps
1. Add UI-level auth checks in `Listing.tsx` — `src/pages/guest/Listing.tsx` — guard `handleBookNow` and `handleToggleWishlist` by calling `useAuth()`; if not authenticated show tooltip(subtle complaint) around the action button and return early.  
2. Add same UI-level guard in `ListingCard.tsx` — `src/components/guest/discover/ListingCard.tsx` — wrap its wishlist handler (`handleToggleWishlist`) and `onRemoveWishlist` calls.  
3. Add same guard in `Discover.tsx` — `src/pages/guest/Discover.tsx` — protect places that call `toggleListingWishlist` or `addItem`.  
4. Create a small reusable helper `requireAuth(action, {onBlocked})` in `src/utils/requireAuth.ts` and use it to wrap component handlers (optional but recommended to reduce duplication). Use `useAuth()` and `useToast()` inside the helper to show the message or open the login modal.  
5. Add context-level guards inside the `useWishlist` and `useBooking` providers so writes always check auth centrally — only after confirming this won’t break guest localStorage persistence. If adopted, keep provider guards configurable (e.g., allow guest-write flag) to avoid breaking current guest flows.

### Further Considerations
1. UX decision: show a tooltip with a caution message.eg "Action not allowed before you are authenticated" Tooltip is less disruptive than a toast or modal, and fits well for blocking button actions. 
2. Guest flow: confirm whether unauthenticated local persistence (localStorage wishlist/bookings) must be preserved — if yes, prefer UI-level guards that only block server-write actions but keep local guest persistence.  
3. Scope: start with the minimal UI-level approach (Steps 1–3 + Step 4 helper). If you want I can proceed to implement these changes and run quick checks.

---

This file was generated from the mitigation plan discussed for guarding write actions (bookings, wishlist) behind authentication checks. 
