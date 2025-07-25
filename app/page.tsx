'use client';

import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation'; // Removed - no longer needed after removing onboarding
import Image from 'next/image';
import { BottomNavLayout } from '@/components/layout/BottomNavLayout';
// import BottomNav from '@/components/layout/BottomNav';
import { NextActivities } from '@/components/home/NextActivities';
import { WellnessJourney } from '@/components/home/WellnessJourney';
import { ProductRecommendations } from '@/components/home/ProductRecommendations';
import { WellnessCompanionCTA } from '@/components/home/WellnessCompanionCTA';
// import { WelcomeOnboarding } from '@/components/home/WelcomeOnboarding'; // Removed - no longer using onboarding
// import { useLocalStorageState } from '@/src/hooks/useLocalStorageState'; // Removed - no longer needed
import { getThrivingsFromStorage } from '@/src/utils/thrivingStorage';
import { getPantryItems } from '@/src/utils/pantryStorage';
import { getChatHistory } from '@/src/utils/chatStorage';
// import { useAuth } from '@/src/contexts/AuthContext'; // Removed - auth moved to Discover page
// import { PhoneAuthModal } from '@/components/auth/PhoneAuthModal'; // Removed - auth moved to Discover page
// import Button from '@/components/ui/Button'; // Removed - auth moved to Discover page
import type { Thriving } from '@/src/types/thriving';
import type { ChatHistoryItem } from '@/src/types/chat';

export default function HomeV2Page() {
  // const router = useRouter(); // Removed - no longer needed
  // const { user, loading } = useAuth(); // Removed - auth moved to Discover page
  // const [showAuthModal, setShowAuthModal] = useState(false); // Removed - auth moved to Discover page
  // Removed onboarding and userName states - no longer needed
  const [thrivings, setThrivings] = useState<Thriving[]>([]);
  const [pantryItems, setPantryItems] = useState<Array<{
    id?: string;
    name?: string;
  }>>([]);
  const [latestChat, setLatestChat] = useState<ChatHistoryItem | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [thrivingsData, pantryData] = await Promise.all([
          getThrivingsFromStorage(),
          getPantryItems()
        ]);
        setThrivings(thrivingsData);
        setPantryItems(pantryData);
        
        // Get latest chat
        const chatHistory = getChatHistory();
        if (chatHistory.length > 0) {
          setLatestChat(chatHistory[0]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const timeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const greeting = `Good ${timeOfDay()}!`;

  // Onboarding removed - go straight to home page

  // Custom header with logo and greeting
  const customHeader = (
    <div className="bg-white shadow-sm">
      <div className="flex items-center justify-between" style={{ padding: '4vw 5vw' }}>
        <div className="flex items-center" style={{ gap: '3vw' }}>
          <div className="flex items-center justify-center relative shadow-lg" style={{ width: '12vw', height: '12vw', borderRadius: '4vw', background: 'linear-gradient(135deg, var(--logo-pink), var(--logo-pink-dark))' }}>
            <div style={{ width: '7vw', height: '7vw', position: 'relative' }}>
              <Image 
                src="/leaf_wireframe.png" 
                alt="Thrive" 
                fill
                style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                priority
              />
            </div>
          </div>
          <div>
            <h1 className="font-bold" style={{ fontSize: '6vw', color: 'var(--logo-pink)' }}>
              Thrive
            </h1>
            <p className="text-gray-600" style={{ fontSize: '3vw' }}>{greeting}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <BottomNavLayout
      customHeader={customHeader}
      contentClassName="bg-gray-50"
      className="home-layout"
    >
      <div style={{ padding: '5vw', paddingBottom: '8vh' }}>
        <div style={{ marginBottom: '4vh' }}>
          <NextActivities thrivings={thrivings} />
        </div>
        
        <div style={{ marginBottom: '4vh' }}>
          <WellnessJourney thrivings={thrivings} />
        </div>
        
        <div style={{ marginBottom: '4vh' }}>
          <ProductRecommendations pantryItems={pantryItems} />
        </div>
        
        <div style={{ marginBottom: '4vh' }}>
          <WellnessCompanionCTA latestChat={latestChat} />
        </div>
      </div>

    </BottomNavLayout>
  );
}