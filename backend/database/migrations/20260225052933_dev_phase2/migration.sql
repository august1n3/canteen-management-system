/*
  Warnings:

  - The values [GLUTEN_FREE,DAIRY_FREE,NUT_FREE,HALAL,KOSHER] on the enum `DietaryRestriction` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('USER_LOGIN', 'USER_LOGOUT', 'USER_REGISTERED', 'USER_UPDATED', 'USER_DELETED', 'ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_DELETED', 'PAYMENT_PROCESSED', 'MENU_UPDATED', 'GLUTEN_FREE', 'DAIRY_FREE', 'NUT_FREE', 'HALAL', 'KOSHER');

-- AlterEnum
BEGIN;
CREATE TYPE "DietaryRestriction_new" AS ENUM ('VEGETARIAN', 'VEGAN');
ALTER TABLE "menu_items" ALTER COLUMN "dietaryRestrictions" TYPE "DietaryRestriction_new"[] USING ("dietaryRestrictions"::text::"DietaryRestriction_new"[]);
ALTER TYPE "DietaryRestriction" RENAME TO "DietaryRestriction_old";
ALTER TYPE "DietaryRestriction_new" RENAME TO "DietaryRestriction";
DROP TYPE "DietaryRestriction_old";
COMMIT;
