import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Menu, X,
  LayoutDashboard, Users,
  ShoppingCart, History,
  Wallet, Truck, Calendar, Package, Building2
} from 'lucide-react'
import './Layout.css'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Anasayfa' },
  { to: '/calendar', icon: Calendar, label: 'Takvim' },
  { to: '/stock', icon: Package, label: 'Stok' },
  { to: '/sales', icon: ShoppingCart, label: 'Cari Hesap', highlight: true },
  { to: '/transactions', icon: History, label: 'İşlem Geçmişi' },
  { to: '/payments', icon: Wallet, label: 'Tahsilat' },
  { to: '/customers', icon: Users, label: 'Müşteriler' },
  { to: '/wholesalers', icon: Truck, label: 'Firmalar' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button 
          className="menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="logo">
          <Building2 size={24} />
          Yönetim Sistemi
        </h1>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Building2 size={32} />
          <span>Yönetim Sistemi</span>
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                `nav-link ${isActive ? 'active' : ''} ${item.highlight ? 'highlight' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>© 2026 Yönetim Sistemi</p>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
