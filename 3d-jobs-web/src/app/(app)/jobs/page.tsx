'use client';

import { useEffect, useState } from 'react';
import { Panel, SectionHeading } from '@/components/workspace-ui';
import { NewJobForm } from '@/components/new-job-form';
import { JobsList } from '@/components/jobs-list';

export default function JobsPage() {
  const [projects, setProjects] = useState<Array<{ id: string; label: string }>>([]);
  const [taskTypes, setTaskTypes] = useState<Array<{ id: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Use real UUIDs from Neon database
        setProjects([
          { id: 'c9b17676-ca3a-4110-839e-79b6c9fbd1c2', label: 'Demo Production Line' },
          { id: '269c0cd0-d3d0-43ab-8796-24e4ee4302cd', label: 'Architectural Model' },
          { id: 'c921d661-1c8a-4b2d-a335-4b57f6a5ad7d', label: 'Prototype Lab' },
          { id: '58ce51b0-b261-4fe0-8801-965d2f1617a7', label: 'Client Review Queue' },
          { id: '78069f9a-4d9e-48c9-9e51-1d1266f3a10e', label: 'Research Sprint' },
        ]);

        setTaskTypes([
          { id: '38401ab2-8ee9-4560-b762-79c39b344de2', label: '3D Modelling' },
          { id: 'e1bdd73c-4c80-4c02-b746-34e6ad39cf68', label: '3D Printing' },
          { id: '3cbe315f-7baa-47c9-af38-87525e48df8a', label: '3D Scanning' },
          { id: 'a7aa3c19-0dca-42d0-a938-0ea60b5b136e', label: 'CAD Design' },
          { id: 'a6321d4a-80bc-47ef-ab2f-023ecd8e49b4', label: 'Client review' },
          { id: '1f7cb685-24c7-4b74-aa51-6f21a5f7311f', label: 'Post-processing' },
          { id: '20809760-0a64-44ef-a0cc-869d06b9054f', label: 'Rendering' },
          { id: '1b0a4125-9e21-49d4-91ff-77f12fc5441e', label: 'Research' },
        ]);
      } catch (error) {
        console.error('Failed to load projects/taskTypes:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <div className="text-slate-300">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Jobs"
        title="Manage your jobs"
        description="Create new jobs, track their progress, and start timers directly from here."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel className="p-6">
          <SectionHeading
            eyebrow="All jobs"
            title="Your job list"
            description="View and manage all your current jobs."
          />
          <JobsList />
        </Panel>

        <Panel className="p-6">
          <NewJobForm projects={projects} taskTypes={taskTypes} />
        </Panel>
      </div>
    </div>
  );
}
