import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Plus, LogOut, TrendingUp, Clock, CheckCircle, Users, Package } from 'lucide-react'
import { formatDateIST, getTimeRemaining } from '../lib/utils'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    active: 0,
    expired: 0,
    totalOffers: 0
  })

  useEffect(() => {
    fetchBids()
    fetchStats()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('bids-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, () => {
        fetchBids()
        fetchStats()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchBids = async () => {
    const { data, error } = await supabase
      .from('bids')
      .select(`
        *,
        offers (count)
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setBids(data)
    }
    setLoading(false)
  }

  const fetchStats = async () => {
    const { data: activeBids } = await supabase
      .from('bids')
      .select('id', { count: 'exact' })
      .eq('status', 'active')

    const { data: expiredBids } = await supabase
      .from('bids')
      .select('id', { count: 'exact' })
      .eq('status', 'expired')

    const { data: allOffers } = await supabase
      .from('offers')
      .select('id', { count: 'exact' })

    setStats({
      active: activeBids?.length || 0,
      expired: expiredBids?.length || 0,
      totalOffers: allOffers?.length || 0
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-700 border-green-200',
      expired: 'bg-slate-100 text-slate-600 border-slate-200',
      awarded: 'bg-blue-100 text-blue-700 border-blue-200'
    }
    return `px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.active}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg text-slate-600">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Transport Bidding</h1>
              <p className="text-sm text-slate-500">Admin Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/carriers')}
              className="btn-secondary flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Carriers
            </button>
            <button
              onClick={() => navigate('/create-bid')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Bid
            </button>
            <button
              onClick={handleLogout}
              className="p-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Active Bids</p>
              <p className="text-3xl font-bold text-slate-900">{stats.active}</p>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Expired Bids</p>
              <p className="text-3xl font-bold text-slate-900">{stats.expired}</p>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Offers</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalOffers}</p>
            </div>
          </div>
        </div>

        {/* Bids List */}
        <div className="card">
          <h2 className="text-xl font-bold text-slate-900 mb-6">All Bids</h2>
          
          {bids.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">No bids created yet</p>
              <button
                onClick={() => navigate('/create-bid')}
                className="btn-primary"
              >
                Create Your First Bid
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bids.map((bid) => (
                <div
                  key={bid.id}
                  onClick={() => navigate(`/bid-detail/${bid.id}`)}
                  className="p-5 bg-slate-50 hover:bg-slate-100 rounded-lg border-2 border-slate-200 hover:border-blue-400 cursor-pointer transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {bid.bid_number}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {bid.origin} → {bid.destination}
                      </p>
                    </div>
                    <span className={getStatusBadge(bid.status)}>
                      {bid.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Material</p>
                      <p className="text-sm font-medium text-slate-900">{bid.material_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Weight</p>
                      <p className="text-sm font-medium text-slate-900">{bid.weight_tons} tons</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Pickup Date</p>
                      <p className="text-sm font-medium text-slate-900">
                        {formatDateIST(bid.pickup_date, 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Offers Received</p>
                      <p className="text-sm font-medium text-blue-600">{bid.offers[0]?.count || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Created {formatDateIST(bid.created_at, 'PPp')}
                    </span>
                    {bid.status === 'active' && (
                      <span className="text-orange-600 font-medium">
                        {getTimeRemaining(bid.expires_at)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
