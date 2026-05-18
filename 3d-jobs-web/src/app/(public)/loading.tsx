import { SkeletonBlock } from '@/components/workspace-ui';

export default function Loading() {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 md:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-14 w-4/5" />
          <SkeletonBlock className="h-6 w-full" />
          <SkeletonBlock className="h-6 w-5/6" />
          <div className="flex gap-3 pt-4">
            <SkeletonBlock className="h-12 w-36" />
            <SkeletonBlock className="h-12 w-36" />
          </div>
        </div>
        <SkeletonBlock className="min-h-[420px] rounded-[2rem]" />
      </div>
    </div>
  );
}
