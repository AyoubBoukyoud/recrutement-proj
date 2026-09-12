import { redirect } from 'next/navigation';

/** The former mandatory language step is now handled from every page header. */
export default function LanguageSelectPage() {
  redirect('/auth-phone');
}
