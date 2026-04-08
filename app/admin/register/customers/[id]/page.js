// app/admin/register/customers/[id]/page.js
// Redirige automáticamente a /[id]/general
import { redirect } from 'next/navigation';

export default function CustomerDetailRedirect({ params }) {
  redirect(`/admin/register/customers/${params.id}/general`);
}