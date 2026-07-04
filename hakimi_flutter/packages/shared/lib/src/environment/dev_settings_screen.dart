import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'environment_manager.dart';
import 'dev_server_setup_screen.dart';

class DevSettingsScreen extends StatefulWidget {
  const DevSettingsScreen({super.key});

  @override
  State<DevSettingsScreen> createState() => _DevSettingsScreenState();
}

class _DevSettingsScreenState extends State<DevSettingsScreen> {
  bool _isTesting = false;
  bool _showUrlCopied = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final env = EnvironmentManager.instance;
    final url = env.activeUrl.value;
    final connState = env.connectionState.value;
    final latency = env.lastLatencyMs.value;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Developer Settings'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildHeader(theme, connState, url),
          const SizedBox(height: 24),
          _buildSection(theme, 'API Server', [
            _buildInfoTile(
              theme,
              icon: Icons.link,
              label: 'Current URL',
              value: url ?? 'Not configured',
              onTap: url != null
                  ? () {
                      Clipboard.setData(ClipboardData(text: url));
                      setState(() => _showUrlCopied = true);
                      Future.delayed(const Duration(seconds: 2), () {
                        if (mounted) setState(() => _showUrlCopied = false);
                      });
                    }
                  : null,
              trailing: _showUrlCopied
                  ? const Icon(Icons.check, size: 18)
                  : Icon(Icons.copy, size: 18, color: theme.colorScheme.primary),
            ),
            const Divider(height: 1),
            _buildInfoTile(
              theme,
              icon: Icons.speed,
              label: 'Latency',
              value: latency != null ? '${latency}ms' : 'N/A',
            ),
            const Divider(height: 1),
            _buildInfoTile(
              theme,
              icon: Icons.flag,
              label: 'Mode',
              value: env.isRelease ? 'Release (Production)' : 'Debug',
            ),
            const Divider(height: 1),
            _buildInfoTile(
              theme,
              icon: Icons.wifi_tethering,
              label: 'WebSocket',
              value: env.webSocketUrl.isNotEmpty ? env.webSocketUrl : 'N/A',
            ),
          ]),
          const SizedBox(height: 24),
          _buildSection(theme, 'Actions', [
            ListTile(
              leading: const Icon(Icons.wifi_tethering),
              title: const Text('Change Server'),
              subtitle: const Text('Enter a different development server'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () async {
                final result = await Navigator.of(context).push<bool>(
                  MaterialPageRoute(
                    builder: (_) => const DevServerSetupScreen(),
                  ),
                );
                if (result == true && mounted) {
                  setState(() {});
                }
              },
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.refresh),
              title: const Text('Test Connection'),
              subtitle: Text(
                _isTesting ? 'Testing...' : 'Check if the server is reachable',
              ),
              trailing: _isTesting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.chevron_right),
              onTap: _isTesting
                  ? null
                  : () async {
                      setState(() => _isTesting = true);
                      if (url != null && url.isNotEmpty) {
                        await env.testConnection(url);
                      }
                      if (mounted) {
                        setState(() => _isTesting = false);
                      }
                    },
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.delete_outline, color: Colors.red),
              title: const Text('Reset Server', style: TextStyle(color: Colors.red)),
              subtitle: const Text('Clear cached URL and reconnect'),
              onTap: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Reset Server'),
                    content: const Text(
                      'This will clear the cached development server URL. '
                      'You will need to set it up again.',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.of(ctx).pop(false),
                        child: const Text('Cancel'),
                      ),
                      ElevatedButton(
                        onPressed: () => Navigator.of(ctx).pop(true),
                        child: const Text('Reset'),
                      ),
                    ],
                  ),
                );
                if (confirm == true) {
                  await env.resetDevServer();
                  await env.retryConnection();
                  if (mounted) setState(() {});
                }
              },
            ),
          ]),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: theme.colorScheme.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                  'In Release mode the default URL is '
                  'https://api.hakimivisa.com/api. '
                  'You can override it here for testing.',
                    style: TextStyle(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(ThemeData theme, EnvConnectionState state, String? url) {
    final Color color;
    final String statusText;
    switch (state) {
      case EnvConnectionState.connected:
        color = Colors.green;
        statusText = 'Connected';
      case EnvConnectionState.initializing:
        color = Colors.orange;
        statusText = 'Initializing...';
      case EnvConnectionState.disconnected:
        color = Colors.red;
        statusText = 'Disconnected';
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(statusText,
                      style: theme.textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.bold)),
                  Text(
                    url ?? 'No URL configured',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(ThemeData theme, String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            title,
            style: theme.textTheme.titleMedium
                ?.copyWith(fontWeight: FontWeight.w600),
          ),
        ),
        Card(child: Column(children: children)),
      ],
    );
  }

  Widget _buildInfoTile(
    ThemeData theme, {
    required IconData icon,
    required String label,
    required String value,
    VoidCallback? onTap,
    Widget? trailing,
  }) {
    return ListTile(
      leading: Icon(icon, size: 20),
      title: Text(label, style: const TextStyle(fontSize: 14)),
      subtitle: Text(value,
          style: TextStyle(
            fontSize: 13,
            color: theme.colorScheme.onSurfaceVariant,
          )),
      trailing: trailing,
      onTap: onTap,
      dense: true,
    );
  }
}
