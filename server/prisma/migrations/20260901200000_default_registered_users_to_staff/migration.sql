-- Align the database default with the application role model. Existing roles
-- are retained; public registration also explicitly writes STAFF.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationOtpHash" TEXT,
    "verificationOtpExpiresAt" DATETIME,
    "verificationOtpSentAt" DATETIME,
    "resetOtpHash" TEXT,
    "resetOtpExpiresAt" DATETIME,
    "resetOtpSentAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("id", "fullName", "email", "password", "role", "emailVerified", "verificationOtpHash", "verificationOtpExpiresAt", "verificationOtpSentAt", "resetOtpHash", "resetOtpExpiresAt", "resetOtpSentAt", "status", "createdAt", "updatedAt")
SELECT "id", "fullName", "email", "password", "role", "emailVerified", "verificationOtpHash", "verificationOtpExpiresAt", "verificationOtpSentAt", "resetOtpHash", "resetOtpExpiresAt", "resetOtpSentAt", "status", "createdAt", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
