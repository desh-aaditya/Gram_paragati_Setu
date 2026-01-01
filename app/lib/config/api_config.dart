class ApiConfig {
  // Set to true to use dummy data instead of real API calls
  // Useful for testing without backend connection
  static const bool useDummyData = false;
  
  // Update this to your backend URL
  static const String baseUrl = 'http://192.168.60.58:5000/api/mobile';
  
  // API Endpoints
  static const String states = '/states';
  static const String districts = '/districts';
  static const String villages = '/villages';
  static const String priorityVote = '/priority-vote';
  static const String villageAnalytics = '/village';
  static const String volunteerLogin = '/volunteer/login';
  static const String volunteerProjects = '/volunteer';
  static const String checkpointSubmit = '/checkpoint';
  
  // Helper method to build full URL
  static String getUrl(String endpoint) {
    return '$baseUrl$endpoint';
  }
  
  // Helper method for village analytics
  static String getVillageAnalyticsUrl(int villageId) {
    return '$baseUrl/village/$villageId/analytics';
  }
  
  // Helper method for checkpoint submission
  static String getCheckpointSubmitUrl(int checkpointId) {
    return '$baseUrl/checkpoint/$checkpointId/submit';
  }
  
  // Helper method for volunteer projects
  static String getVolunteerProjectsUrl(String volunteerId) {
    return '$baseUrl/volunteer/$volunteerId/projects';
  }
}


