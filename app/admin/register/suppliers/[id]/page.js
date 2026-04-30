// app/admin/register/suppliers/[id]/page.js
import { redirect } from 'next/navigation';

export default function SupplierDetailRedirect({ params }) {
  redirect(`/admin/register/suppliers/${params.id}/general`);
}