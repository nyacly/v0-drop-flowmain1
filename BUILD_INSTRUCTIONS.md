# DropFlow APK Build Instructions

This document provides step-by-step instructions for building the DropFlow app as an APK for Android testing.

## Prerequisites

1. **Node.js** (v18 or later)
2. **Expo CLI** installed globally: `npm install -g @expo/cli`
3. **EAS CLI** installed globally: `npm install -g eas-cli`
4. **Expo account** (free account is sufficient)

## Setup Steps

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

\`\`\`env
# Google Maps API Key (required for map functionality)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Backend API URL (if you have a backend server)
EXPO_PUBLIC_API_URL=http://your-backend-url.com

# Development redirect URL for Supabase (if using authentication)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

### 3. Update Project ID

1. Create an Expo project: `eas init`
2. Update the `projectId` in `app.json` under `extra.eas.projectId`

### 4. Build APK

#### Option A: Preview Build (Recommended for Testing)
\`\`\`bash
eas build --platform android --profile preview
\`\`\`

#### Option B: Production Build
\`\`\`bash
eas build --platform android --profile production
\`\`\`

### 5. Download and Install

1. Once the build completes, you'll receive a download link
2. Download the APK file to your Android device
3. Enable "Install from Unknown Sources" in your Android settings
4. Install the APK

## Build Profiles Explained

- **development**: Creates a development build with debugging enabled
- **preview**: Creates an APK suitable for internal testing
- **production**: Creates a production-ready APK

## Permissions

The app requests the following permissions:
- **Location**: For GPS tracking and route optimization
- **Camera**: For proof of delivery photos
- **Storage**: For saving delivery data and photos
- **Internet**: For map data and route optimization

## Troubleshooting

### Common Issues

1. **Build fails with "Google Maps API Key" error**
   - Ensure you have a valid Google Maps API key in your `.env` file
   - Enable the following APIs in Google Cloud Console:
     - Maps JavaScript API
     - Geocoding API
     - Directions API

2. **Location not working**
   - Ensure location permissions are granted in Android settings
   - Test on a physical device (location doesn't work in emulators without setup)

3. **App crashes on startup**
   - Check that all environment variables are properly set
   - Ensure the backend API URL is accessible (if using authentication)

### Testing Checklist

Before distributing the APK, test the following features:

- [ ] App launches successfully
- [ ] User can import addresses
- [ ] Map displays correctly with markers
- [ ] Route optimization works
- [ ] GPS location tracking functions
- [ ] Camera works for proof of delivery
- [ ] Paywall limits are enforced (10 addresses for free users)
- [ ] Data persists between app sessions

## Development Workflow

For ongoing development:

1. **Local testing**: `npx expo start`
2. **Preview builds**: Use the preview profile for testing new features
3. **Production builds**: Only use for final releases

## Support

If you encounter issues:
1. Check the Expo documentation: https://docs.expo.dev/
2. Review the EAS Build documentation: https://docs.expo.dev/build/introduction/
3. Check the app logs using `npx expo logs`
