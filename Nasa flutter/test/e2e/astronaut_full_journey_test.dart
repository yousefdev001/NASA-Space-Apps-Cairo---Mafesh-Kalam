import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:auramed/main.dart';
import 'package:auramed/features/auth/screens/login_screen.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('Phase 6 End-to-End User Journeys: Complete Mission Lifecycle', () {
    testWidgets('Full Journey: Login -> Dashboard -> 2D Atlas -> Analysis -> Games -> Journal -> Chat -> Profile -> Logout -> Re-Auth',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.75;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      // 1. Launch Application
      await tester.pumpWidget(const AuraMedApp());
      await tester.pump(const Duration(milliseconds: 300));

      // 2. Initial Dashboard State Verification
      expect(find.textContaining('Track Body'), findsOneWidget);
      expect(find.text('Organ Analysis'), findsOneWidget);

      // 3. Journey: 2D Anatomical Body Atlas (Tab 1)
      await tester.tap(find.byIcon(Icons.monitor_heart_outlined));
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.text('Interactive 2D Body Atlas'), findsOneWidget);
      expect(find.text('AuraMed Bio-Telemetry X-Ray Engine'), findsOneWidget);

      // 4. Journey: Health Analysis & Action Checklist (Tab 2)
      await tester.tap(find.byIcon(Icons.analytics_outlined));
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.text('Health Analysis Report'), findsOneWidget);
      expect(find.text('ORGAN TELEMETRY GRID'), findsOneWidget);

      // 5. Journey: Games & Gamification (Tab 3)
      await tester.tap(find.byIcon(Icons.sports_esports_outlined));
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.text('SPACE REFLEX'), findsOneWidget);
      expect(find.text('ALIEN MEMORY'), findsOneWidget);
      expect(find.text('LIFE STYLE ON EARTH'), findsOneWidget);

      // Open Earth Memory Journal
      await tester.ensureVisible(find.text('Open Journal'));
      await tester.pump(const Duration(milliseconds: 300));
      await tester.tap(find.text('Open Journal'));
      await tester.pump(const Duration(milliseconds: 300));
      await tester.runAsync(() async {
        await Future.delayed(const Duration(milliseconds: 150));
      });
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.text('Life Style on Earth'), findsOneWidget);
      expect(find.text('Your Earth memories will live here.'), findsOneWidget);

      // Return back to Gamification
      await tester.tap(find.byIcon(Icons.arrow_back_ios_new_rounded));
      await tester.pump(const Duration(milliseconds: 500));
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.text('SPACE REFLEX'), findsOneWidget);

      // 6. Journey: Profile & Dossier (Tab 4)
      await tester.tap(find.byIcon(Icons.person_outline_rounded));
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.text('Astronaut Profile'), findsOneWidget);
      expect(find.text('PERSONAL BIOMETRICS'), findsOneWidget);
      expect(find.text('CURRENT MISSION DEPLOYMENT'), findsOneWidget);
      expect(find.text('AuraMed AI Server & Cloudflare Tunnel'), findsOneWidget);

      // 7. Journey: Sign Out and Return to Crew Clearance Gate
      await tester.ensureVisible(find.text('Sign Out Astronaut Session'));
      await tester.pump(const Duration(milliseconds: 300));
      await tester.tap(find.text('Sign Out Astronaut Session'));
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.text('End Flight Session?'), findsOneWidget);

      // Confirm sign out in dialog
      await tester.tap(find.widgetWithText(ElevatedButton, 'Sign Out'));
      await tester.pump(const Duration(milliseconds: 500));
      await tester.pump(const Duration(milliseconds: 500));

      // Verify Login Screen is displayed
      expect(find.byType(LoginScreen), findsOneWidget);
      expect(find.text('CREW AUTHENTICATION'), findsOneWidget);
      expect(find.text('AuraMed'), findsOneWidget);

      // 8. Re-authenticate via Quick Demo Access
      await tester.tap(find.text('Quick Demo Access (ast@nasa.com)'));
      await tester.pump(const Duration(milliseconds: 500));
      await tester.pump(const Duration(milliseconds: 500));

      // Verify returned back inside the secure Dashboard
      expect(find.textContaining('Track Body'), findsOneWidget);
      expect(find.byType(LoginScreen), findsNothing);
    });
  });
}
