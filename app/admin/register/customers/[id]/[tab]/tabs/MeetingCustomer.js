'use client';

export default function MeetingCustomer() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
      <svg className="h-14 w-14 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l5.654-4.654m5.58-9.586.083-.083a3.636 3.636 0 0 1 5.144 5.143l-.082.083M5.955 8.955 9 12" />
      </svg>
      <div className="text-center">
        <p className="text-base font-semibold text-gray-500 dark:text-gray-400">En construcción</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Este módulo estará disponible próximamente.</p>
      </div>
    </div>
  );
}
