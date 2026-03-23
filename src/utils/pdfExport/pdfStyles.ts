// PDF Export Styles and Common Utilities
import { jsPDF } from 'jspdf'
import { ROBOTO_BASE64 } from './fontData'

// Company Information
export const COMPANY_INFO = {
  name: 'YÖNETİM SİSTEMİ',
  address: '',
  phone: '',
  email: ''
}

// Colors (RGB format for jsPDF)
export const PDF_COLORS = {
  primary: [102, 126, 234] as [number, number, number],      // Accent purple
  success: [72, 187, 120] as [number, number, number],       // Green
  warning: [236, 201, 75] as [number, number, number],       // Yellow
  error: [245, 101, 101] as [number, number, number],        // Red
  text: [26, 26, 46] as [number, number, number],            // Dark text
  textMuted: [107, 114, 128] as [number, number, number],    // Gray text
  border: [229, 231, 235] as [number, number, number],       // Light border
  headerBg: [243, 244, 246] as [number, number, number],     // Light gray bg
}

// Font sizes
export const PDF_FONTS = {
  title: 18,
  subtitle: 14,
  heading: 12,
  body: 10,
  small: 8
}

// Page margins
export const PDF_MARGINS = {
  left: 15,
  right: 15,
  top: 15,
  bottom: 20
}

// Helper to format currency
export const formatCurrency = (amount: number): string => {
  return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Helper to format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Helper to format datetime
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Create base PDF document with common settings
// Create base PDF document with common settings
export const createBasePDF = (): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })
  
  // Add Turkish font support
  doc.addFileToVFS('Roboto-Regular.ttf', ROBOTO_BASE64)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'bold') // Use same font for bold for now, or add bold font file
  doc.setFont('Roboto', 'normal')
  
  return doc
}

// Add header to PDF
export const addHeader = (doc: jsPDF, title: string, pageNumber?: number): number => {
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = PDF_MARGINS.top
  
  // Company name
  doc.setFontSize(PDF_FONTS.title)
  doc.setFont('Roboto', 'bold')
  doc.setTextColor(...PDF_COLORS.primary)
  doc.text(COMPANY_INFO.name, PDF_MARGINS.left, yPos)
  
  // Page number (if provided)
  if (pageNumber !== undefined) {
    doc.setFontSize(PDF_FONTS.small)
    doc.setFont('Roboto', 'normal')
    doc.setTextColor(...PDF_COLORS.textMuted)
    doc.text(`Sayfa: ${pageNumber}`, pageWidth - PDF_MARGINS.right, yPos, { align: 'right' })
  }
  
  yPos += 10
  
  // Title
  doc.setFontSize(PDF_FONTS.subtitle)
  doc.setFont('Roboto', 'bold')
  doc.setTextColor(...PDF_COLORS.text)
  doc.text(title, pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 8
  
  // Divider line
  doc.setDrawColor(...PDF_COLORS.border)
  doc.setLineWidth(0.5)
  doc.line(PDF_MARGINS.left, yPos, pageWidth - PDF_MARGINS.right, yPos)
  
  return yPos + 5
}

// Add footer to PDF
export const addFooter = (doc: jsPDF): void => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  doc.setFontSize(PDF_FONTS.small)
  doc.setFont('Roboto', 'normal')
  doc.setTextColor(...PDF_COLORS.textMuted)
  
  const footerText = `Oluşturulma: ${formatDateTime(new Date().toISOString())}`
  doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' })
}

// Add customer info section
export const addCustomerInfo = (
  doc: jsPDF, 
  customer: { name: string; phone?: string }, 
  startY: number,
  dateRange?: { start: string; end: string }
): number => {
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = startY
  
  // Left side - Customer info
  doc.setFontSize(PDF_FONTS.body)
  doc.setFont('Roboto', 'normal')
  doc.setTextColor(...PDF_COLORS.textMuted)
  doc.text('Müşteri:', PDF_MARGINS.left, yPos)
  
  doc.setFont('Roboto', 'bold')
  doc.setTextColor(...PDF_COLORS.text)
  doc.text(customer.name, PDF_MARGINS.left + 20, yPos)
  
  if (customer.phone) {
    yPos += 5
    doc.setFont('Roboto', 'normal')
    doc.setTextColor(...PDF_COLORS.textMuted)
    doc.text('Telefon:', PDF_MARGINS.left, yPos)
    doc.setTextColor(...PDF_COLORS.text)
    doc.text(customer.phone, PDF_MARGINS.left + 20, yPos)
  }
  
  // Right side - Date range (if provided)
  if (dateRange) {
    const rightX = pageWidth - PDF_MARGINS.right
    doc.setFont('Roboto', 'normal')
    doc.setTextColor(...PDF_COLORS.textMuted)
    doc.text(`Başlangıç: ${dateRange.start}`, rightX, startY, { align: 'right' })
    doc.text(`Bitiş: ${dateRange.end}`, rightX, startY + 5, { align: 'right' })
  }
  
  return yPos + 8
}
