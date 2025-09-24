import { prisma } from "@/lib/prisma";
// import { SubscriptionTier, BillingCycle } from "@/lib/generated/prisma";
import { SubscriptionTier, BillingCycle } from "@prisma/client";

export interface CreateSubscriptionData {
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  amount: number;
  currency?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}

export interface UpdateSubscriptionData {
  status?: string;
  tier?: SubscriptionTier;
  billingCycle?: BillingCycle;
  amount?: number;
  currency?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  canceledAt?: Date;
}

export class SubscriptionsService {
  // Get all subscriptions
  static async getSubscriptions() {
    return await prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        profile: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  // Get subscription by ID
  static async getSubscription(id: string) {
    return await prisma.subscription.findUnique({
      where: { id },
      include: {
        profile: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  // Get subscription by Stripe subscription ID
  static async getSubscriptionByStripeId(stripeSubscriptionId: string) {
    return await prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
      include: {
        profile: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  // Get subscriptions for a user
  static async getUserSubscriptions(userId: string) {
    return await prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        profile: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  // Get active subscription for a user
  static async getActiveSubscription(userId: string) {
    return await prisma.subscription.findFirst({
      where: {
        userId,
        status: "active",
      },
      orderBy: { createdAt: "desc" },
      include: {
        profile: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  // Create a new subscription
  static async createSubscription(data: CreateSubscriptionData) {
    return await prisma.subscription.create({
      data,
      include: {
        profile: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  // Update a subscription
  static async updateSubscription(
    stripeSubscriptionId: string,
    data: UpdateSubscriptionData
  ) {
    return await prisma.subscription.update({
      where: { stripeSubscriptionId },
      data,
      include: {
        profile: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  // Upsert subscription (create or update)
  static async upsertSubscription(data: CreateSubscriptionData) {
    return await prisma.subscription.upsert({
      where: { stripeSubscriptionId: data.stripeSubscriptionId },
      update: {
        status: data.status,
        tier: data.tier,
        billingCycle: data.billingCycle,
        amount: data.amount,
        currency: data.currency,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
      },
      create: data,
      include: {
        profile: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  // Cancel a subscription
  static async cancelSubscription(stripeSubscriptionId: string) {
    return await prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: {
        status: "canceled",
        canceledAt: new Date(),
      },
    });
  }

  // Get subscription analytics
  static async getSubscriptionAnalytics() {
    const [
      totalSubscriptions,
      activeSubscriptions,
      canceledSubscriptions,
      basicSubscriptions,
      plusSubscriptions,
      monthlyRevenue,
      yearlyRevenue,
    ] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: "active" } }),
      prisma.subscription.count({ where: { status: "canceled" } }),
      prisma.subscription.count({
        where: { status: "active", tier: SubscriptionTier.basic },
      }),
      prisma.subscription.count({
        where: { status: "active", tier: SubscriptionTier.plus },
      }),
      prisma.subscription.aggregate({
        where: {
          status: "active",
          billingCycle: BillingCycle.monthly,
        },
        _sum: { amount: true },
      }),
      prisma.subscription.aggregate({
        where: {
          status: "active",
          billingCycle: BillingCycle.yearly,
        },
        _sum: { amount: true },
      }),
    ]);

    const monthlyRevenueTotal = monthlyRevenue._sum.amount || 0;
    const yearlyRevenueTotal = (yearlyRevenue._sum.amount || 0) / 12; // Convert to monthly equivalent

    return {
      totalSubscriptions,
      activeSubscriptions,
      canceledSubscriptions,
      basicSubscriptions,
      plusSubscriptions,
      churnRate:
        totalSubscriptions > 0
          ? (canceledSubscriptions / totalSubscriptions) * 100
          : 0,
      monthlyRecurringRevenue: monthlyRevenueTotal + yearlyRevenueTotal,
      annualRecurringRevenue: (monthlyRevenueTotal + yearlyRevenueTotal) * 12,
    };
  }

  // Get subscriptions expiring soon
  static async getExpiringSubscriptions(days: number = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await prisma.subscription.findMany({
      where: {
        status: "active",
        currentPeriodEnd: {
          lte: futureDate,
        },
      },
      include: {
        profile: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { currentPeriodEnd: "asc" },
    });
  }
}
