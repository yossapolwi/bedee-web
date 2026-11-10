import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_pages_blocks_expert_tabs_background_variant" AS ENUM('plain', 'tinted');
  CREATE TYPE "public"."enum__pages_v_blocks_expert_tabs_background_variant" AS ENUM('plain', 'tinted');

  ALTER TABLE "pages_blocks_expert_tabs" ADD COLUMN "background_variant" "enum_pages_blocks_expert_tabs_background_variant" DEFAULT 'tinted';
  ALTER TABLE "_pages_v_blocks_expert_tabs" ADD COLUMN "background_variant" "enum__pages_v_blocks_expert_tabs_background_variant" DEFAULT 'tinted';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_expert_tabs" DROP COLUMN "background_variant";
  ALTER TABLE "_pages_v_blocks_expert_tabs" DROP COLUMN "background_variant";

  DROP TYPE "public"."enum_pages_blocks_expert_tabs_background_variant";
  DROP TYPE "public"."enum__pages_v_blocks_expert_tabs_background_variant";`)
}
