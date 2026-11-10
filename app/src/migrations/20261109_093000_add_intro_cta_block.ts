import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "pages_blocks_intro_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_intro_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );

  ALTER TABLE "pages_blocks_intro_cta" ADD CONSTRAINT "pages_blocks_intro_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_intro_cta" ADD CONSTRAINT "_pages_v_blocks_intro_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "pages_blocks_intro_cta_order_idx" ON "pages_blocks_intro_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_intro_cta_parent_id_idx" ON "pages_blocks_intro_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_intro_cta_path_idx" ON "pages_blocks_intro_cta" USING btree ("_path");
  CREATE INDEX "pages_blocks_intro_cta_locale_idx" ON "pages_blocks_intro_cta" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_intro_cta_order_idx" ON "_pages_v_blocks_intro_cta" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_intro_cta_parent_id_idx" ON "_pages_v_blocks_intro_cta" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_intro_cta_path_idx" ON "_pages_v_blocks_intro_cta" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_intro_cta_locale_idx" ON "_pages_v_blocks_intro_cta" USING btree ("_locale");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE "pages_blocks_intro_cta" CASCADE;
  DROP TABLE "_pages_v_blocks_intro_cta" CASCADE;`)
}
