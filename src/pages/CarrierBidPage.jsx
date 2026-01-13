import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDateIST, getTimeRemaining } from '../lib/utils'
import { Package, MapPin, Calendar, Weight, TrendingUp, CheckCircle, Clock } from 'lucide-react'

export default function CarrierBidPage() {
  const { bidId } = useParams()
  const [bid, setBid] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    company_name: '',
    person_name: '',
    mobile_number: '',
    alternate_number: '',
    quoted_price: '',
    estimated_delivery_date: '',
    vehicle_type: '',
    additional_comments: ''
  })

  useEffect(() => {
    fetchBid()
  }, [bidId])

  const fetchBid = async () => {
    const { data, error } = await supabase
      .from('bids')
      .select('*')
      .eq('id', bidId)
      .single()

    if (!error && data) {
      setBid(data)
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('offers')
        .insert([
          {
            bid_id: bidId,
            ...formData,
            quoted_price: parseFloat(formData.quoted_price)
          }
        ])

      if (error) throw error

      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting offer:', error)
      alert('Failed to submit offer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg text-slate-600">Loading bid details...</div>
      </div>
    )
  }

  if (!bid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="card text-center max-w-md">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Bid Not Found</h2>
          <p className="text-slate-600">This bid may have been removed or the link is invalid.</p>
        </div>
      </div>
    )
  }

  const isExpired = bid.status !== 'active'

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="card text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Offer Submitted Successfully!</h2>
          <p className="text-slate-600 mb-4">
            Thank you for submitting your offer. We will review all bids and contact you if selected.
          </p>
          <div className="p-4 bg-slate-50 rounded-lg text-left">
            <p className="text-sm text-slate-600 mb-1">Bid Number</p>
            <p className="font-bold text-slate-900">{bid.bid_number}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-900">{bid.bid_number}</h1>
              </div>
              <p className="text-slate-600">Transport Bid Request</p>
            </div>
            {!isExpired ? (
              <div className="px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                <Clock className="w-4 h-4 text-orange-600 inline mr-2" />
                <span className="text-sm font-medium text-orange-600">
                  {getTimeRemaining(bid.expires_at)}
                </span>
              </div>
            ) : (
              <div className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg">
                <span className="text-sm font-medium text-slate-600">Bidding Closed</span>
              </div>
            )}
          </div>

          {/* Bid Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Route</p>
                <p className="font-bold text-slate-900">{bid.origin} → {bid.destination}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Material</p>
                <p className="font-bold text-slate-900">{bid.material_type}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Weight className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Weight</p>
                <p className="font-bold text-slate-900">{bid.weight_tons} tons</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Pickup Date</p>
                <p className="font-bold text-slate-900">{formatDateIST(bid.pickup_date, 'dd MMM yyyy')}</p>
              </div>
            </div>
          </div>

          {bid.additional_notes && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-2">Additional Notes</p>
              <p className="text-sm text-slate-700">{bid.additional_notes}</p>
            </div>
          )}
        </div>

        {/* Offer Form */}
        {!isExpired ? (
          <form onSubmit={handleSubmit} className="card">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Submit Your Offer</h2>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    name="person_name"
                    value={formData.person_name}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="+91XXXXXXXXXX"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Alternate Number
                  </label>
                  <input
                    type="tel"
                    name="alternate_number"
                    value={formData.alternate_number}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="+91XXXXXXXXXX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quoted Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="quoted_price"
                    value={formData.quoted_price}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Enter your price"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Estimated Delivery Date *
                  </label>
                  <input
                    type="date"
                    name="estimated_delivery_date"
                    value={formData.estimated_delivery_date}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Vehicle Type
                </label>
                <input
                  type="text"
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., 20 Ton Container Truck"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Additional Comments
                </label>
                <textarea
                  name="additional_comments"
                  value={formData.additional_comments}
                  onChange={handleChange}
                  rows="3"
                  className="input-field resize-none"
                  placeholder="Any additional information..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {submitting ? (
                  'Submitting Offer...'
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    Submit Offer
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="card text-center">
            <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Bidding Period Ended</h2>
            <p className="text-slate-600">This bid has expired and is no longer accepting offers.</p>
          </div>
        )}
      </div>
    </div>
  )
}
