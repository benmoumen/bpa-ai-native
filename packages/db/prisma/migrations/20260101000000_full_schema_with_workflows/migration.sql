
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CostType" AS ENUM ('FIXED', 'FORMULA');

-- CreateEnum
CREATE TYPE "DeterminantType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'DATE');

-- CreateEnum
CREATE TYPE "FormType" AS ENUM ('APPLICANT', 'GUIDE');

-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('USER', 'BOT');

-- CreateEnum
CREATE TYPE "RoleStatusCode" AS ENUM ('PENDING', 'PASSED', 'RETURNED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "keycloak_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "status" "ServiceStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_templates" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100) NOT NULL,
    "preview_image_url" VARCHAR(500),
    "form_count" INTEGER NOT NULL DEFAULT 0,
    "workflow_steps" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "short_name" VARCHAR(20) NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirements" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "tooltip" TEXT,
    "template" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_requirements" (
    "id" TEXT NOT NULL,
    "registration_id" TEXT NOT NULL,
    "requirement_id" TEXT NOT NULL,
    "name_override" VARCHAR(100),
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "costs" (
    "id" TEXT NOT NULL,
    "registration_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "CostType" NOT NULL,
    "fixed_amount" DECIMAL(10,2),
    "formula" TEXT,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forms" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "type" "FormType" NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_sections" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "parent_section_id" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "visibility_rule" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fields" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "section_id" TEXT,
    "determinant_id" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "visibility_rule" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "determinants" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "DeterminantType" NOT NULL,
    "source_field_id" TEXT,
    "formula" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "determinants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "role_type" "RoleType" NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "short_name" VARCHAR(50),
    "description" TEXT,
    "is_start_role" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "form_id" TEXT,
    "retry_enabled" BOOLEAN DEFAULT false,
    "retry_interval_minutes" INTEGER,
    "timeout_minutes" INTEGER,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_statuses" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "code" "RoleStatusCode" NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_transitions" (
    "id" TEXT NOT NULL,
    "from_status_id" TEXT NOT NULL,
    "to_role_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_keycloak_id_key" ON "users"("keycloak_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "services_status_idx" ON "services"("status");

-- CreateIndex
CREATE INDEX "services_created_by_idx" ON "services"("created_by");

-- CreateIndex
CREATE INDEX "services_created_at_idx" ON "services"("created_at");

-- CreateIndex
CREATE INDEX "service_templates_category_idx" ON "service_templates"("category");

-- CreateIndex
CREATE INDEX "service_templates_is_active_idx" ON "service_templates"("is_active");

-- CreateIndex
CREATE INDEX "registrations_service_id_idx" ON "registrations"("service_id");

-- CreateIndex
CREATE INDEX "registrations_is_active_idx" ON "registrations"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_service_id_key_key" ON "registrations"("service_id", "key");

-- CreateIndex
CREATE INDEX "requirements_is_active_idx" ON "requirements"("is_active");

-- CreateIndex
CREATE INDEX "document_requirements_registration_id_idx" ON "document_requirements"("registration_id");

-- CreateIndex
CREATE INDEX "document_requirements_requirement_id_idx" ON "document_requirements"("requirement_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_requirements_registration_id_requirement_id_key" ON "document_requirements"("registration_id", "requirement_id");

-- CreateIndex
CREATE INDEX "costs_registration_id_idx" ON "costs"("registration_id");

-- CreateIndex
CREATE INDEX "costs_is_active_idx" ON "costs"("is_active");

-- CreateIndex
CREATE INDEX "forms_service_id_idx" ON "forms"("service_id");

-- CreateIndex
CREATE INDEX "forms_type_idx" ON "forms"("type");

-- CreateIndex
CREATE INDEX "forms_is_active_idx" ON "forms"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "forms_service_id_name_key" ON "forms"("service_id", "name");

-- CreateIndex
CREATE INDEX "form_sections_form_id_idx" ON "form_sections"("form_id");

-- CreateIndex
CREATE INDEX "form_sections_parent_section_id_idx" ON "form_sections"("parent_section_id");

-- CreateIndex
CREATE INDEX "form_sections_is_active_idx" ON "form_sections"("is_active");

-- CreateIndex
CREATE INDEX "form_fields_form_id_idx" ON "form_fields"("form_id");

-- CreateIndex
CREATE INDEX "form_fields_section_id_idx" ON "form_fields"("section_id");

-- CreateIndex
CREATE INDEX "form_fields_determinant_id_idx" ON "form_fields"("determinant_id");

-- CreateIndex
CREATE INDEX "form_fields_is_active_idx" ON "form_fields"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "form_fields_form_id_name_key" ON "form_fields"("form_id", "name");

-- CreateIndex
CREATE INDEX "determinants_service_id_idx" ON "determinants"("service_id");

-- CreateIndex
CREATE INDEX "determinants_source_field_id_idx" ON "determinants"("source_field_id");

-- CreateIndex
CREATE INDEX "determinants_is_active_idx" ON "determinants"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "determinants_service_id_name_key" ON "determinants"("service_id", "name");

-- CreateIndex
CREATE INDEX "roles_service_id_idx" ON "roles"("service_id");

-- CreateIndex
CREATE INDEX "roles_role_type_idx" ON "roles"("role_type");

-- CreateIndex
CREATE INDEX "roles_sort_order_idx" ON "roles"("sort_order");

-- CreateIndex
CREATE INDEX "roles_is_active_idx" ON "roles"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "roles_service_id_name_key" ON "roles"("service_id", "name");

-- CreateIndex
CREATE INDEX "role_statuses_role_id_idx" ON "role_statuses"("role_id");

-- CreateIndex
CREATE INDEX "role_statuses_code_idx" ON "role_statuses"("code");

-- CreateIndex
CREATE INDEX "workflow_transitions_from_status_id_idx" ON "workflow_transitions"("from_status_id");

-- CreateIndex
CREATE INDEX "workflow_transitions_to_role_id_idx" ON "workflow_transitions"("to_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_transitions_from_status_id_to_role_id_key" ON "workflow_transitions"("from_status_id", "to_role_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requirements" ADD CONSTRAINT "document_requirements_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requirements" ADD CONSTRAINT "document_requirements_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costs" ADD CONSTRAINT "costs_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_sections" ADD CONSTRAINT "form_sections_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_sections" ADD CONSTRAINT "form_sections_parent_section_id_fkey" FOREIGN KEY ("parent_section_id") REFERENCES "form_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "form_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_determinant_id_fkey" FOREIGN KEY ("determinant_id") REFERENCES "determinants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "determinants" ADD CONSTRAINT "determinants_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "determinants" ADD CONSTRAINT "determinants_source_field_id_fkey" FOREIGN KEY ("source_field_id") REFERENCES "form_fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_statuses" ADD CONSTRAINT "role_statuses_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_from_status_id_fkey" FOREIGN KEY ("from_status_id") REFERENCES "role_statuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_to_role_id_fkey" FOREIGN KEY ("to_role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

