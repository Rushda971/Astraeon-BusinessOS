/*
  Warnings:

  Existing names and roles are carried into the new profile structure.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_employees" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dateOfBirth" DATETIME,
    "address" TEXT,
    "department" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "joiningDate" DATETIME NOT NULL,
    "salary" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "profileImage" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactRelation" TEXT,
    "emergencyContactPhone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_employees" ("id", "employeeCode", "firstName", "lastName", "email", "phone", "department", "designation", "joiningDate", "salary", "status", "createdAt", "updatedAt")
SELECT "id", printf('EMP-%04d', "id"), "name", '', "email", "phone", 'Operations', "role", "joiningDate", "salary", "status", "createdAt", "updatedAt"
FROM "employees";
DROP TABLE "employees";
ALTER TABLE "new_employees" RENAME TO "employees";
CREATE UNIQUE INDEX "employees_employeeCode_key" ON "employees"("employeeCode");
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");
CREATE INDEX "employees_department_idx" ON "employees"("department");
CREATE INDEX "employees_status_idx" ON "employees"("status");
CREATE INDEX "employees_joiningDate_idx" ON "employees"("joiningDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
