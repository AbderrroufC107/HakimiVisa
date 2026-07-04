import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'environment_manager.dart';

class DevServerSetupScreen extends StatefulWidget {
  final VoidCallback? onSaved;

  const DevServerSetupScreen({super.key, this.onSaved});

  @override
  State<DevServerSetupScreen> createState() => _DevServerSetupScreenState();
}

class _DevServerSetupScreenState extends State<DevServerSetupScreen> {
  final _hostController = TextEditingController();
  final _portController = TextEditingController(text: '4000');
  final _formKey = GlobalKey<FormState>();
  bool _isTesting = false;
  String? _error;
  bool _success = false;
  int? _latencyMs;

  @override
  void dispose() {
    _hostController.dispose();
    _portController.dispose();
    super.dispose();
  }

  Future<void> _testAndSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isTesting = true;
      _error = null;
      _success = false;
      _latencyMs = null;
    });

    final host = _hostController.text.trim();
    final port = int.tryParse(_portController.text.trim()) ?? 4000;
    final env = EnvironmentManager.instance;
    final ok = await env.configureDevServer(host, port);

    if (!mounted) return;

    setState(() {
      _isTesting = false;
      if (ok) {
        _success = true;
        _latencyMs = env.lastLatencyMs.value;
      } else {
        _error = 'Connection failed. Check the host and port, '
            'and ensure the backend is running.';
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Developer Server Setup'),
        automaticallyImplyLeading: widget.onSaved == null,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(Icons.developer_mode, size: 64, color: theme.colorScheme.primary),
              const SizedBox(height: 16),
              Text(
                'Connect to Local Backend',
                textAlign: TextAlign.center,
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Enter your development PC IP address and port.\n'
                'Your phone must be on the same Wi-Fi network.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 32),
              TextFormField(
                controller: _hostController,
                decoration: const InputDecoration(
                  labelText: 'Host / IP Address',
                  hintText: 'e.g. 192.168.1.25',
                  prefixIcon: Icon(Icons.computer),
                ),
                keyboardType: TextInputType.text,
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[\d.]')),
                ],
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter an IP address';
                  }
                  final parts = value.trim().split('.');
                  if (parts.length != 4 || !parts.every((p) {
                    final n = int.tryParse(p);
                    return n != null && n >= 0 && n <= 255;
                  })) {
                    return 'Enter a valid IP address (e.g. 192.168.1.25)';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _portController,
                decoration: const InputDecoration(
                  labelText: 'Port',
                  hintText: '4000',
                  prefixIcon: Icon(Icons.settings_ethernet),
                ),
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                ],
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter a port number';
                  }
                  final port = int.tryParse(value.trim());
                  if (port == null || port < 1 || port > 65535) {
                    return 'Enter a valid port (1-65535)';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.errorContainer,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.error_outline, color: theme.colorScheme.error),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _error!,
                            style: TextStyle(color: theme.colorScheme.error),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              if (_success)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.check_circle, color: theme.colorScheme.primary),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _latencyMs != null
                                ? 'Connected! (${_latencyMs}ms)'
                                : 'Connected!',
                            style: TextStyle(color: theme.colorScheme.primary),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              SizedBox(
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: _isTesting ? null : _testAndSave,
                  icon: _isTesting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.wifi_tethering),
                  label: Text(_isTesting ? 'Testing...' : 'Test & Save'),
                ),
              ),
              if (_success) ...[
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () {
                    if (widget.onSaved != null) {
                      widget.onSaved!();
                    } else {
                      Navigator.of(context).pop(true);
                    }
                  },
                  child: const Text('Continue'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
