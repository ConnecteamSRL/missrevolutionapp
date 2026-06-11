# Release Notes — v1.20

**Branch:** `release-1.20`
**Base:** `main`
**Date:** 2026-02-28

---

## 1. Summary

Release 1.20 is a large structural update that touches the fitness assignment model, medical anamnesis, video management, and content-image handling. The headline changes are:

- **Decoupled assignments** — workout, diet, and recipe assignments are now independent copies of the source template. Editing or deleting a template no longer affects cards already assigned to users.
- **Assignment editing & cross-user copy** — operators can edit the content of an assigned card directly, and copy another user's assignments to the current user.
- **Medical anamnesis redesign** — the form has been restructured into three focused sections (physical limitations, medical conditions / food allergies, and frequent disorders) with new fields and a new `primary_goal` enum. Several legacy fields and the clinical-files upload feature have been removed.
- **Video ordering & source URL** — videos within a category now have a `position` column with drag-and-drop reordering in the backoffice, plus an optional `source_video_url` field for linking to the original source file.
- **Content-image renaming** — images in the content library can be given a human-readable display name that is shown throughout the editor without changing the underlying storage path or public URL.
- **Video watch progress tracking** — a new `user_video_progress` table tracks per-user playback position and completion status for each video. The `video_category_page` and `get_gym_active_videos_by_category` RPCs now return `playback_position` and `completed_at` for the calling user, enabling resume-where-you-left-off and watched/unwatched indicators.

---

## 2. New Features

### 2.1 Template Decoupling (Assignments Are Now Independent Copies)

Previously, assignment tables (`user_workout_assignments`, `user_diet_assignments`, `user_recipe_assignments`) only stored a foreign-key reference to the source template. The user-facing views and the `get_user_fitness_overview` RPC joined back to the template table to resolve content.

Now each assignment row carries its own `title`, `description`, `html_content`, `objective` (and `external_url` for workouts). When a template is assigned the content is **copied at assignment time**, making the assignment fully self-contained. The FK to the template is retained but made nullable (`ON DELETE SET NULL`), so deleting a template no longer cascades to assignments. The old `UNIQUE(user_id, template_id)` constraints have been dropped to allow multiple assignments originating from the same template.

The three `v_my_*` views and the `get_user_fitness_overview` RPC have been rewritten to read from the assignment columns instead of joining to templates.

### 2.2 Assigned-Card Editing

A new **AssignmentEditDialogComponent** allows operators to open an assigned card and edit its title, description, HTML content, objective, active status, and notes — all directly on the user's copy without touching the original template. The dialog includes the ngx-editor rich-text editor and an image picker.

### 2.3 Copy Assigned Cards from Another User

A new **CopyAssignmentDialogComponent** lets the operator search for another user in the same gym, view their current assignments (workouts, diets, recipes), select one or more items, and copy them to the target user. Each copied card becomes a new independent assignment row.

### 2.4 Medical Anamnesis Redesign

The `medical_anamnesis` table has been restructured:

| Removed columns          | New / renamed columns                          |
| ------------------------ | ---------------------------------------------- |
| `diseases`               | `has_medical_conditions` (boolean)             |
| `current_medications`    | `has_physical_limitations` (boolean)           |
| `physical_issues`        | `physical_limitations_desc` (text)             |
| `thyroid_issues`         | `has_food_allergies` (boolean)                 |
| `note`                   | `food_allergies_desc` (text)                   |
| `frequent_aliments`      | `frequent_disorders` (text[])                  |
| `allergies_intolerances` | `frequent_disorders_other_desc` (text)         |
| `weight_kg` (renamed)    | `weight_current_kg`                            |
| —                        | `primary_goal` (new enum: `primary_goal_enum`) |

New `menstrual_cycle_enum` values: `in_menopausa`, `preferisco_non_specificare`.

The `v_user_anamnesis` view has been recreated with the new column set.

The frontend form (`user-anamnesis-section.component.ts`) was heavily rewritten to match the new three-section layout and no longer uses the dropzone/clinical-files UI.

### 2.5 Clinical Files Upload Removal

All clinical-exams storage code has been removed:

- **Database:** trigger `app_users_delete_clinical_exams`, function `_delete_clinical_exams_on_user_delete()`, and four RLS policies on `storage.objects` for the `clinical_exams` bucket are dropped.
- **Service:** `MedicalAnamnesisService` no longer contains `listClinicalExams`, `uploadClinicalExam`, `deleteClinicalExam(s)`, `createSignedUrl(s)`, the `BUCKET` constant, or the URL cache.
- **Types:** `StorageFileObject` type removed from both `medical.type.ts` and the service.

> The `storage.buckets` / `storage.objects` rows for `clinical_exams` are **not** deleted by the migration (Supabase forbids direct deletion). Clean up via the Supabase Storage API or dashboard if desired.

### 2.6 Video Source URL Field

A new optional `source_video_url` column on the `videos` table stores a direct link to the original video file. The field is exposed in the video-details form and included in the `video_category_page` and `get_gym_active_videos_by_category` RPCs.

### 2.7 Video Ordering Within Categories

Videos now have a `position` integer column (per-category). Three database triggers manage positions automatically:

| Trigger                                | Purpose                                                       |
| -------------------------------------- | ------------------------------------------------------------- |
| `trg_videos_auto_position`             | Assigns the next position on INSERT                           |
| `trg_videos_recalc_position_on_delete` | Closes gaps after a DELETE                                    |
| `trg_videos_handle_category_change`    | Reassigns position when a video moves to a different category |

A new `reorder_videos_in_category` RPC accepts an ordered array of video IDs and bulk-updates positions. The `video_category_page` and `get_gym_active_videos_by_category` RPCs now return videos ordered by `position ASC`.

In the backoffice, the video-category page features a **"Riordina" (Reorder)** button that opens a drag-and-drop dialog (CDK DragDrop) to rearrange videos, plus a position badge on each video card.

### 2.8 Image Renaming in Content Library

A new `content_image_display_names` table stores a cosmetic display name per image (keyed by `object_path`). The actual file in Supabase Storage is never moved — only the label changes, so existing public URLs embedded in workout/diet/recipe HTML remain valid.

- **Service:** `ContentImagesService` now fetches display names alongside images and exposes a `renameImage()` method (upsert). On delete, the corresponding display-name row is also removed.
- **UI:** The images-uploader grid shows an edit (pencil) button per image that opens an `ImageRenameDialogComponent`. Tooltips, preview dialogs, and the image-picker dropdowns in all content editors (workout, diet, recipe — both create and detail views) now show the display name when available, falling back to the prettified file name.

### 2.9 Video Watch Progress Tracking

A new `user_video_progress` table tracks per-user video consumption:

- `playback_position` (integer, seconds) — the furthest point the user has reached, enabling resume-where-you-left-off.
- `completed_at` (timestamptz, nullable) — `NULL` means not completed; a timestamp marks when the video was watched. Using a timestamp instead of a plain boolean provides both the flag and the "when".
- Unique constraint on `(user_id, video_id)` — one progress record per user per video.
- Full RLS: users can only read/write their own progress; operators/admins can read within their scope via `VIDEO:READ:ALL` / `VIDEO:READ:GYM` permissions.

The `video_category_page` and `get_gym_active_videos_by_category` RPCs have been updated with a `LEFT JOIN` on `user_video_progress` (filtered by `app_session.current_user_id()`), adding `playback_position` and `completed_at` to each video object. Values are `null` when the user has no progress record for a given video.

Completion percentage can be computed client-side using `playback_position / duration_seconds` (already present on `videos`).

---

## 3. Database Migrations

Listed in execution order:

| #   | File                                                    | Description                                                                                                                                                                                                                                                                                                                                                                           |
| --- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `20260228120000_decouple_template_assignments.sql`      | Adds `title`, `description`, `html_content`, `external_url`, `objective` columns to the three assignment tables. Backfills from templates. Makes template FK nullable with `ON DELETE SET NULL`. Replaces `v_my_workouts`, `v_my_diets`, `v_my_recipes` views. Rewrites `get_user_fitness_overview` RPC to read from assignment columns.                                              |
| 2   | `20260228130000_fix_views_security_invoker.sql`         | Sets `security_invoker = true` on `v_my_workouts`, `v_my_diets`, `v_my_recipes` to eliminate Supabase security-definer warnings.                                                                                                                                                                                                                                                      |
| 3   | `20260228140000_purge_assignments_and_copy_support.sql` | **Purges all existing rows** from the three assignment tables (fresh start). Drops the `UNIQUE(user_id, template_id)` constraints to allow copy-from-other-user and multiple assignments from the same template.                                                                                                                                                                      |
| 4   | `20260228150000_redesign_medical_anamnesis.sql`         | Creates `primary_goal_enum`. Adds `in_menopausa` and `preferisco_non_specificare` to `menstrual_cycle_enum`. Drops old columns, adds new boolean/text/array columns. Renames `weight_kg` → `weight_current_kg`. Migrates `allergies_intolerances` data. Recreates `v_user_anamnesis` view. Drops clinical-exams trigger, function, and storage policies.                              |
| 5   | `20260228160000_video_source_url_and_position.sql`      | Adds `source_video_url` and `position` columns to `videos`. Backfills positions. Creates composite index `idx_videos_category_position`. Creates three triggers for auto-position, gap-close, and category-change. Creates `reorder_videos_in_category` RPC. Replaces `video_category_page` and `get_gym_active_videos_by_category` RPCs to include new fields and order by position. |
| 6   | `20260228170000_content_image_display_names.sql`        | Creates `content_image_display_names` table (PK `object_path`, `display_name`, `gym_id`). Adds index, timestamp triggers, full RLS policy set (select/insert/update/delete), and grants.                                                                                                                                                                                              |
| 7   | `20260228180000_user_video_progress.sql`                | Creates `user_video_progress` table (`user_id`, `video_id`, `playback_position`, `completed_at`). Adds unique constraint on `(user_id, video_id)`, indexes on `user_id` and `video_id`, RLS policies (user manages own records, operators/admins can read), grants, and timestamp triggers.                                                                                           |
| 8   | `20260228190000_video_rpc_add_progress.sql`             | Updates `video_category_page` and `get_gym_active_videos_by_category` RPCs to LEFT JOIN `user_video_progress` and include `playback_position` and `completed_at` in each video object.                                                                                                                                                                                                |

Additionally, the existing migration `20251019081508_content-images-public.sql` was **commented out entirely** (all SQL wrapped in `-- ...`). This migration previously set up the `content-images` storage bucket and RLS policies; the commenting-out prevents it from re-running on fresh environments.

---

## 4. Breaking Changes

| Change                                                 | Impact                                                                                                                                                                                                                                                         |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **All existing assignment rows purged** (migration #3) | Every `user_workout_assignments`, `user_diet_assignments`, and `user_recipe_assignments` row is deleted. Users will lose their current assignments and need to be re-assigned.                                                                                 |
| **Medical anamnesis columns replaced** (migration #4)  | `diseases`, `current_medications`, `physical_issues`, `thyroid_issues`, `note`, `frequent_aliments`, `allergies_intolerances` are dropped. Any code or report reading these columns will break. `weight_kg` is renamed to `weight_current_kg`.                 |
| **Clinical-files feature removed**                     | The clinical-exams upload/download/signed-URL flow is gone. The storage bucket itself is intentionally **not** deleted by the migration; existing files remain in storage but are no longer managed by the app.                                                |
| **`content-images-public` migration commented out**    | Fresh deployments that rely on this migration to create the `content-images` bucket and policies will skip it. Ensure the bucket and policies are provisioned by another means (e.g., Supabase dashboard or a replacement migration).                          |
| **Assignment insert payload changed**                  | `FitnessService` now expects full content fields (`title`, `html_content`, `objective`, etc.) in insert payloads, not just a template ID. External callers (e.g., AI auto-assignment) must supply these fields.                                                |
| **Unique constraints dropped on assignments**          | `user_workout_assignments_user_id_workout_id_key`, `user_diet_assignments_user_id_diet_id_key`, `user_recipe_assignments_user_id_recipe_id_key` no longer exist. Duplicate (user, template) pairs are now allowed by design.                                   |
| **`AiRequest.fitness` type changed**                   | The `Fitness` interface (with separate `Diets`, `Recipes`, `Workouts` sub-interfaces) is replaced by `FitnessOverview` from `fitness.types.ts`. The `assigned` arrays now contain `AssignedWorkout`/`AssignedDiet`/`AssignedRecipe` instead of template types. |
| **Bulk delete uses assignment ID**                     | `deleteAllUserAssignments` now deletes by assignment `id` (`.in("id", …)`) instead of by `(user_id, template_id)`.                                                                                                                                             |

---

## 5. Files Changed

### 5.1 Database / Migrations

| Status       | File                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------ |
| **Modified** | `supabase/migrations/20251019081508_content-images-public.sql` — entire body commented out |
| **Added**    | `supabase/migrations/20260228120000_decouple_template_assignments.sql`                     |
| **Added**    | `supabase/migrations/20260228130000_fix_views_security_invoker.sql`                        |
| **Added**    | `supabase/migrations/20260228140000_purge_assignments_and_copy_support.sql`                |
| **Added**    | `supabase/migrations/20260228150000_redesign_medical_anamnesis.sql`                        |
| **Added**    | `supabase/migrations/20260228160000_video_source_url_and_position.sql`                     |
| **Added**    | `supabase/migrations/20260228170000_content_image_display_names.sql`                       |
| **Added**    | `supabase/migrations/20260228180000_user_video_progress.sql`                               |
| **Added**    | `supabase/migrations/20260228190000_video_rpc_add_progress.sql`                            |

### 5.2 Types

| Status       | File                                         | Summary                                                                                                                                                                                      |
| ------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Modified** | `backoffice/src/app/types/database.types.ts` | Regenerated to reflect all schema changes (medical anamnesis columns, video `position`/`source_video_url`, new enums `primary_goal_enum`, new `menstrual_cycle_enum` values).                |
| **Modified** | `backoffice/src/app/types/fitness.types.ts`  | Added `AssignedWorkout`, `AssignedDiet`, `AssignedRecipe` interfaces and their insert types. `FitnessOverview.assigned` arrays now use assigned types. Backward-compatible aliases retained. |
| **Modified** | `backoffice/src/app/types/video.types.ts`    | Added `source_video_url` and `position` to `VideoCategoryPageVideoItem`.                                                                                                                     |
| **Modified** | `backoffice/src/app/types/medical.type.ts`   | Removed `StorageFileObject` type.                                                                                                                                                            |
| **Modified** | `backoffice/src/app/types/ai.types.ts`       | Replaced custom `Fitness`/`Diets`/`Recipes`/`Workouts` interfaces with `FitnessOverview` import.                                                                                             |

### 5.3 Services

| Status       | File                                                                  | Summary                                                                                                                                                                                                                                                               |
| ------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Modified** | `backoffice/src/app/services/revolution/fitness.service.ts`           | Rewrote assignment CRUD to use decoupled types. Removed `list` and `getById` methods for assignments. Added `getUserAssignments(userId)` for cross-user copy. Bulk assign/delete now copies content from templates and deletes by assignment ID.                      |
| **Modified** | `backoffice/src/app/services/revolution/medical-anamnesis.service.ts` | Removed all clinical-exams storage methods (`listClinicalExams`, `uploadClinicalExam`, `deleteClinicalExam(s)`, `createSignedUrl(s)`), `BUCKET` constant, and URL cache. Removed `StorageFileObject` type.                                                            |
| **Modified** | `backoffice/src/app/services/revolution/content-images.service.ts`    | Added `displayName` to `UiStorageImage`/`StorageImageMinimal`. Added `fetchDisplayNames()` private helper, `renameImage()` public method. `listForGymWithPreview` and `listMinimalForGym` now resolve display names. `deleteImage` also deletes the display-name row. |
| **Modified** | `backoffice/src/app/services/revolution/video.service.ts`             | Changed video listing order from `created_at DESC` to `position ASC`. Added `reorderVideosInCategory()` RPC call.                                                                                                                                                     |

### 5.4 Components — Users

| Status       | File                                                                           | Summary                                                                                                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Added**    | `backoffice/src/app/pages/users/sections/assignment-edit-dialog.component.ts`  | New dialog for editing an assigned card's content in-place (423 lines).                                                                                                                                                |
| **Added**    | `backoffice/src/app/pages/users/sections/copy-assignment-dialog.component.ts`  | New dialog for copying assignments from another user (751 lines).                                                                                                                                                      |
| **Modified** | `backoffice/src/app/pages/users/sections/user-assignment-section.component.ts` | Integrated edit dialog and copy-from-user dialog. Added "Copia da altro utente" button. Uses decoupled assigned types. Passes `userGymId` input.                                                                       |
| **Modified** | `backoffice/src/app/pages/users/sections/user-anamnesis-section.component.ts`  | Major rewrite: new 3-section form (physical limitations, medical conditions / food allergies, frequent disorders). Removed dropzone/clinical-files UI, MatDialog, MatTooltip. Added MatRadioModule, MatCheckboxModule. |
| **Modified** | `backoffice/src/app/pages/users/user-details/user-details.component.ts`        | Passes `[userGymId]` binding to assignment section.                                                                                                                                                                    |

### 5.5 Components — Video

| Status       | File                                                         | Summary                                                                                                                                                           |
| ------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Modified** | `backoffice/src/app/pages/video/video-category.component.ts` | Added CDK DragDrop reorder dialog, "Riordina" button, position badges, `reorderList` state, `openReorderDialog()`, `onReorderDrop()`, `confirmReorder()` methods. |
| **Modified** | `backoffice/src/app/pages/video/video-details.component.ts`  | Added `source_video_url` form field with URL input and hint text. Reads/writes the field on load/save.                                                            |

### 5.6 Components — Content

| Status       | File                                                                    | Summary                                                                                                                                                                                             |
| ------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Modified** | `backoffice/src/app/pages/content/images-uploader.component.ts`         | Added rename button (edit icon) per image, `openRename()` method, `imageDisplayLabel()` helper. Added `ImageRenameDialogComponent` inline. Updated tooltips and preview titles to use display name. |
| **Modified** | `backoffice/src/app/pages/content/content.utils.ts`                     | Added `imageLabel()` utility function.                                                                                                                                                              |
| **Modified** | `backoffice/src/app/pages/content/diet/diet-create.component.ts`        | Image picker and inserted-image alt text use `imageLabel()`.                                                                                                                                        |
| **Modified** | `backoffice/src/app/pages/content/diet/diet-detail.component.ts`        | Same as above.                                                                                                                                                                                      |
| **Modified** | `backoffice/src/app/pages/content/recipe/recipe-create.component.ts`    | Same as above.                                                                                                                                                                                      |
| **Modified** | `backoffice/src/app/pages/content/recipe/recipe-details.component.ts`   | Same as above.                                                                                                                                                                                      |
| **Modified** | `backoffice/src/app/pages/content/workout/workout-create.component.ts`  | Same as above.                                                                                                                                                                                      |
| **Modified** | `backoffice/src/app/pages/content/workout/workout-details.component.ts` | Same as above.                                                                                                                                                                                      |

### 5.7 Configuration / Build

| Status       | File                               | Summary                                           |
| ------------ | ---------------------------------- | ------------------------------------------------- |
| **Modified** | `.gitignore`                       | Added `/backoffice/dist/` and `/supabase/.temp/`. |
| **Deleted**  | `supabase/.temp/cli-latest`        | Removed (now gitignored).                         |
| **Deleted**  | `supabase/.temp/gotrue-version`    | Removed (now gitignored).                         |
| **Deleted**  | `supabase/.temp/pooler-url`        | Removed (now gitignored).                         |
| **Deleted**  | `supabase/.temp/postgres-version`  | Removed (now gitignored).                         |
| **Deleted**  | `supabase/.temp/project-ref`       | Removed (now gitignored).                         |
| **Deleted**  | `supabase/.temp/rest-version`      | Removed (now gitignored).                         |
| **Deleted**  | `supabase/.temp/storage-migration` | Removed (now gitignored).                         |
| **Deleted**  | `supabase/.temp/storage-version`   | Removed (now gitignored).                         |

---

## 6. Post-Deployment Steps

1. **Run all migrations in order** — Apply the eight new migrations (`20260228120000` through `20260228190000`) against the target database. Migration #3 purges all assignment rows; coordinate with stakeholders if a data-preservation strategy is needed.

2. **Regenerate Supabase types** — After migrations are applied:

   ```bash
   supabase gen types typescript --local > backoffice/src/app/types/database.types.ts
   ```

   This will bring the auto-generated types in sync with the new schema and allow removal of the `as any` / `as unknown` casts in `FitnessService`.

3. **Verify `content-images` bucket** — Because the `20251019081508_content-images-public.sql` migration is now commented out, ensure the `content-images` storage bucket and its RLS policies exist on the target environment. If deploying to a fresh database, recreate them manually via the Supabase dashboard or a separate migration.

4. **Clinical-exams bucket cleanup (optional)** — The `clinical_exams` storage bucket and its objects are intentionally left in place. If you want to reclaim storage, delete files and the bucket via the Supabase Storage API or dashboard (direct SQL deletion is blocked by Supabase).

5. **Re-assign user cards** — All existing assignment rows were purged. Operators will need to re-assign workouts, diets, and recipes to users through the backoffice UI.

6. **Notify PostgREST** — Migration #5 already includes `NOTIFY pgrst, 'reload schema'`. If using Supabase hosted, schema reloads happen automatically; on self-hosted, verify the schema cache is refreshed.

7. **Build and deploy frontend** — Run `npm run build` (or `npm run build:staging`) from the `backoffice/` directory. The output in `dist/Matdash/` includes all new components and updated services.

---

_Generated from the diff between `main` and `release-1.20`._
