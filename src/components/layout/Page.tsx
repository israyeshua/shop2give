import React, { ReactNode } from 'react';
import Container from './Container';

interface PageProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

/**
 * Page component for consistent page layout
 */
const Page: React.FC<PageProps> = ({ 
  children, 
  title,
  className = ''
}) => {
  return (
    <div className={`min-h-screen ${className}`}>
      {title && (
        <header className="bg-white border-b border-gray-200">
          <Container>
            <div className="py-6">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>
          </Container>
        </header>
      )}
      
      <main className="py-6">
        <Container>
          {children}
        </Container>
      </main>
    </div>
  );
};

export default Page;
