import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:auramed/features/gamification/life_style_on_earth/earth_memory.dart';
import 'package:auramed/features/gamification/life_style_on_earth/earth_memory_repository.dart';

void main() {
  group('Unit Tests: EarthMemory & EarthMemoryRepository', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    test('EarthMemory serialization and deserialization preserves all attributes', () {
      final memory = EarthMemory(
        id: 'mem_test_101',
        title: 'Rain on the Window in Seattle',
        content: 'Watching the cold rain fall while drinking earl grey tea.',
        category: 'Nature',
        emotionalTag: 'Serene',
        createdAt: DateTime(2026, 5, 20, 14, 30),
        missionDay: 45,
        isForReturn: true,
        isFavorite: true,
      );

      final map = memory.toMap();
      final revived = EarthMemory.fromMap(map);

      expect(revived.id, memory.id);
      expect(revived.title, memory.title);
      expect(revived.content, memory.content);
      expect(revived.category, memory.category);
      expect(revived.emotionalTag, memory.emotionalTag);
      expect(revived.missionDay, memory.missionDay);
      expect(revived.isForReturn, isTrue);
      expect(revived.isFavorite, isTrue);
    });

    test('EarthMemoryRepository loads clean initial state and performs CRUD', () async {
      final repo = EarthMemoryRepository();
      await repo.loadMemories();

      expect(repo.isLoaded, isTrue);
      expect(repo.count, 0);

      // 1. Create / Insert new memory
      final newMemory = EarthMemory(
        id: 'mem_new_custom',
        title: 'Baking Fresh Sourdough Bread',
        content: 'The aroma of warm bread filling the whole kitchen on Saturday morning.',
        category: 'Food & Coffee',
        emotionalTag: 'Comfort',
        createdAt: DateTime.now(),
        missionDay: 46,
        isForReturn: true,
        isFavorite: false,
      );

      await repo.saveMemory(newMemory);
      expect(repo.count, 1);
      expect(repo.latestMemory?.id, 'mem_new_custom');

      // 2. Toggle Favorite
      await repo.toggleFavorite('mem_new_custom');
      final updated = repo.memories.firstWhere((m) => m.id == 'mem_new_custom');
      expect(updated.isFavorite, isTrue);

      // 3. Toggle Return Bucket
      await repo.toggleReturnBucket('mem_new_custom');
      final updatedBucket = repo.memories.firstWhere((m) => m.id == 'mem_new_custom');
      expect(updatedBucket.isForReturn, isFalse);

      // 4. Delete Memory
      await repo.deleteMemory('mem_new_custom');
      expect(repo.memories.any((m) => m.id == 'mem_new_custom'), isFalse);
    });
  });
}
