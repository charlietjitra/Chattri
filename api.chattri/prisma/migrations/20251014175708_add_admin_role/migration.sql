-- AlterEnum
ALTER TYPE "MetaType" ADD VALUE 'admin';

-- CreateTable
CREATE TABLE "admins" (
    "id" VARCHAR(6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);
