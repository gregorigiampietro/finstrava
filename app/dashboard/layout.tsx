'use client';

import { CompanyProvider } from '@/lib/contexts/company-context';
import { DashboardNav } from './dashboard-nav';
import { CompanyGuard } from '@/components/company-guard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CompanyProvider>
      <CompanyGuard>
        <div className="min-h-screen bg-background">
          <DashboardNav />
          <main className="pt-16 md:ml-56">
            <div className="p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>
      </CompanyGuard>
    </CompanyProvider>
  );
}