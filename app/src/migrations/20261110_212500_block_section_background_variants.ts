import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_pages_blocks_rich_text_content_variant" AS ENUM('plain', 'tinted');
  CREATE TYPE "public"."enum__pages_v_blocks_rich_text_content_variant" AS ENUM('plain', 'tinted');
  CREATE TYPE "public"."enum_pages_blocks_image_carousel_variant" AS ENUM('plain', 'tinted');
  CREATE TYPE "public"."enum__pages_v_blocks_image_carousel_variant" AS ENUM('plain', 'tinted');
  CREATE TYPE "public"."enum_pages_blocks_trust_checklist_background_variant" AS ENUM('plain', 'tinted');
  CREATE TYPE "public"."enum__pages_v_blocks_trust_checklist_background_variant" AS ENUM('plain', 'tinted');

  ALTER TABLE "pages_blocks_rich_text_content" ADD COLUMN "variant" "enum_pages_blocks_rich_text_content_variant" DEFAULT 'plain';
  ALTER TABLE "_pages_v_blocks_rich_text_content" ADD COLUMN "variant" "enum__pages_v_blocks_rich_text_content_variant" DEFAULT 'plain';
  ALTER TABLE "pages_blocks_image_carousel" ADD COLUMN "variant" "enum_pages_blocks_image_carousel_variant" DEFAULT 'plain';
  ALTER TABLE "_pages_v_blocks_image_carousel" ADD COLUMN "variant" "enum__pages_v_blocks_image_carousel_variant" DEFAULT 'plain';
  ALTER TABLE "pages_blocks_trust_checklist" ADD COLUMN "background_variant" "enum_pages_blocks_trust_checklist_background_variant" DEFAULT 'tinted';
  ALTER TABLE "_pages_v_blocks_trust_checklist" ADD COLUMN "background_variant" "enum__pages_v_blocks_trust_checklist_background_variant" DEFAULT 'tinted';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_rich_text_content" DROP COLUMN "variant";
  ALTER TABLE "_pages_v_blocks_rich_text_content" DROP COLUMN "variant";
  ALTER TABLE "pages_blocks_image_carousel" DROP COLUMN "variant";
  ALTER TABLE "_pages_v_blocks_image_carousel" DROP COLUMN "variant";
  ALTER TABLE "pages_blocks_trust_checklist" DROP COLUMN "background_variant";
  ALTER TABLE "_pages_v_blocks_trust_checklist" DROP COLUMN "background_variant";

  DROP TYPE "public"."enum_pages_blocks_rich_text_content_variant";
  DROP TYPE "public"."enum__pages_v_blocks_rich_text_content_variant";
  DROP TYPE "public"."enum_pages_blocks_image_carousel_variant";
  DROP TYPE "public"."enum__pages_v_blocks_image_carousel_variant";
  DROP TYPE "public"."enum_pages_blocks_trust_checklist_background_variant";
  DROP TYPE "public"."enum__pages_v_blocks_trust_checklist_background_variant";`)
}
