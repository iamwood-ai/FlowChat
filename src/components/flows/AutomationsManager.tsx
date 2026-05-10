import React, { useState, useEffect } from 'react';
import AutomationsList from './AutomationsList';
import FlowBuilder from './FlowBuilder';
import AutomationAnalytics from './AutomationAnalytics';
import { AnimatePresence, motion } from 'motion/react';

export default function AutomationsManager({ initialParams }: { initialParams?: any }) {
  const [view, setView] = useState<'list' | 'builder' | 'analytics'>(initialParams ? 'builder' : 'list');
  const [selectedFlow, setSelectedFlow] = useState<any>(null);

  // If we have initial params, we should prepare the builder
  useEffect(() => {
    if (initialParams) {
      setView('builder');
      if (initialParams.templateId || initialParams.prompt) {
        setSelectedFlow({ 
          templateId: initialParams.templateId,
          prompt: initialParams.prompt
        });
      }
    }
  }, [initialParams]);

  const handleEdit = (id: string) => {
    setSelectedFlow({ id });
    setView('builder');
  };

  const handleAnalytics = (flow: any) => {
    setSelectedFlow(flow);
    setView('analytics');
  };

  const handleCreateNew = (templateId?: string) => {
    setSelectedFlow(templateId ? { templateId } : null);
    setView('builder');
  };

  const handleBack = () => {
    setView('list');
    setSelectedFlow(null);
  };

  return (
    <div className="h-full">
      <AnimatePresence>
        {view === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }}
            className="h-full overflow-auto"
          >
            <AutomationsList onEdit={handleEdit} onAnalytics={handleAnalytics} onCreateNew={handleCreateNew} />
          </motion.div>
        )}
        {view === 'builder' && (
          <motion.div
            key="builder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }}
            className="h-full bg-[#F8F9FA]"
          >
            <FlowBuilder 
              flowId={selectedFlow?.id} 
              templateId={selectedFlow?.templateId}
              prompt={selectedFlow?.prompt}
              onBack={handleBack} 
            />
          </motion.div>
        )}
        {view === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }}
            className="h-full overflow-auto"
          >
            <AutomationAnalytics flow={selectedFlow} onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
