import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDateIST, getTimeRemaining } from '../lib/utils'
import { ArrowLeft, Download, Package, MapPin, TrendingUp } from 'lucide-react'

export default function BidDetailPage() {
  const { bidId } = useParams()
  const navigate = useNavigate()
  const [bid, setBid] = useState(null)
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBidAndOffers()

    const channel = supabase
      .channel('offers-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'offers',
        filter: `bid_id=eq.${bidId}` 
      }, () => {
        fetchBidAndOffers()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bidId])

  const fetchBidAndOffers = async () => {
    const { data: bidData } = await supabase
      .from('bids')
      .select('*')
      .eq('id', bidId)
      .single()

    const { data: offersData } = await supabase
      .from('offers')
      .select('*')
      .eq('bid_id', bidId)
      .order('quoted_price', { ascending: true })

    if (bidData) setBid(bidData)
    if (offersData) setOffers(offersData)
    setLoading(false)
  }

  const exportToExcel = async () => {
    // Call the API endpoint to generate Excel
    const response = await fetch(`/api/export-bid/${bidId}`)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${bid.bid_number}-offers.xlsx`
    a.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{bid.bid_number}</h1>
              <p className="text-sm text-slate-500">Bid Details & Offers</p>
            </div>
          </div>
          <button
            onClick={exportToExcel}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export to Excel
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="card sticky top-8">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Bid Information</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Route</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <p className="font-medium text-slate-900">{bid.origin} → {bid.destination}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1">Material</p>
                  <p className="font-medium text-slate-900">{bid.material_type}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1">Weight</p>
                  <p className="font-medium text-slate-900">{bid.weight_tons} tons</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1">Pickup Date</p>
                  <p className="font-medium text-slate-900">{formatDateIST(bid.pickup_date, 'dd MMM yyyy')}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1">Required Delivery</p>
                  <p className="font-medium text-slate-900">{formatDateIST(bid.required_delivery_date, 'dd MMM yyyy')}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    bid.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {bid.status}
                  </span>
                </div>

                {bid.status === 'active' && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm font-medium text-orange-600">
                      {getTimeRemaining(bid.expires_at)}
                    </p>
                  </div>
                )}

                {bid.additional_notes && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Additional Notes</p>
                    <p className="text-sm text-slate-700">{bid.additional_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Offers Received ({offers.length})
                </h2>
              </div>

              {offers.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No offers received yet</p>
                  <p className="text-sm text-slate-500 mt-2">Carriers will submit their bids before expiry</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {offers.map((offer, index) => (
                    <div
                      key={offer.id}
                      className={`p-5 rounded-lg border-2 ${
                        index === 0 
                          ? 'bg-green-50 border-green-300' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">{offer.company_name}</h3>
                          <p className="text-sm text-slate-600">{offer.person_name}</p>
                        </div>
                        {index === 0 && (
                          <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
                            LOWEST BID
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Quoted Price</p>
                          <p className="text-xl font-bold text-slate-900">₹{offer.quoted_price.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Delivery Date</p>
                          <p className="text-sm font-medium text-slate-900">
                            {formatDateIST(offer.estimated_delivery_date, 'dd MMM yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Vehicle Type</p>
                          <p className="text-sm font-medium text-slate-900">{offer.vehicle_type || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Submitted</p>
                          <p className="text-sm font-medium text-slate-900">
                            {formatDateIST(offer.created_at, 'HH:mm')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-600 pt-3 border-t border-slate-200">
                        <span>📱 {offer.mobile_number}</span>
                        {offer.alternate_number && <span>📞 {offer.alternate_number}</span>}
                      </div>

                      {offer.additional_comments && (
                        <div className="mt-3 p-3 bg-white rounded text-sm text-slate-700">
                          <p className="text-xs text-slate-500 mb-1">Comments:</p>
                          {offer.additional_comments}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
