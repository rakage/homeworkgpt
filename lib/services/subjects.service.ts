import { prisma } from "@/lib/prisma";

export interface CreateSubjectData {
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdateSubjectData {
  name?: string;
  description?: string;
  icon?: string;
}

export class SubjectsService {
  // Get all subjects
  static async getSubjects() {
    return await prisma.subject.findMany({
      orderBy: { name: "asc" },
    });
  }

  // Get a specific subject
  static async getSubject(id: string) {
    return await prisma.subject.findUnique({
      where: { id },
    });
  }

  // Get subject by name
  static async getSubjectByName(name: string) {
    return await prisma.subject.findUnique({
      where: { name },
    });
  }

  // Create a new subject
  static async createSubject(data: CreateSubjectData) {
    return await prisma.subject.create({
      data,
    });
  }

  // Update a subject
  static async updateSubject(id: string, data: UpdateSubjectData) {
    return await prisma.subject.update({
      where: { id },
      data,
    });
  }

  // Delete a subject
  static async deleteSubject(id: string) {
    return await prisma.subject.delete({
      where: { id },
    });
  }

  // Get subjects with homework request counts
  static async getSubjectsWithStats() {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: "asc" },
    });

    // Get homework request counts for each subject
    const subjectsWithStats = await Promise.all(
      subjects.map(async (subject) => {
        const requestCount = await prisma.homeworkRequest.count({
          where: { subject: subject.name },
        });

        return {
          ...subject,
          requestCount,
        };
      })
    );

    return subjectsWithStats;
  }

  // Search subjects
  static async searchSubjects(query: string) {
    return await prisma.subject.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
    });
  }
}
