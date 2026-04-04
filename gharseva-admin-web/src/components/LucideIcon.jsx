import React from 'react';
import * as Icons from 'lucide-react';

const LucideIcon = ({ name, color, size = 20, className }) => {
  const mapper = {
    'Plumbing': 'Pipette',
    'Electrician': 'Zap',
    'Painting': 'Brush',
    'Cleaning': 'Sparkles',
    'A/C Repair': 'Wind',
    'Appliance': 'Cpu',
    'Pest Control': 'Bug',
    'Carpentry': 'Hammer',
    'Shifting': 'Truck',
    'Beauty': 'Heart',
  };

  const lucideName = mapper[name] || name;
  const IconComponent = Icons[lucideName] || Icons.HelpCircle;
  return <IconComponent color={color} size={size} className={className} />;
};

export default LucideIcon;
