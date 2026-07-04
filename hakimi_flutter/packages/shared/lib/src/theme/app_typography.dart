import 'package:flutter/material.dart';

class AppTypography {
  AppTypography._();

  static const String fontFamily = 'Poppins';
  static const String fontFamilyMono = 'RobotoMono';

  static TextStyle get displayLarge => const TextStyle(
        fontSize: 32,
        fontWeight: FontWeight.bold,
        letterSpacing: -0.5,
      );

  static TextStyle get displayMedium => const TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.bold,
        letterSpacing: -0.25,
      );

  static TextStyle get displaySmall => const TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.bold,
      );

  static TextStyle get headlineLarge => const TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get headlineMedium => const TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get headlineSmall => const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get titleLarge => const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get titleMedium => const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
      );

  static TextStyle get titleSmall => const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w500,
      );

  static TextStyle get bodyLarge => const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.normal,
      );

  static TextStyle get bodyMedium => const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.normal,
      );

  static TextStyle get bodySmall => const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.normal,
      );

  static TextStyle get labelLarge => const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
      );

  static TextStyle get labelMedium => const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
      );

  static TextStyle get labelSmall => const TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w500,
      );

  static TextTheme get textTheme => TextTheme(
        displayLarge: displayLarge,
        displayMedium: displayMedium,
        displaySmall: displaySmall,
        headlineLarge: headlineLarge,
        headlineMedium: headlineMedium,
        headlineSmall: headlineSmall,
        titleLarge: titleLarge,
        titleMedium: titleMedium,
        titleSmall: titleSmall,
        bodyLarge: bodyLarge,
        bodyMedium: bodyMedium,
        bodySmall: bodySmall,
        labelLarge: labelLarge,
        labelMedium: labelMedium,
        labelSmall: labelSmall,
      );
}
