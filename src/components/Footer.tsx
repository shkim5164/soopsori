export default function Footer() {
  return (
    <footer className="w-full mt-auto border-t border-black">
      <div className="container-fluid py-12 flex flex-col justify-between h-[40vh] min-h-[300px]">
        {/* Top part of footer */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="max-w-md">
            <p className="text-body font-medium mb-4">
              Connect with us to explore your project's potential.
            </p>
            <div className="flex gap-4">
              <span className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                 <span className="text-black text-xs">F</span>
              </span>
              <span className="w-8 h-8 rounded-full border border-black flex items-center justify-center">
                 <span className="text-black text-xs">&amp;</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <a href="mailto:hello@frameandform.com" className="text-small hover:underline underline-offset-4 decoration-1">
              hello@frameandform.com
            </a>
            <span className="text-small text-gray-500">
              Seoul, South Korea
            </span>
          </div>
        </div>

        {/* Bottom Huge Text */}
        <div className="mt-12 flex items-end">
          <h2 className="text-[clamp(3rem,12vw,12rem)] leading-none font-medium tracking-tighter w-full text-center md:text-left">
            Frame &amp; Form
          </h2>
        </div>
      </div>
    </footer>
  );
}
