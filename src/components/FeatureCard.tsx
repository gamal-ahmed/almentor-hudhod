
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon: Icon, 
  title, 
  description,
  color = "primary"
}) => {
  return (
    <div className="feature-card hover-lift">
      <div className={`feature-card-icon bg-${color}-500/10 text-${color}-500`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-medium mt-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

export default FeatureCard;
