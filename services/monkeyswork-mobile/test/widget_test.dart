import 'package:flutter_test/flutter_test.dart';
import 'package:monkeyswork_mobile/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const MonkeysWorkApp());
    expect(find.text('MonkeysWork'), findsOneWidget);
  });
}
