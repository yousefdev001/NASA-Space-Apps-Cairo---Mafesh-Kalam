import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:auramed/core/models/game_rank_model.dart';
import 'package:auramed/core/models/mission_model.dart';
import 'package:auramed/core/widgets/rank_badge_widget.dart';
import 'package:auramed/features/gamification/rank_ladder/rank_ladder_screen.dart';
import 'package:auramed/features/missions/widgets/level_up_dialog.dart';
import 'package:auramed/services/rank_system_service.dart';
import 'package:auramed/state/missions_provider.dart';

void main() {
  group('100-Rank Progression System Domain & Logic', () {
    late RankSystemService service;

    setUp(() {
      service = RankSystemService();
    });

    test('RankSystemService initial fallback generates 10 tiers and 100 ranks', () {
      final rank1 = service.getRankByLevel(1);
      expect(rank1.level, equals(1));
      expect(rank1.tier.toLowerCase(), contains('bronze'));

      final rank50 = service.getRankByLevel(50);
      expect(rank50.level, equals(50));
      expect(rank50.tier.toLowerCase(), contains('platinum'));

      final rank100 = service.getRankByLevel(100);
      expect(rank100.level, equals(100));
      expect(rank100.tier.toLowerCase(), contains('mythic'));

      expect(service.tiers.length, equals(10));
      expect(service.ranks.length, equals(100));
    });

    test('Binary search by total XP returns correct progression rank', () {
      final startingRank = service.getRankByXp(0);
      expect(startingRank.level, equals(1));

      final midRank = service.getRankByXp(10000);
      expect(midRank.level, greaterThan(1));
      expect(midRank.xpRequired, lessThanOrEqualTo(10000));

      final maxRank = service.getRankByXp(9999999);
      expect(maxRank.level, equals(100));
    });

    test('GameRank asset paths are accurately generated', () {
      const sampleRank = GameRank(
        level: 14,
        rank: 'IV',
        name: 'Iron Commander',
        title: 'Commander',
        tier: 'Iron',
        tierId: 'iron',
        tierIndex: 2,
        tierLevel: 4,
        slug: 'iron-commander',
        xpRequired: 3500,
        color: Color(0xFF8E99A8),
      );

      expect(
        sampleRank.badge256Path,
        equals('assets/ranks/images/256/rank_014_iron-commander.png'),
      );
      expect(
        sampleRank.badge512Path,
        equals('assets/ranks/images/512/rank_014_iron-commander.png'),
      );
      expect(
        sampleRank.emblemPath,
        equals('assets/ranks/emblems/512/tier02_iron.png'),
      );
    });
  });

  group('Rank UI Component Tests', () {
    testWidgets('RankBadgeWidget renders fallback gracefully in test environment', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Center(
              child: RankBadgeWidget(
                level: 14,
                size: 80,
                showLevelBadge: true,
              ),
            ),
          ),
        ),
      );

      expect(find.byType(RankBadgeWidget), findsOneWidget);
      expect(find.text('Lvl 14'), findsOneWidget);
    });

    testWidgets('RankBadgeWidget shows lock icon when isLocked is true', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Center(
              child: RankBadgeWidget(
                level: 50,
                size: 60,
                isLocked: true,
              ),
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.lock_rounded), findsOneWidget);
    });

    testWidgets('LevelUpDialog displays rank badge and rank promotion info', (tester) async {
      final event = LevelUpEvent(
        newLevel: 15,
        newRank: AstronautRank.commander,
        didRankUp: true,
        gameRank: RankSystemService().getRankByLevel(15),
      );

      bool dismissed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: LevelUpDialog(
              event: event,
              onDismiss: () {
                dismissed = true;
              },
            ),
          ),
        ),
      );

      expect(find.text('RANK PROMOTION!'), findsOneWidget);
      expect(find.byType(RankBadgeWidget), findsOneWidget);
      expect(find.text('Acknowledge & Continue Mission'), findsOneWidget);

      await tester.tap(find.text('Acknowledge & Continue Mission'));
      await tester.pump();
      expect(dismissed, isTrue);
    });

    testWidgets('RankLadderScreen renders tabs and tier ranks', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider(
            create: (_) => MissionsProvider(),
            child: const RankLadderScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('ASTRONAUT RANK LADDER'), findsOneWidget);
      expect(find.text('My Rank'), findsOneWidget);
      expect(find.byType(TabBar), findsOneWidget);
      expect(find.text('Bronze'), findsWidgets);
    });
  });
}
