-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'DRIVER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trackingId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "weight" REAL,
    "size" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "packageId" TEXT NOT NULL,
    "driverId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Delivery_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Delivery_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeliveryHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryId" TEXT NOT NULL,
    CONSTRAINT "DeliveryHistory_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Package_trackingId_key" ON "Package"("trackingId");
