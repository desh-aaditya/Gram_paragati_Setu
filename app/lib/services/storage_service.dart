import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/priority_vote.dart';
import '../models/checkpoint_submission.dart';

class StorageService {
  static Database? _database;
  static const String _dbName = 'gram_pragati_setu.db';
  static const String _volunteerSessionKey = 'volunteer_session';

  static Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  static Future<Database> _initDatabase() async {
    final path = join(await getDatabasesPath(), _dbName);
    return await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE priority_votes(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            village_id INTEGER NOT NULL,
            required_infrastructure TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT,
            is_volunteer INTEGER DEFAULT 0,
            volunteer_id TEXT,
            employee_id INTEGER,
            client_id TEXT NOT NULL
          )
        ''');

        await db.execute('''
          CREATE TABLE checkpoint_submissions(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            checkpoint_id INTEGER NOT NULL,
            volunteer_id TEXT NOT NULL,
            notes TEXT,
            latitude REAL,
            longitude REAL,
            client_id TEXT NOT NULL,
            submitted_at TEXT,
            media_paths TEXT
          )
        ''');
      },
    );
  }

  // --- Priority Votes ---

  static Future<void> saveOfflineVote(PriorityVote vote) async {
    final db = await database;
    await db.insert(
      'priority_votes',
      {
        'village_id': vote.villageId,
        'required_infrastructure': vote.requiredInfrastructure,
        'description': vote.description,
        'category': vote.category,
        'is_volunteer': vote.isVolunteer ? 1 : 0,
        'volunteer_id': vote.volunteerId,
        'employee_id': vote.employeeId,
        'client_id': vote.clientId,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  static Future<List<PriorityVote>> getOfflineVotes() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query('priority_votes');
    return List.generate(maps.length, (i) {
      return PriorityVote(
        id: maps[i]['id'],
        villageId: maps[i]['village_id'],
        requiredInfrastructure: maps[i]['required_infrastructure'],
        description: maps[i]['description'],
        category: maps[i]['category'],
        isVolunteer: maps[i]['is_volunteer'] == 1,
        volunteerId: maps[i]['volunteer_id'],
        employeeId: maps[i]['employee_id'],
        clientId: maps[i]['client_id'],
      );
    });
  }

  static Future<void> deleteOfflineVote(String clientId) async {
    final db = await database;
    await db.delete(
      'priority_votes',
      where: 'client_id = ?',
      whereArgs: [clientId],
    );
  }

  static Future<void> clearOfflineVotes() async {
    final db = await database;
    await db.delete('priority_votes');
  }

  // --- Checkpoint Submissions ---

  static Future<void> saveCheckpointSubmission(CheckpointSubmission submission) async {
    final db = await database;
    await db.insert(
      'checkpoint_submissions',
      {
        'checkpoint_id': submission.checkpointId,
        'volunteer_id': submission.volunteerId,
        'notes': submission.notes,
        'latitude': submission.latitude,
        'longitude': submission.longitude,
        'client_id': submission.clientId,
        'submitted_at': submission.submittedAt?.toIso8601String(),
        'media_paths': json.encode(submission.mediaPaths),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  static Future<List<CheckpointSubmission>> getCheckpointSubmissions() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query('checkpoint_submissions');
    return List.generate(maps.length, (i) {
      return CheckpointSubmission(
        id: maps[i]['id'],
        checkpointId: maps[i]['checkpoint_id'],
        volunteerId: maps[i]['volunteer_id'],
        notes: maps[i]['notes'],
        latitude: maps[i]['latitude'],
        longitude: maps[i]['longitude'],
        clientId: maps[i]['client_id'],
        submittedAt: maps[i]['submitted_at'] != null 
            ? DateTime.parse(maps[i]['submitted_at']) 
            : null,
        mediaPaths: List<String>.from(json.decode(maps[i]['media_paths'] ?? '[]')),
      );
    });
  }

  static Future<void> deleteCheckpointSubmission(String clientId) async {
    final db = await database;
    await db.delete(
      'checkpoint_submissions',
      where: 'client_id = ?',
      whereArgs: [clientId],
    );
  }

  // --- Volunteer Session ---

  static Future<void> saveVolunteerSession(Map<String, dynamic> session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_volunteerSessionKey, json.encode(session));
  }

  static Future<Map<String, dynamic>?> getVolunteerSession() async {
    final prefs = await SharedPreferences.getInstance();
    final sessionJson = prefs.getString(_volunteerSessionKey);
    if (sessionJson == null) return null;
    return json.decode(sessionJson);
  }

  static Future<void> clearVolunteerSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_volunteerSessionKey);
  }

  // --- Language Preference ---

  static Future<void> saveLanguage(String languageCode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('selected_language', languageCode);
  }

  static Future<String?> getLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('selected_language');
  }
}







