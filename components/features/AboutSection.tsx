'use client';

import React from 'react';
import Image from 'next/image';
import { Heart, Shield, Sparkles, BookOpen, Package } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    iconColor: 'text-sage-dark',
    iconBg: 'from-sage-light/30 to-sage/20',
    title: 'Your Wellness Journey',
    description: 'Track your health story with daily journals. No judgment, just insights.',
    image: '/illustrations/journey_story_illustration.png'
  },
  {
    icon: Heart,
    iconColor: 'text-rose',
    iconBg: 'from-rose/20 to-dusty-rose/15',
    title: 'Stress-Free Routines',
    description: 'Gentle reminders without guilt. Life is hard enough - we\'re here to help, not judge.',
    image: '/illustrations/routine.png'
  },
  {
    icon: Package,
    iconColor: 'text-purple-600',
    iconBg: 'from-purple-500/20 to-purple-600/15',
    title: 'Your Wellness Pantry',
    description: 'Keep track of supplements and remedies at home. Your companion uses this to personalize recommendations.',
    image: '/illustrations/pantry.png'
  },
  {
    icon: Sparkles,
    iconColor: 'text-rose',
    iconBg: 'from-rose/20 to-burgundy/15',
    title: 'Natural Wellness Support',
    description: 'Herbs, supplements, and holistic practices - shared as wisdom, not sales.',
    image: '/illustrations/recommend_supplements.png'
  },
  {
    icon: Shield,
    iconColor: 'text-blue-600',
    iconBg: 'from-blue-100 to-blue-200/50',
    title: 'Your Privacy First',
    description: 'All data stored locally on your device. Your journey stays private.',
    image: '/illustrations/privacy.png'
  }
];

export const AboutSection: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-primary-text">About Thrive</h2>
        <p className="text-lg text-secondary-text-thin max-w-2xl mx-auto">
          Your companion for whole-person wellness. We honor your body&apos;s wisdom and celebrate every healing path.
        </p>
      </div>

      {/* Wellness Companion Card */}
      <div className="rounded-3xl bg-gradient-to-br from-dusty-rose/10 to-sage-light/5 p-8 border border-dusty-rose/20">
        <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-primary-text mb-4">Your Wellness Companion</h3>
            <p className="text-secondary-text mb-4">
              Think of us as two caring friends who are always here to listen. Share your symptoms, worries, or wellness goals - no topic is too small or too personal. Your companion helps create personalized routines, tracks your healing journey, and suggests natural remedies that honor your body&apos;s wisdom.
            </p>
            <p className="text-secondary-text-thin italic">
              Every conversation stays private on your device. We&apos;re here to support, never to judge or share your secrets.
            </p>
          </div>
          <div className="relative w-full md:w-48 h-48 flex-shrink-0 mt-6 md:mt-0">
            <Image
              src="/illustrations/companion.png"
              alt="Your wellness companion - two caring birds"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* Philosophy Card */}
      <div className="rounded-3xl bg-gradient-to-br from-sage-light/10 to-sage/5 p-8 border border-sage/20">
        <h3 className="text-xl font-semibold text-primary-text mb-4">Our Philosophy</h3>
        <blockquote className="text-lg text-secondary-text italic">
          &ldquo;Life is hard enough - your wellness app should be a source of comfort, not another thing to &apos;fail&apos; at.&rdquo;
        </blockquote>
        <p className="mt-4 text-secondary-text-thin">
          We don&apos;t track completion rates or judge missed days. Every small step matters, 
          and we&apos;re here to support you wherever you are in your journey.
        </p>
      </div>

      {/* Holistic Approach Card */}
      <div className="rounded-3xl bg-gradient-to-br from-lavender/10 to-soft-lavender/5 p-8 border border-lavender/20">
        <h3 className="text-xl font-semibold text-primary-text mb-4">Whole-Person Wellness</h3>
        <p className="text-secondary-text mb-4">
          We believe healing happens when mind, body, and spirit work together. Your wellness journey is unique, and we honor all approaches - from ancient wisdom to modern science.
        </p>
        <p className="text-secondary-text-thin italic">
          While we respect all healing paths, we encourage you to explore beyond just symptom management. True wellness comes from understanding and nurturing your whole self.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div 
              key={index}
              className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all"
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-primary-text mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-secondary-text-thin">
                    {feature.description}
                  </p>
                </div>
              </div>
              
              {/* Feature Image */}
              <div className="mt-4 relative h-40 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  className="object-contain p-4"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Core Values */}
      <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold text-primary-text mb-6">What Makes Us Different</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 rounded-full bg-sage mt-2 flex-shrink-0" />
            <div>
              <h5 className="font-medium text-primary-text mb-1">No Guilt, No Shame</h5>
              <p className="text-sm text-secondary-text-thin">
                We don&apos;t show completion percentages or track &ldquo;failures&rdquo;. Your effort is enough.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 rounded-full bg-sage mt-2 flex-shrink-0" />
            <div>
              <h5 className="font-medium text-primary-text mb-1">Privacy by Design</h5>
              <p className="text-sm text-secondary-text-thin">
                Your wellness data never leaves your device. No cloud storage, no data mining.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 rounded-full bg-sage mt-2 flex-shrink-0" />
            <div>
              <h5 className="font-medium text-primary-text mb-1">Honest Guidance</h5>
              <p className="text-sm text-secondary-text-thin">
                We recommend what might help, but never pressure you to buy or do anything.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 rounded-full bg-sage mt-2 flex-shrink-0" />
            <div>
              <h5 className="font-medium text-primary-text mb-1">Celebrate Small Wins</h5>
              <p className="text-sm text-secondary-text-thin">
                Every step forward matters, no matter how small. Progress over perfection.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Message */}
      <div className="text-center py-8">
        <p className="text-secondary-text-thin">
          Built with 💚 for everyone struggling to thrive
        </p>
      </div>
    </div>
  );
};