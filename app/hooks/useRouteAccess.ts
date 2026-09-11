'use client';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { MENU_CONFIG, MenuItem } from '@/components/layouts/menuConfig';
import { usePermissions } from '@/app/hooks/usePermissions';
import { selectUser } from '@/store/authSlice';

type RouteRule = {
  href: string;
  permission?: string;
  permissionCountry?: string;
  rol?: string;
};

// Rutas propias del usuario (su dashboard, sus ajustes) — nunca se restringen,
// aunque queden por debajo de un prefijo que sí tiene permiso (ej. /admin/users).
const PERSONAL_ROUTES = [
  '/admin/users/dashboard',
  '/admin/users/settings',
];

// Reusa el mismo mapeo href → permiso que define el menú, así la protección de
// página y la visibilidad del menú nunca se desincronizan. Solo entran las rutas
// que tienen `permission` o `rol` (las abiertas no necesitan guardia).
const ROUTE_RULES: RouteRule[] = (() => {
  const out: RouteRule[] = [];
  for (const item of (MENU_CONFIG as MenuItem[])) {
    if (item.type === 'link') {
      if (item.permission) {
        out.push({ href: item.href, permission: item.permission, permissionCountry: item.permissionCountry });
      }
    } else {
      for (const child of item.children) {
        if (child.permission || child.rol) {
          out.push({ href: child.href, permission: child.permission, permissionCountry: child.permissionCountry, rol: child.rol });
        }
      }
    }
  }
  // Ruta más larga primero: gana el match más específico (evita que
  // /admin/register/spares tape a /admin/register/spares-in-lot, etc.).
  return out.sort((a, b) => b.href.length - a.href.length);
})();

/**
 * true si el usuario puede ver la ruta actual. Devuelve true cuando la ruta no
 * está en el mapa (páginas sin restricción) — mismo criterio que useVisibleMenu.
 */
export const useRouteAccess = (): boolean => {
  const pathname = usePathname();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const user = useSelector(selectUser);

  return useMemo(() => {
    // Acceso total: el Super Administrador nunca queda bloqueado por ruta.
    if (isSuperAdmin) return true;

    // Rutas propias del usuario — siempre accesibles.
    if (PERSONAL_ROUTES.some(p => pathname === p || pathname.startsWith(p + '/'))) return true;

    const rule = ROUTE_RULES.find(
      (r) => pathname === r.href || pathname.startsWith(r.href + '/')
    );
    if (!rule) return true;

    if (rule.rol && user?.rol !== rule.rol) return false;
    if (!rule.permission) return true;
    // Un permiso acotado por país solo se exige a usuarios de ese país.
    if (rule.permissionCountry && user?.countryCode !== rule.permissionCountry) return true;
    return hasPermission(rule.permission);
  }, [pathname, hasPermission, isSuperAdmin, user?.rol, user?.countryCode]);
};
