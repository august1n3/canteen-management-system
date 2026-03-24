-- AlterTable for payments - make userId optional
ALTER TABLE "payments" 
  ALTER COLUMN "userId" DROP NOT NULL;

