export interface DocEntry {
  slug: string;
  title: string;
  description: string;
}

export const DOCS: DocEntry[] = [
  {
    slug: 'deployment',
    title: 'Deployment guide',
    description: 'Vercel, Render, Supabase, and production env setup.',
  },
  {
    slug: 'qa-checklist',
    title: 'QA checklist',
    description: 'Manual tests to run before each release.',
  },
];

export function getDoc(slug: string): DocEntry | undefined {
  return DOCS.find((d) => d.slug === slug);
}
