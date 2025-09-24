import { prisma } from "@/lib/prisma";
// import { SubscriptionTier, SubscriptionStatus } from "@/lib/generated/prisma";
import { SubscriptionTier, SubscriptionStatus } from "@prisma/client";

export interface CreateProfileData {
  id: string; // UUID from Supabase auth
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface UpdateProfileData {
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  subscriptionTier?: SubscriptionTier;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionId?: string;
  customerId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}

export class ProfilesService {
  // Get all profiles
  static async getProfiles() {
    return await prisma.profile.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        userUsage: {
          orderBy: { month: "desc" },
          take: 6, // Last 6 months
        },
      },
    });
  }

  // Get a specific profile
  static async getProfile(id: string) {
    return await prisma.profile.findUnique({
      where: { id },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
        },
        userUsage: {
          orderBy: { month: "desc" },
        },
      },
    });
  }

  // Get profile by email
  static async getProfileByEmail(email: string) {
    return await prisma.profile.findUnique({
      where: { email },
      include: {
        subscriptions: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        userUsage: {
          orderBy: { month: "desc" },
          take: 1,
        },
      },
    });
  }

  // Create a new profile
  static async createProfile(data: CreateProfileData) {
    return await prisma.profile.create({
      data,
    });
  }

  // Update a profile
  static async updateProfile(id: string, data: UpdateProfileData) {
    return await prisma.profile.update({
      where: { id },
      data,
    });
  }

  // Delete a profile
  static async deleteProfile(id: string) {
    return await prisma.profile.delete({
      where: { id },
    });
  }

  // Get current month usage for a profile
  static async getCurrentUsage(id: string) {
    const currentMonth = new Date();
    currentMonth.setDate(1); // First day of current month
    currentMonth.setHours(0, 0, 0, 0);

    return await prisma.userUsage.findUnique({
      where: {
        userId_month: {
          userId: id,
          month: currentMonth,
        },
      },
    });
  }

  // Update or create usage record
  static async updateUsage(id: string, requestsCount: number, tier: string) {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    return await prisma.userUsage.upsert({
      where: {
        userId_month: {
          userId: id,
          month: currentMonth,
        },
      },
      update: {
        requestsCount,
        tier,
      },
      create: {
        userId: id,
        month: currentMonth,
        requestsCount,
        tier,
      },
    });
  }

  // Get profiles with active subscriptions
  static async getActiveSubscribers() {
    return await prisma.profile.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.active,
      },
      include: {
        subscriptions: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Get subscription analytics
  static async getSubscriptionAnalytics() {
    const [
      totalProfiles,
      activeSubscribers,
      basicSubscribers,
      plusSubscribers,
      pastDueSubscribers,
    ] = await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({
        where: { subscriptionStatus: SubscriptionStatus.active },
      }),
      prisma.profile.count({
        where: {
          subscriptionStatus: SubscriptionStatus.active,
          subscriptionTier: SubscriptionTier.basic,
        },
      }),
      prisma.profile.count({
        where: {
          subscriptionStatus: SubscriptionStatus.active,
          subscriptionTier: SubscriptionTier.plus,
        },
      }),
      prisma.profile.count({
        where: { subscriptionStatus: SubscriptionStatus.past_due },
      }),
    ]);

    return {
      totalProfiles,
      activeSubscribers,
      basicSubscribers,
      plusSubscribers,
      pastDueSubscribers,
      freeUsers: totalProfiles - activeSubscribers,
      conversionRate:
        totalProfiles > 0 ? (activeSubscribers / totalProfiles) * 100 : 0,
    };
  }
}
