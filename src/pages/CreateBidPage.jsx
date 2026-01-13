import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { calculateExpiryTime, generateBidLink } from '../lib/utils'
import { ArrowLeft, Send, Package } from 'lucide-react'

export default function CreateBidPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    origin: 'Nagpur',
    destination: '',
    material_type: '',
    weight_tons: '',
    pickup_date: '',
    required_delivery_date: '',
    additional_notes: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const expiresAt = calculateExpiryTime()
      
      // Generate bid number
      const { data: bidNumberData } = await supabase.rpc('generate_bid_number')
      
      // Get current user
const { data: { user } } = await supabase.auth.getUser()

// Create bid
const { data: bid, error: bidError } = await supabase
  .from('bids')
  .insert([
    {
      bid_number: bidNumberData,
      ...formData,
      weight_tons: parseFloat(formData.weight_tons),
      expires_at: expiresAt.toISOString(),
      status: 'active',
      created_by: user?.id || null  // Add user ID if available
    }
  ])
  .select()
  .single()

      if (bidError) throw bidError

      // Trigger n8n webhook to notify carriers (optional - skip if not configured)
const bidLink = generateBidLink(bid.id)
const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL

// Only call webhook if it's properly configured (not placeholder)
if (webhookUrl && !webhookUrl.includes('placeholder')) {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'bid_created',
        bid_id: bid.id,
        bid_number: bid.bid_number,
        origin: bid.origin,
        destination: bid.destination,
        material: bid.material_type,
        weight: bid.weight_tons,
        pickup_date: bid.pickup_date,
        delivery_date: bid.required_delivery_date,
        bid_link: bidLink,
        expires_at: expiresAt.toISOString()
      })
    })
  } catch (error) {
    console.log('Webhook notification skipped:', error.message)
    // Don't fail bid creation if webhook fails
  }
}

      navigate('/dashboard')
    } catch (error) {
      console.error('Error creating bid:', error)
      alert('Failed to create bid. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Create New Bid</h1>
              <p className="text-sm text-slate-500">Post a new transport requirement</p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="card">
          <div className="space-y-6">
            {/* Route Section */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Route Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Origin City
                  </label>
                  <input
                    type="text"
                    name="origin"
                    value={formData.origin}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Destination City *
                  </label>
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., Delhi"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Shipment Details */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Shipment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Material Type *
                  </label>
                  <input
                    type="text"
                    name="material_type"
                    value={formData.material_type}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., Fabric"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Weight (Tons) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="weight_tons"
                    value={formData.weight_tons}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., 50"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Date Details */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Schedule</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Pickup Date *
                  </label>
                  <input
                    type="date"
                    name="pickup_date"
                    value={formData.pickup_date}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Required Delivery Date *
                  </label>
                  <input
                    type="date"
                    name="required_delivery_date"
                    value={formData.required_delivery_date}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                name="additional_notes"
                value={formData.additional_notes}
                onChange={handleChange}
                rows="4"
                className="input-field resize-none"
                placeholder="Any special requirements or instructions..."
              />
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                ℹ️ <strong>Auto-Expiry:</strong> This bid will automatically expire at the next 6:00 PM IST. 
                An Excel report will be generated at 6:05 PM with all offers received.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Creating Bid...'
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Create Bid & Notify Carriers
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
