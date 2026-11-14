import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:auramed/main.dart';
import 'package:auramed/core/models/vital_reading.dart';
import 'package:auramed/services/ai_health_service.dart';
import 'package:auramed/core/models/mission_model.dart';

void main() {
  group('AuraMed AI Health Engine & Domain Logic', () {
    test('AI evaluates nominal spaceflight telemetry', () {
      final result = AiHealthService.analyzeBiometrics(
        heartRate: 72,
        bloodOxygen: 99,
        temperature: 36.8,
        respiratoryRate: 16,
        systolicBp: 118,
        diastolicBp: 76,
        source: TelemetrySource.simulated,
      );

      expect(result.overallStatus, HealthStatus.normal);
      expect(result.overallHealthScore, greaterThanOrEqualTo(90));
      expect(result.updatedOrgans.length, 6);
    });

    test('AI identifies hypoxia critical alert when SpO2 drops', () {
      final result = AiHealthService.analyzeBiometrics(
        heartRate: 135,
        bloodOxygen: 88, // Critical drop
        temperature: 36.8,
        respiratoryRate: 28,
        systolicBp: 140,
        diastolicBp: 90,
        source: TelemetrySource.manual,
      );

      expect(result.overallStatus, HealthStatus.critical);
      final lungs = result.updatedOrgans.firstWhere((o) => o.id == 'lungs');
      expect(lungs.status, HealthStatus.critical);
      expect(lungs.healthScore, lessThan(50));
    });

    test('Rank System correctly maps level thresholds', () {
      expect(AstronautRankExtension.fromLevel(3), AstronautRank.cadet);
      expect(AstronautRankExtension.fromLevel(8), AstronautRank.specialist);
      expect(AstronautRankExtension.fromLevel(14), AstronautRank.explorer);
      expect(AstronautRankExtension.fromLevel(25), AstronautRank.commander);
      expect(AstronautRankExtension.fromLevel(35), AstronautRank.eliteAstronaut);
    });
  });

  group('AuraMed Multi-Screen UI & Navigation Tests', () {
    testWidgets('Complete navigation flow: Home -> Analysis -> Missions -> Profile',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.75;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(const AuraMedApp());
      await tester.pump(const Duration(milliseconds: 200));

      // 1. Home Dashboard is visible
      expect(find.textContaining('Track Body'), findsOneWidget);
      expect(find.text('Organ Analysis'), findsOneWidget);
      expect(find.text('Heart Rate'), findsWidgets);

      // 2. Navigate to 2D Body Report Tab via icon
      await tester.tap(find.byIcon(Icons.monitor_heart_outlined));
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.text('Interactive 2D Body Atlas'), findsOneWidget);

      // 3. Navigate to Analysis Tab via icon
      await tester.tap(find.byIcon(Icons.analytics_outlined));
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.text('Health Analysis Report'), findsOneWidget);
      expect(find.text('ORGAN TELEMETRY GRID'), findsOneWidget);

      // 4. Navigate to Game Tab via icon
      await tester.tap(find.byIcon(Icons.sports_esports_outlined));
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.text('SPACE REFLEX'), findsOneWidget);
      expect(find.text('ALIEN MEMORY'), findsOneWidget);
      expect(find.text('LIFE STYLE ON EARTH'), findsOneWidget);

      // 5. Navigate to Profile Tab via icon
      await tester.tap(find.byIcon(Icons.person_outline_rounded));
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.text('Astronaut Profile'), findsOneWidget);
      expect(find.text('PERSONAL BIOMETRICS'), findsOneWidget);
      expect(find.text('CURRENT MISSION DEPLOYMENT'), findsOneWidget);
    });
  });
}
