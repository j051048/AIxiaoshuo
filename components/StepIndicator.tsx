import React from 'react';
import { CreatorStep, Language, NovelSettings } from '../types';
import { UI_TEXT } from '../constants';

interface StepIndicatorProps {
  currentStep: CreatorStep;
  isOpen: boolean;
  onToggle: () => void;
  setStep: (step: CreatorStep) => void;
  language: Language;
  settings: NovelSettings;
  onEditSetting: (key: keyof NovelSettings) => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ 
  currentStep, 
  isOpen, 
  onToggle, 
  setStep, 
  language,
  settings,
  onEditSetting
}) => {
  const t = UI_TEXT[language];

  // Helper to generate dynamic description based on settings
  const getStepDescription = (step: CreatorStep): string => {
    switch (step) {
      case CreatorStep.CoreSetting:
        return language === 'zh' 
          ? `题材、受众(${settings.targetAudience})、核心梗`
          : `Genre, Audience (${settings.targetAudience}), Core Conflict`;
      case CreatorStep.DetailedOutline:
        return language === 'zh'
          ? `${settings.totalWordCount}字量级布局、节奏把控`
          : `${settings.totalWordCount} Word Structure, Pacing`;
      case CreatorStep.ChapterWriting:
        return language === 'zh'
          ? `正文创作（单章约${settings.chapterWordCount}字）`
          : `Drafting (approx. ${settings.chapterWordCount} words/chapter)`;
      default:
        return t.stepDetails[step];
    }
  };

  const getEditableKey = (step: CreatorStep): keyof NovelSettings | null => {
    if (step === CreatorStep.CoreSetting) return 'targetAudience';
    if (step === CreatorStep.DetailedOutline) return 'totalWordCount';
    if (step === CreatorStep.ChapterWriting) return 'chapterWordCount';
    return null;
  };

  return (
    <>
      {/* Mobile/H5 Overlay Background */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Drawer / Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-50 w-72 transform transition-transform duration-300 ease-in-out shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:w-80 lg:shadow-none lg:border-r
      `}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">9-Step SOP</h2>
            <p className="text-xs text-slate-500">{t.title}</p>
          </div>
          <button onClick={onToggle} className="lg:hidden text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-80px)] p-4 space-y-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((stepNum) => {
            const step = stepNum as CreatorStep;
            const isActive = step === currentStep;
            const isCompleted = step < currentStep;
            const editableKey = getEditableKey(step);

            return (
              <div 
                key={step}
                onClick={() => setStep(step)} 
                className={`
                  relative p-4 rounded-xl border transition-all cursor-pointer group
                  ${isActive 
                    ? 'bg-primary/5 border-primary shadow-sm' 
                    : isCompleted 
                      ? 'bg-slate-50 border-slate-200 opacity-70' 
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 mt-0.5
                    ${isActive ? 'bg-primary text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}
                  `}>
                    {isCompleted ? '✓' : step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-slate-700'}`}>
                        {t.stepMap[step]}
                      </h3>
                      {editableKey && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditSetting(editableKey);
                          }}
                          className={`
                            opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity p-1 -mt-1 -mr-1 text-slate-400 hover:text-primary hover:bg-white rounded-full
                          `}
                          title={t.edit}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words">
                      {getStepDescription(step)}
                    </p>
                  </div>
                </div>
                
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default StepIndicator;