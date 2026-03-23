// Individual Sale Invoice (Satış Faturası) PDF Generator
import autoTable from 'jspdf-autotable'
import {
  createBasePDF,
  addHeader,
  addFooter,
  formatCurrency,
  formatDate,
  formatDateTime,
  PDF_MARGINS,
  PDF_COLORS,
  PDF_FONTS
} from './pdfStyles'

interface SaleItem {
  id: string
  product_id: string
  product_name?: string
  product_code?: string
  quantity: number
  unit_price: number
  total_price: number
}

interface SaleInvoiceData {
  sale: {
    id: string
    created_at: string
    total_amount: number
    notes?: string
  }
  customer: {
    first_name: string
    last_name: string
    phone?: string
  }
  items: SaleItem[]
}

export const generateSaleInvoice = (data: SaleInvoiceData): void => {
  const doc = createBasePDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Add header
  let yPos = addHeader(doc, 'SATIŞ FATURASI')
  
  // Invoice summary bar (similar to the example image)
  doc.setFillColor(240, 248, 255) // Light blue background
  doc.rect(PDF_MARGINS.left, yPos, pageWidth - PDF_MARGINS.left - PDF_MARGINS.right, 12, 'F')
  
  doc.setFontSize(PDF_FONTS.body)
  doc.setFont('Roboto', 'bold')
  doc.setTextColor(...PDF_COLORS.text)
  
  // Date on left
  doc.text(formatDate(data.sale.created_at), PDF_MARGINS.left + 3, yPos + 8)
  
  // Invoice number
  doc.text(`Fiş No: ${data.sale.id.slice(0, 8).toUpperCase()}`, PDF_MARGINS.left + 35, yPos + 8)
  
  // Customer name
  const customerName = `${data.customer.first_name} ${data.customer.last_name}`
  doc.text(customerName, pageWidth / 2, yPos + 8, { align: 'center' })
  
  // Total amount on right
  doc.setTextColor(...PDF_COLORS.primary)
  doc.text(formatCurrency(data.sale.total_amount), pageWidth - PDF_MARGINS.right - 3, yPos + 8, { align: 'right' })
  
  yPos += 18
  
  // Customer details section
  doc.setFont('Roboto', 'normal')
  doc.setFontSize(PDF_FONTS.small)
  doc.setTextColor(...PDF_COLORS.textMuted)
  
  if (data.customer.phone) {
    doc.text(`Telefon: ${data.customer.phone}`, PDF_MARGINS.left, yPos)
  }
  
  doc.text(`Saat: ${formatDateTime(data.sale.created_at).split(',')[1]?.trim() || ''}`, pageWidth - PDF_MARGINS.right, yPos, { align: 'right' })
  
  yPos += 8
  
  // Divider
  doc.setDrawColor(...PDF_COLORS.border)
  doc.setLineWidth(0.3)
  doc.line(PDF_MARGINS.left, yPos, pageWidth - PDF_MARGINS.right, yPos)
  
  yPos += 5
  
  // Items table - matching the example format
  const tableData = data.items.map((item, index) => [
    (index + 1).toString(),
    item.product_code || item.product_id.slice(0, 6).toUpperCase(),
    item.product_name || `Ürün #${item.product_id.slice(0, 6)}`,
    item.quantity.toFixed(2),
    'AD',
    formatCurrency(item.unit_price),
    formatCurrency(item.total_price)
  ])
  
  autoTable(doc, {
    startY: yPos,
    head: [[
      '#',
      'KODU',
      'AÇIKLAMA',
      'MİKTAR',
      'BİRİM',
      'B.FİYATI',
      'TUTAR'
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'Roboto',
      fontSize: PDF_FONTS.small,
      cellPadding: 2.5,
      textColor: PDF_COLORS.text,
      lineColor: PDF_COLORS.border,
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [230, 230, 250], // Light lavender like the example
      textColor: PDF_COLORS.text,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },   // Index (#)
      1: { halign: 'center', cellWidth: 20 },   // Product code
      2: { halign: 'left', cellWidth: 60 },     // Product name (Açıklama)
      3: { halign: 'right', cellWidth: 18 },    // Quantity
      4: { halign: 'center', cellWidth: 15 },   // Unit (Birim)
      5: { halign: 'right', cellWidth: 25 },    // Unit price
      6: { halign: 'right', cellWidth: 28 }     // Total
    },
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    alternateRowStyles: {
      fillColor: [255, 255, 255]
    }
  })
  
  // Get final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY
  
  yPos = finalY + 8
  
  // Total section - more prominent
  doc.setFillColor(...PDF_COLORS.headerBg)
  doc.rect(pageWidth - PDF_MARGINS.right - 80, yPos, 80, 14, 'F')
  
  doc.setFontSize(PDF_FONTS.heading)
  doc.setFont('Roboto', 'bold')
  doc.setTextColor(...PDF_COLORS.text)
  doc.text('GENEL TOPLAM:', pageWidth - PDF_MARGINS.right - 78, yPos + 10)
  
  doc.setFontSize(PDF_FONTS.subtitle)
  doc.setTextColor(...PDF_COLORS.primary)
  doc.text(formatCurrency(data.sale.total_amount), pageWidth - PDF_MARGINS.right - 3, yPos + 10, { align: 'right' })
  
  // Notes section - more visible
  if (data.sale.notes) {
    yPos += 22
    
    // Notes box
    doc.setDrawColor(...PDF_COLORS.border)
    doc.setFillColor(255, 253, 230) // Light yellow background for notes
    doc.roundedRect(PDF_MARGINS.left, yPos, pageWidth - PDF_MARGINS.left - PDF_MARGINS.right, 20, 2, 2, 'FD')
    
    doc.setFontSize(PDF_FONTS.small)
    doc.setFont('Roboto', 'bold')
    doc.setTextColor(...PDF_COLORS.text)
    doc.text('NOT:', PDF_MARGINS.left + 4, yPos + 6)
    
    doc.setFont('Roboto', 'normal')
    doc.setTextColor(...PDF_COLORS.textMuted)
    
    // Wrap long notes
    const splitNotes = doc.splitTextToSize(data.sale.notes, pageWidth - PDF_MARGINS.left - PDF_MARGINS.right - 20)
    doc.text(splitNotes, PDF_MARGINS.left + 15, yPos + 6)
  }
  
  // Add footer
  addFooter(doc)
  
  // Generate filename
  const fileName = `Satis_${data.sale.id.slice(0, 8).toUpperCase()}_${formatDate(data.sale.created_at).replace(/\./g, '-')}.pdf`
  
  // Save the PDF
  doc.save(fileName)
}
