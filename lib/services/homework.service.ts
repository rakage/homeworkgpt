import { prisma } from "@/lib/prisma";
import { DifficultyLevel, RequestStatus } from "@prisma/client";

export interface CreateHomeworkRequestData {
  userId: string;
  subject: string;
  question: string;
  difficultyLevel?: DifficultyLevel;
}

export interface UpdateHomeworkRequestData {
  subject?: string;
  question?: string;
  difficultyLevel?: DifficultyLevel;
  status?: RequestStatus;
  solution?: string;
}

export class HomeworkService {
  // Get all homework requests for a user
  static async getHomeworkRequests(userId: string) {
    return await prisma.homeworkRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  // Get a specific homework request
  static async getHomeworkRequest(id: string, userId?: string) {
    const where = userId ? { id, userId } : { id };

    return await prisma.homeworkRequest.findUnique({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  // Create a new homework request
  static async createHomeworkRequest(data: CreateHomeworkRequestData) {
    return await prisma.homeworkRequest.create({
      data: {
        userId: data.userId,
        subject: data.subject,
        question: data.question,
        difficultyLevel: data.difficultyLevel || DifficultyLevel.beginner,
        status: RequestStatus.pending,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  // Update a homework request
  static async updateHomeworkRequest(
    id: string,
    data: UpdateHomeworkRequestData,
    userId?: string
  ) {
    const where = userId ? { id, userId } : { id };

    return await prisma.homeworkRequest.update({
      where,
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  // Delete a homework request
  static async deleteHomeworkRequest(id: string, userId?: string) {
    const where = userId ? { id, userId } : { id };

    return await prisma.homeworkRequest.delete({
      where,
    });
  }

  // Get homework requests by status
  static async getHomeworkRequestsByStatus(
    status: RequestStatus,
    userId?: string
  ) {
    const where = userId ? { status, userId } : { status };

    return await prisma.homeworkRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  // Get homework requests analytics
  static async getHomeworkAnalytics(userId?: string) {
    const where = userId ? { userId } : {};

    const [total, pending, inProgress, completed, cancelled] =
      await Promise.all([
        prisma.homeworkRequest.count({ where }),
        prisma.homeworkRequest.count({
          where: { ...where, status: RequestStatus.pending },
        }),
        prisma.homeworkRequest.count({
          where: { ...where, status: RequestStatus.in_progress },
        }),
        prisma.homeworkRequest.count({
          where: { ...where, status: RequestStatus.completed },
        }),
        prisma.homeworkRequest.count({
          where: { ...where, status: RequestStatus.cancelled },
        }),
      ]);

    return {
      total,
      pending,
      inProgress,
      completed,
      cancelled,
    };
  }
}
