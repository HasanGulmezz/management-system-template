// Preload script - güvenlik için gerekli
// Web sayfası ile Electron arasındaki köprü

window.addEventListener('DOMContentLoaded', () => {
  // Uygulama başlığını güncelle
  const title = document.title || 'Yönetim Sistemi'
  document.title = title
  
  // Console'a bilgi yaz
  console.log('Yönetim Sistemi Desktop - Yüklendi')
  console.log('Electron sürümü:', process.versions.electron)
  console.log('Chrome sürümü:', process.versions.chrome)
  console.log('Node sürümü:', process.versions.node)
})
