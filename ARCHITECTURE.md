# 🏗️ System Architecture

## Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER DEVICES                             │
│  📱 Admin (Desktop)        📱 Carrier (Mobile)                  │
└────────────┬─────────────────────────┬──────────────────────────┘
             │                         │
             │                         │
┌────────────▼─────────────────────────▼──────────────────────────┐
│                    VERCEL (Frontend + API)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React App (Vite)                                        │  │
│  │  • DashboardPage       • CarrierBidPage                 │  │
│  │  • CreateBidPage       • BidDetailPage                  │  │
│  │  • LoginPage           • CarriersPage                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Routes (Serverless Functions)                       │  │
│  │  • /api/export-bid/:bidId                               │  │
│  │  • /api/cron-generate-reports (runs at 6:05 PM IST)    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬─────────────────────────┬──────────────────────────┘
             │                         │
             │                         │
┌────────────▼─────────────┐  ┌───────▼──────────────────────────┐
│   SUPABASE              │  │       n8n WORKFLOW               │
│  ┌───────────────────┐  │  │  ┌────────────────────────────┐ │
│  │ PostgreSQL DB     │  │  │  │ 1. Webhook Trigger        │ │
│  │ • bids           │  │  │  │ 2. Query Carriers         │ │
│  │ • offers         │  │  │  │ 3. Loop Through Each      │ │
│  │ • carrier_contacts│  │  │  │ 4. Send WhatsApp          │ │
│  │ • users (auth)   │  │  │  └────────────────────────────┘ │
│  └───────────────────┘  │  │              │                   │
│  ┌───────────────────┐  │  │              ▼                   │
│  │ Real-time Sync    │  │  │  ┌────────────────────────────┐ │
│  │ (WebSockets)      │  │  │  │ WhatsApp Business API      │ │
│  └───────────────────┘  │  │  └────────────────────────────┘ │
│  ┌───────────────────┐  │  └──────────────────────────────────┘
│  │ Row Level Security│  │
│  └───────────────────┘  │
└─────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Creating a New Bid

```
Admin clicks "Create Bid"
    ↓
Fill form (origin, destination, material, weight, dates)
    ↓
Submit form
    ↓
Frontend calculates expiry time (next 6 PM IST)
    ↓
Call Supabase RPC: generate_bid_number()
    ↓
Insert into bids table with generated ID
    ↓
Trigger webhook to n8n (POST to VITE_N8N_WEBHOOK_URL)
    ↓
n8n receives bid data + bid link
    ↓
n8n queries Supabase for active carriers
    ↓
n8n loops through carriers
    ↓
For each carrier: Send WhatsApp with bid link
    ↓
Admin sees bid in dashboard
    ↓
Real-time subscription updates UI automatically
```

### 2. Carrier Submitting an Offer

```
Carrier receives WhatsApp message
    ↓
Click link (e.g., https://yourapp.com/bid/uuid-123)
    ↓
CarrierBidPage loads bid details from Supabase
    ↓
Carrier fills offer form:
    • Company name
    • Contact person
    • Mobile number
    • Quoted price
    • Delivery date
    • Vehicle type (optional)
    ↓
Submit form
    ↓
Insert into offers table (linked to bid_id)
    ↓
Success page shown to carrier
    ↓
Admin dashboard updates in real-time (Supabase real-time)
    ↓
Admin sees new offer appear immediately
```

### 3. Auto-Expiry & Report Generation

```
Time: 6:00 PM IST every day
    ↓
[Nothing happens - bids just "expire" based on expires_at timestamp]
    ↓
Time: 6:05 PM IST every day
    ↓
Vercel Cron Job triggers /api/cron-generate-reports
    ↓
API queries: SELECT * FROM bids WHERE status='active' AND expires_at < NOW()
    ↓
For each expired bid:
    ↓
    Update status to 'expired'
    ↓
    Query all offers for this bid (sorted by price ASC)
    ↓
    Generate Excel workbook:
        • Sheet 1: Bid Summary (details + lowest bid)
        • Sheet 2: All Offers (sorted by price)
    ↓
    Save Excel report (in production, upload to S3 or similar)
    ↓
    Log report generation
    ↓
Return success response with reports metadata
```

### 4. Downloading Excel Report

```
Admin clicks "Export to Excel" on bid detail page
    ↓
Frontend calls: GET /api/export-bid/uuid-123
    ↓
API queries bid + all offers
    ↓
Generate Excel using SheetJS (xlsx library)
    ↓
Return Excel file as buffer
    ↓
Browser downloads file: BID-20260108-001-offers.xlsx
    ↓
Admin opens in Excel/Google Sheets
    ↓
Review all offers, pick winner
```

---

## Database Schema

### Tables

#### `bids`
```sql
• id (uuid, PK)
• bid_number (text, unique) - e.g., BID-20260108-001
• origin (text)
• destination (text)
• material_type (text)
• weight_tons (decimal)
• pickup_date (date)
• required_delivery_date (date)
• additional_notes (text, nullable)
• expires_at (timestamp with time zone)
• status (text) - 'active' | 'expired' | 'awarded'
• created_by (uuid, FK to auth.users)
• created_at, updated_at (timestamps)
```

#### `offers`
```sql
• id (uuid, PK)
• bid_id (uuid, FK to bids)
• company_name (text)
• person_name (text)
• mobile_number (text)
• alternate_number (text, nullable)
• quoted_price (decimal)
• estimated_delivery_date (date)
• vehicle_type (text, nullable)
• additional_comments (text, nullable)
• created_at (timestamp)
```

#### `carrier_contacts`
```sql
• id (uuid, PK)
• company_name (text)
• person_name (text)
• mobile_number (text, unique)
• alternate_number (text, nullable)
• is_active (boolean)
• created_at, updated_at (timestamps)
```

### Key Functions

#### `generate_bid_number()`
Generates sequential bid numbers per day:
- Format: `BID-YYYYMMDD-XXX`
- Example: `BID-20260108-001`, `BID-20260108-002`, etc.
- Resets sequence each day

#### `update_updated_at_column()`
Trigger function to auto-update `updated_at` on row changes

---

## Security Architecture

### Row Level Security (RLS)

**Bids Table:**
- Authenticated users (admins): Full access
- Public (carriers): Read-only by ID (for bid page)

**Offers Table:**
- Public: Can INSERT (submit offers)
- Authenticated users: Can SELECT (view all)

**Carrier Contacts Table:**
- Authenticated users: Full access
- Public: No access

### Authentication Flow

```
User → Login Form
    ↓
Supabase Auth (email/password)
    ↓
JWT token stored in browser
    ↓
All Supabase queries include token
    ↓
RLS policies enforce access control
```

### Environment Variables

```
Public (frontend):
• VITE_SUPABASE_URL          - Safe to expose
• VITE_SUPABASE_ANON_KEY     - Safe to expose
• VITE_N8N_WEBHOOK_URL       - Safe to expose

Private (server-side only):
• SUPABASE_SERVICE_ROLE_KEY  - NEVER expose to frontend
• CRON_SECRET                - Verify cron requests
```

---

## Real-Time Architecture

### Supabase Real-Time Subscriptions

**In Dashboard:**
```javascript
supabase
  .channel('bids-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'bids'
  }, () => {
    fetchBids() // Refresh data
  })
  .subscribe()
```

**In Bid Detail:**
```javascript
supabase
  .channel('offers-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'offers',
    filter: `bid_id=eq.${bidId}`
  }, () => {
    fetchOffers() // Refresh offers
  })
  .subscribe()
```

This ensures:
- New bids appear instantly for all admins
- New offers appear instantly without refresh
- Status changes sync across all open tabs

---

## Deployment Architecture

### Vercel (Frontend + API)
```
Git Push
    ↓
Automatic Build
    ↓
Deploy to Edge Network (global CDN)
    ↓
API routes become serverless functions
    ↓
Cron jobs scheduled automatically
```

**Benefits:**
- Zero-downtime deployments
- Automatic HTTPS
- Global CDN (fast everywhere)
- Automatic scaling
- Free SSL certificates

### Supabase (Backend)
```
PostgreSQL Database
    +
Real-time Engine (WebSockets)
    +
Authentication Service
    +
Row Level Security
```

**Benefits:**
- Managed database (no maintenance)
- Automatic backups
- Built-in auth
- Real-time subscriptions
- Generous free tier

---

## Scaling Considerations

### Current Architecture (0-100 bids/month)
- ✅ Free tier handles everything
- ✅ No performance issues
- ✅ No cost

### Growth Phase (100-1000 bids/month)
- ✅ Still on free tier likely
- ✅ May need Supabase Pro (~$25/month) for more storage
- ✅ Vercel free tier still sufficient

### Scale Phase (1000+ bids/month)
- Supabase Pro: $25/month
- Vercel Pro: $20/month
- Total: ~$45/month for unlimited scale

### Optimizations at Scale:
1. **Database Indexes**: Already included in schema
2. **Caching**: Add Redis for carrier contacts (if needed)
3. **CDN**: Already included (Vercel)
4. **Real-time**: Supabase scales automatically

---

## Monitoring & Observability

### What to Monitor:

1. **Vercel:**
   - Deployment status
   - API response times
   - Cron job execution logs
   - Build logs

2. **Supabase:**
   - Database queries
   - Real-time connections
   - Auth events
   - Storage usage

3. **n8n:**
   - Workflow execution logs
   - WhatsApp delivery status
   - Error logs

### Key Metrics:

- **Bid Creation Rate**: Bids created per day
- **Offer Submission Rate**: Offers per bid
- **WhatsApp Delivery**: Success rate of notifications
- **API Response Time**: Should be < 500ms
- **Database Query Time**: Should be < 100ms

---

## Disaster Recovery

### Backup Strategy:

1. **Database:**
   - Supabase auto-backups (daily)
   - Point-in-time recovery available
   - Manual backups: SQL dumps periodically

2. **Code:**
   - Git repository (version controlled)
   - Vercel keeps deployment history
   - Can rollback to any previous version

3. **Environment Variables:**
   - Document in secure location
   - Use 1Password or similar for team access

### Recovery Time:

- **Database restore**: < 1 hour (Supabase)
- **Code rollback**: < 5 minutes (Vercel)
- **Full system rebuild**: < 30 minutes (redeploy)

---

## Cost Breakdown (Detailed)

### Free Tier (Starts Here):
```
Supabase:
• 500 MB Database Storage
• 1 GB File Storage  
• 2 GB Bandwidth
• 50,000 Monthly Active Users
• Unlimited API requests

Vercel:
• Unlimited deployments
• 100 GB Bandwidth
• Automatic scaling
• Custom domain

Total: $0/month
```

### Paid Tier (When Needed):
```
Supabase Pro ($25/month):
• 8 GB Database Storage
• 100 GB File Storage
• 50 GB Bandwidth
• 100,000 Monthly Active Users
• Daily backups

Vercel Pro ($20/month):
• Everything from free tier
• Analytics
• More bandwidth
• Priority support

Total: $45/month
```

**You'll likely stay on free tier for first 6-12 months.**

---

This architecture is:
- ✅ **Simple**: No complex microservices
- ✅ **Reliable**: Enterprise-grade infrastructure
- ✅ **Scalable**: Grows with you automatically
- ✅ **Cost-effective**: Starts free, grows slowly
- ✅ **Maintainable**: Clean code, good documentation
- ✅ **Secure**: Modern best practices applied

**Built to last. Built to scale. Built to work.** 🚀
