import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../api/models.dart';
import '../l10n/gen/app_localizations.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../widgets/common.dart';
import 'help_screens.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final state = AppScope.of(context);
    final pages = [const AccountTab(), const PrivacyTab(), const SingleChildScrollView(child: HelpLinks())];
    return Scaffold(
      appBar: AppBar(
        title: Text([t.tabAccount, t.tabPrivacy, t.tabHelp][_tab]),
        actions: [
          LanguageMenu(onSelected: (l) async {
            state.setLocale(l);
            final r = await state.api.updateProfile(locale: l.languageCode);
            if (r.ok) state.setUser(r.data);
          }),
          IconButton(key: const Key('sign-out'), tooltip: t.signOut, icon: const Icon(Icons.logout), onPressed: state.signOut),
        ],
      ),
      body: SafeArea(child: Column(children: [const TestBanner(), Expanded(child: pages[_tab])])),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: [
          NavigationDestination(icon: const Icon(Icons.person_outline), label: t.tabAccount),
          NavigationDestination(icon: const Icon(Icons.privacy_tip_outlined), label: t.tabPrivacy),
          NavigationDestination(icon: const Icon(Icons.help_outline), label: t.tabHelp),
        ],
      ),
    );
  }
}

class AccountTab extends StatefulWidget {
  const AccountTab({super.key});
  @override
  State<AccountTab> createState() => _AccountTabState();
}

class _AccountTabState extends State<AccountTab> {
  final _name = TextEditingController();
  String? _message;
  bool _messageIsError = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final u = AppScope.of(context).user;
    if (u != null && _name.text.isEmpty) _name.text = u.displayName;
  }

  void _show(String text, {bool error = false}) => setState(() {
        _message = text;
        _messageIsError = error;
      });

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final state = AppScope.of(context);
    final user = state.user!;
    String roleName(String r) => r == 'APPLICANT' ? t.roleNameApplicant : r == 'DONOR' ? t.roleNameDonor : r;

    Future<void> addRole(String role) async {
      final r = await state.api.addRole(role);
      if (r.ok) {
        state.setUser(r.data);
      } else {
        _show(errorMessage(t, r), error: true);
      }
    }

    return ListView(padding: const EdgeInsets.all(20), children: [
      Semantics(header: true, child: Text(t.hello(user.displayName), style: Theme.of(context).textTheme.headlineSmall)),
      if (_message != null) Notice(_message!, error: _messageIsError),
      const SizedBox(height: 8),
      if (user.emailVerified)
        Row(children: [const Icon(Icons.check_circle, color: HLColors.success, semanticLabel: ''), const SizedBox(width: 8), Text(t.emailConfirmed)])
      else ...[
        Text(t.emailNotConfirmed),
        TextButton(
          onPressed: () async {
            final r = await state.api.resendVerification();
            _show(r.ok ? t.linkSent : errorMessage(t, r), error: !r.ok);
          },
          child: Text(t.resendLink),
        ),
      ],
      const Divider(height: 32),
      Semantics(header: true, child: Text(t.yourRoles, style: Theme.of(context).textTheme.titleMedium)),
      Wrap(spacing: 8, children: user.roles.map((r) => Chip(key: Key('role-$r'), label: Text(roleName(r)))).toList()),
      if (!user.roles.contains('APPLICANT')) OutlinedButton(key: const Key('add-applicant'), onPressed: () => addRole('APPLICANT'), child: Text(t.addApplicant)),
      if (!user.roles.contains('DONOR')) OutlinedButton(key: const Key('add-donor'), onPressed: () => addRole('DONOR'), child: Text(t.addDonor)),
      const SizedBox(height: 8),
      if (user.roles.contains('APPLICANT')) Text(t.comingSoonApplicant),
      if (user.roles.contains('DONOR')) Text(t.comingSoonDonor),
      const Divider(height: 32),
      TextField(key: const Key('profile-name'), controller: _name, decoration: InputDecoration(labelText: t.displayName)),
      const SizedBox(height: 12),
      FilledButton(
        key: const Key('profile-save'),
        onPressed: () async {
          final name = _name.text.trim();
          if (name.isEmpty || name.length > 60) return _show(t.errName, error: true);
          final r = await state.api.updateProfile(displayName: name);
          if (r.ok) state.setUser(r.data);
          _show(r.ok ? t.saved : errorMessage(t, r), error: !r.ok);
        },
        child: Text(t.save),
      ),
    ]);
  }
}

class PrivacyTab extends StatefulWidget {
  const PrivacyTab({super.key});
  @override
  State<PrivacyTab> createState() => _PrivacyTabState();
}

class _PrivacyTabState extends State<PrivacyTab> {
  List<DataRequest>? _items;
  String? _message;
  bool _error = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_items == null) _load();
  }

  Future<void> _load() async {
    final r = await AppScope.of(context).api.dataRequests();
    if (mounted && r.ok) setState(() => _items = r.data);
  }

  Future<void> _create(String type) async {
    final t = AppLocalizations.of(context);
    final r = await AppScope.of(context).api.createDataRequest(type);
    if (!mounted) return;
    setState(() {
      _message = r.ok ? t.requestReceived : errorMessage(t, r);
      _error = !r.ok;
    });
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final locale = Localizations.localeOf(context).toLanguageTag();
    final types = {'ACCESS': t.typeAccess, 'CORRECTION': t.typeCorrection, 'DELETION': t.typeDeletion};
    final statuses = {'RECEIVED': t.statusReceived, 'IN_PROGRESS': t.statusInProgress, 'COMPLETED': t.statusCompleted, 'REJECTED': t.statusRejected};
    return ListView(padding: const EdgeInsets.all(20), children: [
      Text(t.privacyIntro),
      if (_message != null) Notice(_message!, error: _error),
      const SizedBox(height: 12),
      OutlinedButton(key: const Key('req-access'), onPressed: () => _create('ACCESS'), child: Text(t.requestAccess)),
      const SizedBox(height: 8),
      OutlinedButton(onPressed: () => _create('CORRECTION'), child: Text(t.requestCorrection)),
      const SizedBox(height: 16),
      Text(t.deletionNote),
      const SizedBox(height: 8),
      OutlinedButton(onPressed: () => _create('DELETION'), child: Text(t.requestDeletion)),
      const Divider(height: 32),
      Semantics(header: true, child: Text(t.yourRequests, style: Theme.of(context).textTheme.titleMedium)),
      if (_items == null)
        const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator()))
      else if (_items!.isEmpty)
        Text(t.noRequests)
      else
        ..._items!.map((d) => ListTile(
              title: Text(types[d.type] ?? d.type),
              subtitle: Text(DateFormat.yMMMd(locale).add_Hm().format(d.createdAt.toLocal())),
              trailing: Chip(label: Text(statuses[d.status] ?? d.status)),
            )),
    ]);
  }
}
