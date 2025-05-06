
import { useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  Cross,
  BookOpen,
  HeartHandshake,
  Users,
  Sun,
  Moon,
  Star,
  Heart,
  Flame,
  Sparkles,
  Music,
  DotIcon as Dove,
  HandIcon as PrayingHands,
  Church,
  Scroll,
  Compass,
} from "lucide-react"

import heroImg from "../assets/images/IMG_0286-1.jpg";

const Hero = () => {
  const statsRef = useRef(null)
  const iconsContainerRef = useRef(null)

  useEffect(() => {
    // Animation for stats
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in")
            entry.target.classList.remove("opacity-0")
            entry.target.classList.remove("translate-y-4")
          }
        })
      },
      { threshold: 0.1 },
    )

    if (statsRef.current) {
      statsObserver.observe(statsRef.current)
    }

    // Floating animation for icons
    const icons = iconsContainerRef.current?.querySelectorAll(".floating-icon")
    if (icons) {
      icons.forEach((icon, index) => {
        // Add random delay and duration to each icon
        const delay = Math.random() * 2
        const duration = 3 + Math.random() * 2

        icon.style.animationDelay = `${delay}s`
        icon.style.animationDuration = `${duration}s`
      })
    }

    return () => {
      if (statsRef.current) {
        statsObserver.unobserve(statsRef.current)
      }
    }
  }, [])

  return (
    <section className="relative overflow-hidden py-20 md:py-28 lg:py-32 bg-white">
      {/* Floating icons container */}
      <div ref={iconsContainerRef} className="absolute inset-0 pointer-events-none">
        {/* Top left icons */}
        <div className="absolute top-10 left-10">
          <Cross className="floating-icon text-purple-600 w-10 h-10 opacity-20" />
        </div>
        <div className="absolute top-32 left-24">
          <Dove className="floating-icon text-indigo-400 w-8 h-8 opacity-30" />
        </div>
        <div className="absolute top-20 left-40">
          <Heart className="floating-icon text-pink-400 w-6 h-6 opacity-25" />
        </div>

        {/* Top right icons */}
        <div className="absolute top-16 right-20">
          <Sun className="floating-icon text-yellow-500 w-12 h-12 opacity-20" />
        </div>
        <div className="absolute top-40 right-40">
          <Star className="floating-icon text-yellow-400 w-8 h-8 opacity-25" />
        </div>
        <div className="absolute top-24 right-60">
          <PrayingHands className="floating-icon text-indigo-500 w-8 h-8 opacity-20" />
        </div>

        {/* Bottom left icons */}
        <div className="absolute bottom-20 left-16">
          <Flame className="floating-icon text-orange-500 w-10 h-10 opacity-20" />
        </div>
        <div className="absolute bottom-40 left-40">
          <Scroll className="floating-icon text-purple-400 w-8 h-8 opacity-25" />
        </div>
        <div className="absolute bottom-60 left-20">
          <Music className="floating-icon text-purple-500 w-6 h-6 opacity-20" />
        </div>

        {/* Bottom right icons */}
        <div className="absolute bottom-16 right-20">
          <Church className="floating-icon text-indigo-600 w-10 h-10 opacity-20" />
        </div>
        <div className="absolute bottom-40 right-40">
          <Moon className="floating-icon text-indigo-400 w-8 h-8 opacity-25" />
        </div>
        <div className="absolute bottom-60 right-20">
          <Compass className="floating-icon text-yellow-500 w-6 h-6 opacity-20" />
        </div>

        {/* Center area icons */}
        <div className="absolute top-1/3 left-1/4">
          <Sparkles className="floating-icon text-yellow-400 w-6 h-6 opacity-15" />
        </div>
        <div className="absolute top-2/3 right-1/4">
          <Star className="floating-icon text-yellow-500 w-5 h-5 opacity-15" />
        </div>
        <div className="absolute top-1/2 left-1/3">
          <Heart className="floating-icon text-pink-400 w-4 h-4 opacity-15" />
        </div>
      </div>

      {/* Main content */}
      <div className="container relative mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - text content */}
          <div className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
            {/* Main heading with decorative elements */}
            <div className="relative inline-block mb-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-indigo-950">
                Welcome to{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 text-purple-700">Trailblazers Nation</span>
                  <span className="absolute -bottom-2 left-0 right-0 h-3 bg-yellow-300/30 rounded-full blur-sm"></span>
                </span>
              </h1>
            </div>

            <p className="mt-6 text-lg md:text-xl text-gray-600">
              A family of believers passionate about spreading the light of Jesus Christ and empowering individuals to
              walk boldly in faith, purpose, and love.
            </p>

            {/* Call to action buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/register"
                className="px-8 py-4 bg-purple-700 text-white font-medium rounded-full hover:bg-purple-600 transition-all flex items-center justify-center shadow-lg shadow-purple-200 transform hover:scale-105"
              >
                Become a Member <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/events"
                className="px-8 py-4 bg-white border-2 border-purple-200 text-purple-700 font-medium rounded-full hover:bg-purple-50 transition-all flex items-center justify-center transform hover:scale-105"
              >
                Upcoming Events
              </Link>
            </div>

            {/* Stats in a modern card layout */}
            <div
              ref={statsRef}
              className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 opacity-0 translate-y-4 transition-all duration-700"
              style={{ transitionDelay: "300ms" }}
            >
              <div className="bg-white rounded-2xl p-4 border border-purple-100 hover:border-purple-200 transition-all hover:shadow-lg hover:shadow-purple-100 group">
                <div className="flex items-center justify-center mb-3">
                  <div className="bg-purple-50 p-3 rounded-full group-hover:bg-purple-100 transition-colors">
                    <Cross className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-indigo-950">10+</h3>
                <p className="text-gray-500 text-sm">Years of Ministry</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-purple-100 hover:border-purple-200 transition-all hover:shadow-lg hover:shadow-purple-100 group">
                <div className="flex items-center justify-center mb-3">
                  <div className="bg-purple-50 p-3 rounded-full group-hover:bg-purple-100 transition-colors">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-indigo-950">500+</h3>
                <p className="text-gray-500 text-sm"> Growing Community</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-purple-100 hover:border-purple-200 transition-all hover:shadow-lg hover:shadow-purple-100 group">
                <div className="flex items-center justify-center mb-3">
                  <div className="bg-purple-50 p-3 rounded-full group-hover:bg-purple-100 transition-colors">
                    <HeartHandshake className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-indigo-950">100+</h3>
                <p className="text-gray-500 text-sm">Events Held</p>
              </div>
            </div>
          </div>

          {/* Right column - image */}
          <div className="relative mx-auto lg:mx-0 max-w-3xl">
            <div className="relative">
              {/* Decorative elements */}
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-purple-100 rounded-full opacity-70 blur-xl"></div>
              <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-yellow-100 rounded-full opacity-70 blur-xl"></div>

              {/* Main image */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl border-2 border-purple-100">
                <img
                  src={heroImg}
                  alt="Trailblazers Nation worship gathering"
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Floating Bible Study card */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg p-4 max-w-xs text-indigo-950 border border-purple-100">
                <div className="flex items-start space-x-3">
                  <div className="bg-yellow-100 rounded-full p-2">
                    <BookOpen className="h-5 w-5 text-purple-700" />
                  </div>
                  <div>
                    <h4 className="font-medium">Weekly Bible Study</h4>
                    <p className="text-sm text-gray-600 mt-1">Wednesdays at 7pm</p>
                    <div className="mt-2 flex items-center">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-6 w-6 rounded-full bg-purple-100 border-2 border-white overflow-hidden flex items-center justify-center"
                          >
                            <PrayingHands className="h-3 w-3 text-purple-600" />
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 ml-2">+25 attending</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="relative my-16">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent"></div>
          <div className="relative flex justify-center">
            <div className="bg-white px-4 z-10">
              <Cross className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* CSS for floating animation */}
      <style jsx="true">{`
        @keyframes float {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(5deg);
          }
          100% {
            transform: translateY(0px) rotate(0deg);
          }
        }
        
        .floating-icon {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-in {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  )
}

export default Hero

