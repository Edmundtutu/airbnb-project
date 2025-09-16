import React from 'react';
import StatsCard from './StatsCard';
import { TrendingUp, Store, Users, Heart } from 'lucide-react';

const QuickStatsGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <StatsCard
        icon={<TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-white" />}
        title="Trending"
        subtitle="Hot deals"
        gradientFrom="from-blue-500"
        gradientTo="to-blue-600"
      />
      <StatsCard
        icon={<Store className="h-5 w-5 lg:h-6 lg:w-6 text-white" />}
        title="Shops"
        subtitle="Near you"
        gradientFrom="from-green-500"
        gradientTo="to-green-600"
      />
      <StatsCard
        icon={<Users className="h-5 w-5 lg:h-6 lg:w-6 text-white" />}
        title="Community"
        subtitle="Connect"
        gradientFrom="from-purple-500"
        gradientTo="to-purple-600"
      />
      <StatsCard
        icon={<Heart className="h-5 w-5 lg:h-6 lg:w-6 text-white" />}
        title="Favorites"
        subtitle="0 items"
        gradientFrom="from-red-500"
        gradientTo="to-red-600"
      />
    </div>
  );
};

export default QuickStatsGrid;


