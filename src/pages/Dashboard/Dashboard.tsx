import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Users, Truck, ShoppingCart, TrendingUp, AlertTriangle, Calendar, Wallet } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useCalendar } from '../../hooks'
import './Dashboard.css'

interface DashboardStats {
  totalProducts: number
  totalCustomers: number
  totalWholesalers: number
  lowStockProducts: { name: string; total_stock: number }[]
  recentSales: { id: string; customer_name: string; total_amount: number; created_at: string }[]
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCustomers: 0,
    totalWholesalers: 0,
    lowStockProducts: [],
    recentSales: []
  })
  const [loading, setLoading] = useState(true)
  const { notes } = useCalendar()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.rpc('get_dashboard_stats')

        if (error) throw error

        if (data) {
          // RPC returns JSON, so we map it to our state
          const statsData = data as any
          setStats({
            totalProducts: statsData.total_products,
            totalCustomers: statsData.total_customers,
            totalWholesalers: statsData.total_wholesalers,
            lowStockProducts: statsData.low_stock_products || [],
            recentSales: statsData.recent_sales || []
          })
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    { 
      label: 'Toplam Ürün', 
      value: stats.totalProducts.toString(), 
      icon: Package, 
      color: 'primary',
      link: '/stock'
    },
    { 
      label: 'Müşteriler', 
      value: stats.totalCustomers.toString(), 
      icon: Users, 
      color: 'success',
      link: '/customers'
    },
    { 
      label: 'Firmalar', 
      value: stats.totalWholesalers.toString(), 
      icon: Truck, 
      color: 'warning',
      link: '/wholesalers'
    },
  ]

  // Get upcoming notes (today and future, max 7 days)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekLater = new Date(today)
  weekLater.setDate(weekLater.getDate() + 7)

  const upcomingNotes = notes
    .filter(note => {
      const noteDate = new Date(note.date + 'T00:00:00')
      return noteDate >= today && noteDate <= weekLater
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="dashboard animate-slideUp">
      <header className="page-header">
        <h1 className="page-title">Anasayfa</h1>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 stats-grid">
        {statCards.map((stat) => (
          <Link key={stat.label} to={stat.link} className="card stat-card clickable">
            <div className={`stat-icon ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <section className="dashboard-section">
        <h2 className="section-title">Hızlı İşlemler</h2>
        <div className="quick-actions">
          <Link to="/sales" className="btn btn-primary">
            <ShoppingCart size={18} />
            Satış Yap
          </Link>
          <Link to="/wholesalers" className="btn btn-primary">
            <Truck size={18} />
            Alış Yap
          </Link>
          <Link to="/payments" className="btn btn-warning">
            <Wallet size={18} />
            Tahsilat
          </Link>
          <Link to="/stock" className="btn btn-secondary">
            <Package size={18} />
            Stok Yönetimi
          </Link>
          <Link to="/transactions" className="btn btn-secondary">
            <TrendingUp size={18} />
            İşlem Geçmişi
          </Link>
        </div>
      </section>

      {/* Calendar Notes & Recent Activity */}
      <div className="grid grid-cols-3 dashboard-grid">
        {/* Upcoming Calendar Notes */}
        <section className="card calendar-card">
          <div className="card-header">
            <h3 className="card-title">
              <Calendar size={18} />
              Yaklaşan Notlar
            </h3>
            <Link to="/calendar" className="btn btn-secondary btn-sm">
              Tümünü Gör
            </Link>
          </div>
          {upcomingNotes.length === 0 ? (
            <div className="empty-state small">
              <Calendar size={32} className="empty-state-icon" />
              <p>Yaklaşan not yok</p>
            </div>
          ) : (
            <div className="upcoming-notes">
              {upcomingNotes.map(note => (
                <div key={note.id} className="note-item">
                  <div className="note-date-badge">
                    {new Date(note.date + 'T00:00:00').toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </div>
                  <div className="note-details">
                    <span className="note-title">{note.title}</span>
                    {note.description && (
                      <span className="note-desc">{note.description}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Sales */}
        <section className="card">
          <div className="card-header">
            <h3 className="card-title">
              <TrendingUp size={18} />
              Son Satışlar
            </h3>
          </div>
          {stats.recentSales.length === 0 ? (
            <div className="empty-state small">
              <ShoppingCart size={32} className="empty-state-icon" />
              <p>Henüz satış yok</p>
            </div>
          ) : (
            <div className="recent-sales-list">
              {stats.recentSales.map(sale => (
                <div key={sale.id} className="recent-sale-item">
                  <div className="sale-info">
                    <span className="sale-customer">{sale.customer_name}</span>
                    <span className="sale-date">
                      {new Date(sale.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <span className="sale-amount">₺{Number(sale.total_amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Low Stock */}
        <section className="card">
          <div className="card-header">
            <h3 className="card-title">
              <AlertTriangle size={18} />
              Düşük Stok
            </h3>
          </div>
          {stats.lowStockProducts.length === 0 ? (
            <div className="empty-state small">
              <Package size={32} className="empty-state-icon" />
              <p>Stoklar yeterli</p>
            </div>
          ) : (
            <div className="low-stock-list">
              {stats.lowStockProducts.map((product, i) => (
                <div key={i} className="low-stock-item">
                  <span className="product-name">{product.name}</span>
                  <span className={`stock-count ${product.total_stock === 0 ? 'zero' : ''}`}>
                    {product.total_stock} adet
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
