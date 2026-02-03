import { Hono } from "hono";
import { db } from "../lib/db.js";
import { authMiddleware } from "../middleware/auth.js";
import { sendMessageSchema } from "../lib/validation.js";
import { generateMessageId } from "../utils/id-generator.js";
import students from "./students.ts";

const sessions = new Hono();

// Get current active session for user
sessions.get("/active", authMiddleware, async (c) => {
  try {
    const user = c.get("user");

    let activeSession;
    if (user.role === "student") {
      activeSession = await db.session.findFirst({
        where: {
          booking: {
            studentId: user.metaId,
          },
          status: "active",
        },
        include: {
          booking: {
            include: {
              tutor: {
                select: {
                  id: true,
                  videoPlatformLink: true,
                },
              },
            },
          },
        },
      });
    } else {
      activeSession = await db.session.findFirst({
        where: {
          booking: {
            tutorId: user.metaId,
          },
          status: "active",
        },
        include: {
          booking: {
            include: {
              student: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });
    }

    if (!activeSession) {
      return c.json({ activeSession: null });
    }

    // Get user data for the other participant
    let otherParticipant = null;
    if (user.role === "student") {
      // Get tutor user data
      otherParticipant = await db.user.findFirst({
        where: { metaType: "tutor", metaId: activeSession.booking.tutorId },
        select: {
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      });
    } else {
      // Get student user data
      otherParticipant = await db.user.findFirst({
        where: { metaType: "student", metaId: activeSession.booking.studentId },
        select: {
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      });
    }

    return c.json({
      activeSession: {
        ...activeSession,
        otherParticipant,
      },
    });
  } catch (error) {
    console.error("Get active session error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Send message in active session
sessions.post("/:id/messages", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const sessionId = c.req.param("id");
    const body = await c.req.json();
    console.log("Send message request:", {
      sessionId,
      userId: user.userId,
      body,
    });

    const validatedData = sendMessageSchema.parse(body);
    console.log("Validation passed:", validatedData);

    // Verify session exists and user is authorized
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        booking: true,
      },
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    // Check if user is part of this session
    const isAuthorized =
      (user.role === "student" && session.booking.studentId === user.metaId) ||
      (user.role === "tutor" && session.booking.tutorId === user.metaId);

    if (!isAuthorized) {
      return c.json(
        { error: "Not authorized to message in this session" },
        403
      );
    }

    // Check timing restrictions - can message 1 hour before, during, and 1 hour after session
    const currentTime = new Date();
    const scheduledStart = new Date(session.booking.scheduledStartTime);
    const scheduledEnd = new Date(session.booking.scheduledEndTime);
    const oneHourBefore = new Date(scheduledStart.getTime() - 60 * 60 * 1000);
    const oneHourAfter = new Date(scheduledEnd.getTime() + 60 * 60 * 1000);

    let canMessage = false;

    if (session.status === "completed" || session.status === "no_show") {
      // Can message for 1 hour after session ends
      canMessage = currentTime <= oneHourAfter;
    } else {
      // Can message from 1 hour before until 1 hour after scheduled end
      canMessage = currentTime >= oneHourBefore && currentTime <= oneHourAfter;
    }

    if (!canMessage) {
      if (currentTime < oneHourBefore) {
        return c.json(
          {
            error:
              "Messaging is only available 1 hour before the session starts",
          },
          400
        );
      } else {
        return c.json({ error: "Messaging window has expired" }, 400);
      }
    }

    // Calculate message expiry (1 hour after session end or when messaging window closes)
    const messageExpiryTime = oneHourAfter;

    // Create the message
    const message = await db.sessionMessage.create({
      data: {
        id: generateMessageId(),
        sessionId: sessionId,
        senderId: user.userId,
        messageContent: validatedData.messageContent,
        sentAt: currentTime,
        expiresAt: messageExpiryTime,
      },
    });

    // Get sender info for response
    const sender = await db.user.findUnique({
      where: { id: user.userId },
      select: {
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    return c.json(
      {
        message: "Message sent successfully",
        data: {
          ...message,
          sender: {
            id: user.userId,
            firstName: sender?.firstName,
            lastName: sender?.lastName,
            avatarUrl: sender?.avatarUrl,
          },
        },
      },
      201
    );
  } catch (error) {
    console.error("Send message error:", error);

    if (error instanceof Error) {
      if (error.message.includes("validation")) {
        return c.json(
          { error: "Validation failed", details: error.message },
          400
        );
      }
      if (error.message.includes("Prisma")) {
        return c.json({ error: "Database error", details: error.message }, 500);
      }
    }

    return c.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Get messages for a session
sessions.get("/:id/messages", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const sessionId = c.req.param("id");

    // Verify session exists and user is authorized
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        booking: true,
      },
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    // Check if user is part of this session
    const isAuthorized =
      (user.role === "student" && session.booking.studentId === user.metaId) ||
      (user.role === "tutor" && session.booking.tutorId === user.metaId);

    if (!isAuthorized) {
      return c.json(
        { error: "Not authorized to view messages in this session" },
        403
      );
    }

    // Get messages that haven't expired yet
    const messages = await db.sessionMessage.findMany({
      where: {
        sessionId: sessionId,
        expiresAt: {
          gt: new Date(), // Only get non-expired messages
        },
      },
      orderBy: { sentAt: "asc" },
    });

    // Get sender info for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await db.user.findUnique({
          where: { id: message.senderId },
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        });

        return {
          ...message,
          sender: {
            id: message.senderId,
            firstName: sender?.firstName,
            lastName: sender?.lastName,
            avatarUrl: sender?.avatarUrl,
            isMe: message.senderId === user.userId,
          },
        };
      })
    );

    return c.json({
      sessionId,
      messages: messagesWithSenders,
      totalMessages: messages.length,
    });
  } catch (error) {
    console.error("Get session messages error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Mark session as completed (tutors can do this)
sessions.patch("/:id/complete", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const sessionId = c.req.param("id");
    const body = await c.req.json();
    const { notes } = body;

    // Verify session exists
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        booking: true,
      },
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    // Only tutors can mark sessions as completed
    if (user.role !== "tutor" || session.booking.tutorId !== user.metaId) {
      return c.json(
        { error: "Only the tutor can mark the session as completed" },
        403
      );
    }

    if (session.status !== "active") {
      return c.json({ error: "Can only complete active sessions" }, 400);
    }

    const now = new Date();

    // Update session and booking status
    const [updatedSession, updatedBooking] = await db.$transaction([
      db.session.update({
        where: { id: sessionId },
        data: {
          status: "completed",
          actualEndTime: now,
          notes: notes || null,
        },
      }),
      db.booking.update({
        where: { id: session.bookingId },
        data: { status: "completed" },
      }),
    ]);

    // Set expiry time for all messages in this session (1 hour from completion)
    const messageExpiryTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
    await db.sessionMessage.updateMany({
      where: { sessionId: sessionId },
      data: { expiresAt: messageExpiryTime },
    });

    return c.json({
      message: "Session marked as completed successfully",
      session: updatedSession,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Complete session error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Start session (tutors can start, students can join)
sessions.patch("/:id/start", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const sessionId = c.req.param("id");

    // Verify session exists
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        booking: true,
      },
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    // Check authorization
    const isAuthorized =
      (user.role === "student" && session.booking.studentId === user.metaId) ||
      (user.role === "tutor" && session.booking.tutorId === user.metaId);

    if (!isAuthorized) {
      return c.json({ error: "Not authorized to access this session" }, 403);
    }

    // Check timing - can only start within 1 hour of scheduled time or during session
    const now = new Date();
    const scheduledStart = new Date(session.booking.scheduledStartTime);
    const scheduledEnd = new Date(session.booking.scheduledEndTime);
    const oneHourBefore = new Date(scheduledStart.getTime() - 60 * 60 * 1000);

    if (now < oneHourBefore) {
      return c.json(
        {
          error:
            "Session access is only available 1 hour before the scheduled time",
        },
        400
      );
    }

    if (session.status === "completed" || session.status === "no_show") {
      return c.json({ error: "Session has already ended" }, 400);
    }

    // Only tutors can actually start the session
    if (user.role === "tutor" && session.status === "scheduled") {
      const updatedSession = await db.session.update({
        where: { id: sessionId },
        data: {
          status: "active",
          actualStartTime: now,
        },
      });

      return c.json({
        message: "Session started successfully",
        session: updatedSession,
      });
    }

    // Students joining don't change status, just return session info
    return c.json({
      message: "Joined session successfully",
      session: session,
    });
  } catch (error) {
    console.error("Start session error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Check session access (determine if user can access session based on timing)
sessions.get("/:id/access", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const sessionId = c.req.param("id");

    // Verify session exists
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        booking: true,
      },
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    // Check authorization
    const isAuthorized =
      (user.role === "student" && session.booking.studentId === user.metaId) ||
      (user.role === "tutor" && session.booking.tutorId === user.metaId);

    if (!isAuthorized) {
      return c.json({ error: "Not authorized to access this session" }, 403);
    }

    const now = new Date();
    const scheduledStart = new Date(session.booking.scheduledStartTime);
    const scheduledEnd = new Date(session.booking.scheduledEndTime);
    const oneHourBefore = new Date(scheduledStart.getTime() - 60 * 60 * 1000);
    const oneHourAfter = new Date(scheduledEnd.getTime() + 60 * 60 * 1000);

    let accessStatus = "denied";
    let accessMessage = "";
    let canMessage = false;
    let canStart = false;

    if (session.status === "completed" || session.status === "no_show") {
      if (now <= oneHourAfter) {
        accessStatus = "post_session";
        accessMessage =
          "Session has ended. Messaging available for 1 hour after session.";
        canMessage = true;
      } else {
        accessStatus = "expired";
        accessMessage = "Session access has expired.";
      }
    } else if (now < oneHourBefore) {
      accessStatus = "too_early";
      accessMessage =
        "Session access is available 1 hour before the scheduled time.";
    } else if (now >= oneHourBefore && now < scheduledStart) {
      accessStatus = "pre_session";
      accessMessage = "Session access available. Waiting for session to start.";
      canMessage = true;
      canStart = user.role === "tutor";
    } else if (now >= scheduledStart && now <= scheduledEnd) {
      accessStatus = "during_session";
      accessMessage = "Session is in progress.";
      canMessage = true;
      canStart = user.role === "tutor" && session.status === "scheduled";
    } else if (now > scheduledEnd && now <= oneHourAfter) {
      accessStatus = "post_session";
      accessMessage =
        "Session time has passed. Messaging available for 1 hour after session.";
      canMessage = true;
    } else {
      accessStatus = "expired";
      accessMessage = "Session access has expired.";
    }

    // Fetch student and tutor user info
    const [studentUser, tutorUser] = await Promise.all([
      db.user.findFirst({
        where: { metaType: "student", metaId: session.booking.studentId },
        select: { firstName: true, lastName: true },
      }),
      db.user.findFirst({
        where: { metaType: "tutor", metaId: session.booking.tutorId },
        select: { firstName: true, lastName: true },
      }),
    ]);

    return c.json({
      sessionId,
      accessStatus,
      accessMessage,
      canMessage,
      canStart,
      session: {
        id: session.id,
        status: session.status,
        scheduledStart: session.booking.scheduledStartTime,
        scheduledEnd: session.booking.scheduledEndTime,
        actualStartTime: session.actualStartTime,
        actualEndTime: session.actualEndTime,
        studentName: studentUser
          ? `${studentUser.firstName} ${studentUser.lastName}`
          : undefined,
        tutorName: tutorUser
          ? `${tutorUser.firstName} ${tutorUser.lastName}`
          : undefined,
        bookingId: session.bookingId,
        tutorId: session.booking.tutorId,
      },
    });
  } catch (error) {
    console.error("Check session access error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get session by booking ID
sessions.get("/booking/:bookingId", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const bookingId = c.req.param("bookingId");

    // Find session by booking ID
    const session = await db.session.findUnique({
      where: { bookingId: bookingId },
      include: {
        booking: true,
      },
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    // Check authorization
    const isAuthorized =
      (user.role === "student" && session.booking.studentId === user.metaId) ||
      (user.role === "tutor" && session.booking.tutorId === user.metaId);

    if (!isAuthorized) {
      return c.json({ error: "Not authorized to access this session" }, 403);
    }

    return c.json({ session });
  } catch (error) {
    console.error("Get session by booking error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default sessions;
