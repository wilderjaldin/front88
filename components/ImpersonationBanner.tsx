"use client";

import { useSelector, useDispatch } from "react-redux";
import { selectImpersonated, selectUser, restoreAdmin } from "@/store/authSlice";

export default function ImpersonationBanner() {

  const impersonated = useSelector(selectImpersonated);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  if (!impersonated) return null;

  return (
    <div className="bg-orange-500 text-white px-6 py-2 flex items-center justify-between text-sm">
      <div>
        Estás navegando como <b>{user?.name}</b> ({user?.rol})
      </div>

      <button
        onClick={() => dispatch(restoreAdmin())}
        className="bg-white text-orange-600 px-3 py-1 rounded-md text-xs font-semibold"
      >
        Volver a mi cuenta
      </button>
    </div>
  );
}