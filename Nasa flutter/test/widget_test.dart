import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:auramed/main.dart';

void main() {
  testWidgets('AuraMed app smoke test', (WidgetTester tester) async {
    // Set realistic modern mobile viewport dimensions
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.75;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    // Build AuraMed application
    await tester.pumpWidget(const AuraMedApp());
    await tester.pump(const Duration(milliseconds: 200));

    // Verify AuraMed loads and displays health monitoring overview
    expect(find.text('Track Body, Stay Well'), findsOneWidget);
    expect(find.text('HEART RATE'), findsOneWidget);
    expect(find.text('BLOOD OXYGEN'), findsOneWidget);
    expect(find.text('BODY TEMP'), findsOneWidget);
  });
}
