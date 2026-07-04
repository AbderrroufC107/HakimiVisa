import 'package:flutter/material.dart';
import 'package:hakimi_shared/src/l10n/app_localizations.dart';

extension BuildContextExtensions on BuildContext {
  ThemeData get theme => Theme.of(this);
  TextTheme get textTheme => Theme.of(this).textTheme;
  ColorScheme get colorScheme => Theme.of(this).colorScheme;
  AppLocalizations get l10n => AppLocalizations.of(this);
  MediaQueryData get mediaQuery => MediaQuery.of(this);
  double get screenWidth => mediaQuery.size.width;
  double get screenHeight => mediaQuery.size.height;
  bool get isSmallScreen => screenWidth < 600;
  bool get isMediumScreen => screenWidth >= 600 && screenWidth < 1200;
  bool get isLargeScreen => screenWidth >= 1200;
  NavigatorState get navigator => Navigator.of(this);
  ScaffoldMessengerState get scaffoldMessenger => ScaffoldMessenger.of(this);

  void showSnackBar(String message) {
    scaffoldMessenger.showSnackBar(SnackBar(content: Text(message)));
  }

  void showError(String message) {
    scaffoldMessenger.showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: colorScheme.error,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void showSuccess(String message) {
    scaffoldMessenger.showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
