CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"task_type_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_jobs_user_id" ON "jobs" ("user_id");
--> statement-breakpoint
CREATE INDEX "idx_jobs_project_id" ON "jobs" ("project_id");
--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "job_id" uuid;
--> statement-breakpoint
CREATE INDEX "idx_time_entries_job_id" ON "time_entries" ("job_id");
--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_task_type_id_task_types_id_fk" FOREIGN KEY ("task_type_id") REFERENCES "task_types"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE cascade;
