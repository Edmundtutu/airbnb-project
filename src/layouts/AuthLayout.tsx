import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/15 to-accent/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background with subtle animation */}
      <div className="background-animation">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">CavaYo</h1>
          <p className="text-muted-foreground mt-2">Find your perfect stay</p>
        </div>
        <div className="bg-yellowcard rounded-lg shadow-lg p-6 border">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;