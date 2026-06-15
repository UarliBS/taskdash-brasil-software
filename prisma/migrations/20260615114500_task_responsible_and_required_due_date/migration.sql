ALTER TABLE "Task" ADD COLUMN "responsible" TEXT;

UPDATE "Task"
SET "responsible" = COALESCE(
  (SELECT "name" FROM "User" WHERE "User"."id" = "Task"."userId"),
  'Responsavel'
)
WHERE "responsible" IS NULL;

UPDATE "Task"
SET "dueDate" = CURRENT_TIMESTAMP
WHERE "dueDate" IS NULL;

ALTER TABLE "Task" ALTER COLUMN "responsible" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "dueDate" SET NOT NULL;

CREATE INDEX "Task_userId_responsible_idx" ON "Task"("userId", "responsible");
