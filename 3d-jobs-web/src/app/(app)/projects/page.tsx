import { JobsList } from '@/components/jobs-list';
import { Panel, SectionHeading } from '@/components/workspace-ui';

export default function CompletedTasksPage() {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Completed tasks"
        title="Finished work"
        description="Only tasks marked as completed are shown here."
      />

      <Panel className="p-6">
        <JobsList initialStatus="completed" lockStatus />
      </Panel>
    </div>
  );
}
