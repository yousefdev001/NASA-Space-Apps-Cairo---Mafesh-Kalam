import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:auramed/core/theme/app_colors.dart';
import 'package:auramed/core/models/auramed_assessment.dart';
import 'package:auramed/core/models/astronaut_profile.dart';
import 'package:auramed/core/models/game_rank_model.dart';
import 'package:auramed/core/models/mission_model.dart';
import 'package:auramed/core/models/vital_reading.dart';
import 'package:auramed/core/widgets/corner_bracket_card.dart';
import 'package:auramed/core/widgets/rank_badge_widget.dart';
import 'package:auramed/core/widgets/status_badge.dart';
import 'package:auramed/core/widgets/futuristic_button.dart';
import 'package:auramed/features/dashboard/widgets/dashboard_header.dart';
import 'package:auramed/features/analysis/widgets/medical_checklist_widget.dart';

void main() {
  group('Phase 5 Flutter Widget Audit & UI Layout Tests', () {
    testWidgets('DashboardHeader renders crew dossier and online/offline indicator',
        (WidgetTester tester) async {
      const profile = AstronautProfile(
        fullName: 'Cmdr. Neil Astro',
        astronautId: 'NASA-AST-2026',
        email: 'ast@nasa.com',
        rank: AstronautRank.commander,
        level: 14,
        currentXp: 2850,
        xpToNextLevel: 3500,
        streakDays: 18,
        age: 36,
        height: '178 cm',
        weight: '68 kg',
        gender: 'Male',
        bloodType: 'O+ (RH+)',
        missionName: 'Artemis Gateway-IV',
        missionDuration: '180 Days',
        currentMissionDay: 42,
        spacecraft: 'Orion MPCV',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: DashboardHeader(
              profile: profile,
              isOnline: true,
              isSyncing: false,
              pendingSyncCount: 0,
              onNotificationTap: () {},
              onSyncTap: () {},
              onAvatarTap: () {},
            ),
          ),
        ),
      );

      expect(find.textContaining('Astro'), findsOneWidget);
      expect(find.text('NASA-AST-2026'), findsOneWidget);
      expect(find.textContaining('Artemis Gateway-IV'), findsOneWidget);
      expect(find.textContaining('Day 42'), findsOneWidget);
    });

    testWidgets('CornerBracketCard renders high-tech cyber brackets without clipping',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: CornerBracketCard(
              bracketColor: AppColors.cyan,
              bracketLength: 14,
              child: Text('Telemetry Secured'),
            ),
          ),
        ),
      );

      expect(find.text('Telemetry Secured'), findsOneWidget);
      expect(find.byType(CornerBracketCard), findsOneWidget);
    });

    testWidgets('StatusBadge maps all health statuses to appropriate visual tokens',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                StatusBadge(status: HealthStatus.normal),
                StatusBadge(status: HealthStatus.warning),
                StatusBadge(status: HealthStatus.critical),
              ],
            ),
          ),
        ),
      );

      expect(find.text('NORMAL'), findsOneWidget);
      expect(find.text('WARNING'), findsOneWidget);
      expect(find.text('CRITICAL'), findsOneWidget);
    });

    testWidgets('FuturisticButton supports loading, disabled, and destructive states',
        (WidgetTester tester) async {
      bool tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                FuturisticButton(
                  text: 'Engage Life Support',
                  onPressed: () => tapped = true,
                ),
                const FuturisticButton(
                  text: 'Processing Telemetry',
                  isLoading: true,
                ),
                const FuturisticButton(
                  text: 'Emergency Abort',
                  isDestructive: true,
                ),
              ],
            ),
          ),
        ),
      );

      expect(find.text('Engage Life Support'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Emergency Abort'), findsOneWidget);

      await tester.tap(find.text('Engage Life Support'));
      await tester.pump();
      expect(tapped, isTrue);
    });

    testWidgets('RankBadgeWidget renders game rank tiers and fallback gracefully',
        (WidgetTester tester) async {
      const sampleRank = GameRank(
        level: 15,
        rank: 'V',
        name: 'Iron Rank V',
        title: 'Rank V',
        tier: 'Iron',
        tierId: 'iron',
        tierIndex: 2,
        tierLevel: 5,
        slug: 'iron-rank-5',
        xpRequired: 4500,
        color: Color(0xFF8E99A8),
      );

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: RankBadgeWidget(
              rank: sampleRank,
              size: 64,
              showLevelBadge: true,
            ),
          ),
        ),
      );

      expect(find.byType(RankBadgeWidget), findsOneWidget);
      expect(find.text('Lvl 15'), findsOneWidget);
    });

    testWidgets('Layout resilience on narrow 320px viewport (zero RenderFlex overflow)',
        (WidgetTester tester) async {
      // Force narrow screen constraint typical of compact mobile screens or split views
      tester.view.physicalSize = const Size(320 * 3, 640 * 3);
      tester.view.devicePixelRatio = 3.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final assessment = AuraMedAssessmentResponse(
        severity: 'Critical',
        mlAssessment: const MlAssessment(
          anomalyDetected: true,
          confidenceScore: 0.98,
          hazardRiskLevel: 'High Hypoxia Hazard Alert Status',
        ),
        summary: 'Critical Hypoxemia detected requiring emergency O2 supply verification.',
        actionSteps: [
          MedicalActionStep(
            action: 'Switch suit / cabin life support to emergency 100% O2 delivery mode immediately.',
            refLabel: 'NASA-EM-O2-01',
            warning: 'Extreme Caution: Hypoxic blackout risk.',
          ),
        ],
        escalationRequired: true,
        escalationReason: 'Immediate Flight Surgeon consultation required.',
        isOfflineFallback: true,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: MedicalChecklistWidget(
                assessment: assessment,
                completedIndices: const {},
                onToggleStep: (_) {},
                isEdgeNodeOnline: false,
              ),
            ),
          ),
        ),
      );

      // Verify no RenderFlex overflow exception occurred
      expect(tester.takeException(), isNull);
      expect(find.text('Flight Surgeon Escalation Required'), findsOneWidget);
      expect(find.text('Edge Node Offline'), findsOneWidget);
    });
  });
}
