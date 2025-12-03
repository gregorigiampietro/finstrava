'use client';

import { useState } from 'react';
import { useProducts } from '@/lib/hooks/use-products';
import { ProductForm } from '@/components/products/product-form';
import { ProductsTable } from '@/components/products/products-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle, Search, Package } from 'lucide-react';
import { Product, ProductFormData } from '@/lib/types/product';
import { useToast } from '@/hooks/use-toast';
import { CompanyGuard } from '@/components/company-guard';

export default function ProductsPage() {
  const { products, isLoading, error, createProduct, updateProduct, deleteProduct } = useProducts();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    product.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category?.name && product.category.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (data: ProductFormData) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        toast({
          title: 'Produto/serviço atualizado',
          description: 'O produto/serviço foi atualizado com sucesso.',
        });
      } else {
        await createProduct(data);
        toast({
          title: 'Produto/serviço criado',
          description: 'O produto/serviço foi criado com sucesso.',
        });
      }
      setIsFormOpen(false);
      setEditingProduct(null);
    } catch (error) {
      toast({
        title: 'Erro ao salvar produto/serviço',
        description: 'Ocorreu um erro ao salvar o produto/serviço. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      toast({
        title: 'Produto/serviço excluído',
        description: 'O produto/serviço foi excluído com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao excluir produto/serviço',
        description: 'Ocorreu um erro ao excluir o produto/serviço. Verifique se não há contratos ou lançamentos vinculados.',
        variant: 'destructive',
      });
    }
  };

  return (
    <CompanyGuard>
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar produtos/serviços: {error.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Produtos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie o catálogo de produtos e serviços da sua empresa
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, descrição, tipo ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {products.length}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Produtos</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {products.filter(p => p.type === 'product').length}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">Serviços</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {products.filter(p => p.type === 'service').length}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium">Recorrentes</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {products.filter(p => p.is_recurring).length}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando produtos/serviços...
          </div>
        ) : (
          <ProductsTable
            products={filteredProducts}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingProduct(null);
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Edite os dados do produto existente' : 'Preencha os dados para criar um novo produto'}
              </DialogDescription>
            </DialogHeader>
            <ProductForm
              product={editingProduct || undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingProduct(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </CompanyGuard>
  );
}