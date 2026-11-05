class User {
  User({
    required this.id,
    required this.email,
    required this.displayName,
    required this.locale,
    required this.emailVerified,
    required this.roles,
  });

  final String id;
  final String email;
  final String displayName;
  final String locale;
  final bool emailVerified;
  final List<String> roles;

  factory User.fromJson(Map<String, dynamic> j) => User(
        id: j['id'] as String,
        email: j['email'] as String,
        displayName: j['displayName'] as String,
        locale: (j['locale'] as String?) ?? 'en',
        emailVerified: j['emailVerified'] == true,
        roles: ((j['roles'] as List?) ?? const []).cast<String>(),
      );
}

class DataRequest {
  DataRequest({required this.id, required this.type, required this.status, required this.createdAt});
  final String id;
  final String type;
  final String status;
  final DateTime createdAt;

  factory DataRequest.fromJson(Map<String, dynamic> j) => DataRequest(
        id: j['id'] as String,
        type: j['type'] as String,
        status: j['status'] as String,
        createdAt: DateTime.parse(j['createdAt'] as String),
      );
}

/// Outcome of an API call. Never throws for HTTP or network errors.
class ApiResult<T> {
  const ApiResult._(this.data, this.status, this.error, this.fields);
  const ApiResult.ok(T data, int status) : this._(data, status, null, const {});
  const ApiResult.fail(int status, String? error, Map<String, String> fields) : this._(null, status, error, fields);

  final T? data;
  final int status;

  /// Machine-readable error code from the API, e.g. 'invalid_credentials'. 'network' when offline.
  final String? error;

  /// Field validation errors: field name → code (e.g. 'password' → 'password_too_short').
  final Map<String, String> fields;

  bool get ok => error == null && status >= 200 && status < 300;
  bool get isNetworkError => status == 0;
  bool get isRateLimited => status == 429;
}
