import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'العمل في ألمانيا للمغاربة | Amud Skills',
  description: 'اكتشف فرص العمل في ألمانيا حسب مهنتك وخبرتك ومستوى اللغة الألمانية. أنشئ ملفك المهني على Amud Skills.',
  alternates: {
    canonical: '/ar/travail-allemagne',
    languages: {
      'fr-MA': `${SITE_URL}/emploi-allemagne-maroc`,
      'ar-MA': `${SITE_URL}/ar/travail-allemagne`,
      'x-default': `${SITE_URL}/emploi-allemagne-maroc`,
    },
  },
  openGraph: { title: 'العمل في ألمانيا للمغاربة | Amud Skills', description: 'فرص مهنية للمرشحين المغاربة في ألمانيا.', url: '/ar/travail-allemagne', siteName: 'Amud Skills', locale: 'ar_MA', type: 'article' },
  twitter: { card: 'summary', title: 'العمل في ألمانيا للمغاربة | Amud Skills', description: 'فرص مهنية للمرشحين المغاربة في ألمانيا.' },
};

const faq = [
  ['هل يجب أن أتحدث الألمانية للتقديم؟', 'يعتمد المستوى المطلوب على المهنة وصاحب العمل والتواصل مع الزبائن أو المرضى والقواعد المنظمة للمهنة. اذكر مستواك الحقيقي في ملفك.'],
  ['هل تضمن Amud Skills الحصول على عقد أو تأشيرة؟', 'لا. تساعد المنصة على تقديم الملفات المهنية والربط بين المرشحين والشركات. قرار التوظيف يعود إلى صاحب العمل، وقرارات التأشيرة إلى السلطات المختصة.'],
  ['كيف أتحقق من الشهادة المطلوبة؟', 'تختلف إجراءات الاعتراف بالشهادات حسب المهنة والجهة المختصة. راجع المصادر الرسمية الألمانية قبل بدء الإجراءات.'],
];

export default function ArabicEmploymentGuide() {
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'العمل في ألمانيا', item: `${SITE_URL}/ar/travail-allemagne` },
  ] };
  const faqSchema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) };
  return <main id="main-content" dir="rtl" lang="ar" className="min-h-screen bg-home-sand text-home-ink">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, '\\u003c') }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }} />
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-20">
      <nav aria-label="مسار الصفحة" className="text-sm text-home-slate"><Link href="/" className="underline">الرئيسية</Link> / فرص العمل في ألمانيا</nav>
      <section className="mt-8 rounded-[2rem] bg-home-strong px-6 py-10 text-white sm:px-10 sm:py-14">
        <p className="text-sm font-bold tracking-wide text-white/70">AMUD SKILLS · مواهب مغربية وشركات ألمانية</p>
        <h1 className="mt-5 max-w-4xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">ابحث عن فرصة مهنية مناسبة لك في ألمانيا</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-white/80 sm:text-lg">تساعد Amud Skills المواهب المغربية على عرض خبراتها ومؤهلاتها وربطها بفرص مهنية لدى الشركات في ألمانيا، وفق متطلبات كل وظيفة.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/offres" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-home-coral px-6 py-3 font-bold text-white">عرض الفرص</Link><Link href="/auth-phone" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/35 px-6 py-3 font-bold text-white">إنشاء ملفي المهني</Link></div>
      </section>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {[
          ['مجالات مهنية متنوعة', 'قد تشمل الفرص القيادة، والخدمات اللوجستية، والفندقة والمطاعم، والصحة، والبناء، والصناعة، والصيانة، والتقنيات والمعلوماتية. تختلف الاحتياجات من شركة إلى أخرى.'],
          ['الخبرة والمؤهلات', 'يمكن أن تتنوع الملفات بين التكوين المهني ومستويات Bac+2 وBac+3 وBac+5 والخبرة الميدانية. اقرأ شروط كل عرض وتحقق من الاعتراف أو الترخيص عند الحاجة.'],
          ['مستوى اللغة الألمانية', 'المستوى المطلوب مرتبط بطبيعة المهام والتواصل مع الزبائن أو المرضى وصاحب العمل والقواعد المنظمة للمهنة. يمكن أن يتراوح مستوى المرشح من مبتدئ إلى C1+، دون ضمان ملاءمة كل مستوى لكل وظيفة.'],
          ['العقد وشروط العمل', 'تحقق من المهام ومكان العمل وساعات الدوام والأجر وشروط العقد مباشرة مع صاحب العمل. تختلف إجراءات التأشيرة والإقامة والاعتراف بالمؤهلات حسب الحالة.'],
        ].map(([title, body]) => <section key={title} className="rounded-2xl border border-home-line bg-home-surface p-6 sm:p-8"><h2 className="text-xl font-bold">{title}</h2><p className="mt-3 leading-8 text-home-slate">{body}</p></section>)}
      </div>
      <section className="mt-10 rounded-2xl border border-home-line bg-home-surface p-6 sm:p-8"><h2 className="text-2xl font-bold">أسئلة شائعة</h2><div className="mt-4 space-y-3">{faq.map(([question, answer]) => <details key={question} className="rounded-xl border border-home-line p-5"><summary className="cursor-pointer font-bold">{question}</summary><p className="mt-3 leading-8 text-home-slate">{answer}</p></details>)}</div></section>
      <section className="mt-10 rounded-2xl bg-home-coral-soft p-6 sm:p-8"><h2 className="text-xl font-bold">روابط مفيدة</h2><ul className="mt-4 flex flex-wrap gap-x-5 gap-y-3"><li><Link className="font-semibold text-home-coral-dark underline" href="/travailler-en-allemagne">العمل في ألمانيا</Link></li><li><Link className="font-semibold text-home-coral-dark underline" href="/contrat-travail-allemagne">عقد العمل في ألمانيا</Link></li><li><Link className="font-semibold text-home-coral-dark underline" href="/niveau-allemand-travail-allemagne">مستوى الألمانية للعمل</Link></li></ul></section>
      <p className="mt-8 text-sm leading-7 text-home-slate">تسهّل Amud Skills التعارف المهني ولا تضمن التوظيف أو العقد أو التأشيرة. تحقق من الشروط لدى صاحب العمل والجهات الرسمية.</p>
    </div>
  </main>;
}
