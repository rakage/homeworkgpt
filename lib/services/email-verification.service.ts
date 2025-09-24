import { prisma } from "@/lib/prisma";
import { VerificationCodeType } from "@prisma/client";

export interface CreateVerificationCodeData {
  email: string;
  code: string;
  type: VerificationCodeType;
  expiresAt: Date;
  userData?: any;
}

export class EmailVerificationService {
  // Create a new verification code
  static async createVerificationCode(data: CreateVerificationCodeData) {
    // Cast the type to text for the enum
    const typeValue = data.type.toString();

    return await prisma.$queryRaw`
      INSERT INTO "public"."email_verification_codes" 
      (email, code, type, expires_at, user_data, created_at, used)
      VALUES (
        ${data.email.toLowerCase()},
        ${data.code},
        ${typeValue}::public.VerificationCodeType,
        ${data.expiresAt},
        ${data.userData ? JSON.stringify(data.userData) : null}::jsonb,
        NOW(),
        false
      )
      RETURNING *
    `;
  }

  // Get verification code
  static async getVerificationCode(
    email: string,
    code: string,
    type: VerificationCodeType
  ) {
    // Cast the type to text first to match the database enum
    const typeValue = type.toString();

    return await prisma.$queryRaw`
      SELECT * FROM "public"."email_verification_codes"
      WHERE email = ${email.toLowerCase()}
      AND code = ${code}
      AND type::text = ${typeValue}
      AND used = false
      AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;
  }

  // Mark verification code as used
  static async markCodeAsUsed(id: string) {
    return await prisma.$queryRaw`
      UPDATE "public"."email_verification_codes"
      SET used = true
      WHERE id = ${id}::uuid
      RETURNING *
    `;
  }

  // Get all verification codes for an email
  static async getVerificationCodes(email: string) {
    return await prisma.emailVerificationCode.findMany({
      where: { email: email.toLowerCase() },
      orderBy: { createdAt: "desc" },
    });
  }

  // Delete verification code
  static async deleteVerificationCode(id: string) {
    return await prisma.emailVerificationCode.delete({
      where: { id },
    });
  }

  // Clean up expired codes
  static async cleanupExpiredCodes() {
    return await prisma.emailVerificationCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  // Get verification codes by type
  static async getVerificationCodesByType(type: VerificationCodeType) {
    return await prisma.emailVerificationCode.findMany({
      where: { type },
      orderBy: { createdAt: "desc" },
    });
  }

  // Check if email has recent verification code
  static async hasRecentCode(
    email: string,
    type: VerificationCodeType,
    minutesAgo: number = 1
  ) {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutesAgo);

    const recentCode = await prisma.emailVerificationCode.findFirst({
      where: {
        email: email.toLowerCase(),
        type,
        createdAt: {
          gte: cutoffTime,
        },
      },
    });

    return !!recentCode;
  }

  // Get verification code statistics
  static async getVerificationStats() {
    const [
      totalCodes,
      usedCodes,
      expiredCodes,
      signupCodes,
      passwordResetCodes,
    ] = await Promise.all([
      prisma.emailVerificationCode.count(),
      prisma.emailVerificationCode.count({ where: { used: true } }),
      prisma.emailVerificationCode.count({
        where: { expiresAt: { lt: new Date() } },
      }),
      prisma.emailVerificationCode.count({
        where: { type: VerificationCodeType.signup },
      }),
      prisma.emailVerificationCode.count({
        where: { type: VerificationCodeType.password_reset },
      }),
    ]);

    return {
      totalCodes,
      usedCodes,
      expiredCodes,
      activeCodes: totalCodes - usedCodes - expiredCodes,
      signupCodes,
      passwordResetCodes,
      usageRate: totalCodes > 0 ? (usedCodes / totalCodes) * 100 : 0,
    };
  }
}
