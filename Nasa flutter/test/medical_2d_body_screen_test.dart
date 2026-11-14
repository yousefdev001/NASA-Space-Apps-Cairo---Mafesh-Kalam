import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:auramed/features/body_report/screens/medical_2d_body_screen.dart';
import 'package:auramed/state/health_provider.dart';
import 'package:auramed/services/telemetry_sync_service.dart';

void main() {
  group('Medical 2D Body Model Interactive Tests', () {
    testWidgets('Medical2DBodyScreen renders all core English components and supports tap-to-zoom',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.75;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final syncService = TelemetrySyncService();
      final healthProvider = HealthProvider(syncService: syncService);

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider<HealthProvider>.value(value: healthProvider),
          ],
          child: const MaterialApp(
            home: Medical2DBodyScreen(),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 200));

      // Verify Screen Titles in English
      expect(find.text('Interactive 2D Body Atlas'), findsOneWidget);
      expect(find.textContaining('AuraMed Bio-Telemetry X-Ray Engine'), findsOneWidget);

      // Verify Organ Quick Selector in English
      expect(find.text('HEART'), findsWidgets);
      expect(find.text('LUNGS'), findsWidgets);
      expect(find.text('BRAIN'), findsWidgets);

      // Verify Initial Active Organ Card (English)
      expect(find.textContaining('Cardiovascular System'), findsWidgets);
      expect(find.textContaining('Heart Rate (HR)'), findsWidgets);

      // Select Brain via quick selector
      await tester.tap(find.text('BRAIN').first);
      await tester.pump(const Duration(milliseconds: 200));

      // Verify Brain details
      expect(find.textContaining('Central Nervous System'), findsWidgets);
      expect(find.textContaining('Intracranial Pressure'), findsWidgets);

      // Dismiss modal bottom sheet
      Navigator.pop(tester.element(find.byType(Medical2DBodyScreen)));
      await tester.pump(const Duration(milliseconds: 300));

      // Since organ tap zoomed into Brain, Reset Zoom is now active in AppBar
      expect(find.byTooltip('Reset Zoom (Full Body)'), findsOneWidget);

      // Reset zoom back to full body
      await tester.tap(find.byTooltip('Reset Zoom (Full Body)'));
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.byTooltip('Zoom on Active Organ'), findsOneWidget);

      // Test Palette Color All Organs button
      await tester.tap(find.byIcon(Icons.palette_outlined));
      await tester.pump(const Duration(milliseconds: 200));
      expect(find.byIcon(Icons.palette), findsOneWidget);

      healthProvider.dispose();
      syncService.dispose();
    });
  });
}
