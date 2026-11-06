import 'package:flutter/material.dart';

import '../l10n/gen/app_localizations.dart';
import '../state/app_state.dart';
import '../widgets/common.dart';

class HelpLinks extends StatelessWidget {
  const HelpLinks({super.key});
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    void push(Widget w) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => w));
    return Column(
      children: [
        ListTile(leading: const Icon(Icons.route), title: Text(t.howItWorks), onTap: () => push(InfoScreen(title: t.howItWorks, body: t.howItWorksBody))),
        ListTile(leading: const Icon(Icons.verified_user_outlined), title: Text(t.trust), onTap: () => push(InfoScreen(title: t.trust, body: t.trustBody))),
        ListTile(leading: const Icon(Icons.mail_outline), title: Text(t.contact), onTap: () => push(const ContactScreen())),
        ListTile(leading: const Icon(Icons.flag_outlined), title: Text(t.reportAbuse), onTap: () => push(const ReportAbuseScreen())),
      ],
    );
  }
}

class InfoScreen extends StatelessWidget {
  const InfoScreen({super.key, required this.title, required this.body});
  final String title;
  final String body;
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(title)),
        body: SafeArea(child: ListView(padding: const EdgeInsets.all(20), children: [Text(body, style: Theme.of(context).textTheme.bodyLarge)])),
      );
}

class ContactScreen extends StatefulWidget {
  const ContactScreen({super.key});
  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _message = TextEditingController();
  String? _error;
  bool _done = false;
  bool _busy = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final user = AppScope.of(context).user;
    if (user != null && _email.text.isEmpty) {
      _email.text = user.email;
      _name.text = user.displayName;
    }
  }

  Future<void> _submit() async {
    final t = AppLocalizations.of(context);
    if (!_form.currentState!.validate()) return;
    setState(() => _busy = true);
    final r = await AppScope.of(context).api.contact(
          name: _name.text.trim(),
          email: _email.text.trim(),
          message: _message.text.trim(),
          locale: Localizations.localeOf(context).languageCode,
        );
    if (!mounted) return;
    setState(() {
      _busy = false;
      _done = r.ok;
      _error = r.ok ? null : errorMessage(t, r);
    });
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(t.contact)),
      body: SafeArea(
        child: _done
            ? Padding(padding: const EdgeInsets.all(20), child: Notice(t.messageSent))
            : Form(
                key: _form,
                child: ListView(padding: const EdgeInsets.all(20), children: [
                  Text(t.emergency),
                  const SizedBox(height: 12),
                  if (_error != null) Notice(_error!, error: true),
                  TextFormField(controller: _name, decoration: InputDecoration(labelText: t.yourName), validator: (v) => (v ?? '').trim().isEmpty ? t.errName : null),
                  const SizedBox(height: 16),
                  TextFormField(controller: _email, decoration: InputDecoration(labelText: t.email), keyboardType: TextInputType.emailAddress, validator: (v) => validateEmail(t, v)),
                  const SizedBox(height: 16),
                  TextFormField(
                    key: const Key('contact-message'),
                    controller: _message,
                    decoration: InputDecoration(labelText: t.message, helperText: t.messageHint, helperMaxLines: 3),
                    maxLines: 6,
                    validator: (v) => (v ?? '').trim().length < 10 ? t.messageHint : null,
                  ),
                  const SizedBox(height: 16),
                  FilledButton(key: const Key('contact-submit'), onPressed: _busy ? null : _submit, child: Text(t.send)),
                ]),
              ),
      ),
    );
  }
}

class ReportAbuseScreen extends StatefulWidget {
  const ReportAbuseScreen({super.key});
  @override
  State<ReportAbuseScreen> createState() => _ReportAbuseScreenState();
}

class _ReportAbuseScreenState extends State<ReportAbuseScreen> {
  final _form = GlobalKey<FormState>();
  final _description = TextEditingController();
  String _category = 'fraud';
  String? _error;
  bool _done = false;

  Future<void> _submit() async {
    final t = AppLocalizations.of(context);
    if (!_form.currentState!.validate()) return;
    final r = await AppScope.of(context).api.reportAbuse(category: _category, description: _description.text.trim());
    if (!mounted) return;
    setState(() {
      _done = r.ok;
      _error = r.ok ? null : errorMessage(t, r);
    });
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final cats = {'fraud': t.catFraud, 'impersonation': t.catImpersonation, 'harassment': t.catHarassment, 'privacy': t.catPrivacy, 'other': t.catOther};
    return Scaffold(
      appBar: AppBar(title: Text(t.reportAbuse)),
      body: SafeArea(
        child: _done
            ? Padding(padding: const EdgeInsets.all(20), child: Notice(t.reportSent))
            : Form(
                key: _form,
                child: ListView(padding: const EdgeInsets.all(20), children: [
                  if (_error != null) Notice(_error!, error: true),
                  DropdownButtonFormField<String>(
                    initialValue: _category,
                    decoration: InputDecoration(labelText: t.abuseCategory),
                    isExpanded: true,
                    items: cats.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
                    onChanged: (v) => setState(() => _category = v ?? 'other'),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _description,
                    decoration: InputDecoration(labelText: t.whatHappened, helperText: t.messageHint, helperMaxLines: 3),
                    maxLines: 6,
                    validator: (v) => (v ?? '').trim().length < 10 ? t.messageHint : null,
                  ),
                  const SizedBox(height: 16),
                  FilledButton(onPressed: _submit, child: Text(t.send)),
                ]),
              ),
      ),
    );
  }
}
