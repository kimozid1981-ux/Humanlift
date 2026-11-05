import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'models.dart';
import 'token_store.dart';

/// Talks to the HumanLift API (/v1). Uses a bearer token kept in secure storage;
/// the API returns that token only to clients that identify as the mobile app.
class ApiClient {
  ApiClient({required this.baseUrl, required this.tokens, http.Client? httpClient})
      : _http = httpClient ?? http.Client();

  final String baseUrl;
  final TokenStore tokens;
  final http.Client _http;
  static const _timeout = Duration(seconds: 20);

  Future<ApiResult<Map<String, dynamic>>> _send(String method, String path, [Map<String, dynamic>? body]) async {
    final token = await tokens.read();
    final headers = <String, String>{
      'Accept': 'application/json',
      'X-HumanLift-Client': 'mobile',
      if (body != null) 'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
    final req = http.Request(method, Uri.parse('$baseUrl$path'))..headers.addAll(headers);
    if (body != null) req.body = jsonEncode(body);
    try {
      final streamed = await _http.send(req).timeout(_timeout);
      final res = await http.Response.fromStream(streamed);
      final decoded = res.body.isEmpty ? <String, dynamic>{} : jsonDecode(res.body);
      final map = decoded is Map<String, dynamic> ? decoded : <String, dynamic>{};
      if (res.statusCode >= 200 && res.statusCode < 300) return ApiResult.ok(map, res.statusCode);
      final fields = <String, String>{};
      for (final f in (map['fields'] as List?) ?? const []) {
        final m = f as Map<String, dynamic>;
        final msg = m['message'] as String?;
        fields[m['field'] as String] = (msg != null && RegExp(r'^[a-z_]+$').hasMatch(msg)) ? msg : (m['code'] as String? ?? 'invalid');
      }
      return ApiResult.fail(res.statusCode, (map['error'] as String?) ?? 'http_${res.statusCode}', fields);
    } on TimeoutException {
      return const ApiResult.fail(0, 'network', {});
    } on Exception {
      return const ApiResult.fail(0, 'network', {});
    }
  }

  Future<ApiResult<User>> _userResult(ApiResult<Map<String, dynamic>> r) async {
    if (!r.ok) return ApiResult.fail(r.status, r.error, r.fields);
    final token = r.data!['sessionToken'] as String?;
    if (token != null) await tokens.write(token);
    return ApiResult.ok(User.fromJson(r.data!['user'] as Map<String, dynamic>), r.status);
  }

  Future<ApiResult<User>> register({
    required String email,
    required String password,
    required String displayName,
    required List<String> roles,
    required String locale,
  }) async =>
      _userResult(await _send('POST', '/auth/register', {
        'email': email,
        'password': password,
        'displayName': displayName,
        'roles': roles,
        'locale': locale,
        'acceptTerms': true,
      }));

  Future<ApiResult<User>> login(String email, String password) async =>
      _userResult(await _send('POST', '/auth/login', {'email': email, 'password': password}));

  Future<ApiResult<User>> me() async => _userResult(await _send('GET', '/auth/me'));

  Future<void> logout() async {
    await _send('POST', '/auth/logout');
    await tokens.clear();
  }

  Future<ApiResult<Map<String, dynamic>>> resendVerification() => _send('POST', '/auth/resend-verification');

  Future<ApiResult<Map<String, dynamic>>> requestPasswordReset(String email) =>
      _send('POST', '/auth/password-reset/request', {'email': email});

  Future<ApiResult<User>> updateProfile({String? displayName, String? locale}) async => _userResult(await _send('PATCH', '/me', {
        'displayName': ?displayName,
        'locale': ?locale,
      }));

  Future<ApiResult<User>> addRole(String role) async => _userResult(await _send('POST', '/me/roles', {'role': role}));

  Future<ApiResult<List<DataRequest>>> dataRequests() async {
    final r = await _send('GET', '/me/data-requests');
    if (!r.ok) return ApiResult.fail(r.status, r.error, r.fields);
    final items = ((r.data!['items'] as List?) ?? const []).map((e) => DataRequest.fromJson(e as Map<String, dynamic>)).toList();
    return ApiResult.ok(items, r.status);
  }

  Future<ApiResult<Map<String, dynamic>>> createDataRequest(String type) => _send('POST', '/me/data-requests', {'type': type});

  Future<ApiResult<Map<String, dynamic>>> contact({required String name, required String email, required String message, required String locale}) =>
      _send('POST', '/public/contact', {'name': name, 'email': email, 'topic': 'general', 'message': message, 'locale': locale});

  Future<ApiResult<Map<String, dynamic>>> reportAbuse({required String category, required String description}) =>
      _send('POST', '/public/abuse-reports', {'category': category, 'description': description});
}
