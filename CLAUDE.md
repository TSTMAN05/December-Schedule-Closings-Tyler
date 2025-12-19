# Schedule Closings MVP

## Project Overview

Schedule Closings is a marketplace platform connecting consumers with real estate closing attorneys — like "OpenTable for real estate closings." Customers search for law firms by location, submit closing orders, and track transactions. Law firms receive orders and assign attorneys to work them.

**Owner:** Larry Thompson (Schedule Ventures INC)
**Target Market:** NC and SC initially, designed for nationwide scale

## Tech Stack

- **Framework:** Next.js 14+ (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (use @supabase/auth-ui-react for login UI)
- **Storage:** Supabase Storage
- **Maps:** Mapbox GL
- **Hosting:** Vercel

## Four User Roles (MVP)

### 1. Customer
Anyone booking a closing (homebuyer, seller, real estate agent, lender). Can search law firms, submit orders, track transactions.

### 2. Law Firm
Parent entity that customers see and select. Manages attorneys, receives orders, assigns work.

### 3. Attorney
Works under a law firm. Views assigned orders, updates status, adds notes.

### 4. Admin
Platform administrator. Manages all users, views all data, approves law firms.

## User Flow

1. Customer searches by location on homepage
2. Views law firm list + map on /search
3. Clicks "Schedule" on a law firm
4. Must log in (Supabase Auth modal)
5. Fills out order form with property/customer details
6. Order goes to law firm
7. Law firm assigns attorney
8. Customer tracks order status in dashboard

## Database Schema

Run this SQL in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM TYPES
CREATE TYPE user_role AS ENUM ('customer', 'attorney', 'law_firm', 'admin');
CREATE TYPE customer_type AS ENUM ('buyer', 'seller', 'real_estate_agent', 'lender', 'other');
CREATE TYPE closing_type AS ENUM ('purchase', 'refinance', 'heloc', 'other');
CREATE TYPE property_type AS ENUM ('residential', 'commercial');
CREATE TYPE order_status AS ENUM ('new', 'in_progress', 'completed', 'cancelled');
CREATE TYPE law_firm_status AS ENUM ('pending', 'active', 'inactive');

-- PROFILES TABLE (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  customer_type customer_type,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LAW FIRMS TABLE
CREATE TABLE law_firms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  website TEXT,
  logo_url TEXT,
  description TEXT,
  status law_firm_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OFFICE LOCATIONS TABLE
CREATE TABLE office_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ATTORNEYS TABLE
CREATE TABLE attorneys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
  title TEXT,
  bar_number TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, law_firm_id)
);

-- ORDERS TABLE
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_role customer_type NOT NULL,
  property_street TEXT NOT NULL,
  property_city TEXT NOT NULL,
  property_state TEXT NOT NULL,
  property_zip TEXT NOT NULL,
  property_type property_type NOT NULL,
  closing_type closing_type NOT NULL,
  estimated_closing_date DATE,
  sale_amount DECIMAL(12, 2),
  law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE RESTRICT,
  office_location_id UUID REFERENCES office_locations(id) ON DELETE SET NULL,
  assigned_attorney_id UUID REFERENCES attorneys(id) ON DELETE SET NULL,
  status order_status DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ORDER NOTES TABLE
CREATE TABLE order_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_law_firms_status ON law_firms(status);
CREATE INDEX idx_law_firms_slug ON law_firms(slug);
CREATE INDEX idx_office_locations_law_firm ON office_locations(law_firm_id);
CREATE INDEX idx_office_locations_state ON office_locations(state);
CREATE INDEX idx_office_locations_zip ON office_locations(zip_code);
CREATE INDEX idx_attorneys_law_firm ON attorneys(law_firm_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_law_firm ON orders(law_firm_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE law_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attorneys ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ POLICIES
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Anyone can view active law firms" ON law_firms FOR SELECT USING (status = 'active');
CREATE POLICY "Anyone can view office locations" ON office_locations FOR SELECT USING (true);
CREATE POLICY "Attorneys viewable by all" ON attorneys FOR SELECT USING (true);
CREATE POLICY "Customers can view own orders" ON orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Law firms can view their orders" ON orders FOR SELECT USING (
  law_firm_id IN (SELECT id FROM law_firms WHERE owner_id = auth.uid())
);
CREATE POLICY "Customers can create orders" ON orders FOR INSERT WITH CHECK (customer_id = auth.uid());

-- AUTO-GENERATE ORDER NUMBER
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  sequence_num INT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SPLIT_PART(order_number, '-', 3) AS INT)), 0) + 1
  INTO sequence_num FROM orders WHERE order_number LIKE 'SC-' || year_part || '-%';
  NEW.order_number := 'SC-' || year_part || '-' || LPAD(sequence_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- AUTO-UPDATE TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_law_firms_updated_at BEFORE UPDATE ON law_firms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Sample Data

After running schema, add sample law firms:

```sql
INSERT INTO law_firms (id, name, slug, email, phone, website, description, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'The Shoaf Law Firm, P.A.', 'the-shoaf-law-firm-pa', 'orders@shoaflaw.com', '(919) 877-0009', 'https://shoaflaw.com', 'Full-service real estate closing firm.', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Samantha H. Terres, PLLC', 'samantha-h-terres-pllc', 'office@samterreslaw.com', '(704) 897-3072', 'https://samterreslaw.com', 'Experienced real estate attorney.', 'active'),
  ('33333333-3333-3333-3333-333333333333', 'The Law Office Of Habekah Cannon, PLLC', 'law-office-habekah-cannon-pllc', 'hbclawclosings@gmail.com', '(980) 430-1156', NULL, 'Real estate closings.', 'active'),
  ('44444444-4444-4444-4444-444444444444', 'Hejirika Law, PLLC', 'hejirika-law-pllc', 'info@hejirikalaw.com', '(980) 580-2260', 'https://hejirikalaw.com', 'Modern law firm.', 'active'),
  ('55555555-5555-5555-5555-555555555555', 'Baker Law, PLLC', 'baker-law-pllc', 'docs@labakerlaw.com', '(704) 369-5550', 'https://labakerlaw.com', 'Trusted closing services.', 'active');

INSERT INTO office_locations (law_firm_id, name, street_address, city, state, zip_code, latitude, longitude, is_primary) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Dilworth', '1235 East Blvd, Suite E', 'Charlotte', 'NC', '28203', 35.2030, -80.8565, false),
  ('11111111-1111-1111-1111-111111111111', 'Charlotte - Main', '6047 Tyvola Glen Circle', 'Charlotte', 'NC', '28217', 35.1578, -80.8826, true),
  ('11111111-1111-1111-1111-111111111111', 'Raleigh - Main', '3101 Glenwood Ave', 'Raleigh', 'NC', '27612', 35.8275, -78.6825, false),
  ('22222222-2222-2222-2222-222222222222', 'Main Office', '9820 Northcross Center Ct', 'Huntersville', 'NC', '28078', 35.4126, -80.8428, true),
  ('33333333-3333-3333-3333-333333333333', 'University Area', '8701 Mallard Creek Rd', 'Charlotte', 'NC', '28262', 35.3176, -80.7437, true),
  ('44444444-4444-4444-4444-444444444444', 'Main Office', '7404 E Independence Blvd', 'Charlotte', 'NC', '28227', 35.1851, -80.7098, true),
  ('55555555-5555-5555-5555-555555555555', 'Main Office', '1234 South Blvd', 'Charlotte', 'NC', '28203', 35.2100, -80.8580, true);
```

## File Structure

```
schedule-closings/
├── CLAUDE.md                 # This file
├── .env.local                # Environment variables (never commit)
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── middleware.ts             # Auth middleware
│
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout with AuthProvider
│   │   ├── page.tsx          # Homepage with search hero
│   │   ├── globals.css
│   │   │
│   │   ├── auth/
│   │   │   └── callback/route.ts  # OAuth callback handler
│   │   │
│   │   ├── search/
│   │   │   └── page.tsx      # Law firm search results + map
│   │   │
│   │   ├── order/
│   │   │   └── new/page.tsx  # Order submission form (auth required)
│   │   │
│   │   ├── customer/         # Customer dashboard (auth required)
│   │   │   ├── page.tsx
│   │   │   └── orders/
│   │   │       ├── page.tsx
│   │   │       └── [id]/page.tsx
│   │   │
│   │   ├── law-firm/         # Law firm dashboard
│   │   │   ├── page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   └── attorneys/page.tsx
│   │   │
│   │   ├── attorney/         # Attorney dashboard
│   │   │   ├── page.tsx
│   │   │   └── orders/page.tsx
│   │   │
│   │   └── admin/            # Admin dashboard
│   │       ├── page.tsx
│   │       ├── law-firms/page.tsx
│   │       └── orders/page.tsx
│   │
│   ├── components/
│   │   ├── ui/               # Button, Input, Card, Modal, Badge, etc.
│   │   ├── layout/           # Header, Footer, Sidebar
│   │   ├── auth/             # AuthModal
│   │   ├── search/           # SearchHero, SearchFilters, LawFirmCard, SearchMap
│   │   └── orders/           # OrderForm, OrderCard, OrderStatusBadge
│   │
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts     # Browser client (singleton)
│   │       └── server.ts     # Server client
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useLawFirms.ts
│   │
│   ├── providers/
│   │   └── AuthProvider.tsx
│   │
│   └── types/
│       └── index.ts
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Design System

**Colors:**
- Brand blue (header, buttons): `#1e3a8a`
- Brand blue light: `#3b82f6`
- Status new: yellow/amber
- Status in progress: blue
- Status completed: green
- Status cancelled: red

**Design Reference:** Match scheduleclosings.com
- Blue header with white text
- Clean white cards with subtle shadows
- Search results: list on left, map on right

## Key Implementation Notes

### Auth Flow
1. Use `@supabase/auth-ui-react` for login modal
2. Create singleton Supabase client to prevent re-initialization
3. AuthProvider should track `isLoading` state to prevent header flash
4. Protected routes redirect to /search with auth modal

### Supabase Client (Important!)
Use singleton pattern to prevent auth state issues:

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return client
}
```

### Law Firms Query
Simple query that works:

```typescript
const { data, error } = await supabase
  .from('law_firms')
  .select(`
    id, name, slug, email, phone, logo_url, description,
    office_locations (id, name, street_address, city, state, zip_code, latitude, longitude)
  `)
  .eq('status', 'active')
  .order('name')
```

### Required npm Packages

```bash
npm install @supabase/supabase-js @supabase/ssr @supabase/auth-ui-react @supabase/auth-ui-shared
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react
npm install mapbox-gl react-map-gl
npm install clsx tailwind-merge
```

## Build Order

1. **Foundation:** Supabase clients, types, AuthProvider, base UI components
2. **Layout:** Header with auth, Footer
3. **Homepage:** Search hero
4. **Search:** Law firm list, map, filters
5. **Auth:** Login modal, protected routes
6. **Order Form:** Submit order flow
7. **Customer Dashboard:** View orders
8. **Law Firm Dashboard:** Manage orders, assign attorneys
9. **Admin Dashboard:** Manage all data