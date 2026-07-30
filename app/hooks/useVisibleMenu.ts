import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { MENU_CONFIG, MenuItem, MenuItemChild } from '@/components/layouts/menuConfig';
import { usePermissions } from '@/app/hooks/usePermissions';
import { selectUser } from '@/store/authSlice';

export const useVisibleMenu = (): MenuItem[] => {
  const { hasPermission } = usePermissions();
  const user = useSelector(selectUser);

  return useMemo(() => {
    // Un `permission` acotado por `permissionCountry` solo se exige a usuarios de ese país;
    // para el resto de países el item se muestra igual, sin evaluar el permiso.
    const checkPermission = (permission?: string, permissionCountry?: string) => {
      if (!permission) return true;
      if (permissionCountry && user?.countryCode !== permissionCountry) return true;
      return hasPermission(permission);
    };

    if (!MENU_CONFIG) return [];
    return MENU_CONFIG.reduce<MenuItem[]>((acc, item) => {
      // Permiso del item padre (si existe)
      if (!checkPermission(item.permission, item.permissionCountry)) return acc;

      if (item.type === 'link') {
        acc.push(item);
        return acc;
      }

      // Dropdown: filtrar hijos por permiso y/o rol
      const visibleChildren = item.children.filter(
        (child: MenuItemChild) =>
          checkPermission(child.permission, child.permissionCountry) &&
          (!child.rol || user?.rol === child.rol)
      );

      // Si no quedan hijos visibles, ocultar el dropdown completo
      if (visibleChildren.length === 0) return acc;

      acc.push({ ...item, children: visibleChildren });
      return acc;
    }, []);
  }, [hasPermission, user?.rol, user?.countryCode]);
};