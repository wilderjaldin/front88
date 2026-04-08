import { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectPermissions } from "@/store/authSlice";

export const usePermissions = () => {
    const permissions = useSelector(selectPermissions);

    const permissionSet = useMemo(() => {
        return new Set(permissions || []);
    }, [permissions]);

    const hasPermission = (permission) => {
        return permissionSet.has(permission);
    };

    return { hasPermission };
};