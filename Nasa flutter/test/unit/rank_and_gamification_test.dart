import 'package:flutter_test/flutter_test.dart';
import 'package:auramed/services/rank_system_service.dart';
import 'package:auramed/state/missions_provider.dart';

void main() {
  group('Unit Tests: RankSystemService & 100-Rank Gamification Progression', () {
    late RankSystemService rankService;

    setUp(() async {
      rankService = RankSystemService();
      await rankService.init();
    });

    test('Loads exactly 10 Tiers and 100 Ranks without gaps', () {
      expect(rankService.tiers.length, 10);
      expect(rankService.ranks.length, 100);

      // Verify level monotonicity from 1 to 100
      for (int i = 0; i < 100; i++) {
        final rank = rankService.ranks[i];
        expect(rank.level, i + 1);
        expect(rank.tierIndex, greaterThanOrEqualTo(1));
        expect(rank.tierIndex, lessThanOrEqualTo(10));
        expect(rank.tierLevel, greaterThanOrEqualTo(1));
        expect(rank.tierLevel, lessThanOrEqualTo(10));
      }
    });

    test('Verifies Tier boundaries and names across all 10 tiers', () {
      final expectedTiers = [
        'Bronze', 'Iron', 'Silver', 'Gold', 'Platinum',
        'Emerald', 'Sapphire', 'Ruby', 'Diamond', 'Mythic'
      ];

      for (int t = 0; t < 10; t++) {
        final tier = rankService.tiers[t];
        expect(tier.name, expectedTiers[t]);
        expect(tier.index, t + 1);

        // Check first rank of tier
        final firstRankOfTier = rankService.getRankByLevel((t * 10) + 1);
        expect(firstRankOfTier.tier, expectedTiers[t]);
        expect(firstRankOfTier.tierLevel, 1);

        // Check last rank of tier
        final lastRankOfTier = rankService.getRankByLevel((t + 1) * 10);
        expect(lastRankOfTier.tier, expectedTiers[t]);
        expect(lastRankOfTier.tierLevel, 10);
      }
    });

    test('XP requirement curve strictly increases with level', () {
      int previousXp = -1;
      for (int level = 1; level <= 100; level++) {
        final rank = rankService.getRankByLevel(level);
        expect(rank.xpRequired, greaterThan(previousXp));
        previousXp = rank.xpRequired;
      }
    });

    test('Resolves correct rank from raw cumulative XP values', () {
      // Level 1: 0 XP
      expect(rankService.getRankByXp(0).level, 1);
      expect(rankService.getRankByXp(50).level, 1);

      // Level 100 maximum ceiling
      final maxRank = rankService.getRankByLevel(100);
      expect(rankService.getRankByXp(maxRank.xpRequired + 50000).level, 100);
    });

    test('Calculates level progression percentage accurately', () {
      final progress = rankService.getProgressToNextLevel(1, 200, 400);
      expect(progress, 0.5);

      final zeroProgress = rankService.getProgressToNextLevel(1, 0, 500);
      expect(zeroProgress, 0.0);

      final completedProgress = rankService.getProgressToNextLevel(1, 500, 500);
      expect(completedProgress, 1.0);
    });

    test('Identifies level up transitions reliably via MissionsProvider', () {
      final missions = MissionsProvider();
      final initialLevel = missions.level;

      // Small XP increase does not trigger level up
      final noEvent = missions.addXp(10);
      expect(noEvent, isNull);
      expect(missions.level, initialLevel);

      // Sufficient XP triggers level up and returns LevelUpEvent
      final event = missions.addXp(missions.xpToNextLevel);
      expect(event, isNotNull);
      expect(event!.newLevel, initialLevel + 1);
      expect(missions.level, initialLevel + 1);
      expect(event.gameRank, isNotNull);
      expect(event.gameRank!.level, initialLevel + 1);
    });
  });
}
