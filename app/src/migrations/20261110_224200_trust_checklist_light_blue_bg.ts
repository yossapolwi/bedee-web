import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TYPE "public"."enum_pages_blocks_trust_checklist_background_variant" ADD VALUE IF NOT EXISTS 'lightBlue';
  ALTER TYPE "public"."enum__pages_v_blocks_trust_checklist_background_variant" ADD VALUE IF NOT EXISTS 'lightBlue';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT 1`)
}
