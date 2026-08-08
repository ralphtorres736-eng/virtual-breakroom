import React, { useState, useEffect } from 'react';
import { getNextMonthlyLunchThursday, calculateCountdown } from '../utils/dateUtils';
import type { CountdownTime } from '../utils/dateUtils';
import { Calendar, Clock, Heart, Award } from 'lucide-react';

export const Hero: React.FC = () => {
  const [targetDate, setTargetDate] = useState<Date>(getNextMonthlyLunchThursday(new Date()));
  const [countdown, setCountdown] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isCompleted: false,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(calculateCountdown(targetDate, new Date()));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  // Recalculate target if it has passed
  useEffect(() => {
    if (countdown.isCompleted) {
      setTargetDate(getNextMonthlyLunchThursday(new Date()));
    }
  }, [countdown.isCompleted]);

  const formattedTargetDate = targetDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTargetTime = targetDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="relative overflow-hidden bg-brand-law-navy text-white rounded-2xl shadow-xl border border-brand-gold/30 mb-8">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-gold/5 rounded-full blur-3xl -ml-20 -mb-20"></div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 lg:p-12 items-center">
        {/* Left Side: Appreciation & Tradition Note */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold-bright text-xs font-semibold tracking-wider uppercase">
            <Award className="w-3.5 h-3.5" />
            The Firm Tradition
          </div>

          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
            Mrs. Potter's <br />
            <span className="text-brand-gold-bright">Monthly Lunch Thursday</span>
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-xl font-light">
            A cherished monthly tradition established to celebrate our hardworking staff.
            Take a well-deserved break to enjoy a premium meal on the firm,
            record a short meal preview, and join your colleagues here at <span className="text-white font-medium">The Virtual Breakroom</span>.
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs md:text-sm text-slate-300 border-t border-slate-700/50">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#dfba73]" />
              <span>Next Event: <strong className="text-white">{formattedTargetDate}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#dfba73]" />
              <span>Catering Hours: <strong className="text-white">{formattedTargetTime} EST</strong></span>
            </div>
          </div>
        </div>

        {/* Right Side: Elegant Countdown Box */}
        <div className="lg:col-span-5 w-full">
          <div className="rounded-xl p-6 border border-brand-gold/20 shadow-2xl relative overflow-hidden bg-[#0d1726]">
            <div className="text-center mb-6">
              <h2 className="text-xs uppercase tracking-widest text-[#dfba73] font-semibold">
                COUNTDOWN TO MRS. POTTER'S LUNCH
              </h2>
              <p className="text-white text-xs mt-1">Catering active on launch</p>
            </div>

            <div className="grid grid-cols-4 gap-2 md:gap-4 text-center">
              {/* Days */}
              <div className="bg-brand-law-navy/80 rounded-lg p-3 border border-slate-700/50 shadow-inner">
                <span className="font-serif text-2xl md:text-3xl font-bold text-white block">
                  {String(countdown.days).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-300 font-medium">Days</span>
              </div>

              {/* Hours */}
              <div className="bg-brand-law-navy/80 rounded-lg p-3 border border-slate-700/50 shadow-inner">
                <span className="font-serif text-2xl md:text-3xl font-bold text-white block">
                  {String(countdown.hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-300 font-medium">Hours</span>
              </div>

              {/* Minutes */}
              <div className="bg-brand-law-navy/80 rounded-lg p-3 border border-slate-700/50 shadow-inner">
                <span className="font-serif text-2xl md:text-3xl font-bold text-white block">
                  {String(countdown.minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-300 font-medium">Min</span>
              </div>

              {/* Seconds */}
              <div className="bg-brand-law-navy/80 rounded-lg p-3 border border-slate-700/50 shadow-inner">
                <span className="font-serif text-2xl md:text-3xl font-bold text-[#dfba73] block animate-pulse">
                  {String(countdown.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-300 font-medium">Sec</span>
              </div>
            </div>

            {/* Note of appreciation */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#dfba73] bg-brand-gold/10 py-2.5 rounded-lg border border-brand-gold/20">
              <Heart className="w-3.5 h-3.5 fill-current text-[#dfba73]" />
              <span>Compliments of the Managing Partners</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
