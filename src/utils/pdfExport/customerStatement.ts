// Customer Account Statement (Cari Hesap Ekstresi) PDF Generator
import autoTable from 'jspdf-autotable'
import {
  createBasePDF,
  addHeader,
  addFooter,
  addCustomerInfo,
  formatCurrency,
  formatDate,
  PDF_MARGINS,
  PDF_COLORS,
  PDF_FONTS
} from './pdfStyles'

interface SaleItem {
  quantity: number
  unit_price: number
  product?: { name: string } | null
}

interface Sale {
  id: string
  created_at: string
  total_amount: number
  sale_items?: SaleItem[]
}

interface Payment {
  id: string
  created_at: string
  amount: number
  payment_type: string
  notes?: string
}

interface CustomerStatementData {
  customer: {
    id: string
    first_name: string
    last_name: string
    phone?: string
  }
  sales: Sale[]
  payments: Payment[]
  currentBalance: number
}

// Get payment type label in Turkish
const getPaymentTypeLabel = (type: string): string => {
  switch (type) {
    case 'cash': return 'Nakit'
    case 'credit_card': return 'Kredi Kartı'
    case 'bank_transfer': return 'Havale/EFT'
    case 'check': return 'Çek'
    case 'promissory_note': return 'Senet'
    default: return type
  }
}

export const generateCustomerStatement = (data: CustomerStatementData): void => {
  const doc = createBasePDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Add header
  let yPos = addHeader(doc, 'CARİ HESAP EKSTRESİ', 1)
  
  // Customer info
  const customerName = `${data.customer.first_name} ${data.customer.last_name}`
  
  // Get date range from transactions
  const allDates = [
    ...data.sales.map(s => s.created_at),
    ...data.payments.map(p => p.created_at)
  ].sort()
  
  const dateRange = allDates.length > 0 ? {
    start: formatDate(allDates[0]),
    end: formatDate(allDates[allDates.length - 1])
  } : undefined
  
  yPos = addCustomerInfo(doc, {
    name: customerName,
    phone: data.customer.phone
  }, yPos, dateRange)
  
  yPos += 5

  // Sort sales by date
  const sortedSales = [...data.sales].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // ==================== SATIŞLAR BÖLÜMÜ ====================
  if (sortedSales.length > 0) {
    // Section title
    doc.setFillColor(102, 126, 234) // Primary color
    doc.rect(PDF_MARGINS.left, yPos, pageWidth - PDF_MARGINS.left - PDF_MARGINS.right, 8, 'F')
    doc.setFont('Roboto', 'bold')
    doc.setFontSize(PDF_FONTS.body)
    doc.setTextColor(255, 255, 255)
    doc.text('SATIŞLAR', PDF_MARGINS.left + 3, yPos + 5.5)
    
    yPos += 12
    
    // Each sale as a block
    sortedSales.forEach((sale, saleIndex) => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage()
        yPos = addHeader(doc, 'CARİ HESAP EKSTRESİ', doc.internal.pages.length)
        yPos += 5
      }
      
      // Sale header bar (light blue background like the example)
      doc.setFillColor(230, 240, 255)
      doc.rect(PDF_MARGINS.left, yPos, pageWidth - PDF_MARGINS.left - PDF_MARGINS.right, 8, 'F')
      
      doc.setFont('Roboto', 'bold')
      doc.setFontSize(PDF_FONTS.small)
      doc.setTextColor(...PDF_COLORS.text)
      
      // Date
      doc.text(formatDate(sale.created_at), PDF_MARGINS.left + 3, yPos + 5.5)
      
      // Invoice number
      doc.text(`Fiş No: ${sale.id.slice(0, 8).toUpperCase()}`, PDF_MARGINS.left + 30, yPos + 5.5)
      
      // Type
      doc.text('Satış', PDF_MARGINS.left + 65, yPos + 5.5)
      
      // Total amount on right
      doc.setTextColor(...PDF_COLORS.primary)
      doc.text(formatCurrency(Number(sale.total_amount)), pageWidth - PDF_MARGINS.right - 3, yPos + 5.5, { align: 'right' })
      
      yPos += 10
      
      // Product details table
      if (sale.sale_items && sale.sale_items.length > 0) {
        const productData = sale.sale_items.map((item, index) => [
          (index + 1).toString(),
          item.product?.name || 'Ürün',
          item.quantity.toFixed(2),
          'AD',
          formatCurrency(Number(item.unit_price)),
          formatCurrency(Number(item.unit_price) * item.quantity)
        ])
        
        autoTable(doc, {
          startY: yPos,
          head: [[
            '#',
            'ÜRÜN ADI',
            'MİKTAR',
            'BİRİM',
            'B.FİYATI',
            'TUTAR'
          ]],
          body: productData,
          theme: 'grid',
          styles: {
            font: 'Roboto',
            fontSize: 7,
            cellPadding: 1.5,
            textColor: PDF_COLORS.text,
            lineColor: PDF_COLORS.border,
            lineWidth: 0.1
          },
          headStyles: {
            fillColor: [245, 245, 250],
            textColor: PDF_COLORS.text,
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 7
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 8 },
            1: { halign: 'left', cellWidth: 65 },
            2: { halign: 'right', cellWidth: 18 },
            3: { halign: 'center', cellWidth: 12 },
            4: { halign: 'right', cellWidth: 25 },
            5: { halign: 'right', cellWidth: 28 }
          },
          margin: { left: PDF_MARGINS.left + 5, right: PDF_MARGINS.right + 5 }
        })
        
        yPos = (doc as any).lastAutoTable.finalY + 5
      }
      
      // Add spacing between sales (except last one)
      if (saleIndex < sortedSales.length - 1) {
        yPos += 3
      }
    })
    
    // Sales total
    const totalSales = sortedSales.reduce((sum, s) => sum + Number(s.total_amount), 0)
    doc.setFillColor(...PDF_COLORS.headerBg)
    doc.rect(pageWidth - PDF_MARGINS.right - 60, yPos, 60, 8, 'F')
    doc.setFont('Roboto', 'bold')
    doc.setFontSize(PDF_FONTS.small)
    doc.setTextColor(...PDF_COLORS.text)
    doc.text('SATIŞ TOPLAMI:', pageWidth - PDF_MARGINS.right - 58, yPos + 5.5)
    doc.setTextColor(...PDF_COLORS.error)
    doc.text(formatCurrency(totalSales), pageWidth - PDF_MARGINS.right - 3, yPos + 5.5, { align: 'right' })
    
    yPos += 15
  }

  // ==================== TAHSİLATLAR BÖLÜMÜ ====================
  const sortedPayments = [...data.payments].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  
  if (sortedPayments.length > 0) {
    // Check if we need a new page
    if (yPos > 240) {
      doc.addPage()
      yPos = addHeader(doc, 'CARİ HESAP EKSTRESİ', doc.internal.pages.length)
      yPos += 5
    }
    
    // Section title
    doc.setFillColor(72, 187, 120) // Success/green color
    doc.rect(PDF_MARGINS.left, yPos, pageWidth - PDF_MARGINS.left - PDF_MARGINS.right, 8, 'F')
    doc.setFont('Roboto', 'bold')
    doc.setFontSize(PDF_FONTS.body)
    doc.setTextColor(255, 255, 255)
    doc.text('TAHSİLATLAR', PDF_MARGINS.left + 3, yPos + 5.5)
    
    yPos += 12
    
    // Payments table
    const paymentData = sortedPayments.map(payment => [
      formatDate(payment.created_at),
      payment.id.slice(0, 8).toUpperCase(),
      getPaymentTypeLabel(payment.payment_type),
      payment.notes || '-',
      formatCurrency(Number(payment.amount))
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [[
        'TARİH',
        'FİŞ NO',
        'ÖDEME TÜRÜ',
        'NOT',
        'TUTAR'
      ]],
      body: paymentData,
      theme: 'grid',
      styles: {
        font: 'Roboto',
        fontSize: PDF_FONTS.small,
        cellPadding: 2,
        textColor: PDF_COLORS.text,
        lineColor: PDF_COLORS.border,
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [220, 252, 231], // Light green
        textColor: PDF_COLORS.text,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 25 },
        1: { halign: 'center', cellWidth: 25 },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'left', cellWidth: 50 },
        4: { halign: 'right', cellWidth: 30 }
      },
      margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right }
    })
    
    yPos = (doc as any).lastAutoTable.finalY + 5
    
    // Payments total
    const totalPayments = sortedPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    doc.setFillColor(...PDF_COLORS.headerBg)
    doc.rect(pageWidth - PDF_MARGINS.right - 60, yPos, 60, 8, 'F')
    doc.setFont('Roboto', 'bold')
    doc.setFontSize(PDF_FONTS.small)
    doc.setTextColor(...PDF_COLORS.text)
    doc.text('TAHSİLAT TOPLAMI:', pageWidth - PDF_MARGINS.right - 58, yPos + 5.5)
    doc.setTextColor(...PDF_COLORS.success)
    doc.text(formatCurrency(totalPayments), pageWidth - PDF_MARGINS.right - 3, yPos + 5.5, { align: 'right' })
    
    yPos += 15
  }

  // ==================== ÖZET BÖLÜMÜ ====================
  // Check if we need a new page
  if (yPos > 260) {
    doc.addPage()
    yPos = addHeader(doc, 'CARİ HESAP EKSTRESİ', doc.internal.pages.length)
    yPos += 5
  }
  
  // Final balance box
  doc.setFillColor(250, 250, 255)
  doc.setDrawColor(...PDF_COLORS.primary)
  doc.setLineWidth(0.5)
  doc.roundedRect(PDF_MARGINS.left, yPos, pageWidth - PDF_MARGINS.left - PDF_MARGINS.right, 20, 3, 3, 'FD')
  
  doc.setFont('Roboto', 'bold')
  doc.setFontSize(PDF_FONTS.heading)
  doc.setTextColor(...PDF_COLORS.text)
  doc.text('KALAN BAKİYE:', PDF_MARGINS.left + 10, yPos + 13)
  
  doc.setFontSize(16)
  if (data.currentBalance > 0) {
    doc.setTextColor(...PDF_COLORS.error) // Red for debt
  } else if (data.currentBalance < 0) {
    doc.setTextColor(...PDF_COLORS.success) // Green for credit
  } else {
    doc.setTextColor(...PDF_COLORS.text)
  }
  
  const balanceText = formatCurrency(Math.abs(data.currentBalance)) + 
    (data.currentBalance > 0 ? ' (BORÇ)' : data.currentBalance < 0 ? ' (ALACAK)' : '')
  doc.text(balanceText, pageWidth - PDF_MARGINS.right - 10, yPos + 13, { align: 'right' })
  
  // Add footer
  addFooter(doc)
  
  // Generate filename
  const fileName = `${customerName.replace(/\s+/g, '_')}_Ekstre_${formatDate(new Date().toISOString()).replace(/\./g, '-')}.pdf`
  
  // Save the PDF
  doc.save(fileName)
}
