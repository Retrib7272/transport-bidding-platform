# 🚀 Deployment Guide

This guide will take you from zero to a live bidding platform in ~30 minutes.

## Prerequisites

1. A computer with internet access
2. Basic ability to copy/paste commands
3. That's it! We'll guide you through everything else.

---

## Step 1: Setup Supabase (5 minutes)

### 1.1 Create Supabase Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub or Email
4. Create a new project:
   - **Name**: `transport-bidding`
   - **Database Password**: (generate a strong password and save it!)
   - **Region**: Choose closest to Nagpur (Southeast Asia - Mumbai)
   - Click "Create new project"

### 1.2 Run Database Setup
1. Wait for project to be ready (~2 minutes)
2. Click "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy and paste the entire content from `DATABASE_SCHEMA.md`
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

### 1.3 Get Your API Keys
1. Click "Settings" (gear icon) → "API"
2. Copy these values (you'll need them):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJh...` (long string)
   - **service_role key**: `eyJh...` (another long string - keep this secret!)

### 1.4 Create Admin Users
1. Go to "Authentication" → "Users" in Supabase
2. Click "Add user" → "Create new user"
3. Enter email and password for first admin
4. Repeat for second admin user

✅ **Supabase is ready!**

---

## Step 2: Deploy to Vercel (10 minutes)

### 2.1 Install Git and Node.js (if not already installed)

**On Mac:**
```bash
# Install Homebrew (if needed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

**On Windows:**
1. Download Node.js from https://nodejs.org (LTS version)
2. Run installer
3. Download Git from https://git-scm.com/download/win
4. Run installer

### 2.2 Prepare the Code
```bash
# Navigate to the project folder
cd transport-bidding-platform

# Copy environment example
cp .env.example .env

# Edit .env file with your values:
# - Replace VITE_SUPABASE_URL with your Supabase Project URL
# - Replace VITE_SUPABASE_ANON_KEY with your anon key
# - Replace SUPABASE_SERVICE_ROLE_KEY with your service role key
# - Replace VITE_N8N_WEBHOOK_URL with your n8n webhook (we'll set this up next)
# - Replace CRON_SECRET with a random string (use a password generator)

# Install dependencies
npm install
```

### 2.3 Test Locally
```bash
# Run the development server
npm run dev

# Open browser to http://localhost:3000
# You should see the login page!
# Try logging in with the admin credentials you created in Supabase
```

### 2.4 Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel (will open browser)
vercel login

# Deploy!
vercel

# Follow prompts:
# - Setup and deploy? Y
# - Which scope? (choose your account)
# - Link to existing project? N
# - What's your project's name? transport-bidding-platform
# - In which directory is your code located? ./
# - Want to override settings? N

# After deployment completes, you'll get a URL like:
# https://transport-bidding-platform.vercel.app
```

### 2.5 Configure Environment Variables in Vercel
```bash
# Set environment variables (use your actual values!)
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add VITE_N8N_WEBHOOK_URL production
vercel env add CRON_SECRET production

# Redeploy with env vars
vercel --prod
```

✅ **Your app is live!**

---

## Step 3: Setup n8n Webhook (10 minutes)

You already have n8n running, so let's create the workflow.

### 3.1 Create Webhook Node
1. Open your n8n instance
2. Create a new workflow: "Transport Bid Notifications"
3. Add a **Webhook** node:
   - **Method**: POST
   - **Path**: `bid-created`
   - Copy the **Production URL** (e.g., `https://your-n8n.com/webhook/bid-created`)

### 3.2 Add Carrier Contacts Node
Add a **Supabase** node:
- **Operation**: Select rows
- **Table**: `carrier_contacts`
- **Filter**: `is_active = true`

### 3.3 Add Loop & WhatsApp Nodes
1. Add **Split In Batches** node (to loop through carriers)
2. Add **WhatsApp Business** node for each carrier:
   - **To**: `{{ $json.mobile_number }}`
   - **Message**:
   ```
   🚛 *New Transport Bid Available*

   *Bid ID:* {{ $node["Webhook"].json["body"]["bid_number"] }}

   📦 *Shipment Details:*
   • Material: {{ $node["Webhook"].json["body"]["material"] }}
   • Weight: {{ $node["Webhook"].json["body"]["weight"] }} tons
   • Route: {{ $node["Webhook"].json["body"]["origin"] }} → {{ $node["Webhook"].json["body"]["destination"] }}
   • Pickup: {{ $node["Webhook"].json["body"]["pickup_date"] }}

   💰 Submit your best offer:
   {{ $node["Webhook"].json["body"]["bid_link"] }}

   ⏰ Bidding closes at 6:00 PM IST today

   ---
   Questions? Reply to this message
   ```

### 3.4 Update Your .env and Redeploy
```bash
# Update VITE_N8N_WEBHOOK_URL in .env with your n8n webhook URL
# Then redeploy
vercel --prod
```

✅ **Webhook integration complete!**

---

## Step 4: Add Your Carriers (5 minutes)

1. Go to your deployed app: `https://your-app.vercel.app`
2. Login with admin credentials
3. Click "Carriers" in the navigation
4. Add each of your 10 carrier contacts

---

## Step 5: Test Everything! (5 minutes)

1. Click "Create New Bid"
2. Fill in the form:
   - Origin: Nagpur
   - Destination: Delhi
   - Material: Test Fabric
   - Weight: 10 tons
   - Pickup date: Tomorrow
   - Delivery date: 2 days from now
3. Click "Create Bid & Notify Carriers"
4. Check:
   - ✅ Did all carriers receive WhatsApp message?
   - ✅ Can you open the bid link and submit an offer?
   - ✅ Does the offer appear in the dashboard?

---

## 🎉 You're Live!

Your transport bidding platform is now:
- ✅ Live on the internet
- ✅ Accessible from any device
- ✅ Sending WhatsApp notifications
- ✅ Auto-expiring bids at 6 PM IST
- ✅ Generating Excel reports at 6:05 PM IST

---

## Next Steps

1. **Get a custom domain** (optional):
   - Buy domain from Namecheap or Cloudflare (~₹800/year)
   - In Vercel dashboard, go to Settings → Domains
   - Add your domain and follow DNS instructions

2. **Backup your data**:
   - Supabase has automatic backups
   - For manual backup: Go to Database → Backups in Supabase

3. **Monitor usage**:
   - Vercel dashboard shows deployment stats
   - Supabase dashboard shows database usage

---

## Troubleshooting

### Issue: "Failed to create bid"
- **Solution**: Check that all environment variables are set correctly in Vercel
- Run: `vercel env ls` to see your environment variables

### Issue: "WhatsApp messages not sending"
- **Solution**: Verify n8n webhook URL is correct in environment variables
- Test webhook manually using Postman or curl

### Issue: "Can't login"
- **Solution**: Verify you created admin users in Supabase Authentication

### Issue: "Excel report not generating at 6:05 PM"
- **Solution**: Cron job runs at 6:05 PM IST (18:05 IST = 12:35 PM UTC)
- Check Vercel logs for cron execution

---

## Cost Breakdown

- **Supabase Free Tier**: 500MB database, 2GB bandwidth (more than enough to start)
- **Vercel Free Tier**: Unlimited deployments, 100GB bandwidth
- **Domain** (optional): ~₹800/year
- **Total to start**: ₹0 (Free!)
- **When you grow**: ~₹2000-3000/month for 1000+ bids

---

## Support

If you encounter issues:
1. Check the logs: `vercel logs` in terminal
2. Check Supabase logs in dashboard
3. Check n8n execution logs

The system is designed to be resilient and self-healing. Most issues resolve themselves within minutes.
