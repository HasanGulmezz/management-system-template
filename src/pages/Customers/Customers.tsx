import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Search, Phone, ChevronRight } from 'lucide-react'
import { useCustomers } from '../../hooks'
import './Customers.css'

export default function Customers() {
  const { customers, loading } = useCustomers()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCustomers = customers.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="customers-page animate-slideUp">
      <header className="page-header">
        <h1 className="page-title">Müşteriler</h1>
        <p className="page-subtitle">Müşteriler satış sırasında otomatik eklenir</p>
      </header>

      {/* Filters */}
      <div className="customers-filters card">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Müşteri adı ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="customer-list">
        {loading ? (
          <div className="loading-container card">
            <div className="spinner"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-state card">
            <Users size={48} className="empty-state-icon" />
            <p className="empty-state-title">
              {searchQuery ? 'Müşteri bulunamadı' : 'Henüz müşteri eklenmemiş'}
            </p>
            <p>{searchQuery ? 'Farklı bir arama deneyin' : 'Satış yaparak müşteri ekleyebilirsiniz'}</p>
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <Link 
              key={customer.id} 
              to={`/customers/${customer.id}`} 
              className="customer-card card"
            >
              <div className={`customer-avatar ${customer.balance > 0 ? 'has-debt' : ''}`}>
                {customer.first_name[0]}{customer.last_name[0]}
              </div>
              <div className="customer-info">
                <h3 className="customer-name">{customer.first_name} {customer.last_name}</h3>
                {customer.phone && (
                  <p className="customer-phone">
                    <Phone size={14} />
                    {customer.phone}
                  </p>
                )}
                <p className="customer-stats">
                  {customer.sale_count} satış • ₺{customer.total_spent.toLocaleString()}
                </p>
              </div>
              <div className="customer-actions">
                <span className="customer-spent">₺{customer.total_spent.toLocaleString()}</span>
                <ChevronRight size={20} className="customer-arrow" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
