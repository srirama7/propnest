# 🏠 Real Estate Platform — Product Specification

**Project Name:** PropNest  
**Version:** 1.0  
**Date:** February 24, 2026  
**Stack:** Next.js + Supabase (Free Tier) + Tailwind CSS  

---

## 1. Project Overview

PropNest is a real estate web platform where users can **Buy**, **Sell**, and **Rent** properties. The platform supports four property types — **House**, **Land**, **PG (Paying Guest)**, and **Commercial** — each with dedicated sections. Only image uploads are allowed (no videos/documents). The backend is powered by **Supabase Free Tier**.

---

## 2. Supabase Free Tier Constraints

| Resource             | Free Tier Limit              | Our Strategy                                    |
|----------------------|------------------------------|-------------------------------------------------|
| Database             | 500 MB                       | Normalize schema, store image URLs not blobs    |
| Storage              | 1 GB                         | Compress images client-side before upload        |
| Auth                 | 50,000 MAU                   | Email + Google OAuth                             |
| Edge Functions       | 500K invocations/month       | Use only for critical server-side logic          |
| Realtime connections | 200 concurrent               | Use polling for non-critical updates             |
| API requests         | Unlimited (rate-limited)     | Implement client-side caching                    |
| File upload limit    | 50 MB per file               | Cap image uploads at 5 MB each, max 10 per listing |

---

## 3. User Roles & Authentication

### 3.1 Roles

| Role     | Permissions                                                   |
|----------|---------------------------------------------------------------|
| Guest    | Browse listings, search, filter, view details                 |
| User     | All Guest permissions + create listings, save favorites, chat |
| Admin    | All User permissions + approve/reject listings, manage users  |

### 3.2 Auth Flow (Supabase Auth)

- **Sign Up / Login:** Email & Password, Google OAuth
- **Email Verification:** Required before posting listings
- **Password Reset:** Via Supabase magic link
- **Session Management:** Supabase JWT tokens, auto-refresh

---

## 4. Listing Categories & Sections

The platform is divided into **four property type sections**, each supporting three transaction modes.

### 4.1 Section: Houses 🏡

**Transaction Modes:** Buy | Sell | Rent

| Field               | Type        | Required | Notes                               |
|----------------------|-------------|----------|-------------------------------------|
| title                | text        | ✅       | Max 120 chars                        |
| description          | text        | ✅       | Max 2000 chars                       |
| price                | integer     | ✅       | In INR; for rent = per month         |
| transaction_type     | enum        | ✅       | `buy`, `sell`, `rent`                |
| bedrooms             | integer     | ✅       | 1–20                                 |
| bathrooms            | integer     | ✅       | 1–10                                 |
| area_sqft            | integer     | ✅       | Built-up area                        |
| furnishing           | enum        | ✅       | `furnished`, `semi`, `unfurnished`   |
| floors               | integer     | ❌       | Total floors                         |
| parking              | boolean     | ❌       | Has parking                          |
| address              | text        | ✅       | Full address                         |
| city                 | text        | ✅       | City name                            |
| state                | text        | ✅       | State name                           |
| pincode              | text        | ✅       | 6-digit                              |
| latitude             | float       | ❌       | For map display                      |
| longitude            | float       | ❌       | For map display                      |
| images               | text[]      | ✅       | Min 1, Max 10 image URLs             |
| year_built           | integer     | ❌       | Construction year                    |
| amenities            | text[]      | ❌       | e.g., gym, pool, garden              |

---

### 4.2 Section: Land 🌍

**Transaction Modes:** Buy | Sell

| Field               | Type        | Required | Notes                               |
|----------------------|-------------|----------|-------------------------------------|
| title                | text        | ✅       | Max 120 chars                        |
| description          | text        | ✅       | Max 2000 chars                       |
| price                | integer     | ✅       | In INR                               |
| transaction_type     | enum        | ✅       | `buy`, `sell`                        |
| area_sqft            | integer     | ✅       | Plot area                            |
| land_type            | enum        | ✅       | `residential`, `commercial`, `agricultural`, `industrial` |
| facing               | enum        | ❌       | `north`, `south`, `east`, `west`     |
| road_width_ft        | integer     | ❌       | Approaching road width               |
| boundary_wall        | boolean     | ❌       | Has boundary wall                    |
| address              | text        | ✅       | Full address                         |
| city                 | text        | ✅       |                                      |
| state                | text        | ✅       |                                      |
| pincode              | text        | ✅       |                                      |
| latitude             | float       | ❌       |                                      |
| longitude            | float       | ❌       |                                      |
| images               | text[]      | ✅       | Min 1, Max 10 image URLs             |
| is_corner_plot       | boolean     | ❌       |                                      |
| legal_clearance      | boolean     | ❌       | RERA approved / clear title          |

---

### 4.3 Section: PG (Paying Guest) 🛏️

**Transaction Modes:** Rent only

| Field               | Type        | Required | Notes                               |
|----------------------|-------------|----------|-------------------------------------|
| title                | text        | ✅       | Max 120 chars                        |
| description          | text        | ✅       | Max 2000 chars                       |
| rent_per_month       | integer     | ✅       | In INR                               |
| security_deposit     | integer     | ✅       | In INR                               |
| gender_preference    | enum        | ✅       | `male`, `female`, `any`              |
| occupancy_type       | enum        | ✅       | `single`, `double`, `triple`, `any`  |
| meals_included       | boolean     | ✅       |                                      |
| meal_types           | text[]      | ❌       | e.g., breakfast, lunch, dinner       |
| wifi                 | boolean     | ❌       |                                      |
| laundry              | boolean     | ❌       |                                      |
| ac                   | boolean     | ❌       |                                      |
| attached_bathroom    | boolean     | ❌       |                                      |
| rules                | text        | ❌       | House rules, curfew, etc.            |
| available_from       | date        | ✅       |                                      |
| address              | text        | ✅       |                                      |
| city                 | text        | ✅       |                                      |
| state                | text        | ✅       |                                      |
| pincode              | text        | ✅       |                                      |
| images               | text[]      | ✅       | Min 1, Max 10 image URLs             |
| amenities            | text[]      | ❌       | e.g., gym, parking, power backup     |

---

### 4.4 Section: Commercial 🏢

**Transaction Modes:** Buy | Sell | Rent

| Field               | Type        | Required | Notes                                  |
|----------------------|-------------|----------|----------------------------------------|
| title                | text        | ✅       | Max 120 chars                           |
| description          | text        | ✅       | Max 2000 chars                          |
| price                | integer     | ✅       | For rent = per month                    |
| transaction_type     | enum        | ✅       | `buy`, `sell`, `rent`                   |
| commercial_type      | enum        | ✅       | `office`, `shop`, `warehouse`, `showroom`, `coworking` |
| area_sqft            | integer     | ✅       | Carpet area                             |
| furnishing           | enum        | ✅       | `furnished`, `semi`, `unfurnished`      |
| floors               | integer     | ❌       |                                         |
| parking              | boolean     | ❌       |                                         |
| power_backup         | boolean     | ❌       |                                         |
| lift                 | boolean     | ❌       |                                         |
| address              | text        | ✅       |                                         |
| city                 | text        | ✅       |                                         |
| state                | text        | ✅       |                                         |
| pincode              | text        | ✅       |                                         |
| latitude             | float       | ❌       |                                         |
| longitude            | float       | ❌       |                                         |
| images               | text[]      | ✅       | Min 1, Max 10 image URLs                |

---

## 5. Database Schema (Supabase / PostgreSQL)

### 5.1 Tables

```sql
-- USERS (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LISTINGS (unified table with category column)
CREATE TABLE public.listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Common fields
  category TEXT NOT NULL CHECK (category IN ('house', 'land', 'pg', 'commercial')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'rent')),
  title TEXT NOT NULL CHECK (char_length(title) <= 120),
  description TEXT NOT NULL CHECK (char_length(description) <= 2000),
  price INTEGER NOT NULL CHECK (price > 0),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL CHECK (pincode ~ '^\d{6}$'),
  latitude FLOAT,
  longitude FLOAT,
  images TEXT[] NOT NULL CHECK (array_length(images, 1) BETWEEN 1 AND 10),
  
  -- Status & moderation
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'sold', 'archived')),
  
  -- Category-specific fields stored as JSONB
  details JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAVORITES / SAVED LISTINGS
CREATE TABLE public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- INQUIRIES / CONTACT REQUESTS
CREATE TABLE public.inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) <= 500),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REPORTS (flag inappropriate listings)
CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Indexes

```sql
CREATE INDEX idx_listings_category ON public.listings(category);
CREATE INDEX idx_listings_transaction ON public.listings(transaction_type);
CREATE INDEX idx_listings_city ON public.listings(city);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_price ON public.listings(price);
CREATE INDEX idx_listings_user ON public.listings(user_id);
CREATE INDEX idx_listings_created ON public.listings(created_at DESC);
```

### 5.3 Row Level Security (RLS)

```sql
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Anyone can read active listings
CREATE POLICY "Public can view active listings"
  ON public.listings FOR SELECT
  USING (status = 'active');

-- Users can view their own listings regardless of status
CREATE POLICY "Users can view own listings"
  ON public.listings FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can create listings
CREATE POLICY "Auth users can create listings"
  ON public.listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own listings
CREATE POLICY "Users can update own listings"
  ON public.listings FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own listings
CREATE POLICY "Users can delete own listings"
  ON public.listings FOR DELETE
  USING (auth.uid() = user_id);
```

### 5.4 JSONB `details` Structure by Category

**House:**
```json
{
  "bedrooms": 3,
  "bathrooms": 2,
  "area_sqft": 1500,
  "furnishing": "semi",
  "floors": 2,
  "parking": true,
  "year_built": 2020,
  "amenities": ["gym", "pool", "garden"]
}
```

**Land:**
```json
{
  "area_sqft": 2400,
  "land_type": "residential",
  "facing": "north",
  "road_width_ft": 30,
  "boundary_wall": true,
  "is_corner_plot": false,
  "legal_clearance": true
}
```

**PG:**
```json
{
  "rent_per_month": 8000,
  "security_deposit": 16000,
  "gender_preference": "male",
  "occupancy_type": "double",
  "meals_included": true,
  "meal_types": ["breakfast", "dinner"],
  "wifi": true,
  "laundry": false,
  "ac": true,
  "attached_bathroom": true,
  "rules": "No smoking. Curfew 11 PM.",
  "available_from": "2026-03-01",
  "amenities": ["power backup", "parking"]
}
```

**Commercial:**
```json
{
  "commercial_type": "office",
  "area_sqft": 2000,
  "furnishing": "furnished",
  "floors": 3,
  "parking": true,
  "power_backup": true,
  "lift": true
}
```

---

## 6. Supabase Storage Configuration

### 6.1 Bucket: `listing-images`

```sql
-- Storage bucket config
INSERT INTO storage.buckets (id, name, public) 
VALUES ('listing-images', 'listing-images', true);
```

### 6.2 Storage Policies

```sql
-- Anyone can view images
CREATE POLICY "Public image access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

-- Authenticated users can upload images
CREATE POLICY "Auth users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listing-images'
    AND auth.role() = 'authenticated'
    AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp'))
    AND (octet_length(content) <= 5242880) -- 5 MB
  );

-- Users can delete their own images
CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 6.3 Upload Rules

- **Allowed formats:** JPG, JPEG, PNG, WebP only
- **Max file size:** 5 MB per image
- **Max images per listing:** 10
- **Folder structure:** `listing-images/{user_id}/{listing_id}/{filename}`
- **Client-side compression:** Resize to max 1920px width, quality 80% before upload
- **No videos, PDFs, or documents allowed**

---

## 7. Pages & Routes

| Route                           | Page                     | Auth Required |
|---------------------------------|--------------------------|---------------|
| `/`                             | Home / Landing Page      | ❌            |
| `/houses`                       | Houses Section           | ❌            |
| `/houses/buy`                   | Houses for Sale          | ❌            |
| `/houses/rent`                  | Houses for Rent          | ❌            |
| `/land`                         | Land Section             | ❌            |
| `/land/buy`                     | Land for Sale            | ❌            |
| `/pg`                           | PG Section               | ❌            |
| `/pg/rent`                      | PG Listings              | ❌            |
| `/commercial`                   | Commercial Section       | ❌            |
| `/commercial/buy`               | Commercial for Sale      | ❌            |
| `/commercial/rent`              | Commercial for Rent      | ❌            |
| `/listing/[id]`                 | Listing Detail Page      | ❌            |
| `/sell`                         | Create Listing Form      | ✅            |
| `/sell/house`                   | Sell House Form          | ✅            |
| `/sell/land`                    | Sell Land Form           | ✅            |
| `/sell/pg`                      | List PG Form             | ✅            |
| `/sell/commercial`              | List Commercial Form     | ✅            |
| `/dashboard`                    | User Dashboard           | ✅            |
| `/dashboard/my-listings`        | My Listings              | ✅            |
| `/dashboard/favorites`          | Saved Listings           | ✅            |
| `/dashboard/inquiries`          | My Inquiries             | ✅            |
| `/dashboard/profile`            | Edit Profile             | ✅            |
| `/auth/login`                   | Login Page               | ❌            |
| `/auth/signup`                  | Sign Up Page             | ❌            |
| `/admin`                        | Admin Dashboard          | ✅ (admin)    |
| `/admin/listings`               | Manage All Listings      | ✅ (admin)    |
| `/admin/users`                  | Manage Users             | ✅ (admin)    |

---

## 8. Image Handling Pipeline

```
User selects image(s)
        │
        ▼
┌──────────────────────┐
│ Client-side Validation│
│ • Format: jpg/png/webp│
│ • Size: ≤ 5 MB        │
│ • Count: ≤ 10          │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Client-side Compress  │
│ • Max width: 1920px   │
│ • Quality: 80%        │
│ • Convert to WebP     │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Upload to Supabase    │
│ Storage Bucket        │
│ listing-images/       │
│   {uid}/{lid}/{file}  │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Store public URL in   │
│ listings.images[]     │
└──────────────────────┘
```

---

## 9. UI Components & Features

### 9.1 Home Page

- Hero section with search bar (city, category, transaction type)
- Section cards linking to Houses, Land, PG, Commercial
- Featured/recent listings carousel
- Statistics banner (total listings, cities, users)

### 9.2 Category Section Pages (Houses, Land, PG, Commercial)

- Tab navigation for transaction types (Buy | Sell | Rent)
- Filter sidebar: price range, city, area, specific fields per category
- Sort options: price (low-high, high-low), newest, oldest
- Grid/List view toggle
- Listing cards with: primary image, title, price, city, key details
- Pagination (20 items per page)

### 9.3 Listing Detail Page

- Image gallery with lightbox (swipeable)
- Property details organized by category
- Price and transaction badge
- Owner/Agent contact card
- Inquiry form (send message)
- Save to favorites button
- Share button
- Similar listings section
- Report listing button
- Map embed (if lat/long available)

### 9.4 Create Listing Form

- Step-by-step wizard: Category → Details → Images → Preview → Submit
- Dynamic form fields based on selected category
- Image upload with drag-and-drop, preview, reorder, and delete
- Client-side validation with clear error messages
- Preview before submission
- Submit for admin approval

### 9.5 User Dashboard

- Overview: total listings, active, pending, views
- My Listings: edit, delete, mark as sold
- Favorites: saved listings grid
- Inquiries: messages received on listings
- Profile: edit name, phone, avatar, city

### 9.6 Admin Dashboard

- Pending listings queue with approve/reject actions
- All listings management (search, filter, status change)
- User management (view, ban)
- Reports management
- Basic analytics (listings count by category, city)

---

## 10. Search & Filtering

### 10.1 Global Search

- Search by title, city, or pincode
- Uses PostgreSQL `ILIKE` for text search

### 10.2 Filters by Category

**Houses:** bedrooms, bathrooms, price range, area range, furnishing, city  
**Land:** land type, price range, area range, city, facing  
**PG:** gender preference, occupancy type, meals, price range, city  
**Commercial:** commercial type, price range, area range, furnishing, city

### 10.3 Implementation

```sql
-- Example filtered query
SELECT * FROM public.listings
WHERE category = 'house'
  AND transaction_type = 'buy'
  AND status = 'active'
  AND city ILIKE '%bangalore%'
  AND price BETWEEN 5000000 AND 10000000
  AND (details->>'bedrooms')::int >= 2
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

---

## 11. API Endpoints (Supabase Client SDK)

All data access goes through Supabase JS client with RLS. No custom backend API needed.

| Action                 | Method  | Supabase Call                                      |
|------------------------|---------|----------------------------------------------------|
| Get listings           | SELECT  | `supabase.from('listings').select('*').eq(...)`     |
| Create listing         | INSERT  | `supabase.from('listings').insert({...})`           |
| Update listing         | UPDATE  | `supabase.from('listings').update({...}).eq('id')`  |
| Delete listing         | DELETE  | `supabase.from('listings').delete().eq('id')`       |
| Upload image           | UPLOAD  | `supabase.storage.from('listing-images').upload()`  |
| Delete image           | DELETE  | `supabase.storage.from('listing-images').remove()`  |
| Send inquiry           | INSERT  | `supabase.from('inquiries').insert({...})`          |
| Toggle favorite        | UPSERT  | `supabase.from('favorites').upsert({...})`          |
| Sign up                | AUTH    | `supabase.auth.signUp({...})`                       |
| Login                  | AUTH    | `supabase.auth.signInWithPassword({...})`           |
| OAuth login            | AUTH    | `supabase.auth.signInWithOAuth({provider:'google'})` |

---

## 12. Validation Rules Summary

| Rule                                    | Enforcement        |
|-----------------------------------------|--------------------|
| Images only (jpg, jpeg, png, webp)      | Client + Storage   |
| Max image size: 5 MB                    | Client + Storage   |
| Max 10 images per listing               | Client + DB CHECK  |
| Min 1 image per listing                 | Client + DB CHECK  |
| Title max 120 chars                     | Client + DB CHECK  |
| Description max 2000 chars              | Client + DB CHECK  |
| Price > 0                               | Client + DB CHECK  |
| Pincode must be 6 digits                | Client + DB CHECK  |
| Email must be verified to post           | Client + RLS       |
| Transaction type matches category rules  | Client + DB trigger|
| Land cannot have `rent` transaction      | Client + DB trigger|
| PG can only have `rent` transaction      | Client + DB trigger|

---

## 13. Transaction Type Restrictions

| Category    | Buy | Sell | Rent |
|-------------|-----|------|------|
| House       | ✅  | ✅   | ✅   |
| Land        | ✅  | ✅   | ❌   |
| PG          | ❌  | ❌   | ✅   |
| Commercial  | ✅  | ✅   | ✅   |

---

## 14. Tech Stack

| Layer       | Technology                     |
|-------------|--------------------------------|
| Frontend    | Next.js 14 (App Router)        |
| Styling     | Tailwind CSS + shadcn/ui       |
| Backend     | Supabase (Free Tier)           |
| Database    | PostgreSQL (via Supabase)      |
| Auth        | Supabase Auth                  |
| Storage     | Supabase Storage               |
| Hosting     | Vercel (Free Tier)             |
| Image Opt.  | browser-image-compression lib  |
| Maps        | Leaflet.js (free/open-source)  |
| State       | React Context / Zustand        |

---

## 15. Non-Functional Requirements

- **Performance:** Pages load under 2 seconds; images lazy-loaded
- **Responsive:** Mobile-first design, works on all screen sizes
- **SEO:** Dynamic meta tags per listing, OpenGraph images
- **Accessibility:** WCAG 2.1 AA compliance
- **Security:** RLS on all tables, input sanitization, CSRF protection
- **Scalability:** Designed to migrate to Supabase Pro if needed
- **Offline:** Service worker for basic caching of viewed listings

---

## 16. Future Enhancements (v2)

- In-app chat between buyer and seller (Supabase Realtime)
- EMI / loan calculator widget
- Virtual tour / 360° image support
- Agent/broker profiles and verification
- Promoted/featured listing (paid tier)
- SMS notifications via Twilio
- Advanced search with map-based filtering
- Multi-language support (Hindi, regional)