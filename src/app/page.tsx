'use client';

import React from 'react';

import { ChatModeSelector } from '@/components/ChatModeSelector';
import { CedarCaptionChat } from '@/cedar/components/chatComponents/CedarCaptionChat';
import { FloatingCedarChat } from '@/cedar/components/chatComponents/FloatingCedarChat';
import { SidePanelCedarChat } from '@/cedar/components/chatComponents/SidePanelCedarChat';
import GenericNode from '@/app/components/GenericNode';
import WorkflowRunner from './components/WorkflowRunner';

type ChatMode = 'floating' | 'sidepanel' | 'caption';

export default function HomePage() {
  // Cedar-OS chat components with mode selector
  // Choose between caption, floating, or side panel chat modes
  const [chatMode, setChatMode] = React.useState<ChatMode>('caption');

  
  const renderContent = () => (
    <div className="relative min-h-screen w-full">
      <div className="container mx-auto px-4 py-8">
        
        {/* Workflow Interface */}
        <WorkflowRunner />

        {/* Chat Interface */}
        
      </div> 
    </div>
  );

  

  if (chatMode === 'sidepanel') {
    return (
      <SidePanelCedarChat
        side="right"
        title="Cedarling Chat"
        collapsedLabel="Chat with Cedar"
        showCollapsedButton={true}
      >
        {renderContent()}
      </SidePanelCedarChat>
    );
  }

  return renderContent();
}
