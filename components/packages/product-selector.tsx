'use client';

import { useMemo } from 'react';
import { Product } from '@/lib/types/product';
import { useProducts } from '@/lib/hooks/use-products';
import { useProductCategories } from '@/lib/hooks/use-product-categories';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, ChevronRight, FolderOpen, Folder, Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

// Simple checkbox component to avoid Radix issues
function SimpleCheckbox({
  checked,
  indeterminate,
  className
}: {
  checked: boolean;
  indeterminate?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background',
        'flex items-center justify-center',
        (checked || indeterminate) && 'bg-primary text-primary-foreground',
        className
      )}
    >
      {checked && <Check className="h-3 w-3" />}
      {indeterminate && !checked && <Minus className="h-3 w-3" />}
    </div>
  );
}

interface ProductSelectorProps {
  selectedProductIds: string[];
  onSelectionChange: (productIds: string[]) => void;
}

interface CategoryGroup {
  id: string | null;
  name: string;
  color?: string | null;
  parentId?: string | null;
  products: Product[];
  subcategories: CategoryGroup[];
}

export function ProductSelector({ selectedProductIds, onSelectionChange }: ProductSelectorProps) {
  const { products } = useProducts();
  const { categories } = useProductCategories();

  // Group products by category hierarchy
  const groupedProducts = useMemo(() => {
    const activeProducts = products.filter(p => p.is_active);

    // Build category map
    const categoryMap = new Map<string, CategoryGroup>();

    // Initialize categories
    categories.forEach(cat => {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        parentId: cat.parent_id,
        products: [],
        subcategories: [],
      });
    });

    // Group for uncategorized products
    const uncategorized: CategoryGroup = {
      id: null,
      name: 'Sem Categoria',
      products: [],
      subcategories: [],
    };

    // Assign products to categories
    activeProducts.forEach(product => {
      if (product.category_id && categoryMap.has(product.category_id)) {
        categoryMap.get(product.category_id)!.products.push(product);
      } else {
        uncategorized.products.push(product);
      }
    });

    // Build hierarchy
    const rootCategories: CategoryGroup[] = [];

    categoryMap.forEach(cat => {
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)!.subcategories.push(cat);
      } else if (!cat.parentId) {
        rootCategories.push(cat);
      }
    });

    // Sort categories and subcategories by name
    rootCategories.sort((a, b) => a.name.localeCompare(b.name));
    rootCategories.forEach(cat => {
      cat.subcategories.sort((a, b) => a.name.localeCompare(b.name));
    });

    // Add uncategorized if it has products
    if (uncategorized.products.length > 0) {
      rootCategories.push(uncategorized);
    }

    // Filter out empty categories (no products and no subcategories with products)
    const filterEmpty = (cats: CategoryGroup[]): CategoryGroup[] => {
      return cats.filter(cat => {
        cat.subcategories = filterEmpty(cat.subcategories);
        return cat.products.length > 0 || cat.subcategories.length > 0;
      });
    };

    return filterEmpty(rootCategories);
  }, [products, categories]);

  const toggleProduct = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      onSelectionChange(selectedProductIds.filter(id => id !== productId));
    } else {
      onSelectionChange([...selectedProductIds, productId]);
    }
  };

  const toggleCategory = (category: CategoryGroup) => {
    const categoryProductIds = getAllProductIds(category);
    const allSelected = categoryProductIds.every(id => selectedProductIds.includes(id));

    if (allSelected) {
      // Deselect all
      onSelectionChange(selectedProductIds.filter(id => !categoryProductIds.includes(id)));
    } else {
      // Select all
      const newSelection = new Set([...selectedProductIds, ...categoryProductIds]);
      onSelectionChange(Array.from(newSelection));
    }
  };

  const getAllProductIds = (category: CategoryGroup): string[] => {
    const ids = category.products.map(p => p.id);
    category.subcategories.forEach(sub => {
      ids.push(...getAllProductIds(sub));
    });
    return ids;
  };

  const getCategorySelectionState = (category: CategoryGroup): 'none' | 'some' | 'all' => {
    const categoryProductIds = getAllProductIds(category);
    if (categoryProductIds.length === 0) return 'none';

    const selectedCount = categoryProductIds.filter(id => selectedProductIds.includes(id)).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === categoryProductIds.length) return 'all';
    return 'some';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const renderProduct = (product: Product) => {
    const isSelected = selectedProductIds.includes(product.id);

    return (
      <div
        key={product.id}
        className={cn(
          'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
          isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
        )}
        onClick={() => toggleProduct(product.id)}
      >
        <SimpleCheckbox checked={isSelected} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{product.name}</span>
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {product.type === 'service' ? 'Serviço' : 'Produto'}
            </Badge>
          </div>
          {product.price && product.price > 0 && (
            <p className="text-xs text-muted-foreground">
              {formatCurrency(product.price)}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderCategory = (category: CategoryGroup, level: number = 0) => {
    const selectionState = getCategorySelectionState(category);
    const hasContent = category.products.length > 0 || category.subcategories.length > 0;

    if (!hasContent) return null;

    return (
      <div key={category.id || 'uncategorized'} className={cn('space-y-1', level > 0 && 'ml-4')}>
        {/* Category Header */}
        <div
          className={cn(
            'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
            'hover:bg-muted/50',
            level === 0 ? 'bg-muted/30' : ''
          )}
          onClick={() => toggleCategory(category)}
        >
          <SimpleCheckbox
            checked={selectionState === 'all'}
            indeterminate={selectionState === 'some'}
          />
          {level === 0 ? (
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
          <span className={cn(
            'font-medium text-sm',
            level === 0 ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {category.name}
          </span>
          {category.color && (
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: category.color }}
            />
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {getAllProductIds(category).length} item(s)
          </span>
        </div>

        {/* Subcategories */}
        {category.subcategories.length > 0 && (
          <div className="space-y-1">
            {category.subcategories.map(sub => renderCategory(sub, level + 1))}
          </div>
        )}

        {/* Products directly in this category */}
        {category.products.length > 0 && (
          <div className={cn('space-y-0.5', level > 0 ? 'ml-4' : 'ml-6')}>
            {category.products.map(renderProduct)}
          </div>
        )}
      </div>
    );
  };

  if (groupedProducts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum produto/serviço ativo</p>
        <p className="text-xs">Cadastre produtos para incluí-los em pacotes</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] rounded-lg border p-3">
      <div className="space-y-2">
        {groupedProducts.map(category => renderCategory(category))}
      </div>
    </ScrollArea>
  );
}

// Component to display selected products organized by category
interface SelectedProductsDisplayProps {
  selectedProductIds: string[];
  onRemove: (productId: string) => void;
}

export function SelectedProductsDisplay({ selectedProductIds, onRemove }: SelectedProductsDisplayProps) {
  const { products } = useProducts();
  const { categories } = useProductCategories();

  const groupedSelected = useMemo(() => {
    const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));

    // Build category lookup with parent info
    const categoryLookup = new Map<string, { name: string; color?: string | null; parentName?: string }>();
    categories.forEach(cat => {
      const parent = cat.parent_id ? categories.find(c => c.id === cat.parent_id) : null;
      categoryLookup.set(cat.id, {
        name: cat.name,
        color: cat.color,
        parentName: parent?.name,
      });
    });

    // Group by category path
    const groups = new Map<string, { path: string; color?: string | null; products: Product[] }>();

    selectedProducts.forEach(product => {
      let path = 'Sem Categoria';
      let color: string | null | undefined;

      if (product.category_id && categoryLookup.has(product.category_id)) {
        const cat = categoryLookup.get(product.category_id)!;
        path = cat.parentName ? `${cat.parentName} > ${cat.name}` : cat.name;
        color = cat.color;
      }

      if (!groups.has(path)) {
        groups.set(path, { path, color, products: [] });
      }
      groups.get(path)!.products.push(product);
    });

    // Sort groups by path
    return Array.from(groups.values()).sort((a, b) => a.path.localeCompare(b.path));
  }, [selectedProductIds, products, categories]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (selectedProductIds.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum serviço selecionado</p>
        <p className="text-xs">Marque os serviços acima para incluí-los no pacote</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groupedSelected.map(group => (
        <div key={group.path} className="space-y-1">
          {/* Category Header */}
          <div className="flex items-center gap-2 px-2 py-1">
            <Folder className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {group.path}
            </span>
            {group.color && (
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: group.color }}
              />
            )}
          </div>

          {/* Products */}
          <div className="space-y-1">
            {group.products.map(product => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs">
                    {product.type === 'service' ? 'Serviço' : 'Produto'}
                  </Badge>
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    {product.price && product.price > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Preço base: {formatCurrency(product.price)}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  onClick={() => onRemove(product.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <p className="text-xs text-muted-foreground pt-2 border-t">
        {selectedProductIds.length} serviço(s) selecionado(s)
      </p>
    </div>
  );
}
