import Image from "next/image";

export default function About() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="container-fluid pt-20 pb-24">
        {/* Decorative Logos */}
        <div className="flex gap-4 mb-24">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border border-black flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 m-auto w-3/4 h-3/4 border border-black transform rotate-45"></div>
          </div>
          <div className="w-24 h-24 md:w-32 md:h-32 relative flex items-center justify-center">
            <div className="absolute w-full h-full border-[8px] border-dotted border-black rounded-full"></div>
          </div>
        </div>

        <h1 className="text-h1 max-w-5xl leading-tight">
          Every visual tells a story, and seeing is truly believing. We specialize in making this come to life in digital branding.
        </h1>
      </section>

      <div className="container-fluid">
        <div className="divider" />
      </div>

      {/* Our Services Section */}
      <section className="container-fluid py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <h2 className="text-h2">Our Services</h2>
          </div>
          
          <div className="md:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-16 gap-x-8">
              <div>
                <h3 className="text-h3 mb-4">Digital Strategy</h3>
                <p className="text-body text-gray-500">
                  Aligning your digital presence with your core business objectives through data-driven insights and market research.
                </p>
              </div>
              <div>
                <h3 className="text-h3 mb-4">Art Direction</h3>
                <p className="text-body text-gray-500">
                  Guiding the visual narrative to ensure every touchpoint resonates with your audience.
                </p>
              </div>
              <div>
                <h3 className="text-h3 mb-4">Visual Identity</h3>
                <p className="text-body text-gray-500">
                  Crafting memorable logos, color palettes, and typography systems that define your brand.
                </p>
              </div>
              <div>
                <h3 className="text-h3 mb-4">Brand Strategy</h3>
                <p className="text-body text-gray-500">
                  Defining your brand's voice, positioning, and long-term vision in a competitive landscape.
                </p>
              </div>
              <div>
                <h3 className="text-h3 mb-4">Interaction Design</h3>
                <p className="text-body text-gray-500">
                  Creating intuitive, engaging user interfaces that delight and convert.
                </p>
              </div>
              <div>
                <h3 className="text-h3 mb-4">Copywriting</h3>
                <p className="text-body text-gray-500">
                  Articulating your brand's story with clarity, emotion, and purpose.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-fluid">
        <div className="divider-light" />
      </div>

      {/* Our Team Section */}
      <section className="container-fluid py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <h2 className="text-huge">Our Team</h2>
          </div>
          
          <div className="md:col-span-8">
            {/* Leadership */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="flex flex-col">
                <div className="aspect-square bg-gray-200 mb-6 relative overflow-hidden grayscale">
                   <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1000')] bg-cover bg-center"></div>
                </div>
                <h3 className="text-h3">Alex L.</h3>
                <p className="text-body text-gray-500 mt-2">Founder and Creative Director</p>
              </div>
              <div className="flex flex-col">
                <div className="aspect-square bg-gray-200 mb-6 relative overflow-hidden grayscale">
                   <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000')] bg-cover bg-center"></div>
                </div>
                <h3 className="text-h3">Cathy G.</h3>
                <p className="text-body text-gray-500 mt-2">Managing Director and Partner</p>
              </div>
            </div>

            <div className="divider-light mb-16" />

            {/* Team Members */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-8">
              <div>
                <h3 className="text-h3">Jeremy T.</h3>
                <p className="text-body text-gray-500 mt-1">Senior Designer</p>
              </div>
              <div>
                <h3 className="text-h3">Mariana V.</h3>
                <p className="text-body text-gray-500 mt-1">Senior Designer</p>
              </div>
              <div>
                <h3 className="text-h3">Phillip G.</h3>
                <p className="text-body text-gray-500 mt-1">Senior Designer</p>
              </div>
              <div>
                <h3 className="text-h3">Kat E.</h3>
                <p className="text-body text-gray-500 mt-1">Senior Designer</p>
              </div>
              <div>
                <h3 className="text-h3">Lauren W.</h3>
                <p className="text-body text-gray-500 mt-1">Senior Designer</p>
              </div>
              <div>
                <h3 className="text-h3">Caleb E.</h3>
                <p className="text-body text-gray-500 mt-1">Senior Designer</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
