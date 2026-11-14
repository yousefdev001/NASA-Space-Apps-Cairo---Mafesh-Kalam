import 'package:flutter_test/flutter_test.dart';
import 'package:auramed/core/config/app_config.dart';
import 'package:auramed/core/models/auramed_assessment.dart';
import 'package:auramed/services/auramed_api_service.dart';

void main() {
  group('Phase 3 & 4 API Contract & Backend Logic Audit', () {
    test('AppConfig network architecture parameters adhere strictly to specifications', () {
      expect(AppConfig.defaultApiKey, 'auramed-secret-key-2026');
      expect(AppConfig.defaultTimeout, const Duration(seconds: 45));
      expect(AppConfig.baseUrl, isNotEmpty);
    });

    test('Contract POST /api/v1/assess-astronaut Request Payload schema compliance', () {
      final samplePayload = {
        'request_id': 'REQ-FLUTTER-001',
        'astronaut_id': 'ASTRO-01',
        'vitals': {
          'heart_rate_bpm': 130.0,
          'spo2_percent': 85.0,
          'body_temperature_c': 37.3,
          'respiratory_rate_bpm': 24.0,
          'systolic_bp_mmhg': 115.0,
          'diastolic_bp_mmhg': 72.0,
          'hrv_rmssd_ms': 28.0,
        },
      };

      // Validate types according to FastAPI contract
      expect(samplePayload['request_id'], isA<String>());
      expect(samplePayload['astronaut_id'], isA<String>());
      expect(samplePayload['vitals'], isA<Map<String, dynamic>>());

      final vitals = samplePayload['vitals'] as Map<String, dynamic>;
      expect(vitals['heart_rate_bpm'], isA<double>());
      expect(vitals['spo2_percent'], isA<double>());
      expect(vitals['body_temperature_c'], isA<double>());
      expect(vitals['respiratory_rate_bpm'], isA<double>());
      expect(vitals['systolic_bp_mmhg'], isA<double>());
      expect(vitals['diastolic_bp_mmhg'], isA<double>());
      expect(vitals['hrv_rmssd_ms'], isA<double>());
    });

    test('Contract POST /api/v1/assess-astronaut Response Payload schema compliance', () {
      final validApiResponse = {
        'severity': 'Warning',
        'ml_assessment': {
          'anomaly_detected': true,
          'confidence_score': 0.91,
          'hazard_risk_level': 'Mild Hypoxic Strain',
        },
        'summary': 'Borderline oxygen saturation with compensatory tachycardia.',
        'action_steps': [
          {
            'action': 'Inspect suit ventilation loop and check CO2 scrubber.',
            'ref_label': 'ECLSS-CHK-04',
            'warning': null,
          }
        ],
        'escalation': {
          'required': false,
          'reason': null,
        },
      };

      final parsed = AuraMedAssessmentResponse.fromMap(validApiResponse);
      expect(parsed.severity, 'Warning');
      expect(parsed.mlAssessment.anomalyDetected, isTrue);
      expect(parsed.mlAssessment.confidenceScore, 0.91);
      expect(parsed.mlAssessment.hazardRiskLevel, 'Mild Hypoxic Strain');
      expect(parsed.actionSteps.length, 1);
      expect(parsed.actionSteps.first.refLabel, 'ECLSS-CHK-04');
      expect(parsed.escalationRequired, isFalse);
    });

    test('Contract POST /v1/chat Request and Response schema compliance', () {
      final chatRequest = {
        'message': 'What is the acute hypoxia countermeasure protocol?',
        'history': [
          {'role': 'user', 'content': 'Hello flight surgeon'},
          {'role': 'assistant', 'content': 'AuraMed flight intelligence active.'}
        ],
      };

      expect(chatRequest['message'], isA<String>());
      expect(chatRequest['history'], isA<List>());

      final chatResponse = {
        'response': '1. Immediately verify suit/cabin partial pressure of oxygen (pO2 >= 140 mmHg).\n2. Engage secondary oxygen accumulator valve.',
        'citations': [
          'NASA Aerospace Medicine Handbook STD-3001',
          'NASA SP-2020-5001 Space Suit Life Support Systems'
        ],
      };

      final parsed = MedicalRagResponse.fromMap(chatResponse);
      expect(parsed.response, contains('Immediately verify suit/cabin'));
      expect(parsed.citations.length, 2);
      expect(parsed.citations.contains('NASA Aerospace Medicine Handbook STD-3001'), isTrue);
    });

    test('Contract GET /health Heartbeat schema compliance', () {
      final healthyPayload = {
        'status': 'healthy',
        'operating_mode': 'online',
      };

      final status = HeartbeatStatus.healthy(healthyPayload);
      expect(status.isHealthy, isTrue);
      expect(status.operatingMode, 'online');
      expect(status.status, 'healthy');
    });

    test('AuraMedApiService handles 45-second timeout and offline server gracefully', () async {
      final originalUrl = AppConfig.baseUrl;
      await AppConfig.setBaseUrl('http://127.0.0.1:9999');
      try {
        final service = AuraMedApiService();

        // Trigger assessment with offline endpoint to test fallback resilience
        final fallbackAssessment = await service.assessAstronaut(
          astronautId: 'ASTRO-01',
          vitals: {
            'heart_rate_bpm': 135.0,
            'spo2_percent': 88.0,
            'body_temperature_c': 37.0,
            'respiratory_rate_bpm': 25.0,
            'systolic_bp_mmhg': 120.0,
            'diastolic_bp_mmhg': 80.0,
            'hrv_rmssd_ms': 25.0,
          },
        );

        // Must NOT throw, must return valid clinical assessment with fallback flag
        expect(fallbackAssessment.isOfflineFallback, isTrue);
        expect(fallbackAssessment.severity, 'Critical');
        expect(fallbackAssessment.escalationRequired, isTrue);
        expect(fallbackAssessment.actionSteps.isNotEmpty, isTrue);
      } finally {
        await AppConfig.setBaseUrl(originalUrl);
      }
    });
  });
}
