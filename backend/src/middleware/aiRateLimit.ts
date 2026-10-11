import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

interface UserUsage {
  minuteCount: number;
  minuteResetAt: number;
  dayCount: number;
  dayResetAt: number;
}

const userUsageStore = new Map<string, UserUsage>();

// Constants
const MAX_PER_MINUTE = 30;
const MAX_PER_DAY = 150;
const ONE_MINUTE_MS = 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Periodic cleanup of stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [userId, usage] of userUsageStore.entries()) {
    if (now > usage.dayResetAt && now > usage.minuteResetAt) {
      userUsageStore.delete(userId);
    }
  }
}, 10 * 60 * 1000);

export function aiUsageLimiter(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new AppError('Authentication required to access AI Content Studio.', 401));
  }

  const userId = req.user._id.toString();
  const now = Date.now();

  let usage = userUsageStore.get(userId);

  if (!usage) {
    usage = {
      minuteCount: 0,
      minuteResetAt: now + ONE_MINUTE_MS,
      dayCount: 0,
      dayResetAt: now + ONE_DAY_MS,
    };
    userUsageStore.set(userId, usage);
  }

  // Check 1-minute window reset
  if (now > usage.minuteResetAt) {
    usage.minuteCount = 0;
    usage.minuteResetAt = now + ONE_MINUTE_MS;
  }

  // Check 1-day window reset
  if (now > usage.dayResetAt) {
    usage.dayCount = 0;
    usage.dayResetAt = now + ONE_DAY_MS;
  }

  // Check minute threshold
  if (usage.minuteCount >= MAX_PER_MINUTE) {
    const secondsRemaining = Math.ceil((usage.minuteResetAt - now) / 1000);
    res.setHeader('Retry-After', secondsRemaining);
    return next(
      new AppError(
        `AI generation rate limit exceeded. You can make up to ${MAX_PER_MINUTE} generations per minute. Please try again in ${secondsRemaining}s.`,
        429
      )
    );
  }

  // Check daily threshold
  if (usage.dayCount >= MAX_PER_DAY) {
    const hoursRemaining = Math.ceil((usage.dayResetAt - now) / (1000 * 60 * 60));
    return next(
      new AppError(
        `Daily AI generation quota reached (${MAX_PER_DAY} generations/day). Quota resets in ~${hoursRemaining} hours.`,
        429
      )
    );
  }

  // Increment usage counters
  usage.minuteCount += 1;
  usage.dayCount += 1;

  // Add usage headers for client transparency
  res.setHeader('X-RateLimit-Limit-Minute', MAX_PER_MINUTE);
  res.setHeader('X-RateLimit-Remaining-Minute', Math.max(0, MAX_PER_MINUTE - usage.minuteCount));
  res.setHeader('X-RateLimit-Limit-Day', MAX_PER_DAY);
  res.setHeader('X-RateLimit-Remaining-Day', Math.max(0, MAX_PER_DAY - usage.dayCount));

  next();
}

export function getUserUsageStats(userId: string): {
  minuteCount: number;
  minuteRemaining: number;
  dayCount: number;
  dayRemaining: number;
} {
  const usage = userUsageStore.get(userId);
  if (!usage) {
    return {
      minuteCount: 0,
      minuteRemaining: MAX_PER_MINUTE,
      dayCount: 0,
      dayRemaining: MAX_PER_DAY,
    };
  }

  return {
    minuteCount: usage.minuteCount,
    minuteRemaining: Math.max(0, MAX_PER_MINUTE - usage.minuteCount),
    dayCount: usage.dayCount,
    dayRemaining: Math.max(0, MAX_PER_DAY - usage.dayCount),
  };
}
