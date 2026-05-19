'use client';

import { SidebarNav, BottomTabNav } from '@/components/Navigation';
import { StatCard } from '@/components/UI';

export default function LandingPage() {
  return (
    <div className="flex">
      <SidebarNav />
      <main className="flex-1 pb-16 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Hero Section */}
          <section className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">⏱️ TaskTimer</h1>
            <p className="text-xl text-gray-600 mb-8">Track your time, organize your projects, maximize your productivity</p>
            <div className="flex gap-4 justify-center">
              <a
                href="/register"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Get Started
              </a>
              <a
                href="/login"
                className="px-8 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Sign In
              </a>
            </div>
          </section>

          {/* Public Stats */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Join Our Community</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Total Users" value="1,250" icon="👥" />
              <StatCard label="Hours Tracked" value="125,480" icon="⏱️" />
              <StatCard label="Projects Active" value="3,890" icon="📁" />
            </div>
          </section>

          {/* Features */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold mb-2">📊 Analytics</h3>
              <p className="text-gray-700">Get insights with charts, heatmaps, and detailed breakdowns of your work.</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold mb-2">⏲️ Real-time Timer</h3>
              <p className="text-gray-700">Track time as you work with our intuitive timer widget.</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold mb-2">📅 Calendar View</h3>
              <p className="text-gray-700">Visualize your schedule and spot overlaps with color-coded blocks.</p>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold mb-2">📁 Project Management</h3>
              <p className="text-gray-700">Organize tasks by project with custom colors and categories.</p>
            </div>
          </section>
        </div>
      </main>
      <BottomTabNav />
    </div>
  );
}
