import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:humanlift/api/api_client.dart';
import 'package:humanlift/api/token_store.dart';

/// An in-memory stand-in for the HumanLift API with the same rules as the real one
/// for the endpoints the app uses. Synthetic data only.
class FakeApi {
  final users = <String, Map<String, dynamic>>{};
  final passwords = <String, String>{};
  final sessions = <String, String>{}; // token -> email
  final dataRequests = <Map<String, dynamic>>[];
  final contactMessages = <Map<String, dynamic>>[];
  final requestsSeen = <http.Request>[];
  bool offline = false;
  int _n = 0;

  http.Response _json(int status, Object body) => http.Response(jsonEncode(body), status, headers: {'content-type': 'application/json'});

  Map<String, dynamic>? _auth(http.Request r) {
    final h = r.headers['Authorization'];
    if (h == null || !h.startsWith('Bearer ')) return null;
    final email = sessions[h.substring(7)];
    return email == null ? null : users[email];
  }

  late final client = MockClient((r) async {
    requestsSeen.add(r);
    if (offline) throw http.ClientException('offline');
    final path = r.url.path.replaceFirst('/v1', '');
    final body = r.body.isEmpty ? <String, dynamic>{} : jsonDecode(r.body) as Map<String, dynamic>;
    String newSession(String email) {
      final t = 'token-${_n++}';
      sessions[t] = email;
      return t;
    }

    switch ('${r.method} $path') {
      case 'POST /auth/register':
        if ((body['password'] as String).length < 12) {
          return _json(400, {'error': 'validation_failed', 'fields': [{'field': 'password', 'code': 'too_small', 'message': 'password_too_short'}]});
        }
        final email = (body['email'] as String).toLowerCase();
        if (users.containsKey(email)) return _json(400, {'error': 'registration_failed'});
        users[email] = {'id': 'u${_n++}', 'email': email, 'displayName': body['displayName'], 'locale': body['locale'], 'emailVerified': false, 'roles': body['roles']};
        passwords[email] = body['password'] as String;
        return _json(201, {'user': users[email], 'sessionToken': newSession(email)});
      case 'POST /auth/login':
        final email = (body['email'] as String).toLowerCase();
        if (passwords[email] != body['password']) return _json(401, {'error': 'invalid_credentials'});
        return _json(200, {'user': users[email], 'sessionToken': newSession(email)});
      case 'POST /public/contact':
        contactMessages.add(body);
        return _json(201, {'status': 'received'});
    }
    final me = _auth(r);
    if (me == null) return _json(401, {'error': 'not_signed_in'});
    switch ('${r.method} $path') {
      case 'GET /auth/me':
        return _json(200, {'user': me});
      case 'POST /auth/logout':
        sessions.removeWhere((k, v) => v == me['email']);
        return http.Response('', 204);
      case 'PATCH /me':
        me.addAll(body);
        return _json(200, {'user': me});
      case 'POST /me/roles':
        (me['roles'] as List).add(body['role']);
        return _json(201, {'user': me});
      case 'GET /me/data-requests':
        return _json(200, {'items': dataRequests});
      case 'POST /me/data-requests':
        if (dataRequests.any((d) => d['type'] == body['type'])) return _json(400, {'error': 'request_already_open'});
        final item = {'id': 'd${_n++}', 'type': body['type'], 'status': 'RECEIVED', 'createdAt': DateTime.utc(2026, 11, 5, 12).toIso8601String()};
        dataRequests.add(item);
        return _json(201, {'item': item});
    }
    return _json(404, {'error': 'not_found'});
  });

  ApiClient apiClient(MemoryTokenStore store) => ApiClient(baseUrl: 'http://api.test/v1', tokens: store, httpClient: client);
}
