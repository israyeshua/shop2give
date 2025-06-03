import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { detectCategory, type Category } from '../../lib/categoryDetection';
import { useDropzone } from 'react-dropzone';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  image?: string;
}

interface CreateCampaignChatProps {
  onUpdateForm: (data: any) => void;
  onCategoryDetected?: (category: Category) => void;
}

const questions = [
  "What cause are you raising funds for?",
  "Share your story - why does this matter to you?",
  "What's your fundraising goal amount?",
  "Which category fits best: Medical, Education, Mission & Faith, Community, or Emergency Relief?"
];

const getAIResponse = (userMessage: string, questionIndex: number, detectedCategory: Category | null): string => {
  const lowerMessage = userMessage.toLowerCase();
  
  if (questionIndex === 0 && detectedCategory) {
    switch (detectedCategory) {
      case 'medical':
        return "I notice this is a medical campaign. These typically perform best with personal stories and regular updates. Would you like tips on making your campaign compelling?";
      case 'education':
        return "Education campaigns often succeed when they show the long-term impact. Can you share what this education will lead to?";
      case 'mission':
        return "Faith-based campaigns resonate strongly with communities. Let's focus on the spiritual impact and community involvement.";
      case 'community':
        return "Community projects thrive on local support. Would you like suggestions for engaging your neighborhood?";
      case 'emergency':
        return "For urgent needs, it's crucial to clearly communicate the immediate impact. Let me help you structure your appeal.";
    }
  }
  
  return questions[questionIndex + 1] || "Thank you for sharing! I'll help you create your campaign now.";
};

export function CreateCampaignChat({ onUpdateForm, onCategoryDetected }: CreateCampaignChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1,
    onDrop: files => {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  });

  useEffect(() => {
    if (currentQuestion === 0) {
      addAIMessage(questions[0]);
    }
  }, []);

  const addAIMessage = async (text: string) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setMessages(prev => [...prev, { id: Date.now().toString(), text, sender: 'ai' }]);
    setIsTyping(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim() && !imagePreview) return;

    // Add user message
    const userMessage = { 
      id: Date.now().toString(), 
      text: currentInput,
      sender: 'user' as const,
      image: imagePreview || undefined
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setImagePreview(null);

    // Update form data based on current question
    const formUpdate: any = {};
    switch (currentQuestion) {
      case 0:
        formUpdate.title = currentInput;
        break;
      case 1:
        formUpdate.description = currentInput;
        break;
      case 2:
        formUpdate.goalAmount = parseInt(currentInput.replace(/[^0-9]/g, ''));
        break;
      case 3:
        formUpdate.category = currentInput;
        break;
    }
    onUpdateForm(formUpdate);
    
    // Detect category from user input
    try {
      const suggestion = await detectCategory(currentInput);
      if (suggestion && onCategoryDetected) {
        onCategoryDetected(suggestion.category);
      }
      
      // Get AI response based on detected category
      const aiResponse = getAIResponse(currentInput, currentQuestion, suggestion?.category || null);
      
      // Move to next question
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        await addAIMessage(aiResponse);
      }
    } catch (error) {
      console.error('Error detecting category:', error);
      
      // Fallback if category detection fails
      const aiResponse = getAIResponse(currentInput, currentQuestion, null);
      
      // Move to next question
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        await addAIMessage(aiResponse);
      }
    }
  };

  return (
    <div className="flex h-[600px] flex-col rounded-lg border border-gray-200 bg-white">
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg px-4 py-2 ${
                  message.sender === 'user'
                    ? 'bg-brand-teal text-white'
                    : 'bg-gray-100 text-gray-900'
                } max-w-[80%]`}
              >
                {message.text}
                {message.image && (
                  <img 
                    src={message.image} 
                    alt="Uploaded content"
                    className="mt-2 rounded-md"
                  />
                )}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 text-gray-500"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>AI is typing...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        {imagePreview && (
          <div className="mb-2 relative inline-block">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="h-20 w-20 rounded object-cover"
            />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex space-x-2">
          <div {...getRootProps()} className="flex-shrink-0">
            <input {...getInputProps()} />
            <Button
              type="button"
              variant="secondary"
              className={isDragActive ? 'bg-brand-teal/10' : ''}
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
          </div>
          <input
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal"
            placeholder="Type your answer..."
          />
          <Button type="submit" disabled={!currentInput.trim() && !imagePreview || isTyping}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}