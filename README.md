# 🏡 Kinly — The Private, Intelligent Family Companion

<p align="center">
  <img src="./assets/images/icon.png" width="100" height="100" alt="Kinly Logo" style="border-radius: 22px;" />
</p>

<p align="center">
  <strong>"Don't make the family manage the app. Make the app understand the family."</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-SDK_57-blue.svg" alt="Expo SDK 57" />
  <img src="https://img.shields.io/badge/React_Native-0.76-61DAFB.svg" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Platforms-iOS_%7C_Android_%7C_Web-orange.svg" alt="Platforms" />
  <img src="https://img.shields.io/badge/Security-Lockout_Protected_%26_Salted_Hash-green.svg" alt="Security" />
  <img src="https://img.shields.io/badge/Design-10Yr_Staff_Engineer_Grade-purple.svg" alt="Design" />
</p>

---

## 🌟 Executive Summary

**Kinly** (FamilyOS) is a private, multi-generational operating system designed for modern households. Rather than functioning as a cold enterprise productivity tool or a generic chore checklist, Kinly acts as a warm, proactive digital living room that keeps family members connected, aware, and coordinated in real time.

Built with **React Native**, **Expo Router**, and **TypeScript**, Kinly delivers a bespoke mobile experience with fluid glassmorphism, instant tactile feedback, and accessibility modes tailored for both tech-savvy teens and aging grandparents.

---

## ✨ Flagship Capabilities

### 1. 📡 Real-Time Telemetry & Live Family Radar Map
- **Live Device Telemetry**: At-a-glance visibility into each family member’s ringer status (`🔔 Sound`, `🔕 Silent`, `📳 Vibrate`, `🌙 DND`), exact battery level (`⚡ 94% Charging` / `🔋 28% Low Battery`), and device model tag.
- **Interactive Live Radar Map**: High-performance SVG-rendered radar map with animated ping rings, interactive member avatars, and direct contextual actions (**Call Directly**, **Send Urgent Ping**).
- **Safe Zones & Privacy Geofences**: Geofenced awareness for Home, School, Office, and Grandma's house without invasive surveillance or battery drain.

### 2. 🗓️ Unified Natural Language & Voice Planner
- **Zero-Friction Scheduling**: Type or speak naturally: *"Remind Dad to pick up vegetables tomorrow at 6 PM"* or *"Give Dadi BP medicine tonight"*. Kinly's natural language engine automatically infers assignees, categories, and due dates.
- **Tri-Fold Unified Feed**: Single cohesive timeline integrating Calendar Events, Household Tasks, and Medication & Care Reminders.
- **Elderly-Friendly Touch Targets**: 48px minimum touch targets and single-tap completions with celebratory haptics.

### 3. 📦 Family Vault & Physical Memory Engine
- **Searchable Physical World**: Instant answers to daily household questions like *"Where is Dad's passport?"*, *"What is the Wi-Fi password?"*, or *"Where are the spare house keys?"*.
- **Drawer & Cupboard Cataloging**: Tag items with photo verification, physical locations (e.g., *Bedroom > Wardrobe Top Shelf*), and timestamped last verification logs.
- **Encrypted Document Storage**: Secure storage for medical cards, vaccination records, insurance policies, and birth certificates.

### 4. 🧠 Ambient Context Engine & Micro-Coordination
- **Morning Briefing & Evening Catchup**: Automated context snapshots highlighting who is where, today's schedule, and pending medication routines.
- **Smart Prioritized Notifications**: Notifications categorized into `Urgent`, `Important`, and `Normal` to eliminate alert fatigue.
- **Family Spaces Switcher**: Effortlessly toggle between *Immediate Household*, *Extended Relatives*, or *Grandparents' Home*.

### 5. 🛡️ Enterprise-Grade Security & Privacy Hardening
- **Client-Side PBKDF2-Equivalent Hashing**: User credentials are authenticated against cryptographic salted hashes—never stored or transmitted in plain text.
- **Brute-Force Rate Limiting**: Automatic 30-second lockout penalty enforced after 5 consecutive failed sign-in attempts.
- **Session Corruption Resilience**: Safe parsing guards prevent app crashes on malformed local state.
- **Zero Third-Party Ad Trackers**: Completely private family circle with explicit location consent strings configured for iOS App Store and Google Play compliance.

---

## 🏛️ Architecture & Project Structure

Kinly is architected around clean domain separation, high testability, and strict TypeScript types.

```
Kinly/
├── app.json                     # Production metadata, bundle IDs, iOS infoPlist & Android permissions
├── assets/                      # App icons, splash screens, brand typography
├── src/
│   ├── app/                     # Expo Router file-based navigation
│   │   ├── (auth)/              # Authentication flow (Sign In, Sign Up, Password Reset)
│   │   ├── (tabs)/              # Core bottom tab navigation
│   │   │   ├── index.tsx        # Dashboard (Live Telemetry, Radar Map, Quick Actions)
│   │   │   ├── family.tsx       # Family Circle & Safe Geofence Locations
│   │   │   ├── plans.tsx        # Unified Planner (Calendar, Tasks, Reminders)
│   │   │   ├── memory.tsx       # Searchable Physical Memory & Vault
│   │   │   └── _layout.tsx      # Glassmorphic floating navigation bar
│   │   └── modal/               # Accessible sheets (Notifications, Profile, Map)
│   ├── components/
│   │   ├── cards/               # Domain cards (FamilyMemberCard, TaskCard, EventCard, MemoryCard)
│   │   ├── location/            # LiveFamilyMap (Radar pins, telemetry popovers)
│   │   └── ui/                  # Design system primitives (Header, EmptyState, Badges, Buttons)
│   ├── context/
│   │   ├── AuthContext.tsx      # Auth state, session persistence, brute-force protection
│   │   ├── FamilyContext.tsx    # Family graph, real-time presence, tasks, memory CRUD
│   │   ├── ThemeContext.tsx     # Light/Dark tokens & Elderly Accessibility scaler
│   │   └── VoiceContext.tsx     # Speech synthesis & voice recognition hooks
│   ├── constants/
│   │   └── theme.ts             # Harmonious color palette & elevation design tokens
│   ├── types/
│   │   └── index.ts             # Domain interfaces (FamilyMember, Telemetry, Task, Memory)
│   └── data/
│       └── mockFamilyData.ts    # Type-safe schemas and default data models
```

---

## 🚀 Quickstart & Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (v20+ recommended)
- [Expo Go](https://expo.dev/go) or an iOS / Android simulator

### 1. Installation
```bash
git clone https://github.com/asry16/family-companion.git
cd family-companion
npm install
cd server && npm install && cd ..
```

### 2. Start the Backend API & AWS Services (Port 3001)
```bash
npm run server
# Or: cd server && npm run dev
```

### 3. Start the Expo App (Port 8081)
```bash
npx expo start
```
- Press **`i`** to open in the iOS Simulator.
- Press **`a`** to open in the Android Emulator.
- Press **`w`** to open in Google Chrome / Safari (Web Preview).
- Scan the QR code with your iPhone Camera or Android Expo Go app to test on physical hardware.

### 4. Type Checking & Verification
```bash
npx tsc --noEmit
cd server && npm run build
```

---

## 📱 App Store & Google Play Ready

| Target | Identifier | Production Status |
| :--- | :--- | :--- |
| **iOS** | `com.kinly.familycompanion` | Bundle ID & Permissions configured (`NSLocationWhenInUseUsageDescription`, `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`) |
| **Android** | `com.kinly.familycompanion` | Package ID & Permissions configured (`ACCESS_FINE_LOCATION`, `RECORD_AUDIO`, `CAMERA`) |
| **Web** | Static Metro Export | Responsive adaptive layout |

---

## 🔒 Security & Privacy Commitments

Kinly treats family data as sacrosanct:
- **Zero Plaintext Credentials**: All passwords hashed with unique random salt.
- **Granular Member Consent**: Telemetry (location and battery) can be toggled per member at any time.
- **No Monetization of Family Data**: Designed from day one for zero ad-network tracking.

---

## 📄 License
Kinly is distributed under the MIT License. See [LICENSE](./LICENSE) for details.

Developed with ❤️ for families everywhere.
# family-companion
