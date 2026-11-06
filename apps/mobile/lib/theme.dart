import 'package:flutter/material.dart';

/// Same palette as the website: calm deep teal, warm off-white, amber accent.
class HLColors {
  static const primary = Color(0xFF1D5C63);
  static const background = Color(0xFFFBF8F3);
  static const text = Color(0xFF1F2A2E);
  static const accent = Color(0xFFC9752C);
  static const warningBg = Color(0xFFFFF4D6);
  static const warningText = Color(0xFF5C4300);
  static const error = Color(0xFF9B1C1C);
  static const success = Color(0xFF1F5F3A);
}

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(seedColor: HLColors.primary, primary: HLColors.primary, surface: Colors.white, error: HLColors.error);
  return ThemeData(
    colorScheme: scheme,
    scaffoldBackgroundColor: HLColors.background,
    useMaterial3: true,
    inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder()),
    filledButtonTheme: FilledButtonThemeData(style: FilledButton.styleFrom(minimumSize: const Size(48, 48))),
    outlinedButtonTheme: OutlinedButtonThemeData(style: OutlinedButton.styleFrom(minimumSize: const Size(48, 48))),
  );
}
