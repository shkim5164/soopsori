import React from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export const metadata = {
  title: "Design System | Soopsori",
  description: "Soopsori Neo-Brutalism Design System showcase",
};

export default function DesignSystemPage() {
  return (
    <div className="max-w-5xl mx-auto p-8 space-y-16 animate-fade-in-up">
      <div className="space-y-4">
        <h1 className="text-5xl font-black lowercase tracking-tighter">Design System</h1>
        <p className="text-lg font-bold text-gray-600">
          Soopsori Neo-Brutalism UI Components Showcase
        </p>
      </div>

      <div className="neo-divider" />

      {/* Buttons */}
      <section className="space-y-6">
        <h2 className="text-3xl font-black">Buttons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Variants</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="default">Default</Button>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Sizes</h3>
            <div className="flex flex-wrap items-end gap-4">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">
                <span className="text-xl">⭐</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="neo-divider" />

      {/* Badges */}
      <section className="space-y-6">
        <h2 className="text-3xl font-black">Badges</h2>
        <div className="flex flex-wrap gap-4">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="vocal">Vocal</Badge>
          <Badge variant="acoustic-guitar">A.Guitar</Badge>
          <Badge variant="electric-guitar">E.Guitar</Badge>
          <Badge variant="bass">Bass</Badge>
          <Badge variant="drum">Drum</Badge>
          <Badge variant="keyboard">Keyboard</Badge>
          <Badge variant="other">Other</Badge>
        </div>
      </section>

      <div className="neo-divider" />

      {/* Input */}
      <section className="space-y-6">
        <h2 className="text-3xl font-black">Inputs</h2>
        <div className="max-w-md space-y-4">
          <Input type="text" placeholder="Default text input" />
          <Input type="email" placeholder="Email address" />
          <Input type="password" placeholder="Password" />
          <Input type="text" placeholder="Disabled input" disabled />
        </div>
      </section>

      <div className="neo-divider" />

      {/* Cards */}
      <section className="space-y-6">
        <h2 className="text-3xl font-black">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Standard Card</CardTitle>
              <CardDescription>This is a standard neo-brutalist card.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-bold">Cards are great for grouping related content together.</p>
            </CardContent>
            <CardFooter>
              <Button variant="primary" className="w-full">Action</Button>
            </CardFooter>
          </Card>
          
          <Card className="bg-neo-yellow">
            <CardHeader>
              <CardTitle>Colored Card</CardTitle>
              <CardDescription className="text-gray-800">You can easily override background colors.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-bold">Just add Tailwind classes like `bg-neo-yellow`.</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost">Cancel</Button>
              <Button variant="default">Submit</Button>
            </CardFooter>
          </Card>
        </div>
      </section>
      
      <div className="neo-divider" />
      
      {/* Colors */}
      <section className="space-y-6">
        <h2 className="text-3xl font-black">Brand Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-20 w-full border-2 border-black bg-neo-yellow rounded-lg"></div>
            <p className="font-bold text-center">Neo Yellow</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 w-full border-2 border-black bg-neo-pink rounded-lg"></div>
            <p className="font-bold text-center">Neo Pink</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 w-full border-2 border-black bg-neo-blue rounded-lg"></div>
            <p className="font-bold text-center">Neo Blue</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 w-full border-2 border-black bg-neo-green rounded-lg"></div>
            <p className="font-bold text-center">Neo Green</p>
          </div>
        </div>
      </section>

    </div>
  );
}
