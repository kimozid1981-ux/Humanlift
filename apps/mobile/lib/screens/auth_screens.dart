import 'package:flutter/material.dart';

import '../l10n/gen/app_localizations.dart';
import '../state/app_state.dart';
import '../widgets/common.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  String? _error;
  String? _info;
  bool _busy = false;

  Future<void> _submit() async {
    final t = AppLocalizations.of(context);
    if (!_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    final state = AppScope.of(context);
    final r = await state.api.login(_email.text.trim(), _password.text);
    if (!mounted) return;
    setState(() => _busy = false);
    if (r.ok) {
      state.setUser(r.data);
      Navigator.of(context).popUntil((route) => route.isFirst);
    } else {
      setState(() => _error = errorMessage(t, r));
    }
  }

  Future<void> _forgot() async {
    final t = AppLocalizations.of(context);
    if (validateEmail(t, _email.text) != null) {
      _form.currentState!.validate();
      return;
    }
    final r = await AppScope.of(context).api.requestPasswordReset(_email.text.trim());
    if (!mounted) return;
    setState(() => r.ok ? _info = t.resetSent : _error = errorMessage(t, r));
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(t.signIn)),
      body: SafeArea(
        child: Form(
          key: _form,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              if (_error != null) Notice(_error!, error: true),
              if (_info != null) Notice(_info!),
              TextFormField(
                key: const Key('login-email'),
                controller: _email,
                decoration: InputDecoration(labelText: t.email),
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                validator: (v) => validateEmail(t, v),
              ),
              const SizedBox(height: 16),
              TextFormField(
                key: const Key('login-password'),
                controller: _password,
                decoration: InputDecoration(labelText: t.password),
                obscureText: true,
                autofillHints: const [AutofillHints.password],
                validator: (v) => (v ?? '').isEmpty ? t.errCredentials : null,
              ),
              const SizedBox(height: 24),
              FilledButton(key: const Key('login-submit'), onPressed: _busy ? null : _submit, child: Text(t.signIn)),
              TextButton(onPressed: _forgot, child: Text(t.forgotPassword)),
            ],
          ),
        ),
      ),
    );
  }
}

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _name = TextEditingController();
  bool _applicant = false;
  bool _donor = false;
  bool _terms = false;
  bool _submitted = false;
  bool _busy = false;
  String? _error;
  Map<String, String> _fieldErrors = {};

  Future<void> _submit() async {
    final t = AppLocalizations.of(context);
    setState(() => _submitted = true);
    final valid = _form.currentState!.validate();
    if (!valid || !(_applicant || _donor) || !_terms) return;
    setState(() {
      _busy = true;
      _error = null;
      _fieldErrors = {};
    });
    final state = AppScope.of(context);
    final r = await state.api.register(
      email: _email.text.trim(),
      password: _password.text,
      displayName: _name.text.trim(),
      roles: [if (_applicant) 'APPLICANT', if (_donor) 'DONOR'],
      locale: Localizations.localeOf(context).languageCode,
    );
    if (!mounted) return;
    setState(() => _busy = false);
    if (r.ok) {
      state.setUser(r.data);
      Navigator.of(context).popUntil((route) => route.isFirst);
    } else if (r.fields.isNotEmpty) {
      setState(() => _fieldErrors = r.fields);
      _form.currentState!.validate();
    } else {
      setState(() => _error = errorMessage(t, r));
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final roleError = _submitted && !(_applicant || _donor);
    final termsError = _submitted && !_terms;
    return Scaffold(
      appBar: AppBar(title: Text(t.createAccount)),
      body: SafeArea(
        child: Form(
          key: _form,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              if (_error != null) Notice(_error!, error: true),
              TextFormField(
                key: const Key('register-email'),
                controller: _email,
                decoration: InputDecoration(labelText: t.email),
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                validator: (v) => validateEmail(t, v) ?? (_fieldErrors.containsKey('email') ? t.errEmail : null),
              ),
              const SizedBox(height: 16),
              TextFormField(
                key: const Key('register-password'),
                controller: _password,
                decoration: InputDecoration(labelText: t.password, helperText: t.passwordHint),
                obscureText: true,
                autofillHints: const [AutofillHints.newPassword],
                validator: (v) => (v ?? '').length < 12 || _fieldErrors.containsKey('password') ? t.errPasswordShort : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                key: const Key('register-name'),
                controller: _name,
                decoration: InputDecoration(labelText: t.displayName),
                validator: (v) {
                  final s = (v ?? '').trim();
                  return s.isEmpty || s.length > 60 ? t.errName : null;
                },
              ),
              const SizedBox(height: 16),
              Semantics(header: true, child: Text(t.rolesLegend, style: Theme.of(context).textTheme.titleMedium)),
              if (roleError) Notice(t.errRoles, error: true),
              CheckboxListTile(
                key: const Key('register-applicant'),
                value: _applicant,
                onChanged: (v) => setState(() => _applicant = v ?? false),
                title: Text(t.roleApplicant),
                controlAffinity: ListTileControlAffinity.leading,
              ),
              CheckboxListTile(
                key: const Key('register-donor'),
                value: _donor,
                onChanged: (v) => setState(() => _donor = v ?? false),
                title: Text(t.roleDonor),
                controlAffinity: ListTileControlAffinity.leading,
              ),
              if (termsError) Notice(t.errTerms, error: true),
              CheckboxListTile(
                key: const Key('register-terms'),
                value: _terms,
                onChanged: (v) => setState(() => _terms = v ?? false),
                title: Text(t.acceptTerms),
                controlAffinity: ListTileControlAffinity.leading,
              ),
              const SizedBox(height: 16),
              FilledButton(key: const Key('register-submit'), onPressed: _busy ? null : _submit, child: Text(t.createAccount)),
            ],
          ),
        ),
      ),
    );
  }
}
