---
description: How to run the Gram Pragati Setu mobile app on an emulator
---

1.  **Prerequisites**:
    *   Ensure you have Android Studio installed and an Android Emulator set up (AVD Manager).
    *   Ensure the backend server is running (`npm run dev` in `backend` folder).
    *   Ensure your computer and emulator can communicate (for localhost, use `10.0.2.2` in Android emulator).

2.  **Start the Emulator**:
    *   Open Android Studio -> Device Manager -> Start your preferred emulator.
    *   OR run `flutter emulators --launch <emulator_id>` if you know the ID.

3.  **Run the App**:
    *   Navigate to the app directory:
        ```bash
        cd app
        ```
    *   Install dependencies:
        ```bash
        flutter pub get
        ```
    *   Run the app:
        ```bash
        flutter run
        ```
    *   If you have multiple devices connected, specify the device:
        ```bash
        flutter run -d <device_id>
        ```

4.  **Troubleshooting**:
    *   **Backend Connection**: If the app cannot connect to the backend, check `lib/config/api_config.dart`. For Android emulator, `baseUrl` should often be `http://10.0.2.2:5000/api`.
    *   **Gradle Errors**: If you see build errors, try `flutter clean` and then `flutter run` again.
