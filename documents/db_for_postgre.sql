CREATE TYPE "user_role" AS ENUM (
  'ADMIN',
  'TEACHER',
  'STUDENT'
);

CREATE TYPE "course_status" AS ENUM (
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'ARCHIVED'
);

CREATE TYPE "enrollment_status" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'INVITED'
);

CREATE TYPE "material_type" AS ENUM (
  'VIDEO',
  'PDF',
  'SLIDE',
  'LINK',
  'TEXT',
  'OTHER'
);

CREATE TYPE "question_type" AS ENUM (
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'TRUE_FALSE'
);

CREATE TYPE "attempt_status" AS ENUM (
  'IN_PROGRESS',
  'SUBMITTED'
);

CREATE TYPE "grading_policy" AS ENUM (
  'HIGHEST',
  'LATEST',
  'AVERAGE'
);

CREATE TABLE "users" (
  "id" bigserial PRIMARY KEY,
  "email" varchar(255) UNIQUE NOT NULL,
  "password_hash" varchar(255) NOT NULL,
  "full_name" varchar(255) NOT NULL,
  "role" user_role NOT NULL DEFAULT 'STUDENT',
  "is_active" bool NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "courses" (
  "id" bigserial PRIMARY KEY,
  "code" varchar(32) UNIQUE NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text,
  "created_by" bigint NOT NULL,
  "status" course_status NOT NULL DEFAULT 'DRAFT',
  "is_enrollment_open" bool NOT NULL DEFAULT true,
  "requested_review_at" timestamptz,
  "reviewed_by" bigint,
  "reviewed_at" timestamptz,
  "published_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "course_instructors" (
  "id" bigserial PRIMARY KEY,
  "course_id" bigint NOT NULL,
  "user_id" bigint NOT NULL,
  "role" varchar(32) NOT NULL DEFAULT 'OWNER',
  "added_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "enrollments" (
  "id" bigserial PRIMARY KEY,
  "course_id" bigint NOT NULL,
  "student_id" bigint NOT NULL,
  "status" enrollment_status NOT NULL DEFAULT 'PENDING',
  "requested_at" timestamptz NOT NULL DEFAULT (now()),
  "approved_by" bigint,
  "approved_at" timestamptz,
  "added_by" bigint,
  "note" text
);

CREATE TABLE "lectures" (
  "id" bigserial PRIMARY KEY,
  "course_id" bigint NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text,
  "position" int NOT NULL DEFAULT 1,
  "duration_sec" int,
  "is_published" bool NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "materials" (
  "id" bigserial PRIMARY KEY,
  "lecture_id" bigint NOT NULL,
  "type" material_type NOT NULL,
  "title" varchar(255),
  "url" text,
  "storage_key" varchar(255),
  "size_bytes" bigint,
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "quizzes" (
  "id" bigserial PRIMARY KEY,
  "lecture_id" bigint UNIQUE NOT NULL,
  "title" varchar(255) NOT NULL,
  "is_published" bool NOT NULL DEFAULT false,
  "attempts_allowed" int NOT NULL DEFAULT 1,
  "time_limit_sec" int,
  "total_points" numeric(10,2),
  "grading_policy" grading_policy NOT NULL DEFAULT 'HIGHEST',
  "due_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "questions" (
  "id" bigserial PRIMARY KEY,
  "quiz_id" bigint NOT NULL,
  "type" question_type NOT NULL,
  "prompt" text NOT NULL,
  "points" numeric(10,2) NOT NULL DEFAULT 1,
  "position" int NOT NULL DEFAULT 1
);

CREATE TABLE "options" (
  "id" bigserial PRIMARY KEY,
  "question_id" bigint NOT NULL,
  "content" text NOT NULL,
  "is_correct" bool NOT NULL DEFAULT false,
  "position" int NOT NULL DEFAULT 1
);

CREATE TABLE "quiz_attempts" (
  "id" bigserial PRIMARY KEY,
  "quiz_id" bigint NOT NULL,
  "student_id" bigint NOT NULL,
  "status" attempt_status NOT NULL DEFAULT 'IN_PROGRESS',
  "started_at" timestamptz NOT NULL DEFAULT (now()),
  "submitted_at" timestamptz,
  "score" numeric(10,2),
  "max_score" numeric(10,2)
);

CREATE TABLE "attempt_answers" (
  "id" bigserial PRIMARY KEY,
  "attempt_id" bigint NOT NULL,
  "question_id" bigint NOT NULL,
  "selected_option_id" bigint,
  "selected_options" text,
  "answer_text" text,
  "is_correct" bool,
  "points_awarded" numeric(10,2)
);

CREATE TABLE "discussion_threads" (
  "id" bigserial PRIMARY KEY,
  "lecture_id" bigint NOT NULL,
  "created_by" bigint NOT NULL,
  "title" varchar(255) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "closed_at" timestamptz
);

CREATE TABLE "discussion_posts" (
  "id" bigserial PRIMARY KEY,
  "thread_id" bigint NOT NULL,
  "parent_post_id" bigint,
  "author_id" bigint NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz
);

CREATE TABLE "lecture_progress" (
  "id" bigserial PRIMARY KEY,
  "lecture_id" bigint NOT NULL,
  "student_id" bigint NOT NULL,
  "progress_percent" numeric(5,2) NOT NULL DEFAULT 0,
  "last_viewed_at" timestamptz,
  "completed_at" timestamptz
);

CREATE TABLE "audit_logs" (
  "id" bigserial PRIMARY KEY,
  "actor_id" bigint,
  "action" varchar(128) NOT NULL,
  "target_type" varchar(64) NOT NULL,
  "target_id" bigint,
  "meta_json" text,
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "notifications" (
  "id" bigserial PRIMARY KEY,
  "user_id" bigint NOT NULL,
  "type" varchar(64) NOT NULL,
  "payload_json" text,
  "read_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE UNIQUE INDEX ON "course_instructors" ("course_id", "user_id");

CREATE UNIQUE INDEX ON "enrollments" ("course_id", "student_id");

CREATE INDEX ON "enrollments" ("student_id", "status");

CREATE INDEX ON "lectures" ("course_id", "position");

CREATE INDEX ON "materials" ("lecture_id");

CREATE INDEX ON "questions" ("quiz_id", "position");

CREATE INDEX ON "options" ("question_id", "position");

CREATE INDEX ON "quiz_attempts" ("quiz_id", "student_id");

CREATE INDEX ON "quiz_attempts" ("student_id", "status");

CREATE UNIQUE INDEX ON "attempt_answers" ("attempt_id", "question_id");

CREATE INDEX ON "discussion_posts" ("thread_id");

CREATE UNIQUE INDEX ON "lecture_progress" ("lecture_id", "student_id");

CREATE INDEX ON "lecture_progress" ("student_id");

CREATE INDEX ON "notifications" ("user_id", "created_at");

COMMENT ON TABLE "users" IS 'Tài khoản do Admin cấp; Không dùng pw để tăng tính bảo mật; role xác định quyền.';

COMMENT ON TABLE "courses" IS 'Luồng duyệt khóa học của Admin.';

COMMENT ON TABLE "enrollments" IS 'Học sinh có thể xin vào; GV có thể add trực tiếp.';

ALTER TABLE "courses" ADD FOREIGN KEY ("created_by") REFERENCES "users" ("id");

ALTER TABLE "courses" ADD FOREIGN KEY ("reviewed_by") REFERENCES "users" ("id");

ALTER TABLE "course_instructors" ADD FOREIGN KEY ("course_id") REFERENCES "courses" ("id");

ALTER TABLE "course_instructors" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "enrollments" ADD FOREIGN KEY ("course_id") REFERENCES "courses" ("id");

ALTER TABLE "enrollments" ADD FOREIGN KEY ("student_id") REFERENCES "users" ("id");

ALTER TABLE "enrollments" ADD FOREIGN KEY ("approved_by") REFERENCES "users" ("id");

ALTER TABLE "enrollments" ADD FOREIGN KEY ("added_by") REFERENCES "users" ("id");

ALTER TABLE "lectures" ADD FOREIGN KEY ("course_id") REFERENCES "courses" ("id");

ALTER TABLE "materials" ADD FOREIGN KEY ("lecture_id") REFERENCES "lectures" ("id");

ALTER TABLE "quizzes" ADD FOREIGN KEY ("lecture_id") REFERENCES "lectures" ("id");

ALTER TABLE "questions" ADD FOREIGN KEY ("quiz_id") REFERENCES "quizzes" ("id");

ALTER TABLE "options" ADD FOREIGN KEY ("question_id") REFERENCES "questions" ("id");

ALTER TABLE "quiz_attempts" ADD FOREIGN KEY ("quiz_id") REFERENCES "quizzes" ("id");

ALTER TABLE "quiz_attempts" ADD FOREIGN KEY ("student_id") REFERENCES "users" ("id");

ALTER TABLE "attempt_answers" ADD FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts" ("id");

ALTER TABLE "attempt_answers" ADD FOREIGN KEY ("question_id") REFERENCES "questions" ("id");

ALTER TABLE "attempt_answers" ADD FOREIGN KEY ("selected_option_id") REFERENCES "options" ("id");

ALTER TABLE "discussion_threads" ADD FOREIGN KEY ("lecture_id") REFERENCES "lectures" ("id");

ALTER TABLE "discussion_threads" ADD FOREIGN KEY ("created_by") REFERENCES "users" ("id");

ALTER TABLE "discussion_posts" ADD FOREIGN KEY ("thread_id") REFERENCES "discussion_threads" ("id");

ALTER TABLE "discussion_posts" ADD FOREIGN KEY ("parent_post_id") REFERENCES "discussion_posts" ("id");

ALTER TABLE "discussion_posts" ADD FOREIGN KEY ("author_id") REFERENCES "users" ("id");

ALTER TABLE "lecture_progress" ADD FOREIGN KEY ("lecture_id") REFERENCES "lectures" ("id");

ALTER TABLE "lecture_progress" ADD FOREIGN KEY ("student_id") REFERENCES "users" ("id");

ALTER TABLE "audit_logs" ADD FOREIGN KEY ("actor_id") REFERENCES "users" ("id");

ALTER TABLE "notifications" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
