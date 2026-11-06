import 'package:flutter/material.dart';

import 'api/api_client.dart';
import 'api/token_store.dart';
import 'app.dart';
import 'config.dart';
import 'state/app_state.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final api = ApiClient(baseUrl: AppConfig.apiBaseUrl, tokens: SecureTokenStore());
  runApp(HumanLiftApp(state: AppState(api)));
}
