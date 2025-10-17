import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Foody</h1>
          <p className="text-muted-foreground mt-2">Community-driven shopping</p>
        </div>
        <div className="bg-card rounded-lg shadow-lg p-6 border">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;