# Smart Task Manager

A cross-platform task management application built entirely with AI, functioning perfectly on iOS, Android, and Desktop (Web) using Expo and React Native.

## Features
- **Cross-Platform**: Runs beautifully on Web, iOS, and Android out of the box.
- **Local Persistence**: Stores data securely and purely locally using `AsyncStorage`.
- **Modern UI**: Clean, responsive light theme using `react-native` styles.
- **Date/Time Support**: Native pickers for iOS/Android, and HTML5 pickers for the Web.
- **TypeScript**: Fully typed for better developer experience and reliability.

## Getting Started

1. **Install Dependencies**
   Ensure you have Node.js installed, then run:
   ```bash
   npm install
   ```

2. **Start the Application**
   You can run the app on your preferred platform:
   - For Web (Desktop): `npm run web`
   - For iOS/Android: `npm start` (then scan the QR code with the Expo Go app)

## Testing

This project incorporates both Unit Tests and End-to-End (E2E) tests.

### Unit Testing (Jest)
We use Jest along with React Native Testing Library to verify component rendering and logic.
```bash
npm run test
```

### End-to-End Testing (Playwright)
Playwright is configured to test the web deployment of this application. It will launch a headless browser and verify the full user flow.
1. First, install the Playwright browsers (if not done yet):
   ```bash
   npx playwright install
   ```
2. Run the E2E test suite:
   ```bash
   npm run test:e2e
   ```

## Project Structure
- `/src/components` - Reusable UI components (`TaskCard`, `TaskFormModal`, etc.)
- `/src/utils` - Helpers and services (e.g., local storage wrappers)
- `/__tests__` - Jest unit tests
- `/e2e` - Playwright integration tests
- `/App.tsx` - Main application entry point
