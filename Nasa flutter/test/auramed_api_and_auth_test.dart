import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:auramed/core/models/auramed_assessment.dart';
import 'package:auramed/services/auramed_api_service.dart';
import 'package:auramed/services/offline_database_service.dart';
import 'package:auramed/state/auth_provider.dart';
import 'package:auramed/features/analysis/widgets/medical_checklist_widget.dart';

void main() {
  group('AuraMed Crew Authentication & Validation Tests', () {
    test('OfflineDatabase validates demo account ast@nasa.com / ast@2026', () {
      final db = OfflineDatabaseService();
      expect(db.validateUser('ast@nasa.com', 'ast@2026'), isTrue);
      expect(db.validateUser('AST@NASA.COM', 'ast@2026'), isTrue); // Case-insensitive
      expect(db.validateUser('ast@nasa.com', 'wrong_pass'), isFalse);
      expect(db.validateUser('unknown@nasa.gov', 'pass123'), isFalse);
    });

    test('AuthProvider authenticates ast@nasa.com / ast@2026 successfully', () async {
      final auth = AuthProvider();
      final success = await auth.login('ast@nasa.com', 'ast@2026');
      expect(success, isTrue);
      expect(auth.isAuthenticated, isTrue);
      expect(auth.errorMessage, isNull);
      expect(auth.profile.email, 'ast@nasa.com');
      expect(auth.profile.fullName, contains('Neil Astro'));
    });

    test('AuthProvider flags invalid credentials with helpful guidance', () async {
      final auth = AuthProvider();
      final success = await auth.login('unknown@nasa.gov', 'invalid');
      expect(success, isFalse);
      expect(auth.errorMessage, contains('Invalid credentials'));
      expect(auth.errorMessage, contains('ast@nasa.com'));
    });

    test('Crew registration saves and validates in offline database', () async {
      final db = OfflineDatabaseService();
      await db.registerUser(
        email: 'test.crew@artemis.nasa.gov',
        password: 'securePass2026',
        fullName: 'Dr. Helen Vance',
        astronautId: 'ASTRO-TEST-01',
      );

      expect(db.validateUser('test.crew@artemis.nasa.gov', 'securePass2026'), isTrue);
      final user = db.getUser('test.crew@artemis.nasa.gov');
      expect(user?['fullName'], 'Dr. Helen Vance');
      expect(user?['astronautId'], 'ASTRO-TEST-01');
    });
  });

  group('AuraMed Healthcare AI Assessment & Decision Support Tests', () {
    test('AuraMedAssessmentResponse parses full API payload correctly', () {
      final mockJson = {
        'severity': 'Critical',
        'ml_assessment': {
          'anomaly_detected': true,
          'confidence_score': 0.98,
          'hazard_risk_level': 'High Hypoxia Hazard',
        },
        'summary': 'Acute Hypoxemia requiring immediate life-support intervention.',
        'action_steps': [
          {
            'action': 'Switch suit to 100% O2 delivery.',
            'ref_label': 'NASA-EM-O2-01',
            'warning': 'Urgent: Avoid physical movement.',
          },
          {
            'action': 'Contact Houston Flight Surgeon.',
            'ref_label': 'NASA-COM-EMRG',
          }
        ],
        'escalation': {
          'required': true,
          'reason': 'SpO2 level 85.0% below safety envelope.',
        },
      };

      final response = AuraMedAssessmentResponse.fromMap(mockJson);
      expect(response.severity, 'Critical');
      expect(response.mlAssessment.anomalyDetected, isTrue);
      expect(response.mlAssessment.confidenceScore, 0.98);
      expect(response.actionSteps.length, 2);
      expect(response.actionSteps.first.refLabel, 'NASA-EM-O2-01');
      expect(response.actionSteps.first.warning, contains('Urgent'));
      expect(response.escalationRequired, isTrue);
      expect(response.isOfflineFallback, isFalse);
    });

    test('AuraMed offline fallback generates clinical action steps on hypoxia', () async {
      final service = AuraMedApiService();
      // Test offline assessment directly with critical vitals
      final assessment = await service.assessAstronaut(
        astronautId: 'ASTRO-TEST',
        vitals: {
          'heart_rate_bpm': 140.0,
          'spo2_percent': 86.0,
          'body_temperature_c': 37.2,
          'respiratory_rate_bpm': 26.0,
          'systolic_bp_mmhg': 120.0,
          'diastolic_bp_mmhg': 75.0,
          'hrv_rmssd_ms': 22.0,
        },
      );

      expect(assessment.severity, 'Critical');
      expect(assessment.mlAssessment.anomalyDetected, isTrue);
      expect(assessment.escalationRequired, isTrue);
      expect(assessment.actionSteps.isNotEmpty, isTrue);
      expect(assessment.actionSteps.any((s) => s.refLabel.contains('O2')), isTrue);
    });

    test('MedicalRagResponse parses citations and response correctly', () {
      final mockRagJson = {
        'response': 'Hypoxia countermeasures dictate increasing cabin pO2 immediately.',
        'citations': ['NASA STD-3001', 'ISS Flight Surgeon Protocol'],
      };

      final rag = MedicalRagResponse.fromMap(mockRagJson);
      expect(rag.response, contains('Hypoxia countermeasures'));
      expect(rag.citations.length, 2);
      expect(rag.citations.first, 'NASA STD-3001');
    });
  });

  group('MedicalChecklistWidget UI Tests', () {
    testWidgets('Renders action checklist steps and allows interactive toggling',
        (WidgetTester tester) async {
      final testAssessment = AuraMedAssessmentResponse(
        severity: 'Critical',
        mlAssessment: const MlAssessment(
          anomalyDetected: true,
          confidenceScore: 0.96,
          hazardRiskLevel: 'High Hazard',
        ),
        summary: 'Critical Hypoxia Alert: Execute checklist procedures immediately.',
        actionSteps: [
          MedicalActionStep(
            action: 'Engage secondary oxygen accumulator.',
            refLabel: 'NASA-EM-O2-02',
            warning: 'Do not disconnect suit umbilical.',
          ),
          MedicalActionStep(
            action: 'Notify Houston Flight Surgeon.',
            refLabel: 'NASA-COM-01',
          ),
        ],
        escalationRequired: true,
        escalationReason: 'Immediate Surgeon Intervention Mandated',
        isOfflineFallback: true,
      );

      final completedSteps = <int>{};

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatefulBuilder(
              builder: (context, setState) {
                return SingleChildScrollView(
                  child: MedicalChecklistWidget(
                    assessment: testAssessment,
                    completedIndices: completedSteps,
                    isEdgeNodeOnline: false,
                    onToggleStep: (idx) {
                      setState(() {
                        if (completedSteps.contains(idx)) {
                          completedSteps.remove(idx);
                        } else {
                          completedSteps.add(idx);
                        }
                      });
                    },
                  ),
                );
              },
            ),
          ),
        ),
      );

      // Verify Escalation Banner
      expect(find.text('Flight Surgeon Escalation Required'), findsOneWidget);

      // Verify Edge Node Offline Banner
      expect(find.text('Edge Node Offline'), findsOneWidget);

      // Verify Action Steps rendered
      expect(find.text('Engage secondary oxygen accumulator.'), findsOneWidget);
      expect(find.text('NASA-EM-O2-02'), findsOneWidget);
      expect(find.text('Notify Houston Flight Surgeon.'), findsOneWidget);

      // Tap first checkbox to complete step
      await tester.tap(find.text('Engage secondary oxygen accumulator.'));
      await tester.pump();

      expect(completedSteps.contains(0), isTrue);
      expect(find.text('1/2 Completed'), findsOneWidget);
    });
  });
}
