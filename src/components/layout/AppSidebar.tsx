import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  CreditCard,
  FileText,
  Plug,
  GitMerge,
  BarChart3,
  Settings,
  Building2,
  Key,
} from 'lucide-react'

interface AppSidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
}

const menuItems = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'collections',
    title: 'Collections',
    icon: CreditCard,
  },
  {
    id: 'debit-orders',
    title: 'Debit Orders',
    icon: FileText,
  },
  {
    id: 'pas-integrations',
    title: 'PAS Integrations',
    icon: Plug,
  },
  {
    id: 'reconciliation',
    title: 'Reconciliation',
    icon: GitMerge,
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: BarChart3,
  },
  {
    id: 'api-keys',
    title: 'API Keys',
    icon: Key,
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
  },
]

export function AppSidebar({ currentPage, onPageChange }: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-slate-200">
      <SidebarHeader className="border-b border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Premium Collection</h1>
            <p className="text-sm text-slate-500">Investec Integration</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => onPageChange(item.id)}
                isActive={currentPage === item.id}
                className="w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-slate-100 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700"
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-slate-100 p-3">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900">Admin User</p>
            <p className="text-xs text-slate-500 truncate">admin@company.com</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}