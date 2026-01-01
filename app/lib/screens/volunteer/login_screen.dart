import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:gram_pragati_setu_mobile/l10n/gen/app_localizations.dart';
import '../../providers/language_provider.dart';
import '../../widgets/language_selector.dart';
import '../volunteer_home.dart';
import '../../services/api_service.dart';
import '../../services/storage_service.dart';

class VolunteerLoginScreen extends ConsumerStatefulWidget {
  const VolunteerLoginScreen({super.key});

  @override
  ConsumerState<VolunteerLoginScreen> createState() => _VolunteerLoginScreenState();
}

class _VolunteerLoginScreenState extends ConsumerState<VolunteerLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final l10n = AppLocalizations.of(context)!;
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final apiService = ApiService();
      final result = await apiService.volunteerLogin(
        _usernameController.text.trim(),
        _passwordController.text,
      );

      // Save volunteer session
      await StorageService.saveVolunteerSession(result);

      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => VolunteerHomeScreen(volunteerData: result),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        String errorMessage = l10n.loginFailed;
        if (e is DioException) {
          if (e.type == DioExceptionType.connectionTimeout || 
              e.type == DioExceptionType.receiveTimeout) {
            errorMessage = 'Connection timed out. Check your internet or server.';
          } else if (e.response != null) {
            errorMessage = e.response?.data['error'] ?? '${l10n.serverError}: ${e.response?.statusCode}';
          } else {
             errorMessage = 'Network error: ${e.message}';
          }
        } else {
          errorMessage = e.toString();
        }
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final currentLocale = ref.watch(languageProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.volunteerLogin),
        actions: [
          const LanguageSelector(isWhite: true),
        ],
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo/Icon
              Container(
                padding: const EdgeInsets.all(16), // Reduced from 20
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 10,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.account_balance,
                  size: 50, // Reduced from 60
                  color: Color(0xFF003366),
                ),
              ),
              const SizedBox(height: 24), // Reduced from 32
              
              // Login Card
              Card(
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(20.0), // Reduced from 24
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          l10n.volunteerAccess,
                          style: const TextStyle(
                            fontSize: 20, // Slightly reduced
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF003366),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 20), // Reduced from 24
                        TextFormField(
                          controller: _usernameController,
                          decoration: InputDecoration(
                            labelText: l10n.username,
                            prefixIcon: const Icon(Icons.person_outline),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12), // Compact
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter username';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 12), // Reduced from 16
                        TextFormField(
                          controller: _passwordController,
                          decoration: InputDecoration(
                            labelText: l10n.password,
                            prefixIcon: const Icon(Icons.lock_outline),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12), // Compact
                            suffixIcon: IconButton(
                              icon: Icon(_obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                              onPressed: () {
                                setState(() => _obscurePassword = !_obscurePassword);
                              },
                            ),
                          ),
                          obscureText: _obscurePassword,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter password';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 32),
                        ElevatedButton(
                          onPressed: _isLoading ? null : _login,
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            backgroundColor: const Color(0xFF003366),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              : Text(
                                  l10n.secureLogin,
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1),
                                ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                l10n.authorizedOnly,
                style: const TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }
}







