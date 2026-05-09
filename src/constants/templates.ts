import { 
  MessageSquare, 
  Zap, 
  Instagram, 
  Facebook, 
  TrendingUp, 
  Users, 
  Link, 
  ShoppingBag, 
  Youtube,
  Smartphone,
  Gift,
  HelpCircle,
  Briefcase,
  Sparkles
} from 'lucide-react';

export interface Template {
  id: string;
  title: string;
  desc: string;
  category: 'Recommended' | 'Grow your followers' | 'Engage your audience' | 'Drive traffic';
  platform: 'Instagram' | 'Facebook' | 'TikTok' | 'Multi-Channel' | 'WhatsApp' | 'SMS';
  color: string;
  count: string;
  icon: any;
}

export const ALL_TEMPLATES: Template[] = [
  // Recommended
  { 
    id: 'auto-dm-comments', 
    title: 'Auto-DM Links from Comments', 
    desc: 'Automatically send a DM with a link when someone comments on your post.', 
    category: 'Recommended', 
    platform: 'Instagram', 
    color: 'bg-blue-50 border-blue-100 text-blue-600', 
    count: 'Top Pick',
    icon: MessageSquare 
  },
  { 
    id: 'generate-leads-stories', 
    title: 'Generate Leads with Stories', 
    desc: 'Convert story viewers into leads by auto-responding to story replies.', 
    category: 'Recommended', 
    platform: 'Instagram', 
    color: 'bg-pink-50 border-pink-100 text-pink-600', 
    count: 'Hot',
    icon: Zap 
  },
  { 
    id: 'respond-dms', 
    title: 'Respond to all your DMs', 
    desc: 'Never miss a message. AI-powered auto-responses for every incoming DM.', 
    category: 'Recommended', 
    platform: 'Instagram', 
    color: 'bg-emerald-50 border-emerald-100 text-emerald-600', 
    count: 'Utility',
    icon: MessageSquare 
  },
  { 
    id: 'recognize-questions-ai', 
    title: 'Recognize questions in DM with AI', 
    desc: 'Use AI to identify common questions and answer them automatically or flag for support.', 
    category: 'Recommended', 
    platform: 'Instagram', 
    color: 'bg-violet-50 border-violet-100 text-violet-600', 
    count: 'AI Powered',
    icon: Sparkles 
  },

  // Grow your followers
  { 
    id: 'grow-followers-comments', 
    title: 'Grow followers from comments', 
    desc: 'Encourage commenters to follow you before receiving a special bonus.', 
    category: 'Grow your followers', 
    platform: 'Instagram', 
    color: 'bg-indigo-50 border-indigo-100 text-indigo-600', 
    count: '1.2k uses',
    icon: Users 
  },
  { 
    id: 'follow-freebie', 
    title: 'Follow first, then freebie', 
    desc: 'Automatically verify if a user follows you before sending a lead magnet.', 
    category: 'Grow your followers', 
    platform: 'Facebook', 
    color: 'bg-purple-50 border-purple-100 text-purple-600', 
    count: '850 uses',
    icon: Gift 
  },
  { 
    id: 'grow-email-list', 
    title: 'Grow your email list', 
    desc: 'Collect emails in DMs and sync them directly to your CRM.', 
    category: 'Grow your followers', 
    platform: 'Instagram', 
    color: 'bg-teal-50 border-teal-100 text-teal-600', 
    count: 'Essential',
    icon: Users 
  },

  // Engage your audience
  { 
    id: 'automate-ai', 
    title: 'Automate conversations with AI', 
    desc: 'Use Gemini to handle complex customer queries and maintain natural conversations.', 
    category: 'Engage your audience', 
    platform: 'Instagram', 
    color: 'bg-fuchsia-50 border-fuchsia-100 text-fuchsia-600', 
    count: 'New',
    icon: Sparkles 
  },
  { 
    id: 'run-giveaway', 
    title: 'Run a giveaway', 
    desc: 'Automate entry collection and winner selection for your social media giveaways.', 
    category: 'Engage your audience', 
    platform: 'Instagram', 
    color: 'bg-amber-50 border-amber-100 text-amber-600', 
    count: 'Popular',
    icon: Gift 
  },
  { 
    id: 'gamify-live', 
    title: 'Gamify Instagram Live', 
    desc: 'Trigger interactive elements and rewards during your live broadcasts.', 
    category: 'Engage your audience', 
    platform: 'Instagram', 
    color: 'bg-orange-50 border-orange-100 text-orange-600', 
    count: 'Trending',
    icon: Zap 
  },
  { 
    id: 'trigger-dms-live', 
    title: 'Trigger DMs during IG Live', 
    desc: 'Send info or links to viewers based on live triggers or keywords.', 
    category: 'Engage your audience', 
    platform: 'Instagram', 
    color: 'bg-rose-50 border-rose-100 text-rose-600', 
    count: 'High Engagement',
    icon: Zap 
  },
  { 
    id: 'faq-story-replies', 
    title: 'Answer FAQs from story replies', 
    desc: 'Instant answers to common questions asked via story reply stickers.', 
    category: 'Engage your audience', 
    platform: 'Instagram', 
    color: 'bg-sky-50 border-sky-100 text-sky-600', 
    count: 'Utility',
    icon: HelpCircle 
  },
  { 
    id: 'get-collabs-stories', 
    title: 'Get more collabs from Story replies', 
    desc: 'Automate outreach and qualification for potential brand collaborators.', 
    category: 'Engage your audience', 
    platform: 'Instagram', 
    color: 'bg-cyan-50 border-cyan-100 text-cyan-600', 
    count: 'Networking',
    icon: Briefcase 
  },

  // Drive traffic
  { 
    id: 'affiliate-links', 
    title: 'Send affiliate product links', 
    desc: 'Share monetized links automatically when users ask for product details.', 
    category: 'Drive traffic', 
    platform: 'Instagram', 
    color: 'bg-lime-50 border-lime-100 text-lime-600', 
    count: 'Profitable',
    icon: Link 
  },
  { 
    id: 'grow-youtube', 
    title: 'Grow your YouTube', 
    desc: 'Drive social traffic to your latest YouTube videos via automated DMs.', 
    category: 'Drive traffic', 
    platform: 'Facebook', 
    color: 'bg-red-50 border-red-100 text-red-600', 
    count: 'Videos',
    icon: Youtube 
  },
  { 
    id: 'insta-to-whatsapp', 
    title: 'Go from Instagram to WhatsApp', 
    desc: 'Move your high-value conversations from IG DM to WhatsApp for closer contact.', 
    category: 'Drive traffic', 
    platform: 'Instagram', 
    color: 'bg-emerald-50 border-emerald-100 text-emerald-600', 
    count: 'Sales',
    icon: Smartphone 
  },
  { 
    id: 'dm-course-closer', 
    title: 'DM your course like a closer', 
    desc: 'Qualify students for your online courses automatically in the DMs.', 
    category: 'Drive traffic', 
    platform: 'Instagram', 
    color: 'bg-violet-50 border-violet-100 text-violet-600', 
    count: 'High ROI',
    icon: Briefcase 
  },
  { 
    id: 'coupons-stories', 
    title: 'Give coupons in stories', 
    desc: 'Send unique discount codes to users who interact with your stories.', 
    category: 'Drive traffic', 
    platform: 'Instagram', 
    color: 'bg-rose-50 border-rose-100 text-rose-600', 
    count: 'Sales',
    icon: ShoppingBag 
  },
  { 
    id: 'sell-reel-comments', 
    title: 'Sell from Reel comments', 
    desc: 'The best-seller: convert reel comments into direct sales links.', 
    category: 'Drive traffic', 
    platform: 'Instagram', 
    color: 'bg-cyan-50 border-cyan-100 text-cyan-600', 
    count: 'Best Seller',
    icon: ShoppingBag 
  },
  { 
    id: 'send-offers-live', 
    title: 'Send offers in DMs during Live', 
    desc: 'Maximize live conversions by sending limited-time offers directly to DMs.', 
    category: 'Drive traffic', 
    platform: 'Instagram', 
    color: 'bg-amber-50 border-amber-100 text-amber-600', 
    count: 'Conversion Focus',
    icon: ShoppingBag 
  },
];
