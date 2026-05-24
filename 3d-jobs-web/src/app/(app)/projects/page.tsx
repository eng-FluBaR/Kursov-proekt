import { JobsList } from '@/components/jobs-list';
import { PreviewHint } from '@/components/preview-hint';
import { Panel, SectionHeading } from '@/components/workspace-ui';

export default function CompletedTasksPage() {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Completed tasks"
        title="Finished work"
        description="Only tasks marked as completed are shown here."
      />
      <PreviewHint title="Review mode">
        Тук се събират приключените задачи. След login можеш да отвориш всяка задача, да видиш записаното време и да експортираш отчет.
      </PreviewHint>

      <Panel className="p-6">
        <JobsList initialStatus="completed" lockStatus />
      </Panel>
    </div>
  );
}
