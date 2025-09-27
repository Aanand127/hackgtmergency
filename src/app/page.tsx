'use client';

import React from 'react';

import { ChatModeSelector } from '@/components/ChatModeSelector';
import { CedarCaptionChat } from '@/cedar/components/chatComponents/CedarCaptionChat';
import { FloatingCedarChat } from '@/cedar/components/chatComponents/FloatingCedarChat';
import { SidePanelCedarChat } from '@/cedar/components/chatComponents/SidePanelCedarChat';
import { BasicStateValue, getCedarState, setCedarState } from 'cedar-os';
import '@/app/components/GenericNode';
import GenericNode from '@/app/components/GenericNode';
type ChatMode = 'floating' | 'sidepanel' | 'caption';

export default function HomePage() {
  // Cedar-OS chat components with mode selector
  // Choose between caption, floating, or side panel chat modes

  

  const [chatMode, setChatMode] = React.useState<ChatMode>('caption');

  const renderContent = () => (
    <div className="relative h-screen w-full">
      <ChatModeSelector currentMode={chatMode} onModeChange={setChatMode} />

      {chatMode === 'caption' && <CedarCaptionChat />}

      {chatMode === 'floating' && (
        <FloatingCedarChat side="right" title="Cedarling Chat" collapsedLabel="Chat with Cedar" />
      )}
    </div>
  );
  <GenericNode />
  const newNodes = [
    { id: 1, text: 'Added Node here', chat: 'Description here'},
    { id: 2, text: 'Anotehr test noce here', chat: 'desc 2'},
  ];
  setCedarState('queries', newNodes);

  const currentQueries = getCedarState('queries');
  if (currentQueries && Array.isArray(currentQueries)) {
    const updatedQueries = currentQueries.map((query) => ({
      ...query,
      chat: 'Looking to que another'
    }));
    setCedarState('queries', updatedQueries)
  }

  const testNode = (currentQueries: BasicStateValue) => (
    <div>
      <p>`Current num Nodes: ${currentQueries?.toString()}`</p>
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
