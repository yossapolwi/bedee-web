import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_feature_steps" ADD COLUMN "cta_label" varchar;
  ALTER TABLE "pages_blocks_feature_steps" ADD COLUMN "cta_url" varchar;
  ALTER TABLE "_pages_v_blocks_feature_steps" ADD COLUMN "cta_label" varchar;
  ALTER TABLE "_pages_v_blocks_feature_steps" ADD COLUMN "cta_url" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_feature_steps" DROP COLUMN "cta_label";
  ALTER TABLE "pages_blocks_feature_steps" DROP COLUMN "cta_url";
  ALTER TABLE "_pages_v_blocks_feature_steps" DROP COLUMN "cta_label";
  ALTER TABLE "_pages_v_blocks_feature_steps" DROP COLUMN "cta_url";`)
}
