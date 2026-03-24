-- AlterTable for orders - add guest customer fields and make userId optional
ALTER TABLE "orders" 
  ALTER COLUMN "userId" DROP NOT NULL,
  ADD COLUMN "guestCustomerName" TEXT,
  ADD COLUMN "guestPhoneNumber" TEXT,
  ADD COLUMN "guestStudentId" TEXT;

-- Add constraint: either userId or guestCustomerName must be set
ALTER TABLE "orders"
  ADD CONSTRAINT check_user_or_guest CHECK ("userId" IS NOT NULL OR "guestCustomerName" IS NOT NULL);
