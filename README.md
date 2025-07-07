# Thrive - Holistic Healing AI App

A premium Next.js mobile-first application for holistic healing, featuring AI-powered wellness routines and personalized health guidance.

## Features

### 🤖 AI Chat Interface
- Real-time streaming responses with Server-Sent Events (SSE)
- Smart card parsing for structured health content
- Emergency alert handling with immediate attention indicators
- Interactive action cards for appointments, medicines, and routines
- Question suggestions with click-to-ask functionality
- "Your Next Victory Awaits 🏆" motivational messaging

### 💪 Wellness Routines
- AI-generated personalized routines based on health concerns
- Multiple routine types: sleep, stress management, pain relief, meditation, exercise
- Smart reminder frequency (AI-determined based on condition severity)
- Progress tracking with step completion
- Video tutorial integration
- Routine management (create, view, adjust, delete)
- Beautiful gradient border cards with smooth animations

### 🎨 Premium UI/UX
- Beautiful color theme with rose/burgundy and sage green families
- Gradient borders and hover effects
- Mobile-first responsive design
- Smooth animations and transitions
- Custom scrollbar styling
- Soft shadows with theme colors

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom theme colors
- **AI Integration**: OpenAI Assistant API
- **Icons**: Lucide React
- **State Management**: React hooks

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/thrive-app.git
   cd thrive-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with:
   ```env
   OPENAI_API_KEY=your_api_key_here
   OPENAI_ASSISTANT_ID=your_assistant_id_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Color Theme

The app uses a carefully crafted color palette:

- **Base Colors**:
  - Root Background: `#f7e1e5` (soft blush pink)
  - Primary Text: `#3a5163` (slate blue)
  - Secondary Text: `#4a5568` (lighter slate)

- **Rose/Burgundy Family** (Primary):
  - Strong Rose: `#e11d48`
  - Rose: `#fb7185`
  - Dusty Rose: `#daa0a9`
  - Burgundy: `#914372`

- **Sage Green Family** (Secondary):
  - Sage Light: `#a3bfa0`
  - Sage: `#87a878`
  - Sage Dark: `#6b8c5f`

## API Endpoints

- `POST /api/assistant/stream` - Stream AI chat responses
- `POST /api/routine/create` - Create personalized wellness routines
- `POST /api/routine/adjust` - Adjust existing routines based on feedback

## Project Structure

```
thrive-app/
├── app/
│   ├── api/
│   │   ├── assistant/stream/
│   │   └── routine/
│   │       ├── create/
│   │       └── adjust/
│   ├── routines/
│   └── page.tsx
├── components/
│   └── features/
│       ├── SmartCardChat.tsx
│       └── RoutineCreationModal.tsx
├── src/
│   └── services/
│       └── openai/
└── public/
```

## Development Guidelines

- Use inline styles with Tailwind classes for flexibility
- Reuse gradient utilities defined in globals.css
- Follow the mobile-first responsive design approach
- Maintain the premium feel with smooth animations and transitions

## License

This project is proprietary and confidential.