import { createContext, useState, useEffect } from 'react';

export const AgentContext = createContext();

const AGENTS = [
  { id: 'kai', name: 'Kai', emoji: '🤖' },
  { id: 'po-kai', name: 'PO-Kai', emoji: '🧩' },
];

export function AgentContextProvider({ children }) {
  const [agentId, setAgentId] = useState('kai');

  // Load agent from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('kai-agent-id');
    if (stored && AGENTS.some(a => a.id === stored)) {
      setAgentId(stored);
    }
  }, []);

  // Save to localStorage whenever agentId changes
  const setAgent = (newAgentId) => {
    if (AGENTS.some(a => a.id === newAgentId)) {
      setAgentId(newAgentId);
      localStorage.setItem('kai-agent-id', newAgentId);
    }
  };

  const agent = AGENTS.find(a => a.id === agentId) || AGENTS[0];

  return (
    <AgentContext.Provider
      value={{
        agentId,
        agentName: agent.name,
        agentEmoji: agent.emoji,
        setAgent,
        agents: AGENTS,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}
