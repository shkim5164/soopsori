import Image from "next/image";

export default function Project() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="container-fluid pt-20 pb-24">
        {/* Decorative Logos */}
        <div className="flex gap-4 mb-24">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border border-black flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 m-auto w-3/4 h-3/4 border border-black transform rotate-45"></div>
          </div>
          <div className="w-32 h-32 md:w-48 md:h-48 relative flex items-center justify-center">
            <div className="absolute w-full h-full border-[8px] border-dotted border-black rounded-full"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Left Column */}
          <div className="md:col-span-7 flex flex-col justify-end">
            <div className="mb-8">
              <span className="text-h3 border-b border-black pb-1">Case Study</span>
            </div>
            <h1 className="text-huge">Anders Interiors</h1>
          </div>

          {/* Right Column */}
          <div className="md:col-span-5 flex flex-col justify-end gap-16">
            <p className="text-h3 leading-snug">
              Can a digital catalog capture the essence of luxury furniture? Anders Interiors asked us to create a digital catalog that mirrored the elegance of their brand. See how we combined refined typography, stunning visuals, and intuitive design to deliver an online experience that truly resonates with their discerning clientele.
            </p>
            
            <div className="flex flex-col gap-2 text-gray-500 text-h3 font-normal">
              <p>Digital Catalog &amp; Typography</p>
              <p>Branding</p>
              <p>Website</p>
              <p>Logo</p>
              <p>Art Direction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery */}
      <section className="container-fluid pb-24">
        <div className="w-full aspect-[21/9] bg-gray-200 relative mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=2000')] bg-cover bg-center"></div>
        </div>
        <div className="grid-2">
          <div className="w-full aspect-[4/3] bg-gray-100 relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1000')] bg-cover bg-center"></div>
          </div>
          <div className="w-full aspect-[4/3] bg-gray-100 relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000')] bg-cover bg-center"></div>
          </div>
        </div>
      </section>

      <div className="container-fluid">
        <div className="divider" />
      </div>

      {/* Next Project */}
      <section className="container-fluid py-24 flex justify-between items-end">
        <div>
          <p className="text-sm text-gray-500 mb-4">Next Project</p>
          <h2 className="text-h1 hover:underline cursor-pointer">Redo</h2>
        </div>
        <div>
          <span className="text-h1">→</span>
        </div>
      </section>
    </div>
  );
}
