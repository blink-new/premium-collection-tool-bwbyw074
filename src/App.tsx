import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Dashboard } from '@/components/pages/Dashboard'
import { Collections } from '@/components/pages/Collections'
import { DebitOrders } from '@/components/pages/DebitOrders'
import { PASIntegrations } from '@/components/pages/PASIntegrations'
import { Reconciliation } from '@/components/pages/Reconciliation'
import { Reports } from '@/components/pages/Reports'
import { Settings } from '@/components/pages/Settings'
import { APIKeys } from '@/components/pages/APIKeys'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'collections':
        return <Collections />
      case 'debit-orders':
        return <DebitOrders />
      case 'pas-integrations':
        return <PASIntegrations />
      case 'reconciliation':
        return <Reconciliation />
      case 'reports':
        return <Reports />
      case 'settings':
        return <Settings />
      case 'api-keys':
        return <APIKeys />
      default:
        return <Dashboard />
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        <AppSidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        <main className="flex-1 overflow-hidden">
          {renderPage()}
        </main>
      </div>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </SidebarProvider>
  )
}

export default App