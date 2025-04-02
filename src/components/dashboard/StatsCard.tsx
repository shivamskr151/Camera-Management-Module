
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  change?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  description,
  change,
  variant = 'default',
  className,
}) => {
  const isPositiveChange = change && change > 0;
  
  const getChangeColor = () => {
    if (change === undefined) return '';
    if (isPositiveChange) return 'text-green-500';
    return 'text-red-500';
  };
  
  const getCardStyle = () => {
    switch (variant) {
      case 'success':
        return 'border-green-100 dark:border-green-900/40 bg-green-50/50 dark:bg-green-900/20';
      case 'warning':
        return 'border-yellow-100 dark:border-yellow-900/40 bg-yellow-50/50 dark:bg-yellow-900/20';
      case 'danger':
        return 'border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-900/20';
      default:
        return 'border-border bg-card';
    }
  };

  const getIconStyle = () => {
    switch (variant) {
      case 'success':
        return 'text-green-500 bg-green-100/80 dark:bg-green-900/30';
      case 'warning':
        return 'text-yellow-500 bg-yellow-100/80 dark:bg-yellow-900/30';
      case 'danger':
        return 'text-red-500 bg-red-100/80 dark:bg-red-900/30';
      default:
        return 'text-primary bg-primary/10';
    }
  };

  return (
    <Card className={cn('overflow-hidden transition-all duration-200 hover:shadow-md', getCardStyle(), className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
            
            {(description || change !== undefined) && (
              <div className="flex items-center mt-2 text-sm">
                {change !== undefined && (
                  <span className={cn('flex items-center mr-1', getChangeColor())}>
                    {isPositiveChange ? <ArrowUp className="h-3 w-3 mr-0.5" /> : <ArrowDown className="h-3 w-3 mr-0.5" />}
                    {Math.abs(change)}%
                  </span>
                )}
                {description && <span className="text-muted-foreground">{description}</span>}
              </div>
            )}
          </div>
          
          <div className={cn('rounded-md p-2', getIconStyle())}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
