'use client';

import { useEffect, useState } from 'react';

const CANDIDATES = [
  {
    nom: 'Youssef Amrani',
    poste: 'Full-Stack Developer',
    niveau: 'C1 Professional',
    dispo: 'Immediate',
    tags: ['Node.js', 'React'],
    photo:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCHi4-UDl2MvbNBB_8dTyZ8YmA3yPioir8vx9SOXWqkSeslHwYAAb0nHWf5lYCcwveOSeMBmGpRvGnret-UMRsGB3VDhj985LOombYpN-AhNkdjYjOfOg0LKbM89_VUmc6KKJ5875qqxagxq94VIniQkUBlUSHtYiIp8fXeqjsfWs-pvi9DaC4quxYsjyUKSqJn8ZD1EMvqsQ4jiHABVa8Uw9sWgRecA2jGpqa_DGjl0Mh6l5yLQdXY',
  },
  {
    nom: 'Nadia Mansouri',
    poste: 'Data Scientist',
    niveau: 'B2 Intermediate',
    dispo: 'Immediate',
    tags: ['Python', 'AWS'],
    photo:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBMn_KzX2FxXsITntcnXaodQAETST9hn83oeb-ToHrFjEKC5tpLroEmpINd-GGeN3HbB2zzozlbXV7HEkZKO3Un_k6Njdur4DQLCtzAYU_Vk6U3jU_3Q1pIjLB6HAlA9w-vNxzqUU8K1ruDoWIVkTEWsYD89bazoAqtEVl5jfMX_FiGbIKP4svH5LwcsTL65j86g2usZ0md1XdRwQn4o2ZVg0TOPHpibhTbJTi6il-qjaYhqM7H4toU',
  },
  {
    nom: 'Karim El-Fassi',
    poste: 'Mechanical Engineer',
    niveau: 'C1 Professional',
    dispo: 'In 2 Weeks',
    tags: ['AutoCAD', 'BIM'],
    photo:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCMgrETHaWk9IHaInc2b16y1-FcQH0TmwIvVYhm3VDUpAcmR4EYCbE827BZN-rUC_CbfVkbHVcbeC-EAolaeeagkeGQlcmYRymRGLHtHL46uEe4y7V2XO1BRne8PPziJyXPhu2LUKrqHynGFLq748UIWnkLNbbD226imdqvb7ho3BkErxw9qkChPWtxP3FdxO2AFqE3kKHddO1tf79LwO_nMtBBtNtiru7O1oBpsF4O178DD7b_CZFS',
  },
  {
    nom: 'Sara Benzakour',
    poste: 'Senior Product Designer',
    niveau: 'B2 Intermediate',
    dispo: 'Immediate',
    tags: ['Figma', 'German Market'],
    photo:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBjGvBk7NkLlKzqWn9ku3gv3v8MHW3O9SXwISZIffvMOfBc73sQdbd7Gd1E5IBGtkudSaoyfDwbRReYlA55HOXKxqreBms9VdD7A4UdzxeWnOlLo1OXUrgsd-mzoVXuA9XBYv-uaFtDwkAyApi_JegqNmIhtfnUOLUMhgNwH8m5U8CyVCxxdZhO6SdBFViqFUDdlP8KOrPvczVwfkoX5979VWqAlLjym3zF8PL4LpQ5D-gNv3M5ZfL4',
  },
];

type StatutMatch = 'New' | 'Contacted' | 'Interview' | 'Offer' | 'Rejected';
const MATCHINGS: { nom: string; initiales: string; poste: string; statut: StatutMatch; when: string; bg: string; fg: string }[] = [
  { nom: 'Adnane Alami', initiales: 'AA', poste: 'DevOps Specialist', statut: 'New', when: 'Today, 09:15 AM', bg: 'bg-amud-primary-fixed', fg: 'text-amud-on-primary-fixed' },
  { nom: 'Imane Bennani', initiales: 'IB', poste: 'Cloud Architect', statut: 'Contacted', when: 'Yesterday', bg: 'bg-amud-secondary-fixed', fg: 'text-amud-on-secondary-fixed' },
  { nom: 'Omar Tazi', initiales: 'OT', poste: 'Frontend Lead', statut: 'Interview', when: 'Oct 24, 2023', bg: 'bg-amud-tertiary-fixed', fg: 'text-amud-on-tertiary-fixed' },
  { nom: 'Rania Kadiri', initiales: 'RK', poste: 'HR Business Partner', statut: 'Offer', when: 'Oct 22, 2023', bg: 'bg-amud-surface-container-highest', fg: 'text-amud-on-surface-variant' },
  { nom: 'Mehdi Ziani', initiales: 'MZ', poste: 'Cybersecurity Analyst', statut: 'Rejected', when: 'Oct 20, 2023', bg: 'bg-amud-error-container', fg: 'text-amud-on-error-container' },
];

const STATUT_PILL: Record<StatutMatch, string> = {
  New: 'bg-amud-primary-container text-white',
  Contacted: 'bg-amud-surface-container-high text-amud-on-surface-variant',
  Interview: 'bg-amud-tertiary text-white',
  Offer: 'bg-amud-primary text-white',
  Rejected: 'bg-amud-error-container text-amud-on-error-container',
};

export default function AmudEmployerDashboardPage() {
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2200);
    return () => clearTimeout(t);
  }, [notice]);

  return (
    <>
      {notice ? (
        <div className="flex items-center gap-2 rounded-lg border border-amud-primary-fixed-dim bg-amud-primary-fixed p-md text-body-md text-amud-on-primary-fixed">
          <span className="material-symbols-outlined">check_circle</span>
          {notice}
        </div>
      ) : null}

      <section>
        <h2 className="text-headline-lg text-amud-on-surface">Employer Dashboard</h2>
        <p className="text-body-md text-amud-on-surface-variant">Welcome back. Here&apos;s what&apos;s happening with your recruitment funnel today.</p>
      </section>

      <section className="grid grid-cols-1 gap-lg md:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: 'person_add', value: '24', label: 'New Candidates', delta: '+12%', bg: 'bg-amud-primary-fixed', fg: 'text-amud-on-primary-fixed' },
          { icon: 'handshake', value: '18', label: 'Active Matchings', bg: 'bg-amud-secondary-fixed', fg: 'text-amud-on-secondary-fixed' },
          { icon: 'calendar_today', value: '5', label: 'Scheduled Interviews', extra: 'Next: Tomorrow 10am', bg: 'bg-amud-tertiary-fixed', fg: 'text-amud-on-tertiary-fixed', accent: true },
          { icon: 'analytics', value: '68%', label: 'Conversion Rate', bg: 'bg-amud-primary-fixed', fg: 'text-amud-on-primary-fixed' },
        ].map((k) => (
          <div
            key={k.label}
            className={`group relative overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg transition-all hover:-translate-y-1 hover:shadow-md ${k.accent ? 'border-l-4 border-l-amud-primary' : ''}`}
          >
            <div className="mb-md flex items-start justify-between">
              <span className={`material-symbols-outlined rounded-lg p-xs ${k.bg} ${k.fg}`}>{k.icon}</span>
              {k.delta ? (
                <span className="flex items-center gap-xs text-label-sm font-bold text-amud-primary">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  {k.delta}
                </span>
              ) : null}
            </div>
            <div className="text-display-lg text-amud-on-surface">{k.value}</div>
            <div className="text-label-md text-amud-on-surface-variant">{k.label}</div>
            {k.extra ? <div className="mt-xs text-[12px] font-bold text-amud-primary">{k.extra}</div> : null}
          </div>
        ))}
      </section>

      <section className="space-y-md">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-sm text-title-lg text-amud-on-surface">
            <span className="material-symbols-outlined text-amud-primary">flash_on</span>
            Latest Candidates
          </h3>
          <button onClick={() => setNotice('Ouverture de la liste complète des talents.')} className="text-label-md font-bold text-amud-primary hover:underline">
            See all talent
          </button>
        </div>
        <div className="-mx-xs flex gap-lg overflow-x-auto px-xs pb-md">
          {CANDIDATES.map((c) => (
            <div key={c.nom} className="min-w-[280px] rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md transition-colors hover:border-amud-primary">
              <div className="mb-md flex items-center gap-md">
                <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-amud-primary-fixed">
                  <img className="h-full w-full object-cover" alt={c.nom} src={c.photo} />
                </div>
                <div>
                  <h4 className="font-bold text-amud-on-surface">{c.nom}</h4>
                  <p className="text-label-sm text-amud-on-surface-variant">{c.poste}</p>
                </div>
              </div>
              <div className="mb-lg space-y-sm">
                <div className="flex justify-between text-[12px]">
                  <span className="text-amud-on-surface-variant">German Level</span>
                  <span className="font-bold text-amud-on-surface">{c.niveau}</span>
                </div>
                <div className="flex flex-wrap gap-xs">
                  <span className="rounded bg-amud-primary-container px-sm py-1 text-[10px] font-bold uppercase tracking-wider text-white">{c.dispo}</span>
                  {c.tags.map((t) => (
                    <span key={t} className="rounded bg-amud-surface-container-highest px-sm py-1 text-[10px] font-bold text-amud-on-surface-variant">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setNotice(`Profil de ${c.nom} ouvert.`)}
                className="w-full rounded-lg bg-amud-surface-container-low py-2 text-label-md font-bold text-amud-primary transition-colors hover:bg-amud-primary-fixed"
              >
                View profile
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
        <div className="flex items-center justify-between border-b border-amud-outline-variant bg-amud-surface-container-low px-lg py-md">
          <h3 className="text-title-lg text-amud-on-surface">Recent Matchings</h3>
          <div className="flex gap-sm">
            <button className="rounded p-xs transition-colors hover:bg-amud-surface-container-high">
              <span className="material-symbols-outlined text-[20px] text-amud-on-surface-variant">filter_list</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-amud-outline-variant text-[12px] font-bold uppercase tracking-widest text-amud-on-surface-variant">
                <th className="px-lg py-md">Candidate Name</th>
                <th className="px-lg py-md">Position</th>
                <th className="px-lg py-md">Status</th>
                <th className="px-lg py-md">Last Activity</th>
                <th className="px-lg py-md text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amud-outline-variant">
              {MATCHINGS.map((m) => (
                <tr key={m.nom} className="transition-colors hover:bg-amud-surface-container-low">
                  <td className="px-lg py-md">
                    <div className="flex items-center gap-sm">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black ${m.bg} ${m.fg}`}>{m.initiales}</div>
                      <span className="font-bold text-amud-on-surface">{m.nom}</span>
                    </div>
                  </td>
                  <td className="px-lg py-md text-label-md text-amud-on-surface-variant">{m.poste}</td>
                  <td className="px-lg py-md">
                    <span className={`inline-flex items-center gap-xs rounded-full px-sm py-1 text-[11px] font-bold ${STATUT_PILL[m.statut]}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {m.statut}
                    </span>
                  </td>
                  <td className="px-lg py-md text-label-md text-amud-on-surface-variant">{m.when}</td>
                  <td className="px-lg py-md text-right">
                    <button onClick={() => setNotice(`Détails de ${m.nom} ouverts.`)} className="text-label-sm font-bold text-amud-primary hover:underline">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="p-margin-desktop text-center text-label-sm text-amud-on-surface-variant opacity-60">
        © 2023 Amud Skills. Morocco-Germany Bridge Recruitment. All rights reserved.
      </footer>
    </>
  );
}
