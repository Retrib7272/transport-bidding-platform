# ⚡ Quick Start Guide

Get your bidding platform running in 30 minutes!

## 📋 Checklist

### ✅ Phase 1: Setup (10 min)
- [ ] Create Supabase account
- [ ] Run database setup SQL
- [ ] Create 2 admin users
- [ ] Copy API keys

### ✅ Phase 2: Deploy (10 min)
- [ ] Install Node.js
- [ ] Run `npm install`
- [ ] Create `.env` file
- [ ] Test locally: `npm run dev`
- [ ] Deploy to Vercel: `vercel --prod`

### ✅ Phase 3: Connect n8n (5 min)
- [ ] Import n8n workflow from `N8N_WORKFLOW.json`
- [ ] Configure WhatsApp Business credentials
- [ ] Copy webhook URL
- [ ] Update `VITE_N8N_WEBHOOK_URL` in Vercel
- [ ] Redeploy: `vercel --prod`

### ✅ Phase 4: Add Carriers (3 min)
- [ ] Login to your app
- [ ] Go to Carriers page
- [ ] Add all 10 carrier contacts

### ✅ Phase 5: Test (2 min)
- [ ] Create a test bid
- [ ] Verify WhatsApp messages sent
- [ ] Submit a test offer
- [ ] Check dashboard updates

---

## 🎯 What You'll Have

After following this guide, you'll have:

1. **A live web application** accessible from anywhere
2. **Automatic WhatsApp notifications** via n8n
3. **Real-time bid tracking** with instant updates
4. **Auto-expiring bids** at 6 PM IST daily
5. **Excel reports** generated automatically at 6:05 PM IST
6. **Mobile-friendly** interface for carriers
7. **Secure admin portal** for your team

---

## 🚦 Your First Bid

1. **Login** to your app
2. **Click** "Create New Bid"
3. **Fill in**:
   - Origin: Nagpur
   - Destination: Delhi (or any city)
   - Material: Fabric (or any material)
   - Weight: 50 tons
   - Dates: Pick upcoming dates
4. **Submit** - WhatsApp messages sent automatically!
5. **Carriers receive** link to submit offers
6. **You see** all offers in real-time
7. **At 6 PM IST** - Bid expires
8. **At 6:05 PM IST** - Excel report ready to download

---

## 📱 How Carriers Use It

1. They receive WhatsApp message
2. Click the link (works on any device)
3. See bid details
4. Fill simple form:
   - Company name
   - Contact person
   - Mobile number
   - Price quote
   - Delivery date
5. Submit offer
6. Done! ✅

---

## 💡 Pro Tips

### For Maximum Efficiency:
- Create bids in the morning so carriers have full day to respond
- Set pickup dates 3-5 days out to give adequate prep time
- Add clear notes for special requirements
- Export Excel after 6:05 PM to review all offers
- Call the lowest bidder to confirm and award

### For Better Offers:
- Post bids regularly (carriers start to anticipate)
- Be clear about requirements
- Honor your selection (builds trust)
- Provide feedback to carriers

### For Growth:
- Add more carriers as you discover reliable ones
- Track which carriers consistently offer good rates
- Use the data to negotiate better deals

---

## 🔐 Security Notes

- **Never share** your service role key publicly
- **Only give** admin login to trusted team members
- **Keep** your CRON_SECRET random and secret
- **Backup** your Supabase data regularly (it's automatic!)

---

## 📞 When You Need Help

Most issues are solved by:
1. **Redeploying**: `vercel --prod`
2. **Checking logs**: `vercel logs`
3. **Verifying env vars**: `vercel env ls`
4. **Testing locally**: `npm run dev`

The system is designed to be self-healing and resilient!

---

## 🎉 That's It!

You now have a professional transport bidding platform that would cost ₹5-10 lakhs to build from an agency.

You built it in 30 minutes.

**Welcome to the future of your logistics operations!** 🚛📈
