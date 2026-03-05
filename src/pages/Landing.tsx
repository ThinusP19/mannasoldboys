import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Award, ArrowRight } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* Hero Section */}
      <div className="bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Monnas Oldboys</h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Connecting Monnas Old Boys Alumni Since 1907
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8">
                  Sign In
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black px-8">
                  Join the Network
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Join?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Alumni Directory</h3>
            <p className="text-gray-600">
              Find and connect with fellow Old Boys from any graduation year. Search by name, year, or profession.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Marketplace</h3>
            <p className="text-gray-600">
              Support fellow alumni businesses. Find services from lawyers, doctors, accountants, and more.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">OB Number</h3>
            <p className="text-gray-600">
              Get your unique Old Boy number (e.g., OB2005-001) and join the official alumni network.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Connect?</h2>
          <p className="text-gray-300 mb-8">
            Join thousands of Monnas Old Boys who are already networking and supporting each other.
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8">
              Get Started <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>Monnas Oldboys - Monnas Old Boys Alumni Network</p>
          <p className="text-sm mt-2">Est. 1907</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
