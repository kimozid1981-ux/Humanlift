import 'package:flutter/material.dart';

import '../api/models.dart';
import '../config.dart';
import '../l10n/gen/app_localizations.dart';
import '../theme.dart';

/// Shown on every screen outside production.
class TestBanner extends StatelessWidget {
  const TestBanner({super.key});
  @override
  Widget build(BuildContext context) {
    if (AppConfig.isProduction) return const SizedBox.shrink();
    return Semantics(
      container: true,
      child: Container(
        width: double.infinity,
        color: HLColors.warningBg,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Text(AppLocalizations.of(context).testBanner, style: const TextStyle(color: HLColors.warningText), textAlign: TextAlign.center),
      ),
    );
  }
}

/// A status message announced to screen readers.
class Notice extends StatelessWidget {
  const Notice(this.text, {super.key, this.error = false});
  final String text;
  final bool error;
  @override
  Widget build(BuildContext context) {
    return Semantics(
      liveRegion: true,
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: error ? const Color(0xFFFBE9E7) : const Color(0xFFE5F2EA),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(text, style: TextStyle(color: error ? HLColors.error : HLColors.success, fontWeight: FontWeight.w600)),
      ),
    );
  }
}

/// Plain-language message for a failed API call.
String errorMessage(AppLocalizations t, ApiResult r) {
  if (r.isNetworkError) return t.errNetwork;
  if (r.isRateLimited) return t.errTooMany;
  switch (r.error) {
    case 'invalid_credentials':
      return t.errCredentials;
    case 'account_not_active':
      return t.errNotActive;
    case 'registration_failed':
      return t.errRegistration;
    case 'request_already_open':
      return t.requestOpen;
    default:
      return t.errGeneric;
  }
}

String? validateEmail(AppLocalizations t, String? v) {
  final s = (v ?? '').trim();
  return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(s) ? null : t.errEmail;
}

class LanguageMenu extends StatelessWidget {
  const LanguageMenu({super.key, required this.onSelected});
  final ValueChanged<Locale> onSelected;
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return PopupMenuButton<Locale>(
      tooltip: t.language,
      icon: const Icon(Icons.language),
      onSelected: onSelected,
      itemBuilder: (_) => const [
        PopupMenuItem(value: Locale('en'), child: Text('English')),
        PopupMenuItem(value: Locale('fr'), child: Text('Français')),
      ],
    );
  }
}
