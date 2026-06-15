'use client';

const TableItems = ({ t, items }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.nro_part} 1</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.brand} 1</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.nro_part} 2</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.brand} 2</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
        {items.map((item, index) => (
          <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors">
            <td className="px-4 py-2.5 font-mono text-gray-800 dark:text-gray-200">{item.nro_part_1}</td>
            <td className="px-4 py-2.5">
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                {item.brand_1}
              </span>
            </td>
            <td className="px-4 py-2.5 font-mono text-gray-800 dark:text-gray-200">{item.nro_part_2}</td>
            <td className="px-4 py-2.5">
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                {item.brand_2}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default TableItems;
