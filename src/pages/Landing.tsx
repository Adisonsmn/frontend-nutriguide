import { Link } from 'react-router-dom';
import { UserPlus, UtensilsCrossed, TrendingUp, CheckCircle } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useAuthStore } from '../store/authStore';

export const Landing = () => {
  const revealHowItWorks = useScrollReveal();
  const revealWhyChoose = useScrollReveal();
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-20 px-4 text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0s' }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <span className="text-primary font-semibold text-lg">Nutri Guide</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary max-w-4xl leading-tight">
          Personal Nutrition, Personalized for You
        </h1>
        
        <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Get healthy food recommendations tailored to your budget, preferences, and nutritional goals.
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center">
          {isAuthenticated ? (
            <Link 
              to="/dashboard" 
              className="bg-gold text-primary rounded-full px-10 py-3 font-semibold opacity-90 scale-95 hover:opacity-100 hover:scale-105 hover:shadow-lg hover:bg-[hsl(48,85%,55%)] transition-all duration-300 ease-in-out"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link 
                to="/register" 
                className="bg-gold text-primary rounded-full px-10 py-3 font-semibold opacity-90 scale-95 hover:opacity-100 hover:scale-105 hover:shadow-lg hover:bg-[hsl(48,85%,55%)] transition-all duration-300 ease-in-out"
              >
                Register
              </Link>
              <Link 
                to="/login" 
                className="bg-blue-medium text-white rounded-full px-10 py-3 font-semibold opacity-90 scale-95 hover:opacity-100 hover:scale-105 hover:shadow-lg hover:bg-[hsl(220,55%,45%)] transition-all duration-300 ease-in-out"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section 
        ref={revealHowItWorks.domRef}
        className={`py-20 px-4 max-w-6xl mx-auto transition-all duration-700 ease-out ${revealHowItWorks.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-primary text-center mb-16">How It Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="border border-gray-100 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6">
              <UserPlus className="text-primary" size={28} />
            </div>
            <h3 className="font-bold text-xl text-primary mb-3">Create Profile</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Input your age, weight, and health goals to get started with personalized recommendations.
            </p>
          </div>

          {/* Card 2 */}
          <div className="border border-gray-100 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6">
              <UtensilsCrossed className="text-primary" size={28} />
            </div>
            <h3 className="font-bold text-xl text-primary mb-3">Get Recommendations</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Our system matches meals to your nutritional needs and budget constraints.
            </p>
          </div>

          {/* Card 3 */}
          <div className="border border-gray-100 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="text-primary" size={28} />
            </div>
            <h3 className="font-bold text-xl text-primary mb-3">Track & Learn</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Save your food history, view detailed recipes, and read health tips to stay informed.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Nutri Guide Section */}
      <section 
        ref={revealWhyChoose.domRef}
        className={`bg-gray-50 rounded-3xl p-10 md:p-20 max-w-6xl mx-auto my-12 transition-all duration-700 ease-out ${revealWhyChoose.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-primary text-center mb-12">Why Choose Nutri Guide?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div className="flex items-start gap-4">
            <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
            <div>
              <h4 className="font-bold text-primary text-lg">Budget-Friendly Options</h4>
              <p className="text-gray-500 text-sm">Find nutritious meals that fit your budget</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
            <div>
              <h4 className="font-bold text-primary text-lg">Personalized Recommendations</h4>
              <p className="text-gray-500 text-sm">Tailored to your health goals and preferences</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
            <div>
              <h4 className="font-bold text-primary text-lg">Detailed Nutritional Info</h4>
              <p className="text-gray-500 text-sm">Complete breakdown of macros and micronutrients</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
            <div>
              <h4 className="font-bold text-primary text-lg">Progress Tracking</h4>
              <p className="text-gray-500 text-sm">Monitor your nutrition journey over time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-auto py-10 text-center opacity-0 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <p className="text-gray-400 text-sm">
          © 2026 Nutri Guide. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
