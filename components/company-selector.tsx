'use client';

import { useCompany } from '@/lib/contexts/company-context';
import { Button } from '@/components/ui/button';
import { Building2, ChevronDown, Plus, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function CompanySelector() {
  const { companies, selectedCompany, isLoading, selectCompany } = useCompany();
  const router = useRouter();

  if (isLoading) {
    return (
      <Button variant="ghost" disabled className="rounded-xl">
        <Building2 className="mr-2 h-4 w-4" />
        <span className="text-sm">Carregando...</span>
      </Button>
    );
  }

  if (companies.length === 0) {
    return (
      <Button
        onClick={() => router.push('/dashboard/companies/new')}
        className="rounded-xl"
        size="sm"
      >
        <Plus className="mr-2 h-4 w-4" />
        Criar Empresa
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 px-3 rounded-xl hover:bg-accent gap-2"
        >
          <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium max-w-[120px] truncate hidden sm:inline">
            {selectedCompany?.name || 'Selecione'}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] rounded-xl p-1">
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => selectCompany(company.id)}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-2",
              selectedCompany?.id === company.id && "bg-primary/10"
            )}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate text-sm">{company.name}</span>
            </div>
            {selectedCompany?.id === company.id && (
              <Check className="h-4 w-4 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          onClick={() => router.push('/dashboard/companies')}
          className="cursor-pointer rounded-lg px-3 py-2 text-muted-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="text-sm">Gerenciar Empresas</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
