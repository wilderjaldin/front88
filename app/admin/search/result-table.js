'use client';

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const ResultTable = ({ title, columns, rows = [], hasSearched = false, hideHeader = false, scrollable = false }) => {
  // Antes de buscar no se muestra nada — ni siquiera la estructura vacía.
  if (!hasSearched) return null;

  // Búsqueda ya hecha y sin coincidencias en esta categoría: se colapsa a una
  // línea delgada (en vez de encabezado + cuerpo vacío) para no ocupar tanto
  // espacio, pero sigue visible para confirmar que la categoría existe.
  if (rows.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
        <h3 className="text-xs font-medium">{title}</h3>
        <span className="ml-auto text-xs">Sin resultados</span>
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
        <span className="ml-auto text-xs text-gray-400">{rows.length}</span>
      </div>
      <div className={`overflow-x-auto ${scrollable ? 'max-h-[420px] overflow-y-auto' : ''}`}>
        <table className="w-full border-collapse bg-white dark:bg-gray-900">
          {!hideHeader && (
            <thead>
              <tr>
                {columns.map(c => (
                  <th key={c.key} className={`${thClass} ${c.className ?? ''}`}>{c.label}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                {columns.map(c => (
                  <td key={c.key} className={`${tdClass} ${c.className ?? ''}`}>
                    {c.render ? c.render(row) : (row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultTable;
