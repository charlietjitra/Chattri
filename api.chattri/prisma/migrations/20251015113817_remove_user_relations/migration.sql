-- DropForeignKey
ALTER TABLE "public"."bookings" DROP CONSTRAINT "bookings_cancelled_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."session_messages" DROP CONSTRAINT "session_messages_sender_id_fkey";
