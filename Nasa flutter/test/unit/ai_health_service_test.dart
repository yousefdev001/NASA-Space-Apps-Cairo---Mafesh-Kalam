import 'package:flutter_test/flutter_test.dart';
import 'package:auramed/core/models/vital_reading.dart';
import 'package:auramed/services/ai_health_service.dart';

void main() {
  group('Unit Tests: AiHealthService Medical Decision Engine', () {
    test('Evaluates nominal biometric envelope correctly', () {
      final result = AiHealthService.analyzeBiometrics(
        heartRate: 72,
        bloodOxygen: 99,
        temperature: 36.8,
        respiratoryRate: 14,
        systolicBp: 118,
        diastolicBp: 76,
        source: TelemetrySource.simulated,
      );

      expect(result.overallStatus, HealthStatus.normal);
      expect(result.overallHealthScore, greaterThanOrEqualTo(90));
      expect(result.updatedOrgans.length, 6);

      final heart = result.updatedOrgans.firstWhere((o) => o.id == 'heart');
      expect(heart.status, HealthStatus.normal);
      expect(heart.healthScore, greaterThanOrEqualTo(90));

      final lungs = result.updatedOrgans.firstWhere((o) => o.id == 'lungs');
      expect(lungs.status, HealthStatus.normal);

      final brain = result.updatedOrgans.firstWhere((o) => o.id == 'brain');
      expect(brain.status, HealthStatus.normal);
    });

    test('Critical Hypoxemia triggers critical lungs and brain alerts', () {
      final result = AiHealthService.analyzeBiometrics(
        heartRate: 110,
        bloodOxygen: 85, // Severe hypoxia
        temperature: 36.8,
        respiratoryRate: 26,
        systolicBp: 125,
        diastolicBp: 80,
        source: TelemetrySource.simulated,
      );

      expect(result.overallStatus, HealthStatus.critical);

      final lungs = result.updatedOrgans.firstWhere((o) => o.id == 'lungs');
      expect(lungs.status, HealthStatus.critical);
      expect(lungs.healthScore, lessThan(50));
      expect(lungs.aiAssessment, contains('Hypoxia warning'));

      final brain = result.updatedOrgans.firstWhere((o) => o.id == 'brain');
      expect(brain.status, HealthStatus.critical);
      expect(brain.aiAssessment, contains('Hypoperfusion risk'));
    });

    test('Critical Tachycardia and Severe Hypertension triggers cardiac emergency', () {
      final result = AiHealthService.analyzeBiometrics(
        heartRate: 145, // Extreme tachycardia
        bloodOxygen: 97,
        temperature: 37.1,
        respiratoryRate: 22,
        systolicBp: 165, // Severe systolic hypertension
        diastolicBp: 102,
        source: TelemetrySource.manual,
      );

      expect(result.overallStatus, HealthStatus.critical);

      final heart = result.updatedOrgans.firstWhere((o) => o.id == 'heart');
      expect(heart.status, HealthStatus.critical);
      expect(heart.healthScore, lessThan(50));
      expect(heart.aiAssessment, contains('Critical tachycardia'));
    });

    test('Elevated workout heart rate flags metabolic and hepatic exertion', () {
      final result = AiHealthService.analyzeBiometrics(
        heartRate: 118,
        bloodOxygen: 98,
        temperature: 37.3,
        respiratoryRate: 20,
        systolicBp: 130,
        diastolicBp: 82,
        source: TelemetrySource.live,
      );

      expect(result.overallStatus, HealthStatus.warning);

      final liver = result.updatedOrgans.firstWhere((o) => o.id == 'liver');
      expect(liver.status, HealthStatus.warning);
      expect(liver.aiAssessment, contains('metabolic expenditure'));
    });

    test('Extreme Hyperthermia (heat stroke) and Hypothermia thresholds', () {
      // Hyperthermia test
      final heatResult = AiHealthService.analyzeBiometrics(
        heartRate: 105,
        bloodOxygen: 98,
        temperature: 38.8,
        respiratoryRate: 24,
        systolicBp: 124,
        diastolicBp: 78,
        source: TelemetrySource.live,
      );
      expect(heatResult.overallStatus, HealthStatus.critical);
      final bodyHeat = heatResult.updatedOrgans.firstWhere((o) => o.id == 'whole_body');
      expect(bodyHeat.status, HealthStatus.critical);
      expect(bodyHeat.aiAssessment, contains('Thermoregulation failure alert'));

      // Hypothermia test (< 35.0°C)
      final coldResult = AiHealthService.analyzeBiometrics(
        heartRate: 52,
        bloodOxygen: 98,
        temperature: 34.6,
        respiratoryRate: 12,
        systolicBp: 110,
        diastolicBp: 70,
        source: TelemetrySource.live,
      );
      expect(coldResult.overallStatus, HealthStatus.critical);
      final bodyCold = coldResult.updatedOrgans.firstWhere((o) => o.id == 'whole_body');
      expect(bodyCold.status, HealthStatus.critical);
      expect(bodyCold.aiAssessment, contains('Thermoregulation failure alert'));
    });
  });
}
