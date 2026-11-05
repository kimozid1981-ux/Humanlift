import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:humanlift/api/token_store.dart';
import 'package:humanlift/app.dart';
import 'package:humanlift/state/app_state.dart';

import 'fake_api.dart';

Future<({FakeApi fake, MemoryTokenStore store, AppState state})> pumpApp(WidgetTester tester, {Locale locale = const Locale('en')}) async {
  // A tall phone-sized screen (logical 412 x 1200) so whole forms fit, as they would after scrolling on a device.
  tester.view.physicalSize = const Size(1236, 3600);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  final fake = FakeApi();
  final store = MemoryTokenStore();
  final state = AppState(fake.apiClient(store), initialLocale: locale);
  await tester.pumpWidget(HumanLiftApp(state: state));
  await tester.pumpAndSettle();
  return (fake: fake, store: store, state: state);
}

Future<void> register(WidgetTester tester, {String email = 'ana@example.test', String password = 'a long enough password'}) async {
  await tester.tap(find.text('Create account').first);
  await tester.pumpAndSettle();
  await tester.enterText(find.byKey(const Key('register-email')), email);
  await tester.enterText(find.byKey(const Key('register-password')), password);
  await tester.enterText(find.byKey(const Key('register-name')), 'Ana');
  await tester.tap(find.byKey(const Key('register-donor')));
  await tester.tap(find.byKey(const Key('register-terms')));
  await tester.pump();
  await tester.ensureVisible(find.byKey(const Key('register-submit')));
  await tester.tap(find.byKey(const Key('register-submit')));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('welcome screen shows the tagline and the test-environment banner', (tester) async {
    await pumpApp(tester);
    expect(find.text('Real people. Verified needs. Meaningful help.'), findsOneWidget);
    expect(find.textContaining('Test environment. No real money'), findsOneWidget);
  });

  testWidgets('French locale shows French text', (tester) async {
    await pumpApp(tester, locale: const Locale('fr'));
    expect(find.text('De vraies personnes. Des besoins vérifiés. Une aide qui compte.'), findsOneWidget);
    expect(find.text('Créer un compte'), findsOneWidget);
  });

  testWidgets('registration requires a role, accepted terms and a 12-character password', (tester) async {
    final app = await pumpApp(tester);
    await tester.tap(find.text('Create account').first);
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('register-email')), 'not-an-email');
    await tester.enterText(find.byKey(const Key('register-password')), 'short');
    await tester.ensureVisible(find.byKey(const Key('register-submit')));
    await tester.tap(find.byKey(const Key('register-submit')));
    await tester.pumpAndSettle();
    expect(find.text('Enter a valid email address.'), findsOneWidget);
    expect(find.text('Your password must be at least 12 characters.'), findsOneWidget);
    expect(find.text('Choose at least one option.'), findsOneWidget);
    expect(find.text('You need to accept to continue.'), findsOneWidget);
    expect(app.fake.requestsSeen, isEmpty, reason: 'nothing is sent while the form is invalid');
  });

  testWidgets('registers, stores the session token securely and identifies as the mobile client', (tester) async {
    final app = await pumpApp(tester);
    await register(tester);
    expect(find.text('Hello, Ana'), findsOneWidget);
    expect(find.byKey(const Key('role-DONOR')), findsOneWidget);
    expect(find.text('Please confirm your email address. We sent you a link.'), findsOneWidget);
    expect(app.store.token, isNotNull);
    final req = app.fake.requestsSeen.firstWhere((r) => r.url.path == '/v1/auth/register');
    expect(req.headers['X-HumanLift-Client'], 'mobile');
    expect(req.body, contains('"acceptTerms":true'));
  });

  testWidgets('edits the profile name and adds the applicant role', (tester) async {
    final app = await pumpApp(tester);
    await register(tester);
    await tester.enterText(find.byKey(const Key('profile-name')), 'Ana Maria');
    await tester.ensureVisible(find.byKey(const Key('profile-save')));
    await tester.tap(find.byKey(const Key('profile-save')));
    await tester.pumpAndSettle();
    expect(find.text('Saved.'), findsOneWidget);
    expect(app.fake.users['ana@example.test']!['displayName'], 'Ana Maria');
    await tester.ensureVisible(find.byKey(const Key('add-applicant')));
    await tester.tap(find.byKey(const Key('add-applicant')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('role-APPLICANT')), findsOneWidget);
  });

  testWidgets('privacy tab creates a data request and refuses a duplicate', (tester) async {
    await pumpApp(tester);
    await register(tester);
    await tester.tap(find.text('Privacy'));
    await tester.pumpAndSettle();
    expect(find.text('You have not made any requests.'), findsOneWidget);
    await tester.tap(find.byKey(const Key('req-access')));
    await tester.pumpAndSettle();
    expect(find.text('Your request has been received.'), findsOneWidget);
    expect(find.text('Copy of my data'), findsOneWidget);
    expect(find.text('Received'), findsOneWidget);
    await tester.tap(find.byKey(const Key('req-access')));
    await tester.pumpAndSettle();
    expect(find.text('You already have an open request of this type.'), findsOneWidget);
  });

  testWidgets('sign out clears the token; wrong password shows a generic error; correct password signs in', (tester) async {
    final app = await pumpApp(tester);
    await register(tester);
    await tester.tap(find.byKey(const Key('sign-out')));
    await tester.pumpAndSettle();
    expect(app.store.token, isNull);
    expect(find.text('Create account'), findsWidgets);

    await tester.tap(find.text('Sign in').first);
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('login-email')), 'ana@example.test');
    await tester.enterText(find.byKey(const Key('login-password')), 'wrong password here');
    await tester.tap(find.byKey(const Key('login-submit')));
    await tester.pumpAndSettle();
    expect(find.text('Email or password is incorrect.'), findsOneWidget);
    await tester.enterText(find.byKey(const Key('login-password')), 'a long enough password');
    await tester.tap(find.byKey(const Key('login-submit')));
    await tester.pumpAndSettle();
    expect(find.text('Hello, Ana'), findsOneWidget);
  });

  testWidgets('a saved session is restored on app start', (tester) async {
    final fake = FakeApi();
    final store = MemoryTokenStore();
    final api = fake.apiClient(store);
    await api.register(email: 'ben@example.test', password: 'a long enough password', displayName: 'Ben', roles: ['APPLICANT'], locale: 'en');
    await tester.pumpWidget(HumanLiftApp(state: AppState(api)));
    await tester.pumpAndSettle();
    expect(find.text('Hello, Ben'), findsOneWidget);
  });

  testWidgets('shows a clear message when the network is unavailable', (tester) async {
    final app = await pumpApp(tester);
    app.fake.offline = true;
    await tester.tap(find.text('Sign in').first);
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('login-email')), 'ana@example.test');
    await tester.enterText(find.byKey(const Key('login-password')), 'whatever password');
    await tester.tap(find.byKey(const Key('login-submit')));
    await tester.pumpAndSettle();
    expect(find.text('We could not reach HumanLift. Check your connection and try again.'), findsOneWidget);
  });

  testWidgets('contact form sends a message', (tester) async {
    final app = await pumpApp(tester);
    await tester.scrollUntilVisible(find.text('Contact us'), 100);
    await tester.tap(find.text('Contact us'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextFormField).at(0), 'Visitor');
    await tester.enterText(find.byType(TextFormField).at(1), 'visitor@example.test');
    await tester.enterText(find.byKey(const Key('contact-message')), 'How will donations work?');
    await tester.tap(find.byKey(const Key('contact-submit')));
    await tester.pumpAndSettle();
    expect(find.text('Thank you. Your message has been received.'), findsOneWidget);
    expect(app.fake.contactMessages.single['locale'], 'en');
  });

  testWidgets('meets Android and iOS tap-target and text-contrast guidelines on the welcome screen', (tester) async {
    final handle = tester.ensureSemantics();
    await pumpApp(tester);
    await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
    await expectLater(tester, meetsGuideline(iOSTapTargetGuideline));
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    handle.dispose();
  });

  testWidgets('layout still works with very large text (200%)', (tester) async {
    tester.platformDispatcher.textScaleFactorTestValue = 2.0;
    addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
    await pumpApp(tester);
    expect(tester.takeException(), isNull);
    expect(find.text('Create account'), findsOneWidget);
  });

  testWidgets('covers the screen when the app goes to the background (app-switcher privacy)', (tester) async {
    await pumpApp(tester);
    expect(find.byKey(const Key('privacy-cover')), findsNothing);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.inactive);
    await tester.pump();
    expect(find.byKey(const Key('privacy-cover')), findsOneWidget);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
    await tester.pump();
    expect(find.byKey(const Key('privacy-cover')), findsNothing);
  });
}
