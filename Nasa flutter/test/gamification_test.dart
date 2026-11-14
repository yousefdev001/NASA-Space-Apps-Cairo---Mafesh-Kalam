import 'package:flutter_test/flutter_test.dart';
import 'package:auramed/features/gamification/space_reflex/space_reflex_controller.dart';
import 'package:auramed/features/gamification/space_reflex/space_reflex_state.dart';
import 'package:auramed/features/gamification/alien_memory/alien_memory_controller.dart';
import 'package:auramed/features/gamification/alien_memory/alien_memory_state.dart';
import 'package:auramed/features/gamification/life_style_on_earth/earth_memory.dart';

void main() {
  group('Space Reflex Mini Game Logic', () {
    test('Initializes with Recruit stage by default', () {
      final controller = SpaceReflexController();
      expect(controller.state.stage, ReflexStage.recruit);
      expect(controller.state.status, ReflexGameStatus.instructions);
      expect(controller.state.totalRounds, 5);
      controller.dispose();
    });

    test('Stage difficulty changes rounds and target sizes correctly', () {
      final controller = SpaceReflexController();
      controller.setStage(ReflexStage.deepSpaceCommander);
      expect(controller.state.stage, ReflexStage.deepSpaceCommander);
      expect(controller.state.totalRounds, 10);
      expect(controller.state.stage.targetSize, 46.0);
      controller.dispose();
    });
  });

  group('Alien Memory Mini Game Logic', () {
    test('Initializes with Medium difficulty and correct cards count', () {
      final controller = AlienMemoryController();
      expect(controller.state.difficulty, MemoryDifficulty.medium);
      expect(controller.state.difficulty.pairsCount, 8);
      expect(controller.state.difficulty.totalCards, 16);

      controller.startGame();
      expect(controller.state.status, MemoryGameStatus.playing);
      expect(controller.state.cards.length, 16);
      controller.dispose();
    });

    test('Easy difficulty generates 12 cards with 6 matching pairs', () {
      final controller = AlienMemoryController();
      controller.setDifficulty(MemoryDifficulty.easy);
      controller.startGame();
      expect(controller.state.cards.length, 12);
      expect(controller.state.difficulty.pairsCount, 6);
      controller.dispose();
    });
  });

  group('Life Style on Earth Journal Logic', () {
    test('EarthMemory model serializes and deserializes cleanly', () {
      final memory = EarthMemory(
        id: 'test_1',
        title: 'Morning run in Central Park',
        content: 'Miss breathing the crisp autumn air and running on real soil.',
        category: 'Hobbies',
        emotionalTag: 'Nostalgic',
        createdAt: DateTime(2026, 11, 13),
        missionDay: 42,
        isForReturn: true,
        isFavorite: true,
      );

      final map = memory.toMap();
      final restored = EarthMemory.fromMap(map);

      expect(restored.id, 'test_1');
      expect(restored.title, 'Morning run in Central Park');
      expect(restored.category, 'Hobbies');
      expect(restored.isForReturn, true);
      expect(restored.isFavorite, true);
    });
  });
}
