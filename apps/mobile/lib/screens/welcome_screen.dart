import 'package:flutter/material.dart';

import '../l10n/gen/app_localizations.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../widgets/common.dart';
import 'auth_screens.dart';
import 'help_screens.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final state = AppScope.of(context);
    void push(Widget w) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => w));
    return Scaffold(
      appBar: AppBar(title: Text(t.appTitle), actions: [LanguageMenu(onSelected: state.setLocale)]),
      body: SafeArea(
        child: ListView(
          children: [
            const TestBanner(),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Semantics(header: true, child: Text(t.tagline, style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: HLColors.text, fontWeight: FontWeight.w700))),
                  const SizedBox(height: 12),
                  Text(t.intro, style: Theme.of(context).textTheme.bodyLarge),
                  const SizedBox(height: 24),
                  FilledButton(onPressed: () => push(const RegisterScreen()), child: Text(t.createAccount)),
                  const SizedBox(height: 12),
                  OutlinedButton(onPressed: () => push(const LoginScreen()), child: Text(t.signIn)),
                  const SizedBox(height: 24),
                  const HelpLinks(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
