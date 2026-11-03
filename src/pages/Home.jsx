import { lazy } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import Hero from './home/Hero.jsx';
import StatsSection from './home/StatsSection.jsx';
import VisionSection from './home/VisionSection.jsx';
import ProgramsSection from './home/ProgramsSection.jsx';
import JoinCta from './home/JoinCta.jsx';
import Marquee from '../components/ui/Marquee.jsx';
import LazySection from '../components/ui/LazySection.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';

// Bagian di bawah layar dimuat belakangan: kodenya terpisah dan datanya baru diminta saat didekati.
const ChartSection = lazy(() => import('./home/ChartSection.jsx'));
const HighlightsSection = lazy(() => import('./home/HighlightsSection.jsx'));
const JournalSection = lazy(() => import('./home/JournalSection.jsx'));
const TeamSection = lazy(() => import('./home/TeamSection.jsx'));

const WORDS = ['Literasi', 'Seni', 'Riset', 'Pengabdian', 'Kolaborasi', 'Pendidikan'];
const block = (h) => <div className="shell"><Skeleton className="w-full rounded-3xl" style={{ height: h }} /></div>;

export default function Home() {
  useDocumentTitle('');
  return (
    <>
      <Hero />
      <Marquee items={WORDS} className="border-b border-line py-8 sm:py-10" />
      <StatsSection />
      <LazySection fallback={block(420)}><ChartSection /></LazySection>
      <VisionSection />
      <ProgramsSection />
      <div className="pt-24 sm:pt-32">
        <LazySection fallback={block(360)}><HighlightsSection /></LazySection>
      </div>
      <LazySection fallback={block(480)}><JournalSection /></LazySection>
      <LazySection fallback={block(520)}><TeamSection /></LazySection>
      <JoinCta />
    </>
  );
}
