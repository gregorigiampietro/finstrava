'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyGuard } from '@/components/company-guard';

// Product Categories
import { useProductCategories } from '@/lib/hooks/use-product-categories';
import { ProductCategoryForm } from '@/components/product-categories/product-category-form';
import { ProductCategoryTree } from '@/components/product-categories/product-category-tree';
import { ProductCategory, ProductCategoryFormData } from '@/lib/types/product-category';

// Financial Categories
import { useCategories } from '@/lib/hooks/use-categories';
import { CategoryForm } from '@/components/categories/category-form';
import { ResizableTable } from '@/components/categories/resizable-table';
import { Category, CategoryFormData } from '@/lib/types/category';

import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  AlertCircle,
  FolderTree,
  Folder,
  FolderOpen,
  TrendingUp,
  TrendingDown,
  Tags
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState('products');
  const { toast } = useToast();

  // Product Categories State
  const {
    categories: productCategories,
    isLoading: productLoading,
    error: productError,
    createCategory: createProductCategory,
    updateCategory: updateProductCategory,
    deleteCategory: deleteProductCategory,
    buildCategoryTree,
    getParentCategories,
  } = useProductCategories();

  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProductCategory, setEditingProductCategory] = useState<ProductCategory | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);

  // Financial Categories State
  const {
    categories: financialCategories,
    isLoading: financialLoading,
    error: financialError,
    createCategory: createFinancialCategory,
    updateCategory: updateFinancialCategory,
    deleteCategory: deleteFinancialCategory,
  } = useCategories();

  const [isFinancialFormOpen, setIsFinancialFormOpen] = useState(false);
  const [editingFinancialCategory, setEditingFinancialCategory] = useState<Category | null>(null);

  // Product Category Handlers
  const handleProductSubmit = async (data: ProductCategoryFormData) => {
    try {
      if (editingProductCategory) {
        await updateProductCategory(editingProductCategory.id, data);
        toast({ title: 'Categoria atualizada', description: 'A categoria foi atualizada com sucesso.' });
      } else {
        await createProductCategory(data);
        toast({ title: 'Categoria criada', description: 'A categoria foi criada com sucesso.' });
      }
      setIsProductFormOpen(false);
      setEditingProductCategory(null);
      setDefaultParentId(null);
    } catch {
      toast({ title: 'Erro ao salvar', description: 'Ocorreu um erro ao salvar a categoria.', variant: 'destructive' });
    }
  };

  const handleProductEdit = (category: ProductCategory) => {
    setEditingProductCategory(category);
    setDefaultParentId(null);
    setIsProductFormOpen(true);
  };

  const handleAddSubcategory = (parentId: string) => {
    setEditingProductCategory(null);
    setDefaultParentId(parentId);
    setIsProductFormOpen(true);
  };

  const handleProductDelete = async (id: string) => {
    try {
      await deleteProductCategory(id);
      toast({ title: 'Categoria excluída', description: 'A categoria foi excluída com sucesso.' });
    } catch {
      toast({ title: 'Erro ao excluir', description: 'Ocorreu um erro ao excluir a categoria.', variant: 'destructive' });
    }
  };

  // Financial Category Handlers
  const handleFinancialSubmit = async (data: CategoryFormData) => {
    try {
      if (editingFinancialCategory) {
        await updateFinancialCategory(editingFinancialCategory.id, data);
        toast({ title: 'Categoria atualizada', description: 'A categoria foi atualizada com sucesso.' });
      } else {
        await createFinancialCategory(data);
        toast({ title: 'Categoria criada', description: 'A categoria foi criada com sucesso.' });
      }
      setIsFinancialFormOpen(false);
      setEditingFinancialCategory(null);
    } catch {
      toast({ title: 'Erro ao salvar', description: 'Ocorreu um erro ao salvar a categoria.', variant: 'destructive' });
    }
  };

  const handleFinancialEdit = (category: Category) => {
    setEditingFinancialCategory(category);
    setIsFinancialFormOpen(true);
  };

  const handleFinancialDelete = async (id: string) => {
    try {
      await deleteFinancialCategory(id);
      toast({ title: 'Categoria excluída', description: 'A categoria foi excluída com sucesso.' });
    } catch {
      toast({ title: 'Erro ao excluir', description: 'Ocorreu um erro ao excluir a categoria.', variant: 'destructive' });
    }
  };

  // Stats
  const parentCategories = getParentCategories();
  const childCategories = productCategories.filter(c => c.parent_id);
  const categoryTree = buildCategoryTree();
  const incomeCategories = financialCategories.filter(c => c.type === 'income');
  const expenseCategories = financialCategories.filter(c => c.type === 'expense');

  return (
    <CompanyGuard>
      <div className="space-y-6">
        {(productError || financialError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar categorias: {productError?.message || financialError?.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold">Categorias</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize seus produtos, serviços e lançamentos financeiros
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <TabsList>
              <TabsTrigger value="products" className="gap-2">
                <FolderTree className="h-4 w-4" />
                Produtos
              </TabsTrigger>
              <TabsTrigger value="financial" className="gap-2">
                <Tags className="h-4 w-4" />
                Financeiras
              </TabsTrigger>
            </TabsList>

            {activeTab === 'products' ? (
              <Button onClick={() => {
                setEditingProductCategory(null);
                setDefaultParentId(null);
                setIsProductFormOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            ) : (
              <Button onClick={() => setIsFinancialFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            )}
          </div>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6 mt-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                label="Categorias"
                value={parentCategories.length}
                icon={<Folder className="w-4 h-4" />}
                trendLabel="categorias principais"
              />
              <StatCard
                label="Subcategorias"
                value={childCategories.length}
                icon={<FolderOpen className="w-4 h-4" />}
                trendLabel="subcategorias"
              />
              <StatCard
                label="Total"
                value={productCategories.length}
                icon={<FolderTree className="w-4 h-4" />}
                trendLabel="categorias ativas"
              />
            </div>

            {/* Tree */}
            {productLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando categorias...</div>
            ) : categoryTree.length === 0 ? (
              <div className="text-center py-12 border rounded-xl bg-card">
                <FolderTree className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">Nenhuma categoria cadastrada</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Crie categorias para organizar seus produtos e serviços
                </p>
                <Button onClick={() => setIsProductFormOpen(true)} variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Categoria
                </Button>
              </div>
            ) : (
              <ProductCategoryTree
                categories={categoryTree}
                onEdit={handleProductEdit}
                onDelete={handleProductDelete}
                onAddSubcategory={handleAddSubcategory}
              />
            )}
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6 mt-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                label="Receitas"
                value={incomeCategories.length}
                icon={<TrendingUp className="w-4 h-4" />}
                trend={incomeCategories.length > 0 ? 100 : 0}
                trendLabel="categorias de entrada"
              />
              <StatCard
                label="Despesas"
                value={expenseCategories.length}
                icon={<TrendingDown className="w-4 h-4" />}
                trendLabel="categorias de saída"
              />
              <StatCard
                label="Total"
                value={financialCategories.length}
                icon={<Tags className="w-4 h-4" />}
                trendLabel="categorias financeiras"
              />
            </div>

            {/* Table */}
            {financialLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando categorias...</div>
            ) : (
              <ResizableTable
                categories={financialCategories}
                onEdit={handleFinancialEdit}
                onDelete={handleFinancialDelete}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Product Category Modal */}
        <Dialog open={isProductFormOpen} onOpenChange={(open) => {
          setIsProductFormOpen(open);
          if (!open) {
            setEditingProductCategory(null);
            setDefaultParentId(null);
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingProductCategory ? 'Editar Categoria' : defaultParentId ? 'Nova Subcategoria' : 'Nova Categoria de Produto'}
              </DialogTitle>
              <DialogDescription>
                {editingProductCategory
                  ? 'Edite os dados da categoria'
                  : 'Crie uma categoria para organizar seus produtos'}
              </DialogDescription>
            </DialogHeader>
            <ProductCategoryForm
              category={editingProductCategory || undefined}
              parentCategories={parentCategories}
              defaultParentId={defaultParentId}
              onSubmit={handleProductSubmit}
              onCancel={() => {
                setIsProductFormOpen(false);
                setEditingProductCategory(null);
                setDefaultParentId(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Financial Category Modal */}
        <Dialog open={isFinancialFormOpen} onOpenChange={(open) => {
          setIsFinancialFormOpen(open);
          if (!open) setEditingFinancialCategory(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFinancialCategory ? 'Editar Categoria' : 'Nova Categoria Financeira'}
              </DialogTitle>
              <DialogDescription>
                {editingFinancialCategory
                  ? 'Edite os dados da categoria financeira'
                  : 'Crie uma categoria para organizar suas receitas ou despesas'}
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              category={editingFinancialCategory || undefined}
              onSubmit={handleFinancialSubmit}
              onCancel={() => {
                setIsFinancialFormOpen(false);
                setEditingFinancialCategory(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </CompanyGuard>
  );
}
