import React from 'react';
import * as Icons from 'lucide-react';

const LucideIcon = ({ name, color, size = 20, className }) => {
  const IconComponent = Icons[name] || Icons.HelpCircle;
  return <IconComponent color={color} size={size} className={className} />;
};

export default LucideIcon;
