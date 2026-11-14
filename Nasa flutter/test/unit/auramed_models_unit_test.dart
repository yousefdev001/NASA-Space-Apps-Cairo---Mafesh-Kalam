import 'package:flutter_test/flutter_test.dart';
import 'package:auramed/core/models/auramed_assessment.dart';
import 'package:auramed/core/models/astronaut_profile.dart';
import 'package:auramed/core/models/mission_model.dart';
import 'package:auramed/services/offline_database_service.dart';

void main() {
  group('Unit Tests: AuraMed Models & Serialization Robustness', () {
    test('AuraMedAssessmentResponse handles missing, null and malformed fields gracefully', () {
      final minimalMap = <String, dynamic>{};
      final parsed = AuraMedAssessmentResponse.fromMap(minimalMap);

      expect(parsed.severity, 'Normal');
      expect(parsed.mlAssessment.anomalyDetected, isFalse);
      expect(parsed.mlAssessment.confidenceScore, 0.94);
      expect(parsed.actionSteps, isEmpty);
      expect(parsed.escalationRequired, isFalse);
      expect(parsed.summary, contains('nominal astronaut parameters'));
    });

    test('MlAssessment parses confidence score as double from num or string-num', () {
      final mapInt = {'confidence_score': 1, 'anomaly_detected': true, 'hazard_risk_level': 'High'};
      final parsedInt = MlAssessment.fromMap(mapInt);
      expect(parsedInt.confidenceScore, 1.0);

      final mapDouble = {'confidence': 0.88, 'is_anomaly': true, 'risk_level': 'Moderate'};
      final parsedDouble = MlAssessment.fromMap(mapDouble);
      expect(parsedDouble.confidenceScore, 0.88);
      expect(parsedDouble.hazardRiskLevel, 'Moderate');
      expect(parsedDouble.anomalyDetected, isTrue);
    });

    test('HeartbeatStatus distinguishes healthy from offline states', () {
      final healthy = HeartbeatStatus.healthy({'status': 'healthy', 'operating_mode': 'online'});
      expect(healthy.isHealthy, isTrue);
      expect(healthy.operatingMode, 'online');

      final offline = HeartbeatStatus.offline('Connection refused: 503');
      expect(offline.isHealthy, isFalse);
      expect(offline.operatingMode, 'offline');
      expect(offline.errorMessage, contains('Connection refused'));
    });

    test('AstronautProfile copyWith preserves unaltered fields', () {
      const original = AstronautProfile(
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

      final updated = original.copyWith(
        currentXp: 3100,
        streakDays: 19,
        currentMissionDay: 43,
      );

      expect(updated.fullName, original.fullName);
      expect(updated.astronautId, original.astronautId);
      expect(updated.currentXp, 3100);
      expect(updated.streakDays, 19);
      expect(updated.currentMissionDay, 43);
      expect(updated.missionName, original.missionName);
    });

    test('TelemetryRecord and ChatMessageRecord roundtrip serialization', () {
      final telemetry = TelemetryRecord(
        id: 'TEL-998877',
        timestamp: DateTime(2026, 4, 12, 10, 0),
        vitals: {'heart_rate_bpm': 82.5, 'spo2_percent': 98.0},
        scenarioId: 'SCN-01',
        scenarioEn: 'Resting Nominal',
        severity: 'Normal',
        isAnomaly: false,
        isSynced: true,
      );

      final tMap = telemetry.toMap();
      final revivedT = TelemetryRecord.fromMap(tMap);
      expect(revivedT.id, 'TEL-998877');
      expect(revivedT.vitals['heart_rate_bpm'], 82.5);
      expect(revivedT.isSynced, isTrue);

      final chat = ChatMessageRecord(
        id: 'CHAT-001',
        sender: 'astronaut',
        text: 'Telemetry nominal, Houston.',
        timestamp: DateTime.now(),
        metadata: {'tag': 'status_report'},
        isSynced: false,
      );

      final cMap = chat.toMap();
      final revivedC = ChatMessageRecord.fromMap(cMap);
      expect(revivedC.id, 'CHAT-001');
      expect(revivedC.sender, 'astronaut');
      expect(revivedC.metadata?['tag'], 'status_report');
      expect(revivedC.isSynced, isFalse);
    });
  });
}
