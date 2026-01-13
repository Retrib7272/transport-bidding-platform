import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Plus, Trash2, Users } from 'lucide-react'

export default function CarriersPage() {
  const navigate = useNavigate()
  const [carriers, setCarriers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    company_name: '',
    person_name: '',
    mobile_number: '',
    alternate_number: ''
  })

  useEffect(() => {
    fetchCarriers()
  }, [])

  const fetchCarriers = async () => {
    const { data } = await supabase
      .from('carrier_contacts')
      .select('*')
      .eq('is_active', true)
      .order('company_name')

    if (data) setCarriers(data)
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const { error } = await supabase
      .from('carrier_contacts')
      .insert([formData])

    if (!error) {
      setFormData({ company_name: '', person_name: '', mobile_number: '', alternate_number: '' })
      setShowAddForm(false)
      fetchCarriers()
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to remove this carrier?')) {
      await supabase
        .from('carrier_contacts')
        .update({ is_active: false })
        .eq('id', id)
      
      fetchCarriers()
    }
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
              <h1 className="text-2xl font-bold text-slate-900">Carrier Contacts</h1>
              <p className="text-sm text-slate-500">Manage your transport carriers</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Carrier
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showAddForm && (
          <div className="card mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add New Carrier</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Company Name *"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="input-field"
                  required
                />
                <input
                  type="text"
                  placeholder="Contact Person Name *"
                  value={formData.person_name}
                  onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                  className="input-field"
                  required
                />
                <input
                  type="tel"
                  placeholder="Mobile Number *"
                  value={formData.mobile_number}
                  onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                  className="input-field"
                  required
                />
                <input
                  type="tel"
                  placeholder="Alternate Number"
                  value={formData.alternate_number}
                  onChange={(e) => setFormData({ ...formData, alternate_number: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary">Add Carrier</button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            All Carriers ({carriers.length})
          </h2>

          {carriers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">No carriers added yet</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary"
              >
                Add Your First Carrier
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {carriers.map((carrier) => (
                <div
                  key={carrier.id}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{carrier.company_name}</h3>
                    <p className="text-sm text-slate-600">{carrier.person_name}</p>
                    <div className="flex gap-4 mt-2 text-sm text-slate-600">
                      <span>📱 {carrier.mobile_number}</span>
                      {carrier.alternate_number && <span>📞 {carrier.alternate_number}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(carrier.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
