import IconLockDots from "./icon/icon-lock-dots";

export default function AccessDenied({ message }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-md">

        <div className="flex justify-center mb-4 text-red-500">
          <IconLockDots className="w-12 h-12" />
        </div>

        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Acceso restringido
        </h2>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {message || "No tienes permisos para acceder a esta sección."}
        </p>

      </div>
    </div>
  );
}