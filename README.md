# 🏡 Kinly — The Private, Intelligent Family Companion

<p align="center">
  <img src="./assets/images/icon.png" width="96" height="96" alt="Kinly Logo" style="border-radius: 20px;" />
</p>

<p align="center">
  <strong>A cloud-native family operating system bridging household coordination, passive device safety telemetry, physical memory indexing, and emergency dispatch.</strong>
</p>

<p align="center">
  <a href="https://www.wemakedevs.org/aws/first-commit"><img src="https://img.shields.io/badge/Hackathon-AWS_First_Commit_by_WeMakeDevs-FF9900.svg?logo=amazon-aws" alt="AWS First Commit" /></a>
  <img src="https://img.shields.io/badge/Expo-SDK_57-blue.svg" alt="Expo SDK 57" />
  <img src="https://img.shields.io/badge/React_Native-0.86-61DAFB.svg" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Backend-Node_20_Express_WS-339933.svg" alt="Backend" />
  <img src="https://img.shields.io/badge/Cloud-AWS_App_Runner_%7C_S3_%7C_DynamoDB-232F3E.svg?logo=amazon-aws" alt="AWS Cloud" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" />
</p>

---

> ### 🏆 Built for AWS First Commit
> Turning fragmented household communication and high-stress family safety micro-coordinations into a reliable, privacy-first companion powered by **AWS Cloud-Native Services**.

---

## 1. Why This Project?

### The Problem
Modern households rely on a chaotic patchwork of generic consumer tools:
- **Alert Fatigue in Chat Apps**: Important family updates (e.g., doctor appointments, school pickups, utility bill deadlines) get buried inside noisy WhatsApp, iMessage, or Telegram groups.
- **Invasive vs. Non-Existent Tracking**: Existing family safety apps rely on invasive, battery-draining continuous GPS tracking that feels like surveillance. Conversely, when an aging parent's phone runs out of battery or stays on silent during an emergency, family members have zero visibility.
- **The "Physical Memory" Void**: Families waste cumulative hours searching for misplaced physical belongings ("Where is Dad's passport?", "Where did we put the spare house keys?").
- **Accessibility Barrier**: Enterprise productivity suites (Notion, Asana) are completely unusable for elderly grandparents or young children.

### Our Solution
**Kinly** (FamilyOS) is a private, multi-generational household companion designed specifically for family dynamics:
1. **Passive Ambient Telemetry**: Provides at-a-glance awareness of phone battery levels, charging status, ringer states (`Sound`, `Vibrate`, `Silent`, `DND`), and broad safe zones without invasive continuous surveillance.
2. **Physical Vault & Memory Engine**: Indexes physical storage locations (drawers, shelves, cupboards) alongside encrypted digital documents.
3. **Emergency SOS & Multi-Channel Broadcast**: A 2-second hold-to-confirm SOS mechanism that dispatches real-time WebSocket alerts, stores immutable audit records in **Amazon DynamoDB**, broadcasts high-priority SMS via **Amazon SNS**, and records cloud telemetry alarms in **Amazon CloudWatch**.
4. **Intelligent Assistance**: Integrates **Amazon SageMaker** and **Amazon Bedrock** for conversational family assistance and automated document processing.
5. **Dual-Mode & Age-Aware Experience**: Includes an automatic simplified, high-contrast, large touch-target interface tailored for elderly family members (auto-enabled when age > 50) alongside an intuitive glassmorphic dashboard for organizers.

### Why It Matters
Family safety and coordination cannot afford infrastructure downtime or data leaks. By anchoring critical event pipelines to managed AWS cloud infrastructure, Kinly provides enterprise-grade reliability and low latency to everyday families.

---

## 2. The Big Idea

Rather than expecting family members to manually maintain complex databases or manage separate apps for calendars, chores, document storage, and tracking, **Kinly acts as an ambient intelligent living room**.

- **Event-Driven Resilience**: Mission-critical actions—such as an emergency alert—instantly branch out to local in-app WebSocket subscribers while simultaneously executing transactional SMS delivery through **Amazon SNS** and publishing to **Amazon EventBridge**.
- **Hybrid-Cloud Architecture**: The backend utilizes a local high-performance transactional database (SQLite) alongside AWS cloud storage (**Amazon S3**), serverless streaming persistence (**Amazon DynamoDB**), and managed inference (**Amazon SageMaker / Bedrock**), ensuring the system operates with zero disruption even when network connectivity fluctuates.

---

## 3. Key Features

| Feature Area | User Experience & Capability | Supported AWS / System Service |
| :--- | :--- | :--- |
| **Live Family Radar Map** | Visual SVG radar canvas tracking member locations, safe zone geofences (Home, Office, School), and live device state indicators. | Real-time WebSocket Bus + `family_places` |
| **Passive Device Telemetry** | View each family member's battery percentage, charging state, ringer mode, and device model without demanding active check-ins. | **Amazon DynamoDB** (`KinlyTelemetryStream`) |
| **Emergency SOS Dispatch** | 2-second hold-to-confirm SOS triggers animated alert overlays across all family devices, dispatches SMS, and logs incident records. | **Amazon SNS** + **Amazon DynamoDB** + **CloudWatch** |
| **Physical Memory Engine** | Searchable catalog of household items ("Where is Dad's passport?") with drawer/shelf tags and photo verification. | Indexed Relational Engine (`memories`) |
| **Digital Document Vault** | Upload medical prescriptions, utility bills, and insurance policies with automated category tagging and secure download access. | **Amazon S3** (`kinly-family-vault` with AES-256 SSE) |
| **AI Document Analyzer & OCR** | Extracts amounts, due dates, and issuers from utility bills and health cards, suggesting automatic calendar reminders. | **Amazon SageMaker AI** & **Amazon Bedrock** |
| **Interactive Event & Care Planner** | Unified timeline combining family calendar events, tasks, and recurring medication reminders with custom inline `CalendarDatePicker` and tactile `TimeDialerPicker`. | `events`, `tasks`, and `reminders` repos |
| **Age-Aware Elderly Accessibility** | Single-tap dashboard with 48px+ touch targets, text-to-speech guidance (`expo-speech`), and direct quick-dial cards, **auto-activated when age > 50**. | Dedicated `ElderlyDashboard.tsx` view |
| **Private Family Circles & Handles** | Join or create circles via custom unique **Family ID handles** (e.g. `@sharmafamily`) and instant QR code sharing with zero ad tracking. | Cryptographic Token Validator + SQLite |

---

## 4. AWS at the Core ☁️

AWS services are not decorative add-ons in Kinly; they form the operational backbone of our document security, real-time safety telemetry, emergency notifications, and infrastructure deployment.

| AWS Service | Repository Implementation | Engineering Benefit |
| :--- | :--- | :--- |
| **Amazon S3** | [`server/src/aws/s3.service.ts`](./server/src/aws/s3.service.ts) | Encrypted object storage for sensitive family documents, medical records, and receipts with bucket-level AES-256 Server-Side Encryption and time-limited Presigned Get URLs. |
| **Amazon DynamoDB** | [`server/src/aws/dynamodb.service.ts`](./server/src/aws/dynamodb.service.ts) | Single-table telemetry ingestion (`KinlyTelemetryStream`) handling frequent battery/location pings with a 30-day automated TTL, plus an immutable emergency incident ledger (`KinlyEmergencyEvents`). |
| **Amazon SNS** | [`server/src/aws/sns.service.ts`](./server/src/aws/sns.service.ts) | Immediate delivery of transactional high-priority SMS alerts to family phone numbers when an Emergency SOS is triggered, alongside fan-out topic broadcasts (`KinlyEmergencyAlerts`). |
| **Amazon CloudWatch & Logs** | [`server/src/aws/cloudwatch.service.ts`](./server/src/aws/cloudwatch.service.ts) | Publishes custom operational metrics (`EmergencySOSTriggered`, `ActiveFamilyPings`, `DocumentScannedCount`) to custom namespace `Kinly/FamilyOS`, paired with security audit streams in `/aws/kinly/backend`. |
| **Amazon EventBridge** | [`server/src/aws/eventbridge.service.ts`](./server/src/aws/eventbridge.service.ts) | Asynchronous domain event bus (`KinlyEmergencySOS`, `KinlyTaskCreated`, `KinlyDocumentUploaded`) enabling decoupled downstream integrations without blocking client requests. |
| **Amazon SageMaker & Bedrock** | [`server/src/aws/sagemaker.service.ts`](./server/src/aws/sagemaker.service.ts) | SageMaker endpoint execution (`InvokeEndpointCommand`) and Bedrock Foundation Model invocation (`InvokeModelCommand` with Claude 3 Haiku) for intelligent family context querying and multimodal document analysis. |
| **AWS App Runner** | [`server/apprunner.yaml`](./server/apprunner.yaml), [`server/Dockerfile`](./server/Dockerfile) | Fully managed containerized service configuration for building, deploying, and auto-scaling the Node.js 20 backend with integrated health checks. |
| **AWS STS** | [`server/src/aws/provision.ts`](./server/src/aws/provision.ts) | Verifies cloud caller identity (`GetCallerIdentityCommand`) during automated SDK-based resource provisioning. |

---

## 5. System Architecture

### Architectural Topology

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Client Tier (Expo / React Native)                     │
│   iOS Client  •  Android Client  •  Web Client  •  Elderly Accessibility Mode   │
└─────────────────────────┬───────────────────────────────┬───────────────────────┘
                          │ HTTPS REST                    │ WSS Bi-directional
                          ▼                               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      Kinly Backend Tier (Node.js 20 / Express)                  │
│                      [AWS App Runner / Containerized Service]                   │
│                                                                                 │
│   ├── JWT Auth & Rate Limiter          ├── WebSocket Broadcast Hub              │
│   ├── Family & Member Controllers      ├── Telemetry & Geofence Engine          │
│   └── S3 Document & Vault Handlers     └── SageMaker / Bedrock AI Router        │
└───────┬──────────────┬──────────────┬──────────────┬──────────────┬─────────────┘
        │              │              │              │              │
        ▼              ▼              ▼              ▼              ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
│  Amazon S3   ││Amazon DynamoDB││  Amazon SNS  ││ Amazon Cloud-││Amazon Event-│
│ Family Vault ││ Telemetry &  ││ Transactional││  Watch Logs  ││    Bridge    │
│  Presigned   ││ SOS Streams  ││   Emergency  ││  & Custom    ││ Domain Event │
│  Documents   ││  (30-day TTL)││  SMS Alerts  ││   Metrics    ││     Bus      │
└──────────────┘└──────────────┘└──────────────┘└──────────────┘└──────────────┘
        ▲                                                               │
        └───────────────────────────────────────────────────────────────┘
                               Asynchronous Event Flows
```

### End-to-End Request Flows

#### 1. Emergency SOS Dispatch Flow
1. **User Action**: A family member presses and holds the SOS button on the dashboard for 2 seconds.
2. **Client Dispatch**: The mobile client initiates a 5-second countdown cancel sheet while dispatching `POST /api/telemetry/sos` with GPS coordinates, battery level, and user relation.
3. **Internal Broadcast**: The backend instantly broadcasts an `EMERGENCY_SOS` payload across the connected WebSocket bus to all family members' screens.
4. **AWS Ingestion**:
   - **DynamoDB**: Records an immutable incident record in `KinlyEmergencyEvents`.
   - **SNS**: Publishes an urgent transactional SMS to family contact numbers and sends a broadcast to the `KinlyEmergencyAlerts` topic.
   - **CloudWatch**: Increments the `EmergencySOSTriggered` metric in namespace `Kinly/FamilyOS` and writes an audit event to `/aws/kinly/backend`.
   - **EventBridge**: Emits a `KinlyEmergencySOS` domain event.
5. **Client Response**: Family members' screens render an urgent red banner with direct links to the live map.

#### 2. Vault Document Ingestion & Storage Flow
1. **User Action**: A user uploads a prescription, medical record, or utility bill in the Vault tab.
2. **Client Dispatch**: The client sends the document metadata and file payload to `POST /api/vault/documents`.
3. **AWS Execution**:
   - **S3**: The file is stored under `families/{familyId}/documents/{docId}.jpg` with AES-256 encryption. A secure 24-hour presigned URL is generated.
   - **SageMaker / Bedrock**: Optional document parsing extracts provider, total amount, and due dates.
4. **Data Persistence**: The parsed metadata and category tags are saved in the relational database with a reference link to the S3 object key.
5. **Event Delivery**: An event is published to EventBridge (`KinlyDocumentUploaded`) and broadcast over WebSockets to sync all family members' vault lists.

---

## 6. Why AWS?

### Scalability
- **High-Frequency Telemetry**: Family location and device heartbeats generate hundreds of write requests per family per day. Offloading these write spikes to **Amazon DynamoDB** with On-Demand capacity ensures consistent single-digit millisecond latency without saturating relational connection pools.
- **Elastic Compute**: Packaging the backend container via **AWS App Runner** enables automatic horizontal scaling in response to traffic spikes during emergency events.

### Reliability & Fault Isolation
- **Dual-Storage Isolation**: Mission-critical reads (app navigation, member profiles) run with zero network overhead from the local database, while file storage (**S3**), audit logging (**CloudWatch**), and emergency notifications (**SNS**) leverage highly available AWS infrastructure.
- **Graceful Cloud Fallback**: The codebase includes an adaptive configuration provider ([`awsConfig.ts`](./server/src/aws/awsConfig.ts)) that detects live AWS credentials and provides simulation fallback during offline or local development.

### Security
- **Encryption by Default**: All S3 assets use bucket-level server-side encryption (`AES256`).
- **Short-Lived Presigned URLs**: Family documents are never made public. Access is granted exclusively through short-lived presigned URLs generated on demand.
- **Zero Hardcoded Secrets**: All AWS credentials, region identifiers, and resource names are injected through environment variables.

### Observability
- **Custom CloudWatch Metrics**: The application publishes domain-specific operational metrics (`EmergencySOSTriggered`, `ActiveFamilyPings`, `DocumentScannedCount`) enabling targeted alarms without third-party monitoring agents.

---

## 7. Architecture Decisions

| Engineering Decision | Rationale | Trade-Off Considered |
| :--- | :--- | :--- |
| **Hybrid Persistence (Relational Database + Amazon DynamoDB)** | Core family relationships and planner items require relational foreign key constraints and fast local reads, while high-frequency telemetry logs require the infinite write scalability and automated TTL of DynamoDB. | Maintaining two data models in exchange for clean workload isolation and zero relational database bloat. |
| **S3 Presigned URLs vs. Direct File Proxying** | Generating S3 presigned URLs offloads high-bandwidth file transfers directly to AWS S3, reducing memory and bandwidth pressure on the backend container. | Requires client handling of direct S3 URLs instead of routing all files through custom API streams. |
| **AWS SDK v3 Modular Imports** | Only specific client packages (`@aws-sdk/client-s3`, `@aws-sdk/client-dynamodb`, etc.) are imported rather than the monolithic AWS SDK, keeping production bundle size lean. | Requires individual client dependency management across the server module. |
| **Dual AI Gateway (SageMaker + Bedrock)** | Allows teams with provisioned custom SageMaker endpoints to use them, while supporting Bedrock Foundation Models (Claude 3 Haiku) as a serverless alternative. | Requires multi-provider fallback handling in the AI service layer. |
| **In-House Gesture Date & Time Pickers** | Native modal date/time pickers present platform inconsistencies, modal stacking glitches, and dark-mode styling issues. Custom `CalendarDatePicker` and `TimeDialerPicker` components provide smooth inline tactile UX across platforms. | Requires maintaining dedicated calendar/time dialer gesture components in the codebase. |

---

## 8. Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Mobile / Frontend** | React Native 0.86, Expo SDK 57, Expo Router (File-based), React 19, TypeScript |
| **UI & Styling** | Custom Glassmorphic Design System, Linear Gradients (`expo-linear-gradient`), Tactile Haptics (`expo-haptics`), Vector Icons (`@expo/vector-icons`) |
| **Interactive Form Components** | Gesture-driven `CalendarDatePicker` (inline visual calendar grid) & `TimeDialerPicker` (smooth time selection dialer) |
| **Accessibility & Voice** | `expo-speech` (Text-to-Speech feedback), automatic age-triggered Elderly Mode (age > 50), 48px+ touch targets |
| **Backend Compute** | Node.js 20 LTS, Express 4, TypeScript, Native WebSocket (`ws`) |
| **Cloud Storage** | **Amazon S3** (Secure Document Vault & Presigned URLs with AES-256 SSE) |
| **Cloud Database** | **Amazon DynamoDB** (Telemetry Streams & SOS Records with 30-day TTL) |
| **Cloud Messaging** | **Amazon SNS** (Transactional SMS & Alert Fan-out) |
| **Cloud Intelligence** | **Amazon Bedrock** (Claude 3 Haiku) & **Amazon SageMaker Runtime** |
| **Observability** | **Amazon CloudWatch** (Custom Metrics) & **CloudWatch Logs** (Audit Streams) |
| **Event Routing** | **Amazon EventBridge** (Domain Events) |
| **Cloud Deployments** | Docker, **AWS App Runner** (`apprunner.yaml`), Render (`render.yaml`), Railway (`railway.json`), EAS Build (`eas.json`) |
| **Local Persistence** | SQLite (`better-sqlite3`) with foreign key enforcement and indexed queries |
| **Authentication** | Salted password hashes (`bcryptjs`), JWT Session Bearer tokens |

---

## 9. End-to-End Workflow

```
1. Onboarding
   User Register / Login ──> Verification Code ──> Create or Join Family Circle via Family ID (@handle) or QR Code

2. Daily Ambient Presence
   Background Telemetry ──> POST /api/telemetry/device ──> Real-time WebSocket sync + Amazon DynamoDB TTL stream

3. Physical & Digital Vault
   Upload Asset / Log Memory ──> POST /api/vault/documents ──> Amazon S3 Encryption + Metadata Tagging ──> Saved to Family Vault

4. Unified Planning
   Add Task / Event / Med ──> Tactile Calendar & Time Dialer ──> POST /api/planner/* ──> Synced to family timeline

5. Emergency Dispatch
   Hold SOS (2s) ──> POST /api/telemetry/sos ──> Amazon SNS SMS + Amazon DynamoDB Record + CloudWatch Alarms + WebSocket Fanout
```

---

## 10. Screenshots & UI Gallery

> *The Kinly interface combines modern glassmorphism with high-legibility family safety controls:*

| 1. Live Family Radar & Telemetry | 2. Emergency SOS (Hold-to-Confirm) | 3. Physical Memory & Vault |
| :---: | :---: | :---: |
| <img src="./assets/images/logo-glow.png" width="240" alt="Radar Dashboard" /><br/>*Real-time member radar, battery, and safe zones* | <img src="./assets/images/icon.png" width="240" alt="Emergency SOS" /><br/>*2-second hold-to-confirm emergency broadcast* | <img src="./assets/images/logo.png" width="240" alt="Vault & Memory" /><br/>*Physical item finder and encrypted document vault* |

| 4. Unified Family Planner | 5. Elderly Accessibility Dashboard | 6. Household Invitation & QR |
| :---: | :---: | :---: |
| *Events, household tasks, and care reminders in one feed* | *High contrast, 48px+ touch targets, and voice support (auto age > 50)* | *Custom Family ID (@handle) and instant camera QR linking* |

- 📦 **Repository**: [https://github.com/asry16/family-companion](https://github.com/asry16/family-companion)
- 🌐 **Local Backend API**: `http://localhost:3001`
- 📱 **Local Metro Bundler**: `http://localhost:8081`

---

## 11. Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ LTS recommended)
- **Package Manager**: `npm` v9+
- **Mobile Testing**: [Expo Go](https://expo.dev/go) app on iOS / Android or an emulator

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/asry16/family-companion.git
cd family-companion

# Install mobile frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### 2. Configure Environment Variables

#### App Configuration (`.env`)
Copy the root environment template:
```bash
cp .env.example .env
```
Key configuration:
```env
# Point to local server (or live AWS backend e.g. http://100.54.121.185:3001)
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
```

#### Backend Server Configuration (`server/.env`)
Copy the backend environment template:
```bash
cp server/.env.example server/.env
```
Key environment configuration variables in `server/.env`:
```env
PORT=3001
JWT_SECRET=your_jwt_secret_key

# AWS Cloud Credentials (IAM User or AWS Event Engine Sandbox Credentials)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
# AWS_SESSION_TOKEN=your_session_token (only if using temporary sandbox tokens)

# AWS Resource Names
AWS_S3_BUCKET=kinly-family-vault
AWS_DYNAMODB_TELEMETRY_TABLE=KinlyTelemetryStream
AWS_DYNAMODB_SOS_TABLE=KinlyEmergencyEvents
AWS_CLOUDWATCH_LOG_GROUP=/aws/kinly/backend
AWS_EVENTBRIDGE_BUS=default
```
*(Note: If AWS credentials are not provided, Kinly runs using its simulated fallback mode, logging cloud actions to stdout without errors).*

### 3. Automated AWS Cloud Provisioning (Optional)
To automatically verify STS identity and provision the S3 bucket, DynamoDB tables, SNS topic, and CloudWatch log group via the AWS SDK:
```bash
cd server
npm run build
npx tsx src/aws/provision.ts
cd ..
```

### 4. Run the Development Servers

In two separate terminal windows:

**Terminal 1 — Backend API & WebSocket Server:**
```bash
npm run server
# Starts API and WebSockets on http://localhost:3001
```

**Terminal 2 — Expo Mobile & Web App:**
```bash
npm run dev
# Or: npm start (expo start)
```
> **Tip**: Use `npm run dev` (or `npm start`). Do not run `npx run dev`.

From the Metro terminal:
- Press **`w`** to open in Web browser (`http://localhost:8081`).
- Press **`i`** to launch iOS Simulator.
- Press **`a`** to launch Android Emulator.
- Scan the displayed terminal QR code using **Expo Go** on a physical device.

### 5. Building Standalone Mobile Binaries (EAS Build)
Kinly includes configured EAS build profiles (`eas.json`) targeting standalone Android APKs and development builds:
```bash
# Build standalone preview Android APK
npm run build:apk

# Build standalone Android development client
npm run build:dev
```

---

## 12. Project Structure

```
family-companion/
├── app.json                       # Expo config & native permissions (usesCleartextTraffic)
├── eas.json                       # EAS Build profiles (preview APK & dev client)
├── render.yaml                    # Render Cloud deployment blueprint
├── railway.json                   # Railway container deployment configuration
├── assets/                        # Icons, splash screens, and image assets
├── server/                        # Cloud-Native Node.js Backend
│   ├── Dockerfile                 # Multi-stage production container build
│   ├── apprunner.yaml             # AWS App Runner deployment configuration
│   ├── data/                      # Local storage & SQLite data volume
│   └── src/
│       ├── aws/                   # Modular AWS SDK v3 Service Layer
│       │   ├── awsConfig.ts       # Central AWS credentials provider & simulator
│       │   ├── s3.service.ts      # Amazon S3 upload & presigned URL generator
│       │   ├── dynamodb.service.ts# Amazon DynamoDB telemetry & SOS tables
│       │   ├── sns.service.ts     # Amazon SNS SMS & topic publisher
│       │   ├── cloudwatch.service.ts # Amazon CloudWatch metrics & log streams
│       │   ├── eventbridge.service.ts # Amazon EventBridge domain event bus
│       │   ├── sagemaker.service.ts   # Amazon SageMaker & Bedrock AI inference
│       │   └── provision.ts       # Automated AWS resource provisioning script
│       ├── db/                    # Relational schema & repository layer
│       ├── middleware/            # JWT authentication & request validation
│       ├── routes/                # Modular API endpoints (auth, family, telemetry, etc.)
│       ├── websocket.ts           # Real-time WebSocket family bus
│       └── index.ts               # HTTP & WebSocket server entry point
├── src/                           # Mobile Frontend (React Native & Expo)
│   ├── app/                       # Expo Router file-based screen routes
│   │   ├── (auth)/                # Login, Register, Verification
│   │   ├── (tabs)/                # Main bottom tabs (Dashboard, Circle, Plans, Vault, AI)
│   │   └── modal/                 # Family settings, notifications, new plan modal
│   ├── components/                # Domain cards, radar map, and UI primitives
│   │   ├── circle/                # Family Circle map, members, and invite sheets
│   │   ├── home/                  # Command center, SOS trigger, telemetry cards
│   │   ├── simple/                # Elderly accessibility dashboard & quick dials
│   │   ├── ui/                    # CalendarDatePicker, TimeDialerPicker, FamilyQRCode
│   │   └── vault/                 # Document lists, category filters, memory catalog
│   ├── constants/                 # Theme tokens, spacing, and styling constants
│   ├── context/                   # Auth, Family, Theme, and Voice contexts
│   ├── services/                  # API client, WebSocket listener, Location services
│   └── types/                     # Shared TypeScript domain models
└── README.md
```

---

## 13. Security

- **Cryptographic Credential Hashing**: User passwords are encrypted using `bcryptjs` with unique random salts. Passwords are never stored or logged in plain text.
- **Session Authentication**: Authenticated API routes require a valid JSON Web Token (`JWT`) passed via the `Authorization: Bearer <token>` header.
- **Data Isolation**: All family records (tasks, events, documents, telemetry) are scoped by `family_id`, verified against the authenticated user's active session.
- **S3 Server-Side Encryption**: Storage buckets enforce `AES256` server-side encryption (`ApplyServerSideEncryptionByDefault`).
- **Temporary Access Grants**: File downloads are mediated via time-limited presigned URLs (default: 24-hour expiration) rather than public bucket ACLs.
- **Brute-Force Rate Limiting**: Client authentication incorporates lockout protection after consecutive failed sign-in attempts.

---

## 14. Testing & Verification

- **TypeScript Compilation Check**:
  ```bash
  # Client verification
  npx tsc --noEmit

  # Server verification
  cd server && npm run build && cd ..
  ```
- **Backend Health Check**:
  ```bash
  curl -s http://localhost:3001/api/health
  # Response: {"status":"ok","service":"Kinly FamilyOS API Server","version":"1.0.0"}
  ```
- **AWS Provisioning Verification**:
  ```bash
  cd server && npx tsx src/aws/provision.ts
  # Verifies STS credentials and queries S3/DynamoDB/CloudWatch
  ```

---

## 15. Challenges We Solved

1. **Unifying Real-Time WebSocket Alerts with Asynchronous Cloud Pipelines**
   - *Challenge*: Delivering sub-second alert popups to family members while reliably writing to DynamoDB and sending SMS notifications via SNS without blocking the Node.js event loop.
   - *Approach*: Implemented immediate in-memory WebSocket broadcasts to connected clients followed by non-blocking asynchronous dispatch to AWS SDK clients.
   - *Result*: Zero perceivable latency on user devices during emergency triggers.

2. **Cross-Platform Audio & Age-Aware Accessibility**
   - *Challenge*: Younger household members favor rapid micro-interactions and sleek glassmorphism, whereas elderly parents or grandparents require high-contrast buttons, voice assistance, and zero visual clutter.
   - *Approach*: Built an automated `ElderlyDashboard` system that detects user age (> 50) upon registration or profile updates to seamlessly transition into accessibility mode, accompanied by `expo-speech` voice announcements and 48px+ touch targets.
   - *Result*: A single unified application serving all family generations without code fragmentation.

3. **Eliminating Native Date & Time Picker Flaws**
   - *Challenge*: Default React Native date/time picker modules suffer from OS-dependent styling quirks, modal layering bugs on Android, and inconsistent dark-theme rendering.
   - *Approach*: Engineered custom in-house gesture components—[`CalendarDatePicker`](./src/components/ui/CalendarDatePicker.tsx) featuring an intuitive month grid and [`TimeDialerPicker`](./src/components/ui/TimeDialerPicker.tsx) with a tactile smooth scroll dialer.
   - *Result*: Seamless, reliable date and time input experience across iOS, Android, and Web.

4. **Android Cleartext Traffic Handling for Cloud & LAN Backends**
   - *Challenge*: Modern Android versions block cleartext HTTP network requests by default, preventing test devices and APK builds from connecting to development or self-hosted AWS App Runner IP addresses.
   - *Approach*: Integrated `expo-build-properties` within `app.json` to enable `usesCleartextTraffic: true` for development and preview profiles.
   - *Result*: Reliable, zero-hassle mobile device testing against remote AWS backend instances.

5. **Hybrid Cloud Development Workflow**
   - *Challenge*: Enabling team members to develop and test features locally without requiring active AWS accounts or risking unexpected cloud charges during rapid frontend iteration.
   - *Approach*: Developed an adaptive AWS configuration layer ([`awsConfig.ts`](./server/src/aws/awsConfig.ts)) that detects live AWS credentials and gracefully falls back to structured simulation logging when offline.
   - *Result*: Seamless local development with zero configuration friction.

---

## 16. What We Learned

- **AWS SDK v3 Modularity**: Transitioning from monolithic SDK imports to modular clients significantly streamlined our dependency footprint and reduced cold start times.
- **Single-Table Design Nuances**: Structuring DynamoDB keys (`PK: FAMILY#<id>`, `SK: MEMBER#<id>#<timestamp>`) with automated TTL enabled scalable telemetry logging without manual cleanup cron jobs.
- **Empathetic Engineering**: Building for families requires prioritizing calm, passive awareness over engagement-seeking notifications, coupled with smart age-aware adaptations that respect user capabilities.

---

## 17. Future Roadmap

### Near Term
- [ ] Integration of Amazon Polly for customized voice prompts in multiple regional languages.
- [ ] Automated geofence entry/exit detection using background mobile location services.

### Next
- [ ] Amazon Bedrock agent workflow for automated family chore negotiation and conflict resolution.
- [ ] Integration with AWS IoT Core for connected home emergency button hardware.

### Long Term
- [ ] End-to-end encrypted biometric vault storage with AWS KMS customer-managed keys (CMK).
- [ ] Multi-region active-active deployment using Amazon DynamoDB Global Tables.

---

## 18. Team

| Team Member | Role | Core Contributions |
| :--- | :--- | :--- |
| **Asmita Roy** | Full-Stack & UI/UX Engineer | Product architecture, React Native design system, glassmorphic UI, planner workflows, and client state management. |
| **Ritu Raj** | Cloud & Systems Engineer | Node.js backend services, AWS SDK v3 integration (S3, DynamoDB, SNS, SageMaker, CloudWatch), and deployment pipelines. |

---

## 19. Hackathon Context

This project was built for the **AWS First Commit** hackathon organized by **WeMakeDevs**.

- **Event Overview**: A community hackathon challenging builders to construct innovative, cloud-native solutions leveraging Amazon Web Services.
- **Official Hackathon Portal**: [https://www.wemakedevs.org/aws/first-commit](https://www.wemakedevs.org/aws/first-commit)

---

## 20. Summary

We built **Kinly** to solve fragmented household coordination and family safety challenges with a practical, scalable architecture powered by **AWS**. By combining local responsiveness with cloud-native reliability across **Amazon S3**, **Amazon DynamoDB**, **Amazon SNS**, **Amazon CloudWatch**, **Amazon EventBridge**, and **Amazon SageMaker / Bedrock**, Kinly demonstrates how modern cloud architecture can bring peace of mind to everyday families.

- 📦 **GitHub Repository**: [https://github.com/asry16/family-companion](https://github.com/asry16/family-companion)
- 🏆 **Hackathon**: [AWS First Commit by WeMakeDevs](https://www.wemakedevs.org/aws/first-commit)
- 📄 **License**: [MIT](./LICENSE)