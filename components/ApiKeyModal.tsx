
import React from 'react';

// This component is deprecated and removed to comply with security guidelines.
// The Google GenAI API key must be obtained exclusively from the environment variable process.env.API_KEY.
// The application must not ask the user for it under any circumstances.
const ApiKeyModal: React.FC<{ onSuccess: () => void }> = () => {
  return null;
};

export default ApiKeyModal;
