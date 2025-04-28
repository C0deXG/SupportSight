import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { LayoutDashboard, Users, FolderKanban, Bug, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { useToast } from './ui/use-toast'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Issues', href: '/issues', icon: Bug },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      navigate('/login')
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
              <h1 className="text-xl font-semibold">SupportSight</h1>
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => {
                      const isActive = location.pathname === item.href
                      return (
                        <li key={item.name}>
                          <Link
                            to={item.href}
                            className={cn(
                              'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
                              isActive
                                ? 'bg-gray-50 text-primary'
                                : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                            )}
                          >
                            <item.icon
                              className={cn(
                                'h-6 w-6 shrink-0',
                                isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary'
                              )}
                              aria-hidden="true"
                            />
                            {item.name}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </li>
                <li className="mt-auto">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Main content */}
        <main className="lg:pl-72">
          <div className="px-4 py-10 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
} 