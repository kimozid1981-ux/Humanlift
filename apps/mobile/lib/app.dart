import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'l10n/gen/app_localizations.dart';
import 'screens/home_screen.dart';
import 'screens/welcome_screen.dart';
import 'state/app_state.dart';
import 'theme.dart';

class HumanLiftApp extends StatefulWidget {
  const HumanLiftApp({super.key, required this.state});
  final AppState state;

  @override
  State<HumanLiftApp> createState() => _HumanLiftAppState();
}

class _HumanLiftAppState extends State<HumanLiftApp> with WidgetsBindingObserver {
  // True while the app is not in the foreground. The screen is then covered so
  // the app-switcher preview never shows personal details.
  bool _covered = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    widget.state.restore();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState lifecycle) {
    final covered = lifecycle != AppLifecycleState.resumed;
    if (covered != _covered) setState(() => _covered = covered);
  }

  @override
  Widget build(BuildContext context) {
    return AppScope(
      state: widget.state,
      child: ListenableBuilder(
        listenable: widget.state,
        builder: (context, _) => MaterialApp(
          title: 'HumanLift',
          theme: buildTheme(),
          debugShowCheckedModeBanner: false,
          locale: widget.state.locale,
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          builder: (context, child) => Stack(
            children: [
              ?child,
              if (_covered) const PrivacyCover(),
            ],
          ),
          home: widget.state.restoring
              ? const Scaffold(body: Center(child: CircularProgressIndicator()))
              : widget.state.signedIn
                  ? const HomeScreen()
                  : const WelcomeScreen(),
        ),
      ),
    );
  }
}

/// Plain screen shown over the app while it is in the background.
class PrivacyCover extends StatelessWidget {
  const PrivacyCover({super.key});

  @override
  Widget build(BuildContext context) {
    return const Positioned.fill(
      child: ColoredBox(
        key: Key('privacy-cover'),
        color: Color(0xFFFBF8F3),
        child: Center(
          child: Text('HumanLift', textDirection: TextDirection.ltr, style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: Color(0xFF1D5C63))),
        ),
      ),
    );
  }
}
