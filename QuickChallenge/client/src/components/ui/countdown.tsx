import React, { useEffect, useState } from "react";

interface CountdownProps {
  endTime: Date;
  onComplete?: () => void;
  className?: string;
}

export function Countdown({ endTime, onComplete, className = "" }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    minutes: number;
    seconds: number;
    totalSeconds: number;
  }>({ minutes: 0, seconds: 0, totalSeconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = endTime.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, totalSeconds: 0 });
        if (onComplete) {
          onComplete();
        }
        return;
      }
      
      const totalSeconds = Math.floor(difference / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      
      setTimeLeft({ minutes, seconds, totalSeconds });
    };

    // Calculate immediately
    calculateTimeLeft();
    
    // Then set up interval
    const interval = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(interval);
  }, [endTime, onComplete]);

  // Calculate percentage for the circle
  const percentage = timeLeft.totalSeconds === 0 ? 0 : (timeLeft.totalSeconds / (5 * 60)) * 100;
  const circumference = 2 * Math.PI * 45; // r = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative ${className}`}>
      <svg className="countdown-timer h-full w-full" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle 
          cx="50" 
          cy="50" 
          r="45" 
          fill="none" 
          stroke="hsl(var(--primary))" 
          strokeWidth="8" 
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset} 
          transform="rotate(-90 50 50)" 
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-bold text-2xl text-primary">
        {timeLeft.minutes}:{timeLeft.seconds.toString().padStart(2, "0")}
      </div>
    </div>
  );
}
