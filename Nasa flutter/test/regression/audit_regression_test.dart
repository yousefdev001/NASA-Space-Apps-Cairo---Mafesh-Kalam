import 'package:flutter_test/flutter_test.dart';
import 'package:auramed/features/gamification/alien_memory/alien_memory_state.dart';
import 'package:auramed/features/gamification/alien_memory/alien_memory_controller.dart';
import 'package:auramed/services/offline_database_service.dart';
import 'package:auramed/state/auth_provider.dart';

void main() {
  group('Regression Test Suite: Verified Defect Fixes & Non-Regression', () {
    test('Regression 01: Auth Validation trimming and case-insensitivity defect fix', () async {
      final db = OfflineDatabaseService();
      final auth = AuthProvider();

      // Regression: Previously "AST@NASA.COM" or trailing spaces failed authentication
      expect(db.validateUser('AST@NASA.COM', 'ast@2026'), isTrue);
      expect(db.validateUser(' ast@nasa.com ', ' ast@2026 '), isTrue);

      final loginSuccess = await auth.login(' AST@NASA.COM ', 'ast@2026');
      expect(loginSuccess, isTrue);
      expect(auth.isAuthenticated, isTrue);
    });

    test('Regression 02: Alien Memory difficulty card count defect fix', () {
      // Regression: Easy must have 6 pairs (12 cards), Medium 8 pairs (16 cards), Hard 10 pairs (20 cards)
      expect(MemoryDifficulty.easy.pairsCount, 6);
      expect(MemoryDifficulty.easy.totalCards, 12);

      expect(MemoryDifficulty.medium.pairsCount, 8);
      expect(MemoryDifficulty.medium.totalCards, 16);

      expect(MemoryDifficulty.hard.pairsCount, 10);
      expect(MemoryDifficulty.hard.totalCards, 20);

      final controller = AlienMemoryController();
      controller.setDifficulty(MemoryDifficulty.easy);
      controller.startGame();
      expect(controller.state.cards.length, 12);

      controller.setDifficulty(MemoryDifficulty.medium);
      controller.startGame();
      expect(controller.state.cards.length, 16);

      controller.setDifficulty(MemoryDifficulty.hard);
      controller.startGame();
      expect(controller.state.cards.length, 20);
    });

    test('Regression 03: Alien Memory match logic calculates score and completed pairs', () {
      final controller = AlienMemoryController();
      controller.setDifficulty(MemoryDifficulty.easy);
      controller.startGame();

      expect(controller.state.status, MemoryGameStatus.playing);
      expect(controller.state.cards.length, 12);

      // Find the pair for the first card
      final card0 = controller.state.cards[0];
      final cardMatchIndex = controller.state.cards.indexWhere(
        (c) => c.id != card0.id && c.pairKey == card0.pairKey,
      );
      expect(cardMatchIndex, greaterThan(0));

      controller.onCardTapped(0);
      expect(controller.state.selectedIndices, contains(0));

      controller.onCardTapped(cardMatchIndex);
      // Matching cards are immediately marked as matched
      expect(controller.state.matchedPairs, 1);
      expect(controller.state.attempts, 1);
      expect(controller.state.cards[0].isMatched, isTrue);
      expect(controller.state.cards[cardMatchIndex].isMatched, isTrue);
    });
  });
}
