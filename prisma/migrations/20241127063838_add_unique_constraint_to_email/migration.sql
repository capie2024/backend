/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `users_test` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `users_test_email_key` ON `users_test`(`email`);
