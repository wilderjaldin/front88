import { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectPermissions, selectIsSuperAdmin } from "@/store/authSlice";

export const usePermissions = () => {
    const permissions  = useSelector(selectPermissions);
    const isSuperAdmin = useSelector(selectIsSuperAdmin);

    const permissionSet = useMemo(() => {
        return new Set(permissions || []);
    }, [permissions]);

    // El Super Administrador tiene acceso total — no depende de que la lista de
    // permisos esté completa. La autorización real igual la valida el backend.
    const hasPermission = (permission) => {
        return isSuperAdmin || permissionSet.has(permission);
    };

    return { hasPermission, isSuperAdmin };
};
