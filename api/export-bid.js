import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const { bidId } = req.query

  try {
    // Fetch bid details
    const { data: bid } = await supabase
      .from('bids')
      .select('*')
      .eq('id', bidId)
      .single()

    // Fetch all offers
    const { data: offers } = await supabase
      .from('offers')
      .select('*')
      .eq('bid_id', bidId)
      .order('quoted_price', { ascending: true })

    // Create Excel workbook
    const wb = XLSX.utils.book_new()

    // Bid Summary Sheet
    const bidSummary = [
      ['Bid Number', bid.bid_number],
      ['Origin', bid.origin],
      ['Destination', bid.destination],
      ['Material Type', bid.material_type],
      ['Weight (Tons)', bid.weight_tons],
      ['Pickup Date', bid.pickup_date],
      ['Required Delivery Date', bid.required_delivery_date],
      ['Status', bid.status],
      ['Total Offers', offers.length],
      [],
      ['Generated At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })]
    ]

    const ws1 = XLSX.utils.aoa_to_sheet(bidSummary)
    XLSX.utils.book_append_sheet(wb, ws1, 'Bid Summary')

    // Offers Sheet
    const offersData = [
      [
        'Rank',
        'Company Name',
        'Contact Person',
        'Mobile Number',
        'Alternate Number',
        'Quoted Price (₹)',
        'Estimated Delivery Date',
        'Vehicle Type',
        'Additional Comments',
        'Submitted At'
      ],
      ...offers.map((offer, index) => [
        index + 1,
        offer.company_name,
        offer.person_name,
        offer.mobile_number,
        offer.alternate_number || '',
        offer.quoted_price,
        offer.estimated_delivery_date,
        offer.vehicle_type || '',
        offer.additional_comments || '',
        new Date(offer.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      ])
    ]

    const ws2 = XLSX.utils.aoa_to_sheet(offersData)
    
    // Set column widths
    ws2['!cols'] = [
      { wch: 8 },  // Rank
      { wch: 25 }, // Company Name
      { wch: 20 }, // Contact Person
      { wch: 15 }, // Mobile
      { wch: 15 }, // Alternate
      { wch: 15 }, // Price
      { wch: 18 }, // Delivery Date
      { wch: 20 }, // Vehicle Type
      { wch: 30 }, // Comments
      { wch: 20 }  // Submitted At
    ]

    XLSX.utils.book_append_sheet(wb, ws2, 'All Offers')

    // Generate buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${bid.bid_number}-offers.xlsx"`)
    
    res.send(excelBuffer)
  } catch (error) {
    console.error('Error generating Excel:', error)
    res.status(500).json({ error: 'Failed to generate Excel report' })
  }
}
