import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { formatInTimeZone } from 'date-fns-tz'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const IST_TIMEZONE = 'Asia/Kolkata'

export default async function handler(req, res) {
  // Verify this is from Vercel Cron
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const now = new Date()
    const currentIST = formatInTimeZone(now, IST_TIMEZONE, 'yyyy-MM-dd HH:mm:ss')

    console.log(`[CRON] Running at ${currentIST} IST`)

    // Find all bids that expired (status = active but expires_at < now)
    const { data: expiredBids, error } = await supabase
      .from('bids')
      .select('*')
      .eq('status', 'active')
      .lt('expires_at', now.toISOString())

    if (error) throw error

    console.log(`[CRON] Found ${expiredBids?.length || 0} expired bids`)

    const reports = []

    for (const bid of expiredBids || []) {
      // Update bid status to expired
      await supabase
        .from('bids')
        .update({ status: 'expired' })
        .eq('id', bid.id)

      // Fetch offers
      const { data: offers } = await supabase
        .from('offers')
        .select('*')
        .eq('bid_id', bid.id)
        .order('quoted_price', { ascending: true })

      // Generate Excel report
      const wb = XLSX.utils.book_new()

      // Bid Summary
      const bidSummary = [
        ['BID REPORT'],
        ['Generated At', currentIST + ' IST'],
        [],
        ['Bid Number', bid.bid_number],
        ['Origin', bid.origin],
        ['Destination', bid.destination],
        ['Material Type', bid.material_type],
        ['Weight (Tons)', bid.weight_tons],
        ['Pickup Date', bid.pickup_date],
        ['Required Delivery Date', bid.required_delivery_date],
        ['Total Offers Received', offers?.length || 0],
        [],
        ['LOWEST BID', offers?.[0] ? `₹${offers[0].quoted_price.toLocaleString()} by ${offers[0].company_name}` : 'No offers received']
      ]

      const ws1 = XLSX.utils.aoa_to_sheet(bidSummary)
      XLSX.utils.book_append_sheet(wb, ws1, 'Summary')

      // All Offers
      if (offers && offers.length > 0) {
        const offersData = [
          ['Rank', 'Company', 'Contact Person', 'Mobile', 'Alt Mobile', 'Price (₹)', 'Delivery Date', 'Vehicle', 'Comments', 'Submitted At'],
          ...offers.map((offer, idx) => [
            idx + 1,
            offer.company_name,
            offer.person_name,
            offer.mobile_number,
            offer.alternate_number || '',
            offer.quoted_price,
            offer.estimated_delivery_date,
            offer.vehicle_type || '',
            offer.additional_comments || '',
            formatInTimeZone(new Date(offer.created_at), IST_TIMEZONE, 'dd MMM yyyy HH:mm')
          ])
        ]

        const ws2 = XLSX.utils.aoa_to_sheet(offersData)
        ws2['!cols'] = [
          { wch: 6 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
          { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 18 }
        ]
        
        XLSX.utils.book_append_sheet(wb, ws2, 'All Offers')
      }

      // Save to temporary location (in production, you'd upload to S3 or similar)
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      
      reports.push({
        bidId: bid.id,
        bidNumber: bid.bid_number,
        offersCount: offers?.length || 0,
        reportGenerated: true
      })

      console.log(`[CRON] Generated report for ${bid.bid_number}`)
    }

    res.status(200).json({
      success: true,
      timestamp: currentIST,
      expiredBidsCount: expiredBids?.length || 0,
      reports
    })
  } catch (error) {
    console.error('[CRON] Error:', error)
    res.status(500).json({ error: error.message })
  }
}
