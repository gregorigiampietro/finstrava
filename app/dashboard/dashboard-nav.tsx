'use client';

import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { CompanySelector } from '@/components/company-selector';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  FileText,
  BarChart3,
  Menu,
  X,
  LogOut,
  Tags,
  Package,
  FileStack,
  Receipt,
  Boxes,
  FolderTree,
  Settings,
  Briefcase,
  UserCircle,
  Wallet
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useCompany } from '@/lib/contexts/company-context';
import { Logo } from '@/components/logo';

const navigation = [
  {
    label: 'MENU',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Lançamentos', href: '/dashboard/transactions', icon: Receipt },
      { name: 'Contratos', href: '/dashboard/contracts', icon: FileStack },
      { name: 'Relatórios', href: '/dashboard/reports', icon: BarChart3 },
    ]
  },
  {
    label: 'CADASTROS',
    items: [
      { name: 'Clientes', href: '/dashboard/customers', icon: Users },
      { name: 'Produtos', href: '/dashboard/products', icon: Package },
      { name: 'Categorias', href: '/dashboard/categories', icon: FolderTree },
      { name: 'Pacotes', href: '/dashboard/packages', icon: Boxes },
      { name: 'Pagamentos', href: '/dashboard/payment-methods', icon: CreditCard },
    ]
  },
  {
    label: 'RH',
    items: [
      { name: 'Funcionários', href: '/dashboard/hr/employees', icon: UserCircle },
      { name: 'Departamentos', href: '/dashboard/hr/departments', icon: Building2 },
      { name: 'Cargos', href: '/dashboard/hr/positions', icon: Briefcase },
      { name: 'Folha de Pagamento', href: '/dashboard/hr/payroll', icon: Wallet },
    ]
  },
  {
    label: 'SISTEMA',
    items: [
      { name: 'Empresas', href: '/dashboard/companies', icon: Building2 },
      { name: 'Parâmetros', href: '/dashboard/settings', icon: Settings },
    ]
  }
];

export function DashboardNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { selectedCompany } = useCompany();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Top Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-card border-b border-border/50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center p-2 text-muted-foreground rounded-xl md:hidden hover:bg-accent transition-colors"
              >
                <span className="sr-only">Abrir menu</span>
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <Link href="/dashboard" className="flex items-center gap-2">
                <Logo size="sm" />
                <span className="text-lg font-semibold bg-gradient-to-r from-[#8578fe] to-[#cbc7fe] bg-clip-text text-transparent hidden sm:block">
                  Finstrava
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <CompanySelector />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 w-56 h-screen pt-16 transition-transform bg-card border-r border-border/50",
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="h-full flex flex-col px-3 py-4 overflow-y-auto">
          <div className="flex-1 space-y-6">
            {navigation.map((section) => (
              <div key={section.label}>
                <p className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                  {section.label}
                </p>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <item.icon className={cn(
                            "w-4 h-4",
                            active ? "text-primary-foreground" : ""
                          )} />
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* Company indicator at bottom */}
          {selectedCompany && (
            <div className="mt-auto pt-4 border-t border-border/50">
              <div className="px-3 py-2">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase mb-1">
                  Empresa
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {selectedCompany.name}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
