import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/language_provider.dart';

class LanguageSelector extends ConsumerWidget {
  final bool isWhite; // If true, optimized for dark background (AppBar)

  const LanguageSelector({super.key, this.isWhite = true});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentLocale = ref.watch(languageProvider);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isWhite ? Colors.white.withOpacity(0.2) : Colors.grey[200],
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isWhite ? Colors.white.withOpacity(0.5) : Colors.grey[400]!,
        ),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<Locale>(
          value: currentLocale,
          icon: Icon(
            Icons.language, 
            color: isWhite ? Colors.white : Colors.black87, 
            size: 20
          ),
          dropdownColor: Colors.white, // Always white background for dropdown menu
          elevation: 4,
          style: const TextStyle(
            color: Colors.black87, // Always black text for dropdown items
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
          onChanged: (Locale? newLocale) {
            if (newLocale != null) {
              ref.read(languageProvider.notifier).setLanguage(newLocale);
            }
          },
          selectedItemBuilder: (BuildContext context) {
            // This builder allows the selected item (in the bar) to look different 
            // from the items in the dropdown list
            return [
              const Locale('en'),
              const Locale('hi'),
              const Locale('kn'),
              const Locale('mr'),
              const Locale('bho'),
              const Locale('bgc'), // Haryanvi
            ].map((Locale locale) {
              String label;
              switch (locale.languageCode) {
                case 'en': label = 'English'; break;
                case 'hi': label = 'हिंदी'; break;
                case 'kn': label = 'ಕನ್ನಡ'; break;
                case 'mr': label = 'मराठी'; break;
                case 'bho': label = 'भोजपुरी'; break;
                case 'bgc': label = 'हरियाणवी'; break;
                default: label = locale.languageCode;
              }
              return Center(
                child: Text(
                  label,
                  style: TextStyle(
                    color: isWhite ? Colors.white : Colors.black87,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              );
            }).toList();
          },
          items: const [
            DropdownMenuItem(value: Locale('en'), child: Text('English', style: TextStyle(color: Colors.black87))),
            DropdownMenuItem(value: Locale('hi'), child: Text('हिंदी', style: TextStyle(color: Colors.black87))),
            DropdownMenuItem(value: Locale('kn'), child: Text('ಕನ್ನಡ', style: TextStyle(color: Colors.black87))),
            DropdownMenuItem(value: Locale('mr'), child: Text('मराठी', style: TextStyle(color: Colors.black87))),
            DropdownMenuItem(value: Locale('bho'), child: Text('भोजपुरी', style: TextStyle(color: Colors.black87))),
            DropdownMenuItem(value: Locale('bgc'), child: Text('हरियाणवी', style: TextStyle(color: Colors.black87))),
          ],
        ),
      ),
    );
  }
}
