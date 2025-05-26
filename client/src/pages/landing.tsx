import React from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  FileText, 
  Calendar, 
  Users, 
  Shield, 
  Zap, 
  CheckCircle, 
  Star,
  ArrowRight,
  GraduationCap,
  Clock,
  Target,
  BarChart3,
  FileBarChart,
  Bot
} from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();

  const features = [
    {
      icon: <BookOpen className="h-12 w-12 text-blue-600" />,
      title: "Course Management",
      description: "Organize all your courses in one centralized location. Track syllabi, assignments, and important dates across multiple semesters."
    },
    {
      icon: <FileText className="h-12 w-12 text-green-600" />,
      title: "Assignment Tracking", 
      description: "Never miss a deadline again. Keep track of all assignments, projects, and exams with detailed status updates and priority levels."
    },
    {
      icon: <Calendar className="h-12 w-12 text-purple-600" />,
      title: "Academic Calendar",
      description: "Visualize your entire academic schedule. See upcoming deadlines, exam periods, and important academic milestones at a glance."
    },
    {
      icon: <Shield className="h-12 w-12 text-red-600" />,
      title: "Secure Storage",
      description: "Your academic data is protected with enterprise-grade security. Access your coursework safely from anywhere, anytime."
    }
  ];

  const proFeatures = [
    {
      icon: <Bot className="h-8 w-8 text-blue-600" />,
      title: "AI-Powered Analytics",
      description: "Get insights into your study patterns and performance trends"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-green-600" />,
      title: "Advanced Reporting",
      description: "Detailed analytics on assignment completion and study time"
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-600" />,
      title: "Priority Support",
      description: "Get help when you need it with dedicated customer support"
    },
    {
      icon: <FileBarChart className="h-8 w-8 text-purple-600" />,
      title: "Enhanced Dashboard",
      description: "Professional-grade analytics and performance tracking"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Computer Science Major",
      content: "StudyVault has transformed how I manage my coursework. I never lose track of assignments anymore!",
      rating: 5
    },
    {
      name: "Marcus Johnson", 
      role: "Graduate Student",
      content: "The lifetime access means I can reference my work years after graduation. Invaluable for my career.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Pre-Med Student",
      content: "Managing multiple demanding courses is so much easier with StudyVault's organization system.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                StudyVault
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard">
                  <Button variant="default">Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 mb-6">
              Your Academic Success,
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}Organized for Life
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
              StudyVault is the ultimate academic organization platform designed for students who want to succeed. 
              Manage courses, track assignments, and keep your academic journey organized from freshman year through graduation and beyond.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user && (
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
        
        {/* Background Graphics */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              StudyVault provides all the tools you need to stay organized, meet deadlines, and excel in your academic journey.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              How StudyVault Works
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Get organized in three simple steps and transform your academic experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Add Your Courses</h3>
              <p className="text-slate-600">
                Create courses for each class you're taking. Add syllabi, course information, and important details.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Track Assignments</h3>
              <p className="text-slate-600">
                Add assignments, projects, and exams with due dates. Upload related files and track your progress.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Stay Organized</h3>
              <p className="text-slate-600">
                Access your academic materials anytime, anywhere. Never lose important coursework again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pro Plan Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-white/20 text-white mb-4">
              <Star className="w-4 h-4 mr-1" />
              Pro Plan
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Supercharge Your Academic Success
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Unlock advanced features designed for serious students who want to maximize their academic potential.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {proFeatures.map((feature, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    {feature.icon}
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-blue-100">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Link href={user ? "/pro-dashboard" : "/register"}>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                {user ? "Upgrade to Pro" : "Start Pro Trial"}
                <Zap className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Loved by Students Everywhere
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Join thousands of students who have transformed their academic experience with StudyVault.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-base italic">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-slate-600">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Academic Journey?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of students who have already discovered the power of organized academic life.
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-slate-900">
                Contact Sales
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">StudyVault</span>
              </div>
              <p className="text-slate-400">
                Your academic success, organized for life.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pro Plan</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-700 mt-8 pt-8 text-center">
            <p className="text-slate-400">
              © 2025 StudyVault. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}