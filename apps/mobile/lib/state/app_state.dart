import 'package:flutter/widgets.dart';

import '../api/api_client.dart';
import '../api/models.dart';

/// App-wide state: the signed-in user and the chosen language.
class AppState extends ChangeNotifier {
  AppState(this.api, {Locale? initialLocale}) : _locale = initialLocale;

  final ApiClient api;
  User? _user;
  Locale? _locale;
  bool _restoring = true;

  User? get user => _user;
  Locale? get locale => _locale;
  bool get restoring => _restoring;
  bool get signedIn => _user != null;

  /// On start-up, resume a saved session if the token is still valid.
  Future<void> restore() async {
    final token = await api.tokens.read();
    if (token != null) {
      final r = await api.me();
      if (r.ok) {
        _user = r.data;
        _locale ??= Locale(r.data!.locale);
      } else if (r.status == 401) {
        await api.tokens.clear();
      }
    }
    _restoring = false;
    notifyListeners();
  }

  void setUser(User? u) {
    _user = u;
    notifyListeners();
  }

  void setLocale(Locale l) {
    _locale = l;
    notifyListeners();
  }

  Future<void> signOut() async {
    await api.logout();
    _user = null;
    notifyListeners();
  }
}

/// Makes AppState available to every screen.
class AppScope extends InheritedNotifier<AppState> {
  const AppScope({super.key, required AppState state, required super.child}) : super(notifier: state);

  static AppState of(BuildContext context) => context.dependOnInheritedWidgetOfExactType<AppScope>()!.notifier!;
}
