import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/storage_service.dart';

final languageProvider = StateNotifierProvider<LanguageNotifier, Locale>((ref) {
  return LanguageNotifier();
});

class LanguageNotifier extends StateNotifier<Locale> {
  LanguageNotifier() : super(const Locale('en')) {
    _loadLanguage();
  }

  Future<void> _loadLanguage() async {
    final String? langCode = await StorageService.getLanguage();
    if (langCode != null) {
      state = Locale(langCode);
    }
  }

  Future<void> setLanguage(Locale locale) async {
    state = locale;
    await StorageService.saveLanguage(locale.languageCode);
  }
}
