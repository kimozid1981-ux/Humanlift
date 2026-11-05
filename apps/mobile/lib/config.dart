/// Build-time configuration, set with --dart-define. No secrets belong here:
/// anything compiled into an app can be extracted from it.
class AppConfig {
  /// API base URL including the version prefix.
  /// Android emulator: http://10.0.2.2:4000/v1 · iOS simulator: http://localhost:4000/v1
  static const apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:4000/v1');

  /// 'production' hides the test banner. Everything else is a test environment.
  static const environment = String.fromEnvironment('APP_ENVIRONMENT', defaultValue: 'development');

  static bool get isProduction => environment == 'production';
}
