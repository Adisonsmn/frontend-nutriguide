import { useEffect, useState } from 'react';

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
}

export const MacroBar = ({ label, current, target, color }: MacroBarProps) => {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidth(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">
          {current} / {target} g ({percentage}%)
        </span>
      </div>
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${animatedWidth}%`,
            backgroundColor: color,
            transition: 'width 1s ease-in-out',
          }}
        />
      </div>
    </div>
  );
};
