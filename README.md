# engine-kill

Engine Kill is a mobile app for iOS and Android to help manage titan-scale tabletop battles. Track your units (void shields, heat, damage, weapons) and view enemy status in real-time.

## Features

- **Unit Management**: Create and track Titans and Banners
- **Damage Tracking**: Track damage to head, body, and legs with armor values
- **Void Shields**: Manage void shields per facing (front, left, right, rear)
- **Heat Tracking**: Monitor heat levels
- **Weapon Management**: Track left, right, and optional carapace weapons
- **Local Persistence**: Units saved locally and persist across app restarts
- **Real-time Sync**: (Coming soon) Share game state with other players via Firebase

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (installed globally or via npx)
- For iOS: Xcode (Mac only)
- For Android: Android Studio (optional, can use Expo Go)

### Installation

1. Navigate to the project directory:

```bash
cd engine-kill
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

### Running the App

- **Web**: Press `w` in the terminal or visit the URL shown
- **iOS Simulator**: Press `i` (requires Xcode on Mac)
- **Android Emulator**: Press `a` (requires Android Studio)
- **Physical Device**:
  - Install "Expo Go" from App Store/Play Store
  - Scan the QR code shown in terminal
  - Make sure your phone and computer are on the same WiFi network

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── models/         # TypeScript interfaces and types
├── services/       # Business logic and API services
├── context/        # React Context providers
├── data/           # Template data (Titans, Banners)
└── utils/          # Utility functions and constants
```

## Current Status

✅ Project setup complete  
✅ Data models and templates  
✅ Local storage and state management  
✅ Basic screens (Home, Create Unit, Edit Unit)  
⏳ Advanced UI components (pips, sliders, etc.)  
⏳ Firebase integration for multiplayer  
⏳ Session management  

## Next Steps

1. Add advanced UI controls (pips, sliders) for shields and damage
2. Implement Firebase for real-time multiplayer sync
3. Add session creation/joining
4. Create enemy unit summary view
5. Add weapon management UI
6. Polish UI/UX

## Development Notes

- Units are stored locally using AsyncStorage
- All game data is template-based for easy modification
- TypeScript ensures type safety throughout
- React Native Paper provides consistent UI components
