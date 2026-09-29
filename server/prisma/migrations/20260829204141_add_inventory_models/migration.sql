/*
  Warnings:

  - You are about to drop the column `description` on the `inventory_categories` table. All the data in the column will be lost.
  - Added the required column `slug` to the `inventory_categories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN "notes" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_inventory_categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_inventory_categories" ("createdAt", "id", "isActive", "name", "updatedAt") SELECT "createdAt", "id", "isActive", "name", "updatedAt" FROM "inventory_categories";
DROP TABLE "inventory_categories";
ALTER TABLE "new_inventory_categories" RENAME TO "inventory_categories";
CREATE UNIQUE INDEX "inventory_categories_name_key" ON "inventory_categories"("name");
CREATE UNIQUE INDEX "inventory_categories_slug_key" ON "inventory_categories"("slug");
CREATE TABLE "new_inventory_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currentStock" REAL NOT NULL DEFAULT 0,
    "minimumStock" REAL NOT NULL DEFAULT 0,
    "maximumStock" REAL,
    "reorderLevel" REAL,
    "costPerUnit" REAL,
    "status" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "categoryId" INTEGER NOT NULL,
    "supplierId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "inventory_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "inventory_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "inventory_items_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_inventory_items" ("categoryId", "costPerUnit", "createdAt", "currentStock", "id", "maximumStock", "minimumStock", "name", "reorderLevel", "sku", "status", "supplierId", "unit", "updatedAt") SELECT "categoryId", "costPerUnit", "createdAt", "currentStock", "id", "maximumStock", "minimumStock", "name", "reorderLevel", "sku", "status", "supplierId", "unit", "updatedAt" FROM "inventory_items";
DROP TABLE "inventory_items";
ALTER TABLE "new_inventory_items" RENAME TO "inventory_items";
CREATE UNIQUE INDEX "inventory_items_sku_key" ON "inventory_items"("sku");
CREATE INDEX "inventory_items_categoryId_idx" ON "inventory_items"("categoryId");
CREATE INDEX "inventory_items_supplierId_idx" ON "inventory_items"("supplierId");
CREATE INDEX "inventory_items_status_idx" ON "inventory_items"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "stock_adjustments_userId_idx" ON "stock_adjustments"("userId");

-- CreateIndex
CREATE INDEX "stock_movements_reason_idx" ON "stock_movements"("reason");

-- CreateIndex
CREATE INDEX "waste_records_userId_idx" ON "waste_records"("userId");
