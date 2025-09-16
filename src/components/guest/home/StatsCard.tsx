import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export interface StatsCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  gradientFrom: string;
  gradientTo: string;
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon, title, subtitle, gradientFrom, gradientTo, onClick }) => {
  return (
    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer" onClick={onClick}>
      <CardContent className="p-3 lg:p-4 text-center">
        <div className={`w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-full flex items-center justify-center mx-auto mb-2`}>
          {icon}
        </div>
        <h3 className="font-semibold text-sm lg:text-base">{title}</h3>
        <p className="text-xs lg:text-sm text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
};

export default StatsCard;


