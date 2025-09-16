import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  variant: 'info' | 'success' | 'warning' | 'destructive';
}

export function StatsCard({ title, value, icon: Icon, variant }: StatsCardProps) {
  const variantStyles = {
    info: 'bg-info-light border-info/20 text-info',
    success: 'bg-success-light border-success/20 text-success',
    warning: 'bg-warning-light border-warning/20 text-warning',
    destructive: 'bg-destructive/5 border-destructive/20 text-destructive'
  };

  return (
    <Card className="p-6 shadow-card hover:shadow-elevated transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className={cn(
          "p-3 rounded-lg border",
          variantStyles[variant]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}