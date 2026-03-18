import { useMemo } from 'react';
import { MENU_CONFIG, MenuItem, MenuItemChild } from '@/components/layouts/menuConfig';
import { usePermissions } from '@/app/hooks/usePermissions';

export const useVisibleMenu = (): MenuItem[] => {
  const { hasPermission } = usePermissions();

  return useMemo(() => {
    if (!MENU_CONFIG) return [];
    return MENU_CONFIG.reduce<MenuItem[]>((acc, item) => {
      // Permiso del item padre (si existe)
      if (item.permission && !hasPermission(item.permission)) return acc;

      if (item.type === 'link') {
        acc.push(item);
        return acc;
      }

      // Dropdown: filtrar hijos
      const visibleChildren = item.children.filter(
        (child: MenuItemChild) => !child.permission || hasPermission(child.permission)
      );

      // Si no quedan hijos visibles, ocultar el dropdown completo
      if (visibleChildren.length === 0) return acc;

      acc.push({ ...item, children: visibleChildren });
      return acc;
    }, []);
  }, [hasPermission]);
};