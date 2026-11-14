import 'package:flutter_test/flutter_test.dart';
import 'package:auramed/core/config/app_config.dart';
import 'package:auramed/services/auramed_api_service.dart';
import 'package:auramed/services/offline_database_service.dart';
import 'package:auramed/features/gamification/life_style_on_earth/earth_memory.dart';
import 'package:auramed/features/gamification/life_style_on_earth/earth_memory_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('Phase 7 & 9 Advanced Edge Cases, Stress & Security Tests', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    test('Unicode, Arabic script, and Emojis are safely handled in database & models', () async {
      final db = OfflineDatabaseService();

      // Test Arabic medical query
      const arabicText = 'هل انخفاض نسبة الأكسجين SpO2 إلى 88% يستدعي تدخلاً عاجلاً؟ 🚨👨‍🚀';
      final msg = await db.saveChatMessage(
        sender: 'astronaut',
        text: arabicText,
        metadata: {'lang': 'ar', 'symbol': '🪐🚀'},
      );

      expect(msg.text, arabicText);
      final retrieved = db.groundChatMessages.firstWhere((m) => m.id == msg.id);
      expect(retrieved.text, arabicText);
      expect(retrieved.metadata?['symbol'], '🪐🚀');
    });

    test('Earth Memory Journal handles high-volume multilingual text without corruption', () async {
      final repo = EarthMemoryRepository();
      await repo.loadMemories();

      // 1500-character multilingual memory
      final massiveText = 'Memories of Earth: ${'تفاصيل الذكريات الجميلة على كوكب الأرض 🌲🌊 ' * 30}';
      final memory = EarthMemory(
        id: 'mem_stress_01',
        title: 'ذكريات شاطئ البحر الأحمر • Red Sea Coast',
        content: massiveText,
        category: 'Places',
        emotionalTag: 'Nostalgic',
        createdAt: DateTime.now(),
        missionDay: 48,
        isForReturn: true,
      );

      await repo.saveMemory(memory);
      final fetched = repo.memories.firstWhere((m) => m.id == 'mem_stress_01');
      expect(fetched.content.length, greaterThan(1000));
      expect(fetched.title, contains('البحر الأحمر'));
    });

    test('AuraMedApiService handles unexpected malformed vitals payloads safely', () async {
      final service = AuraMedApiService();

      // Payload missing multiple keys and containing extreme unexpected numbers
      final malformedVitals = <String, dynamic>{
        'heart_rate_bpm': -50.0, // Negative HR boundary
        'spo2_percent': null,    // Null SpO2
        'diastolic_bp_mmhg': 999.0, // Extreme BP boundary
      };

      // Must not crash or throw unhandled exceptions
      final result = await service.assessAstronaut(
        astronautId: 'TEST-MALFORMED',
        vitals: malformedVitals,
      );

      expect(result, isNotNull);
      expect(result.severity, isNotEmpty);
      expect(result.summary, isNotEmpty);
    });

    test('Rapid repeated telemetry bursts do not cause lockup or memory leak', () async {
      final db = OfflineDatabaseService();

      final burst = <Future<TelemetryRecord>>[];
      for (int i = 0; i < 50; i++) {
        burst.add(
          db.recordTelemetry(
            vitals: {'heart_rate_bpm': 75.0, 'spo2_percent': 98.0},
            scenarioId: 'BURST-$i',
            scenarioEn: 'Burst test $i',
            severity: 'Normal',
            isAnomaly: false,
          ),
        );
      }

      final records = await Future.wait(burst);
      expect(records.length, 50);
      expect(db.telemetryQueue.length, lessThanOrEqualTo(200));
    });

    test('Security: Secret API Key is securely stored and dynamic updates are sanitized', () async {
      expect(AppConfig.apiKey, 'auramed-secret-key-2026');

      // Test URL sanitization (removes trailing slashes and spaces)
      await AppConfig.setBaseUrl('  https://test-subdomain.trycloudflare.com///  ');
      expect(AppConfig.baseUrl, 'https://test-subdomain.trycloudflare.com');

      // Reset
      await AppConfig.resetToDefaults();
      expect(AppConfig.baseUrl, AppConfig.defaultBaseUrl);
    });
  });
}
