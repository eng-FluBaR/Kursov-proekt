import { SkeletonBlock } from '@/components/workspace-ui';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-28 rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SkeletonBlock className="min-h-[360px] rounded-3xl" />
        <SkeletonBlock className="min-h-[360px] rounded-3xl" />
      </div>
      <SkeletonBlock className="min-h-[320px] rounded-3xl" />
    </div>
  );
}
