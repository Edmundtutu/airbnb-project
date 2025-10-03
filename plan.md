After getting the complete picture of the backend, I have come up with a transition and migration plan:

# 🔍 **Backend Domain Transition Analysis Report**

Based on my thorough analysis of the backend codebase, here's the complete status of the domain transition from **Social Commerce** to **Airbnb-style Rental Platform**:

---

## ✅ **COMPLETED TRANSITIONS (70% Done)**

### 1. **Models** ✅
- [Shop.php] → [Property.php]✅
- [Product.php]→ [Listing.php]✅
- [Order.php] → [Booking.php] ✅
- [OrderItem.php] → [BookingDetails.php] ✅
- User model has [isHost()] and [isGuest()] methods ✅

### 2. **Controllers** ✅
- `ShopController` → `PropertyController` ✅
- `ProductController` → `ListingController` ✅
- `OrderController` → `BookingController` ✅
- Controller namespaces updated (`ShopHandlers` → `PropertyHandlers`, `OrderHandlers` → `BookingHandlers`) ✅

### 3. **Routes (api.php)** ✅
- `/api/v1/shops` → `/api/v1/properties` ✅
- `/api/v1/products` → `/api/v1/listings` ✅
- `/api/v1/orders` → `/api/v1/bookings` ✅
- `/api/v1/vendor/orders` → `/api/v1/host/bookings` ✅
- Chat route updated: `getShopConversations` → `getPropertyConversations` ✅

### 4. **Resources** ✅
- [PropertyResource.php]created ✅
- [ListingResource.php]created ✅
- [BookingResource.php] created ✅
- [BookingDetailResource.php]created ✅
- Old [ShopResource.php] marked as `@deprecated` ✅

### 5. **Database Migrations** ✅
- [2025_09_18_100000_rename_shops_to_properties_table.php] ✅
- [2025_09_18_100001_rename_products_to_listings_table.php] ✅
- [2025_09_18_100002_rename_orders_to_bookings_table.php] ✅
- [2025_09_18_100004_update_users_table_for_airbnb_domain.php] ✅

---

## ❌ **MISSING TRANSITIONS (30% Remaining)**

### 1. **Factories** ❌ (Critical)
**Files still using old domain:**
- ❌ [ShopFactory.php] → Should be `PropertyFactory.php`
- ❌ [ProductFactory.php]→ Should be `ListingFactory.php`
- ❌ [OrderFactory.php] → Should be `BookingFactory.php`
- ❌ [UserFactory.php] - Still has [vendor()] and [customer()] methods using old roles

**Issues:**
- Line 32 in UserFactory: `'role' => fake()->randomElement(['customer', 'vendor'])`
- Line 54-58: [vendor()] method should be `host()`
- Line 64-68: [customer()] method should be `guest()`

### 2. **Seeders** ❌ (Critical)
**File:** [DatabaseSeeder.php]

**Issues:**
- Line 8-12: Imports old models (`Order`, `Product`, `Shop`)
- Line 30-38: Uses [customer()] and [vendor()] factory methods
- Line 41-42: Creates users with old roles
- Line 48-55: References `Shop` model
- Line 57-67: References `Product` model
- Line 96-110: References `Order` model
- Line 118-128: Uses `Shop::class` and `Product::class`
- Line 231-232: Table summary shows "ShopHandlers", "Products", "OrderHandlers"

### 3. **Requests (Form Validation)** ❌
**Files still using old domain:**
- ❌ [StoreShopRequest.php] → Should be `StorePropertyRequest.php`
- ❌ [UpdateShopRequest.php] → Should be `UpdatePropertyRequest.php`
- ❌ [StoreProductRequest.php] → Should be `StoreListingRequest.php`
- ❌ [UpdateProductRequest.php] → Should be `UpdateListingRequest.php`
- ❌ [StoreOrderRequest.php] → Should be `StoreBookingRequest.php`
- ❌ [UpdateOrderRequest.php] → Should be `UpdateBookingRequest.php`

**Missing new request classes:**
- ❌ No `StorePropertyRequest.php`
- ❌ No `StoreListingRequest.php`
- ❌ No `StoreBookingRequest.php`

### 4. **Policies** ❌
**Files still using old domain:**
- ❌ [ShopPolicy.php] → Should be `PropertyPolicy.php`
- ❌ [ProductPolicy.php] → Should be `ListingPolicy.php`
- ❌ [OrderPolicy.php] → Should be `BookingPolicy.php`

**Issues in existing policies:**
- Line 5-6 in ShopPolicy: Uses `Shop` model import
- Line 22, 38, 46, 54, 62: Type hints use `Shop $shop`

**Missing new policy classes:**
- ❌ No `PropertyPolicy.php`
- ❌ No `ListingPolicy.php`
- ❌ No `BookingPolicy.php`

### 5. **Legacy Resources** ⚠️ (Cleanup needed)
**Deprecated but not removed:**
- ⚠️ [ShopResource.php] - marked deprecated, should be removed
- ⚠️ [ProductResource.php] - still exists alongside [ListingResource.php]
- ⚠️ [OrderResource.php] - still exists alongside [BookingResource.php]
- ⚠️ [OrderItemResource.php] - still exists alongside [BookingDetailResource.php]

### 6. **Tests** ❌ (Found via grep)
**Test files still using old domain:**
- [ShopTest.php]
- [ProductTest.php](
- [OrderTest.php]
- Multiple test files reference 'vendor' role (17+ matches in FollowTest.php alone)

---

## 📋 **DETAILED MIGRATION PLAN**

### **Phase 1: Factories Refactoring** (Priority: HIGH)

**Step 1.1: Rename Factory Files**
```bash
# In /backend/database/factories/
ShopFactory.php → PropertyFactory.php
ProductFactory.php → ListingFactory.php  
OrderFactory.php → BookingFactory.php
```

**Step 1.2: Update UserFactory.php**
- Line 32: Change `['customer', 'vendor']` to `['guest', 'host']`
- Line 54-58: Rename [vendor()] method to `host()` and change role to `'host'`
- Line 64-68: Rename [customer()] method to `guest()` and change role to `'guest'`
- Add legacy methods for backward compatibility:
  ```php
  public function vendor(): static { return $this->host(); }
  public function customer(): static { return $this->guest(); }
  ```

**Step 1.3: Update Factory Content**
- **PropertyFactory.php**: Update namespace, class name, and model reference
- **ListingFactory.php**: Update to generate listing-appropriate data (bedrooms, bathrooms, etc.)
- **BookingFactory.php**: Update to generate booking data (check_in, check_out, guests)

---

### **Phase 2: Seeders Refactoring** (Priority: HIGH)

**Step 2.1: Update DatabaseSeeder.php imports**
```php
// Line 8-12: Change from
use App\Models\Order;
use App\Models\Product;
use App\Models\Shop;

// To:
use App\Models\Booking;
use App\Models\Listing;
use App\Models\Property;
```

**Step 2.2: Update role references throughout**
- Replace all [customer()] calls with `guest()`
- Replace all [vendor()] calls with `host()`
- Replace `'vendor'` strings with `'host'`
- Replace `'customer'` strings with `'guest'`

**Step 2.3: Update model references**
- `Shop::factory()` → `Property::factory()`
- `Product::factory()` → `Listing::factory()`
- `Order::factory()` → `Booking::factory()`
- `Shop::class` → `Property::class`
- `Product::class` → `Listing::class`

**Step 2.4: Update variable names for clarity**
- `$shops` → `$properties`
- `$allProducts` → `$allListings`
- `$allOrders` → `$allBookings`
- `$testVendor` → `$testHost`
- `$testCustomer` → `$testGuest`

**Step 2.5: Update summary table**
- "ShopHandlers" → "Properties"
- "Products" → "Listings"
- "OrderHandlers" → "Bookings"
- "Vendors" → "Hosts"
- "Customers" → "Guests"

---

### **Phase 3: Request Classes** (Priority: HIGH)

**Step 3.1: Create new Request classes**
```bash
# Create in /backend/app/Http/Requests/Api/V1/
StorePropertyRequest.php (copy from StoreShopRequest.php)
UpdatePropertyRequest.php (copy from UpdateShopRequest.php)
StoreListingRequest.php (copy from StoreProductRequest.php)
UpdateListingRequest.php (copy from UpdateProductRequest.php)
StoreBookingRequest.php (copy from StoreOrderRequest.php)
UpdateBookingRequest.php (copy from UpdateOrderRequest.php)
```

**Step 3.2: Update validation rules**
- **StorePropertyRequest**: Adjust rules for property-specific fields
- **StoreListingRequest**: Add booking-specific validations (max_guests, bedrooms, bathrooms, price_per_night, etc.)
- **StoreBookingRequest**: Add date validations (check_in, check_out, guests, etc.)

**Step 3.3: Delete old Request files** (after verification)
```bash
# Delete:
StoreShopRequest.php
UpdateShopRequest.php
StoreProductRequest.php
UpdateProductRequest.php
StoreOrderRequest.php
UpdateOrderRequest.php
```

---

### **Phase 4: Policy Classes** (Priority: HIGH)

**Step 4.1: Create new Policy classes**
```bash
# Create in /backend/app/Policies/Api/V1/
PropertyPolicy.php (copy from ShopPolicy.php)
ListingPolicy.php (copy from ProductPolicy.php)
BookingPolicy.php (copy from OrderPolicy.php)
```

**Step 4.2: Update Policy content**
- **PropertyPolicy.php**: 
  - Change `use App\Models\Shop` to `use App\Models\Property`
  - Change all `Shop $shop` to `Property $property`
  - Change `$shop->owner_id` to `$property->host_id`

- **ListingPolicy.php**:
  - Change `use App\Models\Product` to `use App\Models\Listing`
  - Change all `Product $product` to `Listing $listing`
  - Update authorization logic for `listing->property->host_id`

- **BookingPolicy.php**:
  - Change `use App\Models\Order` to `use App\Models\Booking`
  - Change all `Order $order` to `Booking $booking`
  - Update logic: guests can view their bookings, hosts can manage bookings for their properties

**Step 4.3: Register new policies** in `AuthServiceProvider.php`
```php
protected $policies = [
    Property::class => PropertyPolicy::class,
    Listing::class => ListingPolicy::class,
    Booking::class => BookingPolicy::class,
];
```

**Step 4.4: Delete old Policy files** (after verification)

---

### **Phase 5: Cleanup Legacy Resources** (Priority: MEDIUM)

**Step 5.1: Remove deprecated resources**
```bash
# Delete in /backend/app/Http/Resources/Api/V1/
ShopResource.php
ProductResource.php
OrderResource.php
OrderItemResource.php
```

**Step 5.2: Search and replace any remaining references**
```bash
# Search for and update any controllers still using:
- ShopResource::class
- ProductResource::class
- OrderResource::class
```

---

### **Phase 6: Update Tests** (Priority: MEDIUM - Can be done after main transition)

**Step 6.1: Rename test files**
```bash
ShopTest.php → PropertyTest.php
ProductTest.php → ListingTest.php
OrderTest.php → BookingTest.php
```

**Step 6.2: Update test content**
- Replace all model references
- Update factory calls to use `host()` and `guest()`
- Update assertions to match new domain language

⚠️ **CRITICAL WARNINGS**

1. **Database Consistency**: The migrations have already renamed tables, so using old model names will cause errors.
2. **Foreign Key References**: Ensure all `owner_id` references are updated to `host_id` where applicable.
3. **API Contracts**: The routes have changed - frontend must be updated accordingly.
4. **Role-based Logic**: Any middleware or logic checking for `'vendor'` or `'customer'` roles will fail.

 🔍 **VERIFICATION CHECKLIST**
After completing the migration, verify:

- [ ] All factories use new model names
- [ ] All seeders use new model names and roles
- [ ] All requests are renamed and updated
- [ ] All policies are renamed and updated
- [ ] All deprecated resources are removed
- [ ] `php artisan db:seed` runs without errors
- [ ] All API endpoints return correct data
- [ ] Authorization works correctly
- [ ] Tests pass (after updating)
