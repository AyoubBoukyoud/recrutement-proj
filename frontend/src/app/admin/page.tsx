import { redirect } from 'next/navigation';

/** `/admin` seul n'affiche rien en propre — il redirige vers la première
 *  section, exactement comme le faisait la route index de react-router. */
export default function AdminIndexPage() {
  redirect('/admin/apercu');
}
