# HelpNear MVP

> **Fast. Local. Human.** — A hyper-local help-matching mobile app connecting nearby people instantly.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native (Expo SDK 55, TypeScript) |
| Navigation | expo-router (file-based) |
| Backend | Supabase (Auth, PostgreSQL+PostGIS, Realtime, Edge Functions) |
| Maps | react-native-maps (Google Maps) |
| Location | expo-location |

---

## Project Structure

```
HelpNear/
├── app/                    # expo-router screens
│   ├── _layout.tsx         # Root layout (auth guard)
│   ├── index.tsx           # Splash screen
│   ├── auth/
│   │   ├── phone.tsx       # Phone number entry
│   │   └── otp.tsx         # OTP verification
│   ├── (tabs)/
│   │   ├── _layout.tsx     # Bottom tab navigator
│   │   ├── home.tsx        # Dashboard
│   │   ├── nearby.tsx      # Nearby requests list
│   │   └── profile.tsx     # User profile
│   └── request/
│       ├── new.tsx         # Create help request
│       ├── [id].tsx        # Active help (chat + map)
│       └── panic.tsx       # Safety overlay
├── src/
│   ├── lib/
│   │   ├── supabase.ts     # Supabase client
│   │   ├── constants.ts    # Colors, help types, enums
│   │   └── types.ts        # TypeScript interfaces
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── LocationContext.tsx
│   ├── hooks/
│   │   ├── useNearbyRequests.ts  # PostGIS + Realtime
│   │   ├── useChat.ts            # Realtime chat
│   │   ├── useLiveLocation.ts    # Bidirectional location
│   │   └── usePanic.ts           # Safety trigger
│   └── components/
│       ├── ui/             # Button, Card, Badge
│       ├── home/           # ActionCard
│       ├── requests/       # RequestCard, HelpTypeGrid
│       ├── chat/           # ChatBubble, ChatInput
│       ├── safety/         # PanicButton, SafetyBanner
│       └── map/            # RequestMap
└── supabase/
    ├── schema.sql          # Full DB schema + RLS policies
    ├── seed.sql            # Test data
    └── functions/
        └── panic-alert/    # Edge Function
```

---

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_MAPS_KEY=your-google-maps-key
```

### 2. Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Enable **PostGIS** extension in the Supabase dashboard → Database → Extensions
3. Run `supabase/schema.sql` in the SQL editor
4. Enable **Phone Auth** in Authentication → Providers → Phone
5. Deploy Edge Function:
```bash
npx supabase functions deploy panic-alert
```

### 3. Google Maps API Key

1. Create a Google Maps API key in [Google Cloud Console](https://console.cloud.google.com)
2. Enable: Maps SDK for iOS, Maps SDK for Android
3. Add the key to `app.json` under `ios.config.googleMapsApiKey` and `android.config.googleMaps.apiKey`

### 4. Run the App

```bash
npm install
npx expo start
```

Press `i` for iOS Simulator, `a` for Android Emulator, or scan the QR with Expo Go.

---

## MVP Features

| Feature | Status |
|---|---|
| Phone OTP Login | ✅ |
| Request Help (type, time, urgency, note) | ✅ |
| Location auto-detect | ✅ |
| Nearby requests (PostGIS 500m radius) | ✅ |
| Realtime request updates | ✅ |
| Accept request flow | ✅ |
| In-app realtime chat | ✅ |
| Live location sharing | ✅ |
| Task timer | ✅ |
| Panic button + safety overlay | ✅ |
| Emergency call shortcut | ✅ |
| Row Level Security (Supabase) | ✅ |
| User profile | ✅ |

---

## Security

All security is enforced at the **database level** via Supabase RLS:
- Open requests visible to authenticated users for discovery, but lat/lng protected until accepted
- Chats only visible to requester + accepted helper
- Active sessions (location, panic state) only visible to involved parties
- User can only modify their own data

---

## MVP Campus Deployment Checklist

- [ ] Set `EMERGENCY_NUMBER` in `src/lib/constants.ts` to local emergency number
- [ ] Add trusted contacts feature in profile settings
- [ ] Set up Twilio in Edge Function for SMS panic alerts
- [ ] Replace Google Maps API key placeholders in `app.json`
- [ ] Test on physical devices (location + maps require real device for full functionality)
