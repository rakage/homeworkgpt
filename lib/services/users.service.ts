import { prisma } from "@/lib/prisma";

export interface CreateUserData {
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface UpdateUserData {
  email?: string;
  fullName?: string;
  avatarUrl?: string;
}

export class UsersService {
  // Get all users
  static async getUsers() {
    return await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            homeworkRequests: true,
          },
        },
      },
    });
  }

  // Get a specific user
  static async getUser(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        homeworkRequests: {
          orderBy: { createdAt: "desc" },
          take: 10, // Last 10 requests
        },
        _count: {
          select: {
            homeworkRequests: true,
          },
        },
      },
    });
  }

  // Get user by email
  static async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        _count: {
          select: {
            homeworkRequests: true,
          },
        },
      },
    });
  }

  // Create a new user
  static async createUser(data: CreateUserData) {
    return await prisma.user.create({
      data,
    });
  }

  // Update a user
  static async updateUser(id: string, data: UpdateUserData) {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  // Delete a user
  static async deleteUser(id: string) {
    return await prisma.user.delete({
      where: { id },
    });
  }

  // Get user statistics
  static async getUserStats(id: string) {
    const [user, totalRequests, pendingRequests, completedRequests] =
      await Promise.all([
        prisma.user.findUnique({ where: { id } }),
        prisma.homeworkRequest.count({ where: { userId: id } }),
        prisma.homeworkRequest.count({
          where: { userId: id, status: "pending" },
        }),
        prisma.homeworkRequest.count({
          where: { userId: id, status: "completed" },
        }),
      ]);

    return {
      user,
      stats: {
        totalRequests,
        pendingRequests,
        completedRequests,
        completionRate:
          totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0,
      },
    };
  }

  // Search users
  static async searchUsers(query: string) {
    return await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { fullName: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { fullName: "asc" },
      include: {
        _count: {
          select: {
            homeworkRequests: true,
          },
        },
      },
    });
  }
}
