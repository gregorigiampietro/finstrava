'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Contract, ContractFormData } from '@/lib/types/contract';
import { useCustomers } from '@/lib/hooks/use-customers';
import { useCategories } from '@/lib/hooks/use-categories';
import { usePaymentMethods } from '@/lib/hooks/use-payment-methods';
import { useProducts } from '@/lib/hooks/use-products';
import { useProductCategories } from '@/lib/hooks/use-product-categories';
import { usePackages } from '@/lib/hooks/use-packages';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Check, Minus, ChevronRight, FolderOpen, X } from 'lucide-react';
import { parseISO, addMonths, subDays, format } from 'date-fns';

// Simple checkbox component (avoids Radix re-render issues)
function SimpleCheckbox({ checked, indeterminate }: { checked: boolean; indeterminate?: boolean }) {
  return (
    <div
      className={cn(
        'h-4 w-4 shrink-0 rounded-sm border border-primary',
        'flex items-center justify-center transition-colors',
        (checked || indeterminate) && 'bg-primary text-primary-foreground'
      )}
    >
      {checked && <Check className="h-3 w-3" />}
      {indeterminate && !checked && <Minus className="h-3 w-3" />}
    </div>
  );
}

const contractItemSchema = z.object({
  product_id: z.string().min(1, 'Produto é obrigatório'),
  quantity: z.number().min(1, 'Quantidade deve ser maior que zero'),
  unit_price: z.number().min(0, 'Preço deve ser maior ou igual a zero'),
  description: z.string().optional(),
  is_active: z.boolean().optional().default(true),
});

const formSchema = z.object({
  customer_id: z.string().min(1, 'Cliente é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório').max(255, 'Título muito longo'),
  description: z.string().max(500).optional(),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  first_billing_date: z.string().min(1, 'Data do primeiro pagamento é obrigatória'),
  end_date: z.string().optional(),
  contract_duration_months: z.number().min(0).max(120).optional(),
  billing_type: z.enum(['monthly', 'quarterly', 'semiannual', 'annual']),
  billing_day: z.number().min(1).max(31),
  monthly_value: z.number().min(0),
  default_category_id: z.string().optional(),
  default_payment_method_id: z.string().optional(),
  grace_period_days: z.number().min(0).max(90).optional(),
  automatic_renewal: z.boolean().optional(),
  renewal_period_months: z.number().min(1).max(60).optional(),
  notes: z.string().max(1000).optional(),
  contract_items: z.array(contractItemSchema).min(1, 'Adicione pelo menos um serviço'),
});

interface ContractFormProps {
  contract?: Contract;
  onSubmit: (data: ContractFormData) => void;
  onCancel: () => void;
}

type ContractMode = 'package' | 'custom';
type DiscountType = 'none' | 'percentage' | 'fixed';
type AdditionType = 'none' | 'percentage' | 'fixed';

interface CategoryGroup {
  id: string | null;
  name: string;
  color?: string | null;
  parentId?: string | null;
  products: { id: string; name: string; price: number; type: string }[];
  subcategories: CategoryGroup[];
}

export function ContractForm({ contract, onSubmit, onCancel }: ContractFormProps) {
  const { customers } = useCustomers();
  const { categories } = useCategories('income');
  const { paymentMethods } = usePaymentMethods();
  const { products } = useProducts();
  const { categories: productCategories } = useProductCategories();
  const { packages, getActivePackages, isLoading: isLoadingPackages } = usePackages();

  // Determinar modo inicial baseado no contrato existente
  const [mode, setMode] = useState<ContractMode>(() => {
    if (contract?.package_id) return 'package';
    if (contract?.contract_items && contract.contract_items.length > 0) return 'custom';
    return 'package';
  });
  const [selectedPackageId, setSelectedPackageId] = useState<string>(contract?.package_id || '');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() => {
    if (contract?.contract_items && !contract?.package_id) {
      return contract.contract_items.map(item => item.product_id);
    }
    return [];
  });
  const [discountType, setDiscountType] = useState<DiscountType>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [additionType, setAdditionType] = useState<AdditionType>('none');
  const [additionValue, setAdditionValue] = useState<number>(0);

  const activePackages = getActivePackages();
  const activeProducts = products.filter(p => p.is_active);

  const form = useForm<ContractFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: contract?.customer_id || '',
      title: contract?.title || '',
      description: contract?.description || '',
      start_date: contract?.start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
      first_billing_date: contract?.first_billing_date?.split('T')[0] || new Date().toISOString().split('T')[0],
      end_date: contract?.end_date?.split('T')[0] || '',
      contract_duration_months: contract?.contract_duration_months || undefined,
      billing_type: contract?.billing_type || 'monthly',
      billing_day: contract?.billing_day || 10,
      monthly_value: contract?.monthly_value || 0,
      default_category_id: contract?.default_category_id || '',
      default_payment_method_id: contract?.default_payment_method_id || '',
      grace_period_days: contract?.grace_period_days || 0,
      automatic_renewal: contract?.automatic_renewal || false,
      renewal_period_months: contract?.renewal_period_months || 12,
      notes: contract?.notes || '',
      contract_items: contract?.contract_items?.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        description: item.description || '',
        is_active: item.is_active,
      })) || [{ product_id: '', quantity: 1, unit_price: 0, description: '', is_active: true }],
    },
  });

  const automaticRenewal = form.watch('automatic_renewal');
  const startDate = form.watch('start_date');
  const contractDurationMonths = form.watch('contract_duration_months');
  const billingDay = form.watch('billing_day');
  const endDate = form.watch('end_date');

  const selectedPackage = useMemo(() => packages.find(p => p.id === selectedPackageId), [packages, selectedPackageId]);

  // Group products by category
  const groupedProducts = useMemo(() => {
    const categoryMap = new Map<string, CategoryGroup>();
    productCategories.forEach(cat => {
      categoryMap.set(cat.id, {
        id: cat.id, name: cat.name, color: cat.color, parentId: cat.parent_id,
        products: [], subcategories: [],
      });
    });

    const uncategorized: CategoryGroup = { id: null, name: 'Sem Categoria', products: [], subcategories: [] };

    activeProducts.forEach(product => {
      const data = { id: product.id, name: product.name, price: product.price || 0, type: product.type };
      if (product.category_id && categoryMap.has(product.category_id)) {
        categoryMap.get(product.category_id)!.products.push(data);
      } else {
        uncategorized.products.push(data);
      }
    });

    const rootCategories: CategoryGroup[] = [];
    categoryMap.forEach(cat => {
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)!.subcategories.push(cat);
      } else if (!cat.parentId) {
        rootCategories.push(cat);
      }
    });

    rootCategories.sort((a, b) => a.name.localeCompare(b.name));
    if (uncategorized.products.length > 0) rootCategories.push(uncategorized);

    return rootCategories.filter(cat => cat.products.length > 0 || cat.subcategories.some(s => s.products.length > 0));
  }, [activeProducts, productCategories]);

  // Calculate values
  const subtotal = useMemo(() => {
    if (mode === 'package' && selectedPackage) return selectedPackage.monthly_price;
    return selectedProductIds.reduce((sum, id) => sum + (products.find(p => p.id === id)?.price || 0), 0);
  }, [mode, selectedPackage, selectedProductIds, products]);

  const discountAmount = useMemo(() => {
    if (discountType === 'none' || discountValue <= 0) return 0;
    return discountType === 'percentage' ? subtotal * (discountValue / 100) : Math.min(discountValue, subtotal);
  }, [discountType, discountValue, subtotal]);

  const additionAmount = useMemo(() => {
    if (additionType === 'none' || additionValue <= 0) return 0;
    return additionType === 'percentage' ? subtotal * (additionValue / 100) : additionValue;
  }, [additionType, additionValue, subtotal]);

  const finalTotal = Math.max(0, subtotal - discountAmount + additionAmount);

  // Update form when selection changes
  useEffect(() => {
    let items: any[] = [];
    if (mode === 'package' && selectedPackage?.package_items) {
      items = selectedPackage.package_items.map(item => ({
        product_id: item.product_id, quantity: item.quantity,
        unit_price: item.product?.price || 0, description: '', is_active: true,
      }));
    } else if (mode === 'custom' && selectedProductIds.length > 0) {
      items = selectedProductIds.map(id => ({
        product_id: id, quantity: 1,
        unit_price: products.find(p => p.id === id)?.price || 0, description: '', is_active: true,
      }));
    }
    form.setValue('contract_items', items.length > 0 ? items : [{ product_id: '', quantity: 1, unit_price: 0, description: '', is_active: true }]);
    form.setValue('monthly_value', finalTotal);
  }, [mode, selectedPackage, selectedProductIds, products, finalTotal, form]);

  // Auto-calculate end_date usando date-fns para evitar problemas de timezone
  useEffect(() => {
    if (startDate && contractDurationMonths && contractDurationMonths > 0 && billingDay) {
      // parseISO interpreta a data como local, não como UTC
      const start = parseISO(startDate);
      const end = subDays(addMonths(start, contractDurationMonths), 1);
      form.setValue('end_date', format(end, 'yyyy-MM-dd'));
    } else {
      form.setValue('end_date', '');
    }
  }, [startDate, contractDurationMonths, billingDay, form]);

  // Auto-fill title
  useEffect(() => {
    if (selectedPackage && !form.getValues('title')) {
      form.setValue('title', selectedPackage.name);
    }
  }, [selectedPackage, form]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getAllProductIds = (cat: CategoryGroup): string[] => {
    return [...cat.products.map(p => p.id), ...cat.subcategories.flatMap(getAllProductIds)];
  };

  const toggleCategory = (cat: CategoryGroup) => {
    const ids = getAllProductIds(cat);
    const allSelected = ids.every(id => selectedProductIds.includes(id));
    setSelectedProductIds(prev => allSelected ? prev.filter(id => !ids.includes(id)) : Array.from(new Set([...prev, ...ids])));
  };

  const getCategoryState = (cat: CategoryGroup): 'none' | 'some' | 'all' => {
    const ids = getAllProductIds(cat);
    if (ids.length === 0) return 'none';
    const count = ids.filter(id => selectedProductIds.includes(id)).length;
    return count === 0 ? 'none' : count === ids.length ? 'all' : 'some';
  };

  const handleSubmit = (data: ContractFormData) => {
    onSubmit({
      ...data,
      description: data.description || undefined,
      end_date: data.end_date || undefined,
      default_category_id: data.default_category_id || undefined,
      default_payment_method_id: data.default_payment_method_id || undefined,
      notes: data.notes || undefined,
      contract_items: data.contract_items.filter(item => item.product_id && item.quantity > 0),
      package_id: mode === 'package' ? selectedPackageId || undefined : undefined,
    });
  };

  const renderCategory = (cat: CategoryGroup, level = 0) => {
    const state = getCategoryState(cat);
    if (cat.products.length === 0 && cat.subcategories.length === 0) return null;

    return (
      <div key={cat.id || 'uncategorized'} className={cn(level > 0 && 'ml-4')}>
        <div
          className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50"
          onClick={() => toggleCategory(cat)}
        >
          <SimpleCheckbox checked={state === 'all'} indeterminate={state === 'some'} />
          {level === 0 ? <FolderOpen className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          <span className="text-sm font-medium">{cat.name}</span>
          <span className="text-xs text-muted-foreground ml-auto">{getAllProductIds(cat).length}</span>
        </div>
        {cat.subcategories.map(sub => renderCategory(sub, level + 1))}
        {cat.products.length > 0 && (
          <div className={cn('space-y-1', level > 0 ? 'ml-4' : 'ml-6')}>
            {cat.products.map(product => (
              <div
                key={product.id}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors',
                  selectedProductIds.includes(product.id) ? 'bg-primary/10' : 'hover:bg-muted/50'
                )}
                onClick={() => toggleProduct(product.id)}
              >
                <SimpleCheckbox checked={selectedProductIds.includes(product.id)} />
                <span className="text-sm flex-1">{product.name}</span>
                {product.price > 0 && (
                  <span className="text-xs text-muted-foreground">{formatCurrency(product.price)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

        {/* CLIENTE */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Cliente
          </p>
          <FormField
            control={form.control}
            name="customer_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selecione o cliente</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um cliente..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* SERVIÇOS */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Serviços do Contrato
          </p>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => { setMode('package'); setSelectedProductIds([]); }}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-md border text-sm font-medium transition-colors',
                mode === 'package' ? 'border-primary bg-primary/5 text-primary' : 'border-input hover:bg-muted/50'
              )}
            >
              Usar Pacote
            </button>
            <button
              type="button"
              onClick={() => { setMode('custom'); setSelectedPackageId(''); }}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-md border text-sm font-medium transition-colors',
                mode === 'custom' ? 'border-primary bg-primary/5 text-primary' : 'border-input hover:bg-muted/50'
              )}
            >
              Personalizado
            </button>
          </div>

          {mode === 'package' && (
            <div className="space-y-3">
              {isLoadingPackages ? (
                <div className="flex items-center justify-center p-4 rounded-md border bg-muted/30">
                  <span className="text-sm text-muted-foreground">Carregando pacotes...</span>
                </div>
              ) : activePackages.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-4 rounded-md border bg-muted/30 text-center">
                  <span className="text-sm text-muted-foreground">Nenhum pacote disponível</span>
                  <span className="text-xs text-muted-foreground mt-1">Cadastre pacotes em Configurações {'>'} Pacotes</span>
                </div>
              ) : (
                <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um pacote..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activePackages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} - {formatCurrency(pkg.monthly_price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {selectedPackage && (
                <div className="p-3 rounded-md border bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{selectedPackage.name}</span>
                    <Badge variant="secondary">{formatCurrency(selectedPackage.monthly_price)}/mês</Badge>
                  </div>
                  {selectedPackage.package_items && (
                    <div className="flex flex-wrap gap-1">
                      {selectedPackage.package_items.map((item) => (
                        <Badge key={item.id} variant="outline" className="text-xs">
                          {item.product?.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {mode === 'custom' && (
            <div className="space-y-3">
              <ScrollArea className="h-[200px] rounded-md border p-2">
                {groupedProducts.map(cat => renderCategory(cat))}
              </ScrollArea>
              {selectedProductIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedProductIds.map(id => {
                    const p = products.find(x => x.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="gap-1 pr-1">
                        {p?.name}
                        <button type="button" onClick={() => toggleProduct(id)} className="hover:bg-muted rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* VALORES */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Valores
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/30">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>

            <div className="space-y-2">
              <FormLabel>Desconto</FormLabel>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setDiscountType('none'); setDiscountValue(0); }}
                  className={cn(
                    'px-3 py-2 rounded-md border text-sm transition-colors',
                    discountType === 'none' ? 'border-primary bg-primary/5' : 'border-input'
                  )}
                >
                  Nenhum
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={cn(
                    'px-3 py-2 rounded-md border text-sm transition-colors',
                    discountType === 'percentage' ? 'border-primary bg-primary/5' : 'border-input'
                  )}
                >
                  Percentual
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed')}
                  className={cn(
                    'px-3 py-2 rounded-md border text-sm transition-colors',
                    discountType === 'fixed' ? 'border-primary bg-primary/5' : 'border-input'
                  )}
                >
                  Valor Fixo
                </button>
              </div>
              {discountType !== 'none' && (
                <div className="flex gap-2 items-center">
                  {discountType === 'percentage' ? (
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="0"
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                  ) : (
                    <CurrencyInput
                      value={discountValue}
                      onChange={setDiscountValue}
                      placeholder="0,00"
                    />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {discountType === 'percentage' ? '%' : ''}
                  </span>
                </div>
              )}
              {discountAmount > 0 && (
                <p className="text-sm text-red-500">- {formatCurrency(discountAmount)}</p>
              )}
            </div>

            <div className="space-y-2">
              <FormLabel>Acréscimo</FormLabel>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setAdditionType('none'); setAdditionValue(0); }}
                  className={cn(
                    'px-3 py-2 rounded-md border text-sm transition-colors',
                    additionType === 'none' ? 'border-primary bg-primary/5' : 'border-input'
                  )}
                >
                  Nenhum
                </button>
                <button
                  type="button"
                  onClick={() => setAdditionType('percentage')}
                  className={cn(
                    'px-3 py-2 rounded-md border text-sm transition-colors',
                    additionType === 'percentage' ? 'border-primary bg-primary/5' : 'border-input'
                  )}
                >
                  Percentual
                </button>
                <button
                  type="button"
                  onClick={() => setAdditionType('fixed')}
                  className={cn(
                    'px-3 py-2 rounded-md border text-sm transition-colors',
                    additionType === 'fixed' ? 'border-primary bg-primary/5' : 'border-input'
                  )}
                >
                  Valor Fixo
                </button>
              </div>
              {additionType !== 'none' && (
                <div className="flex gap-2 items-center">
                  {additionType === 'percentage' ? (
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="0"
                      value={additionValue || ''}
                      onChange={(e) => setAdditionValue(parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                  ) : (
                    <CurrencyInput
                      value={additionValue}
                      onChange={setAdditionValue}
                      placeholder="0,00"
                    />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {additionType === 'percentage' ? '%' : ''}
                  </span>
                </div>
              )}
              {additionAmount > 0 && (
                <p className="text-sm text-green-600">+ {formatCurrency(additionAmount)}</p>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-primary/10 border border-primary/20">
              <span className="font-medium">Total Mensal</span>
              <span className="text-xl font-bold">{formatCurrency(finalTotal)}</span>
            </div>
          </div>
        </div>

        {/* DETALHES */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Detalhes do Contrato
          </p>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Contrato</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Pacote Marketing Digital" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observações sobre o contrato..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* PERÍODO */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Período e Cobrança
          </p>

          <div className="space-y-4">
            {/* Linha 1: Data de Início / Data do Primeiro Pagamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="first_billing_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Primeiro Pagamento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha 2: Tipo de cobrança / Duração / Dia da cobrança Recorrente */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="billing_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Cobrança</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="semiannual">Semestral</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contract_duration_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (meses)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Indeterminado"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    {contractDurationMonths && endDate && (
                      <FormDescription>
                        Término: {format(parseISO(endDate), 'dd/MM/yyyy')}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billing_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia Cobrança Recorrente</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* CONFIGURAÇÕES */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Configurações
          </p>

          <div className="space-y-4">
            {/* Linha 1: Categoria Padrão / Forma de pagamento / Carência */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="default_category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria Padrão</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="default_payment_method_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grace_period_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carência (dias)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="90"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="automatic_renewal"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <FormLabel className="text-sm">Renovação Automática</FormLabel>
                    <FormDescription className="text-xs">
                      Renovar quando o contrato expirar
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {automaticRenewal && (
              <FormField
                control={form.control}
                name="renewal_period_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período de Renovação (meses)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        placeholder="12"
                        className="w-24"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 12)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Internas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notas internas..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {contract ? 'Atualizar Contrato' : 'Criar Contrato'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
