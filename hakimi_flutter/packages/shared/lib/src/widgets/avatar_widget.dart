import 'package:flutter/material.dart';
import 'package:hakimi_shared/src/theme/app_colors.dart';

class AvatarWidget extends StatelessWidget {
  final String? imageUrl;
  final String initials;
  final double size;
  final Color? backgroundColor;
  final Color? foregroundColor;

  const AvatarWidget({
    super.key,
    this.imageUrl,
    required this.initials,
    this.size = 40,
    this.backgroundColor,
    this.foregroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final bgColor = backgroundColor ?? AppColors.primary;
    final fgColor = foregroundColor ?? Colors.white;

    if (imageUrl != null) {
      return CircleAvatar(
        radius: size / 2,
        backgroundImage: NetworkImage(imageUrl!),
        onBackgroundImageError: (_, __) => _buildInitialsAvatar(bgColor, fgColor),
      );
    }

    return _buildInitialsAvatar(bgColor, fgColor);
  }

  Widget _buildInitialsAvatar(Color bg, Color fg) {
    return CircleAvatar(
      radius: size / 2,
      backgroundColor: bg,
      child: FittedBox(
        child: Padding(
          padding: const EdgeInsets.all(4),
          child: Text(
            initials.length > 2 ? initials.substring(0, 2).toUpperCase() : initials.toUpperCase(),
            style: TextStyle(
              color: fg,
              fontWeight: FontWeight.bold,
              fontSize: size * 0.4,
            ),
          ),
        ),
      ),
    );
  }
}
