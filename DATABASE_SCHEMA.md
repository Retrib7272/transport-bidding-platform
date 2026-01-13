# 📊 Database Schema

## Tables

### 1. users (Supabase Auth handles this)
- id (uuid, primary key)
- email
- created_at

### 2. bids
```sql
CREATE TABLE bids (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bid_number TEXT UNIQUE NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  material_type TEXT NOT NULL,
  weight_tons DECIMAL NOT NULL,
  pickup_date DATE NOT NULL,
  required_delivery_date DATE NOT NULL,
  additional_notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'awarded')),
  created_by uuid REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bids_status ON bids(status);
CREATE INDEX idx_bids_expires_at ON bids(expires_at);
```

### 3. offers
```sql
CREATE TABLE offers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bid_id uuid REFERENCES bids(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  person_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  alternate_number TEXT,
  quoted_price DECIMAL NOT NULL,
  estimated_delivery_date DATE NOT NULL,
  vehicle_type TEXT,
  additional_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_offers_bid_id ON offers(bid_id);
CREATE INDEX idx_offers_created_at ON offers(created_at);
```

### 4. carrier_contacts
```sql
CREATE TABLE carrier_contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  person_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL UNIQUE,
  alternate_number TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_carrier_contacts_is_active ON carrier_contacts(is_active);
```

## Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_contacts ENABLE ROW LEVEL SECURITY;

-- Admin users can do everything
CREATE POLICY "Admin full access to bids" ON bids
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access to carrier_contacts" ON carrier_contacts
  FOR ALL USING (auth.role() = 'authenticated');

-- Public can view bids by ID (for carrier access)
CREATE POLICY "Public can view specific bids" ON bids
  FOR SELECT USING (true);

-- Public can submit offers
CREATE POLICY "Anyone can insert offers" ON offers
  FOR INSERT WITH CHECK (true);

-- Admin can view all offers
CREATE POLICY "Admin can view offers" ON offers
  FOR SELECT USING (auth.role() = 'authenticated');
```

## Functions

### Auto-update timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON bids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carrier_contacts_updated_at BEFORE UPDATE ON carrier_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Generate bid number
```sql
CREATE OR REPLACE FUNCTION generate_bid_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  date_part TEXT;
  sequence_part INTEGER;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(bid_number FROM 13) AS INTEGER)), 0) + 1
  INTO sequence_part
  FROM bids
  WHERE bid_number LIKE 'BID-' || date_part || '%';
  
  new_number := 'BID-' || date_part || '-' || LPAD(sequence_part::TEXT, 3, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
```
