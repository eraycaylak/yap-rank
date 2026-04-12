// ════════════════════════════════════════════════════════════
// HAPTIC FEEDBACK HELPERS
// ════════════════════════════════════════════════════════════
import { tg } from './telegram.js';

export const haptic = {
  tap:     () => tg?.HapticFeedback?.impactOccurred('light'),
  medium:  () => tg?.HapticFeedback?.impactOccurred('medium'),
  heavy:   () => tg?.HapticFeedback?.impactOccurred('heavy'),
  success: () => tg?.HapticFeedback?.notificationOccurred('success'),
  error:   () => tg?.HapticFeedback?.notificationOccurred('error'),
  warn:    () => tg?.HapticFeedback?.notificationOccurred('warning'),
  select:  () => tg?.HapticFeedback?.selectionChanged(),
};
