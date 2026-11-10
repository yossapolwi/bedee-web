import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_pages_blocks_trust_checklist_image_side" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_trust_checklist_image_side" AS ENUM('left', 'right');

  ALTER TABLE "pages_blocks_trust_checklist" ADD COLUMN "image_side" "enum_pages_blocks_trust_checklist_image_side" DEFAULT 'left';
  ALTER TABLE "_pages_v_blocks_trust_checklist" ADD COLUMN "image_side" "enum__pages_v_blocks_trust_checklist_image_side" DEFAULT 'left';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_trust_checklist" DROP COLUMN "image_side";
  ALTER TABLE "_pages_v_blocks_trust_checklist" DROP COLUMN "image_side";

  DROP TYPE "public"."enum_pages_blocks_trust_checklist_image_side";
  DROP TYPE "public"."enum__pages_v_blocks_trust_checklist_image_side";`)
}
