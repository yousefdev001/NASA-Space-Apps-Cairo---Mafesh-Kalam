import 'package:flutter_test/flutter_test.dart';
import 'package:auramed/services/offline_database_service.dart';

void main() {
  group('Phase 2 Database Audit: OfflineDatabaseService Integrity & Edge Cases', () {
    late OfflineDatabaseService db;

    setUp(() {
      db = OfflineDatabaseService();
    });

    test('Pre-populates default crew accounts with case-insensitive validation', () {
      expect(db.validateUser('ast@nasa.com', 'ast@2026'), isTrue);
      expect(db.validateUser('AST@NASA.COM', 'ast@2026'), isTrue);
      expect(db.validateUser('  ast@nasa.com  ', 'ast@2026'), isTrue);
      expect(db.validateUser('ast@nasa.com', 'wrong_passcode'), isFalse);

      final user = db.getUser('ast@nasa.com');
      expect(user, isNotNull);
      expect(user!['email'], 'ast@nasa.com');
      expect(user['fullName'], 'Commander Neil Astro');
    });

    test('Handles concurrent user registrations without race conditions', () async {
      final futures = <Future<void>>[];
      for (int i = 0; i < 20; i++) {
        futures.add(
          db.registerUser(
            email: 'crew_$i@artemis.nasa.gov',
            password: 'passcode_$i',
            fullName: 'Crew Member $i',
            astronautId: 'ASTRO-$i',
          ),
        );
      }
      await Future.wait(futures);

      for (int i = 0; i < 20; i++) {
        expect(db.validateUser('crew_$i@artemis.nasa.gov', 'passcode_$i'), isTrue);
        final user = db.getUser('crew_$i@artemis.nasa.gov');
        expect(user?['astronautId'], 'ASTRO-$i');
      }
    });

    test('Telemetry queue enforces rolling buffer limit (maximum 200 items)', () async {
      // Record 250 telemetry items to test queue capping
      for (int i = 0; i < 250; i++) {
        await db.recordTelemetry(
          vitals: {'heart_rate_bpm': 70.0 + (i % 20), 'spo2_percent': 98.0},
          scenarioId: 'TEST-SCN-$i',
          scenarioEn: 'Scenario $i',
          severity: 'Normal',
          isAnomaly: false,
        );
      }

      // Must never exceed 200 items in memory to prevent memory leaks on embedded devices
      expect(db.telemetryQueue.length, lessThanOrEqualTo(200));
      // Oldest items (0-49) must have rolled off
      expect(db.telemetryQueue.any((t) => t.scenarioId == 'TEST-SCN-0'), isFalse);
      expect(db.telemetryQueue.any((t) => t.scenarioId == 'TEST-SCN-249'), isTrue);
    });

    test('Chat messages enforce rolling buffer limit (maximum 100 items)', () async {
      for (int i = 0; i < 120; i++) {
        await db.addRagMessage(
          ChatMessageRecord(
            id: 'rag_$i',
            sender: i.isEven ? 'astronaut' : 'rag',
            text: 'Telemetry query message $i',
            timestamp: DateTime.now(),
          ),
        );
      }

      expect(db.ragChatMessages.length, lessThanOrEqualTo(100));
      expect(db.ragChatMessages.any((m) => m.id == 'rag_0'), isFalse);
      expect(db.ragChatMessages.any((m) => m.id == 'rag_119'), isTrue);
    });

    test('Flush pending data synchronizes un-synced queue items', () async {
      db.setOnlineStatus(false);

      // Record offline telemetry
      final rec = await db.recordTelemetry(
        vitals: {'heart_rate_bpm': 135.0, 'spo2_percent': 88.0},
        scenarioId: 'OFFLINE-ANOMALY',
        scenarioEn: 'Cabin Pressure Anomaly',
        severity: 'Critical',
        isAnomaly: true,
      );
      expect(rec.isSynced, isFalse);

      // Switch to online and flush
      db.setOnlineStatus(true);
      final flushedCount = await db.flushPendingData();
      expect(flushedCount, greaterThanOrEqualTo(1));

      final refreshedRec = db.telemetryQueue.firstWhere((t) => t.id == rec.id);
      expect(refreshedRec.isSynced, isTrue);
    });

    test('Database models handle boundary values (empty strings, extreme vitals, null metadata)', () {
      final boundaryRecord = TelemetryRecord(
        id: '',
        timestamp: DateTime.now(),
        vitals: {
          'heart_rate_bpm': 0.0,
          'spo2_percent': 100.0,
          'body_temperature_c': 45.0,
          'custom_field_null': null,
        },
        scenarioId: '',
        scenarioEn: '',
        severity: '',
        isAnomaly: false,
      );

      final map = boundaryRecord.toMap();
      expect(map['id'], '');
      expect(map['vitals']['heart_rate_bpm'], 0.0);

      final revived = TelemetryRecord.fromMap(map);
      expect(revived.id, '');
      expect(revived.severity, 'Normal'); // Default applied when empty
    });
  });
}
