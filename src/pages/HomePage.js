import React from 'react';
import { useNavigate } from 'react-router-dom';
import PrimaryButton from '../components/ui/PrimaryButton';
import OutlineButton from '../components/ui/OutlineButton';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SitterCard from '../components/SitterCard';

const HomePage = () => {
  const navigate = useNavigate();
  
  const sitters = [
    { id: 1, name: 'Alex Thompson', grade: 11, school: 'Lincoln High', rate: 15, rating: 4.8, tags: ['CPR', 'First Aid'] },
    { id: 2, name: 'Emma Rodriguez', grade: 12, school: 'Roosevelt High', rate: 18, rating: 4.9, tags: ['CPR'] },
    { id: 3, name: 'Jordan Kim', grade: 10, school: 'Central High', rate: 12, rating: 4.7, tags: ['First Aid'] },
    { id: 4, name: 'Maya Singh', grade: 12, school: 'Eastview High', rate: 16, rating: 4.9, tags: ['CPR', 'Tutor'] },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-dark leading-tight">Reliable childcare from responsible students</h1>
              <p className="mt-4 text-neutral-light text-lg">Sit Side connects families with trusted high school sitters. Flexible schedules, transparent rates, and simple booking.</p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <PrimaryButton onClick={() => navigate('/signup?type=parent')}>Find a Sitter</PrimaryButton>
                <OutlineButton onClick={() => navigate('/signup?type=student')}>Become a Sitter</OutlineButton>
              </div>
              <div className="mt-6">
                <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-soft max-w-md">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="text-neutral-light"><path stroke="currentColor" strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"/></svg>
                  <input aria-label="Search location" className="w-full rounded-xl px-3 py-2 outline-none" placeholder="Search by location or school"/>
                  <PrimaryButton className="px-4 py-2" onClick={() => navigate('/signup?type=parent')}>Search</PrimaryButton>
                </div>
              </div>
            </div>
            <div>
              <Card className="p-6">
                <div className="rounded-2xl bg-primary/10 p-10 text-center">
                  <span className="text-6xl">🧸</span>
                  <p className="mt-4 text-neutral-dark font-semibold">Safe, friendly, student-centered</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-neutral-dark text-center">How It Works</h2>
          <div className="mt-10 grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-neutral-dark">For Parents</h3>
              <ul className="mt-4 space-y-2 text-neutral-light">
                <li>• Browse local student sitters</li>
                <li>• Check availability, rates, and reviews</li>
                <li>• Book and pay securely</li>
              </ul>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-neutral-dark">For Students</h3>
              <ul className="mt-4 space-y-2 text-neutral-light">
                <li>• Create a profile and set your schedule</li>
                <li>• Get matched with nearby families</li>
                <li>• Earn safely with flexible hours</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Sitters */}
      <section id="featured" className="bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-neutral-dark">Featured Sitters</h2>
            <button type="button" className="text-primary hover:underline">See all</button>
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sitters.map(s => (
              <SitterCard key={s.id} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-neutral-dark text-center">What Families Say</h2>
          <div className="mt-10 grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <p className="italic text-neutral-dark">“Sit Side made it so easy to find someone trustworthy for a last-minute night out.”</p>
              <div className="mt-4 text-sm text-neutral-light">— Sarah M.</div>
            </Card>
            <Card className="p-6">
              <p className="italic text-neutral-dark">“As a student, I love the flexibility and the families I’ve met.”</p>
              <div className="mt-4 text-sm text-neutral-light">— Alex T.</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Safety & Trust */}
      <section id="safety" className="bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <Badge color="secondary">Safety</Badge>
              <h3 className="mt-3 text-xl font-semibold text-neutral-dark">Verified profiles</h3>
              <p className="mt-2 text-neutral-light">We emphasize identity verification and transparent reviews.</p>
            </Card>
            <Card className="p-6">
              <Badge color="secondary">Trust</Badge>
              <h3 className="mt-3 text-xl font-semibold text-neutral-dark">Transparent ratings</h3>
              <p className="mt-2 text-neutral-light">Families leave helpful feedback after each booking.</p>
            </Card>
            <Card className="p-6">
              <Badge color="secondary">Support</Badge>
              <h3 className="mt-3 text-xl font-semibold text-neutral-dark">Responsive support</h3>
              <p className="mt-2 text-neutral-light">We’re here to help with any questions or concerns.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-neutral-dark">Ready to get started?</h2>
          <p className="mt-2 text-neutral-light">Create your account and join our trusted community today.</p>
          <div className="mt-6 flex justify-center gap-3">
            <PrimaryButton onClick={() => navigate('/signup')}>Get Started</PrimaryButton>
            <OutlineButton onClick={() => navigate('/login')}>Learn More</OutlineButton>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;