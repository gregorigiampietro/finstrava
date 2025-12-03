import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Department, DepartmentFormData, DepartmentTree } from '@/lib/types/department';
import { useCompany } from '@/lib/contexts/company-context';

export function useDepartments() {
  const { selectedCompany } = useCompany();
  const selectedCompanyId = selectedCompany?.id;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchDepartments = useCallback(async () => {
    if (!selectedCompanyId) {
      setDepartments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .is('deleted_at', null)
        .order('sort_order')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId, supabase]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const createDepartment = async (data: DepartmentFormData) => {
    if (!selectedCompanyId) throw new Error('Nenhuma empresa selecionada');

    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);

    const { error } = await supabase
      .from('departments')
      .insert([{
        ...cleanData,
        company_id: selectedCompanyId,
        is_active: data.is_active ?? true,
        parent_id: data.parent_id || null,
      }]);

    if (error) throw error;
    await fetchDepartments();
  };

  const updateDepartment = async (id: string, data: Partial<DepartmentFormData>) => {
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value === '' ? null : value;
      }
      return acc;
    }, {} as Record<string, unknown>);

    // Garantir que parent_id seja null se vazio
    if ('parent_id' in cleanData) {
      cleanData.parent_id = cleanData.parent_id || null;
    }

    const { error } = await supabase
      .from('departments')
      .update(cleanData)
      .eq('id', id);

    if (error) throw error;
    await fetchDepartments();
  };

  const deleteDepartment = async (id: string) => {
    const { error } = await supabase
      .from('departments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await fetchDepartments();
  };

  const getDepartment = async (id: string): Promise<Department | null> => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  };

  // Construir estrutura de árvore a partir da lista plana
  const buildDepartmentTree = useCallback((): DepartmentTree[] => {
    const departmentMap = new Map<string, DepartmentTree>();
    const roots: DepartmentTree[] = [];

    // Primeiro passo: criar todos os nós
    departments.forEach(dept => {
      departmentMap.set(dept.id, { ...dept, children: [], level: 0 });
    });

    // Segundo passo: construir estrutura de árvore
    departments.forEach(dept => {
      const node = departmentMap.get(dept.id)!;
      if (dept.parent_id && departmentMap.has(dept.parent_id)) {
        const parent = departmentMap.get(dept.parent_id)!;
        node.level = parent.level + 1;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [departments]);

  // Obter lista plana com indicação de hierarquia (para selects)
  const getDepartmentsFlat = useCallback((): { department: Department; level: number; path: string }[] => {
    const result: { department: Department; level: number; path: string }[] = [];

    const traverse = (depts: DepartmentTree[], path: string = '') => {
      depts.forEach(dept => {
        const currentPath = path ? `${path} > ${dept.name}` : dept.name;
        result.push({ department: dept, level: dept.level, path: currentPath });
        if (dept.children.length > 0) {
          traverse(dept.children, currentPath);
        }
      });
    };

    traverse(buildDepartmentTree());
    return result;
  }, [buildDepartmentTree]);

  // Obter apenas departamentos raiz (sem pai)
  const getRootDepartments = useCallback(() => {
    return departments.filter(d => !d.parent_id && d.is_active);
  }, [departments]);

  // Obter filhos de um departamento específico
  const getChildDepartments = useCallback((parentId: string) => {
    return departments.filter(d => d.parent_id === parentId);
  }, [departments]);

  // Obter departamentos ativos para seleção
  const getActiveDepartments = useCallback(() => {
    return departments.filter(d => d.is_active);
  }, [departments]);

  // Verificar se um departamento pode ser pai de outro (evitar ciclos)
  const canBeParent = useCallback((departmentId: string, potentialParentId: string): boolean => {
    if (departmentId === potentialParentId) return false;

    // Verificar se potentialParentId é descendente de departmentId
    const descendants = new Set<string>();
    const collectDescendants = (id: string) => {
      const children = departments.filter(d => d.parent_id === id);
      children.forEach(child => {
        descendants.add(child.id);
        collectDescendants(child.id);
      });
    };

    collectDescendants(departmentId);
    return !descendants.has(potentialParentId);
  }, [departments]);

  return {
    departments,
    isLoading,
    error,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartment,
    buildDepartmentTree,
    getDepartmentsFlat,
    getRootDepartments,
    getChildDepartments,
    getActiveDepartments,
    canBeParent,
    refetch: fetchDepartments,
  };
}
