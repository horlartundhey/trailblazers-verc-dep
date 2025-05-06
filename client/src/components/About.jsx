import React from 'react';
import { Users, Cross, HeartHandshake, BookOpen } from 'lucide-react';
import about from "../assets/images/gal_four.jpg"

const About = () => {
  const features = [
    {
      icon: <Cross className="h-8 w-8 text-yellow-300" />,
      title: "Our Faith",
      description: "We are grounded in the truth of the Gospel and committed to sharing the love of Christ."
    },
    {
      icon: <Users className="h-8 w-8 text-yellow-300" />,
      title: "Our Community",
      description: "A diverse family united in purpose, supporting one another in faith and life."
    },
    {
      icon: <HeartHandshake className="h-8 w-8 text-yellow-300" />,
      title: "Our Mission",
      description: "To empower believers to live out their God-given purpose in their communities."
    },
    {
      icon: <BookOpen className="h-8 w-8 text-yellow-300" />,
      title: "Our Values",
      description: "Biblical truth, authentic relationships, radical generosity, and joyful service."
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-purple-900 mb-4">
            About Trailblazers Nation
          </h2>
          <div className="w-24 h-1 bg-yellow-300 mx-auto mb-6"></div>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            We are a movement of believers committed to transforming lives through the power of the Gospel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="bg-purple-50 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-purple-800 mb-2">{feature.title}</h3>
              <p className="text-gray-700">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2">
            <img 
              src={about}
              alt="Trailblazers Nation community" 
              className="rounded-lg shadow-xl w-full h-auto"
            />
          </div>
          <div className="lg:w-1/2">
            <h3 className="text-2xl font-bold text-purple-900 mb-4">Our Story</h3>
            <p className="text-gray-700 mb-4">
              Founded in 2008, Trailblazers Nation began as a small Bible study group with a big vision. 
              What started with just 12 people meeting in a living room has grown into a vibrant 
              community impacting thousands across the nation.
            </p>
            <p className="text-gray-700 mb-6">
              Through years of prayer, worship, and service, we've seen lives transformed, families restored, 
              and communities renewed by the power of God's love.
            </p>
            <div className="bg-purple-100 border-l-4 border-yellow-300 p-4">
              <p className="italic text-purple-900">
                "For we are God's handiwork, created in Christ Jesus to do good works, 
                which God prepared in advance for us to do." - Ephesians 2:10
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;