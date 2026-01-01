import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gram_pragati_setu_mobile/l10n/gen/app_localizations.dart';
import '../providers/language_provider.dart';
import 'survey_screen.dart';
import 'volunteer/login_screen.dart';
import 'issue_submission_screen.dart';
import '../widgets/language_selector.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final currentLocale = ref.watch(languageProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      extendBodyBehindAppBar: true, 
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.only(left: 16.0),
          child: Image.asset(
            'assets/images/emblem.png',
            fit: BoxFit.contain,
          ),
        ),
        leadingWidth: 70, // Ensure enough space for the logo
        title: const Text(''), 
        actions: [
          PopupMenuButton<Locale>(
            icon: const Icon(Icons.language, color: Colors.white),
            onSelected: (Locale locale) {
              ref.read(languageProvider.notifier).setLanguage(locale);
            },
            itemBuilder: (BuildContext context) => <PopupMenuEntry<Locale>>[
              const PopupMenuItem<Locale>(
                value: Locale('en'),
                child: Text('English'),
              ),
              const PopupMenuItem<Locale>(
                value: Locale('hi'),
                child: Text('हिंदी'),
              ),
            ],
          ),
          const SizedBox(width: 8),
          IconButton(
             onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const VolunteerLoginScreen()),
              );
            },
            icon: const Icon(Icons.person_outline, color: Colors.white),
            tooltip: l10n.volunteerLogin,
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Gradient Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(24, 100, 24, 32),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFFFF9933), Color(0xFFE65100)],
                ),
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(32),
                  bottomRight: Radius.circular(32),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black26,
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  )
                ],
              ),
              child: Column(
                children: [
                  const SizedBox(height: 16),
                  Text(
                    l10n.welcomeTitle,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: Colors.white70,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            
            /* SPACER */
            const SizedBox(height: 10),

            /* MARQUEE & COPY BUTTON */
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: Container(
                height: 50,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(25),
                  boxShadow: [
                     BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                     )
                  ],
                  border: Border.all(color: Colors.orange.shade100),
                ),
                child: Row(
                  children: [
                    Expanded(
                     child: ClipRRect(
                      borderRadius: BorderRadius.circular(18),
                      child: const ScrollingText(
                        text: '📞 Toll Free: +1 660-324-5710, +1 660-324-5714   |   ✉️ Email: gramsetu@gov.in',
                        style: TextStyle(
                          fontSize: 13, 
                          fontWeight: FontWeight.w600, 
                          color: Color(0xFFE65100)
                        ),
                      ),
                    ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      height: 36,
                      width: 36,
                      decoration: BoxDecoration(
                        color: Colors.orange.shade50,
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        padding: EdgeInsets.zero,
                        icon: const Icon(Icons.copy, size: 18, color: Colors.orange),
                        tooltip: 'Copy Contact Info',
                        onPressed: () {
                           Clipboard.setData(const ClipboardData(text: 'Toll Free: +1 660-324-5710, +1 660-324-5714 | Email: gramsetu@gov.in'));
                           ScaffoldMessenger.of(context).showSnackBar(
                             const SnackBar(
                               content: Text('Contact info copied!'),
                               duration: Duration(seconds: 1),
                               behavior: SnackBarBehavior.floating,
                             ),
                           );
                        },
                      ),
                    )
                  ],
                ),
              ),
            ),
            
            // GridView (No Expanded, shrinkWrap=true)
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.all(24.0),
              crossAxisCount: 2,
              crossAxisSpacing: 20,
              mainAxisSpacing: 20,
              childAspectRatio: 0.85,
              children: [
                _buildMenuCard(
                  context,
                  title: l10n.villageSurvey,
                  icon: Icons.assignment_outlined,
                  color: const Color(0xFF1A237E),
                  gradient: const LinearGradient(
                    colors: [Color(0xFFE8EAF6), Colors.white],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const SurveyScreen(isVolunteer: false)),
                    );
                  },
                ),
                _buildMenuCard(
                  context,
                  title: l10n.reportIssue,
                  icon: Icons.report_problem_outlined,
                  color: const Color(0xFFD32F2F),
                   gradient: const LinearGradient(
                    colors: [Color(0xFFFFEBEE), Colors.white],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const IssueSubmissionScreen()),
                    );
                  },
                ),
              ],
            ),
            
            // Demo Section
            _buildDemoSection(context),
            
            // FAQ Section
            _buildFAQSection(context),

            const SizedBox(height: 40),

            // Footer
            Container(
              padding: const EdgeInsets.all(24.0),
              color: Colors.grey[900],
              width: double.infinity,
              child: Column(
                children: [
                  Icon(Icons.verified_user_outlined, size: 20, color: Colors.grey[500]),
                  const SizedBox(height: 8),
                  Text(
                    l10n.officialInitiative,
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    '© 2024 Gram Pragati Setu',
                    style: TextStyle(color: Colors.grey[700], fontSize: 10),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }



  Widget _buildMenuCard(BuildContext context, {
    required String title,
    required IconData icon,
    required Color color,
    required LinearGradient gradient,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Ink(
            decoration: BoxDecoration(
              gradient: gradient,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white, width: 2),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: color.withOpacity(0.15),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(icon, size: 32, color: color),
                ),
                const SizedBox(height: 16),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[800],
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDemoSection(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
      child: Card(
        elevation: 0,
        color: Colors.white,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: Colors.grey.shade200)
        ),
        child: ExpansionTile(
          shape: const Border(),
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          title: const Text(
            'App Demonstrations',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A237E),
            ),
          ),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildVideoCard(
                      context,
                      title: 'English Demo',
                      thumbnailUrl: 'https://img.youtube.com/vi/T0Ucb5YJnLk/0.jpg',
                      videoUrl: 'https://youtube.com/shorts/T0Ucb5YJnLk?feature=share',
                    ),
                    const SizedBox(width: 16),
                    _buildVideoCard(
                      context,
                      title: 'Hindi Demo',
                      thumbnailUrl: 'https://img.youtube.com/vi/PQgzxXEqJ58/0.jpg',
                      videoUrl: 'https://youtube.com/shorts/PQgzxXEqJ58?feature=share',
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVideoCard(BuildContext context, {required String title, required String thumbnailUrl, required String videoUrl}) {
    return GestureDetector(
      onTap: () async {
        final Uri url = Uri.parse(videoUrl);
        if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
            if (!await launchUrl(url)) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not launch video')));
                }
            }
        }
      },
      child: Container(
        width: 160,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
             BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 6, offset: const Offset(0,3))
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                  child: Image.network(
                    thumbnailUrl, 
                    height: 200, // Vertical video aspect
                    width: 160, 
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(height: 200, color: Colors.grey[300], child: const Icon(Icons.broken_image)),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                  child: const Icon(Icons.play_arrow, color: Colors.white, size: 30),
                )
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: Text(
                title,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildFAQSection(BuildContext context) {
    final List<Map<String, String>> faqs = [
      {
        'q': 'What is Gram Pragati Setu?',
        'a': 'A digital platform under PM–AJAY to monitor village development, track projects, and enable coordination.'
      },
      {
        'q': 'What services are for villagers?',
        'a': 'Villagers can raise issues, submit surveys, give voice feedback, and check projects offline.'
      },
      {
        'q': 'What do volunteers do?',
        'a': 'Volunteers verify issues, upload project photos, and support offline data collection.'
      },
      {
        'q': 'How does project tracking work?',
        'a': 'Each project has a dedicated workspace with checkpoints, photos, documents, and a progress tracker.'
      },
      {
        'q': 'What is Department Linkage?',
        'a': 'Projects connect to departments (Education, Health) for direct support and document sharing.'
      },
      {
        'q': 'What is Department Linkage?',
        'a': 'Projects connect to departments (Education, Health) for direct support and document sharing.'
      },
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
      child: Card(
        elevation: 0, 
        color: Colors.white,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: Colors.grey.shade200)
        ),
        child: ExpansionTile(
          shape: const Border(), // Remove default internal border
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          title: const Text(
            'Frequently Asked Questions',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A237E),
            ),
          ),
          children: [
            ...faqs.map((faq) => Container(
            decoration: BoxDecoration(
                border: Border(top: BorderSide(color: Colors.grey.shade100))
            ),
            child: ExpansionTile(
              title: Text(
                faq['q']!,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  color: Colors.black87,
                ),
              ),
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Text(
                    faq['a']!,
                    style: TextStyle(color: Colors.grey[700], fontSize: 13, height: 1.5),
                  ),
                )
              ],
            ),
          )),
          const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

class ScrollingText extends StatefulWidget {
  final String text;
  final TextStyle style;

  const ScrollingText({
    super.key,
    required this.text,
    required this.style,
  });

  @override
  State<ScrollingText> createState() => _ScrollingTextState();
}

class _ScrollingTextState extends State<ScrollingText> with SingleTickerProviderStateMixin {
  late ScrollController _scrollController;
  late AnimationController _animationController;
  bool _isPaused = false;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _animationController = AnimationController(
        vsync: this, 
        duration: const Duration(seconds: 30) // Slower speed
    )..addListener(() {
        if (_scrollController.hasClients && !_isPaused) {
           final maxScroll = _scrollController.position.maxScrollExtent;
           final currentScroll = _animationController.value * maxScroll;
           _scrollController.jumpTo(currentScroll);
        }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startScrolling();
    });
  }

  void _startScrolling() {
     _animationController.repeat();
  }

  void _togglePause() {
    setState(() {
      _isPaused = !_isPaused;
      if (_isPaused) {
        _animationController.stop();
      } else {
        _animationController.repeat(); 
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _togglePause,
      child: ListView(
        controller: _scrollController,
        scrollDirection: Axis.horizontal,
        physics: const NeverScrollableScrollPhysics(),
        children: [
          Center(
            child: SelectableText(
              // Repeat text to allow scrolling effect
              '${widget.text}      •      ${widget.text}      •      ${widget.text}      •      ',
              style: widget.style,
              onTap: _togglePause, // Handle tap on the text itself
            ),
          ),
        ],
      ),
    );
  }
}
