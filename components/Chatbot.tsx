
import React, { useState, useRef, useEffect } from 'react';
import { getChatResponseStream } from '../services/geminiService';
import { ChatMessage } from '../types';
import Icon from './Icon';
import Spinner from './common/Spinner';
import { GenerateContentResponse } from '@google/genai';

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const stream = await getChatResponseStream(input);
      
      let modelResponseText = '';
      setMessages((prev) => [...prev, { role: 'model', text: '' }]);
      
      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        const textChunk = c.text;
        if (textChunk) {
            modelResponseText += textChunk;
            setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'model', text: modelResponseText };
                return newMessages;
            });
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Lo siento, algo salió mal.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] md:h-[calc(100vh-120px)] bg-gray-800/50 rounded-xl shadow-lg">
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                  <Icon name="spark" className="text-lg" />
                </div>
              )}
              <div
                className={`max-w-md p-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-blue-600 rounded-br-lg'
                    : 'bg-gray-700 rounded-bl-lg'
                }`}
              >
                <p className="text-white whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length -1]?.role !== 'model' && (
            <div className="flex items-start gap-3 justify-start">
               <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                  <Spinner className="w-5 h-5" />
                </div>
              <div className="max-w-md p-3 rounded-2xl bg-gray-700 rounded-bl-lg">
                <p className="text-gray-400 italic">Gemini está pensando...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregúntale lo que sea a Gemini..."
            className="flex-grow bg-gray-700 border border-gray-600 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-shadow"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-cyan-500 text-white rounded-full p-3 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-cyan-400 transition-colors"
          >
            <Icon name="send" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
