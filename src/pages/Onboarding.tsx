import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Facebook, Users, Heart, BookOpen, Calendar, Gift, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Onboarding = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showMembership, setShowMembership] = useState(false);

  const handleGetStarted = () => {
    navigate("/login");
  };

  const membershipBenefits = [
    {
      icon: Users,
      title: "Access to Matric Year Photos",
      description: "View and download photos from your matric year"
    },
    {
      icon: Users,
      title: "Friends Contact Details",
      description: "Connect with classmates from your year"
    },
    {
      icon: Users,
      title: "Matric Year Chat Groups",
      description: "Join WhatsApp and other chat groups"
    },
    {
      icon: Calendar,
      title: "Key Monnas Events Updates",
      description: "Stay informed about reunions and activities"
    },
    {
      icon: BookOpen,
      title: "Monnas Stories (Staaltjies)",
      description: "Read and share stories from your years at Monnas"
    },
    {
      icon: Gift,
      title: "Alumni Cap with Your Matric Year",
      description: "Included in Bronze or higher packages"
    }
  ];

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/Logo.jpeg"
              alt="Monnas Witbul Old Boys"
              className="h-10 w-auto"
            />
          </div>
          <Button onClick={handleGetStarted} variant="outline">
            Sign In
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Vision and Mission */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Monnas Old Boys Alumni
          </h1>
          <div className="grid md:grid-cols-2 gap-8 mt-12 max-w-4xl mx-auto">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-2xl">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To create a vibrant, connected community of Monnas Old Boys who support each other and
                  give back to our alma mater, ensuring future generations benefit from the same
                  excellent education and values we received.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-2xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To foster lifelong connections among alumni, preserve our shared history,
                  support current students, and contribute to the continued excellence of
                  Monnas through engagement, mentorship, and philanthropy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upcoming Reunions */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Upcoming Reunions</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle>Class of 2015 - 10 Year Reunion</CardTitle>
                <CardDescription>June 15, 2025</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Join us for a memorable evening of reconnection, dinner, and dancing!
                </p>
                <Button variant="outline" className="w-full">
                  Learn More
                </Button>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle>All-Alumni Summer BBQ</CardTitle>
                <CardDescription>August 20, 2025</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Casual gathering for all alumni. Bring your family!
                </p>
                <Button variant="outline" className="w-full">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Facebook Link */}
        <div className="text-center mb-12">
          <Card className="border-0 shadow-sm bg-white max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Connect on Facebook</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Join our Facebook community to stay connected with fellow Monnas Old Boys
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Facebook className="w-4 h-4 mr-2" />
                Visit Our Facebook Page
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Ways to Give Back */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Ways to Give Back</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle>Current Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Support our current initiatives and make a difference for future generations
                </p>
                <Button variant="outline" className="w-full">
                  View Projects
                </Button>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle>Investment Options</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Invest with a percentage paid towards Monnas NPO
                </p>
                <Button variant="outline" className="w-full">
                  Learn More
                </Button>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle>Testament Beneficiary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Add Monnas NPO as a beneficiary to your testament
                </p>
                <Button variant="outline" className="w-full">
                  Get Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Membership Invite */}
        <Card className="border-0 shadow-lg bg-white max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-2">Become a Member</CardTitle>
            <CardDescription className="text-lg">
              Minimum R75 per month - Join our community and reconnect with your fellow Monnas Old Boys
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showMembership ? (
              <div className="text-center">
                <Button 
                  onClick={() => setShowMembership(true)}
                  className="bg-accent text-white hover:bg-accent/90"
                  size="lg"
                >
                  See What You Get
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-center mb-6">What You Get:</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {membershipBenefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">{benefit.title}</p>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleGetStarted}
                    className="w-full bg-accent text-white hover:bg-accent/90"
                    size="lg"
                  >
                    Get Started - Become a Member
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;

