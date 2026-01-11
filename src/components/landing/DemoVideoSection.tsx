import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, X } from "lucide-react";

export function DemoVideoSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section id="demo" className="py-20 bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-purple-400 font-medium text-sm uppercase tracking-wider">
            Nasıl Çalışır?
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Ürün aktarımı bu kadar kolay
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Bir pazaryerinden diğerine ürün aktarımını saniyeler içinde yapın. 
            AI destekli optimizasyon ile satışlarınızı artırın.
          </p>
        </div>

        {/* Video Container */}
        <div className="relative max-w-4xl mx-auto">
          {/* Video Thumbnail / Player */}
          <div 
            className="relative aspect-video rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shadow-2xl shadow-purple-500/10 group cursor-pointer"
            onClick={() => setIsPlaying(true)}
          >
            {!isPlaying ? (
              <>
                {/* Thumbnail with overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-slate-900/80">
                  {/* Mock dashboard preview */}
                  <div className="absolute inset-4 rounded-xl overflow-hidden bg-slate-900/90 border border-slate-700">
                    {/* Header bar */}
                    <div className="h-10 bg-slate-800 border-b border-slate-700 flex items-center px-4 gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-green-500/60" />
                      <span className="ml-4 text-xs text-slate-400">Seller Club - Dashboard</span>
                    </div>
                    
                    {/* Mock content */}
                    <div className="p-4 flex gap-4 h-full">
                      {/* Sidebar mock */}
                      <div className="w-48 space-y-2">
                        <div className="h-8 bg-purple-500/20 rounded-lg" />
                        <div className="h-6 bg-slate-700/50 rounded-lg w-32" />
                        <div className="h-6 bg-slate-700/50 rounded-lg w-40" />
                        <div className="h-6 bg-slate-700/50 rounded-lg w-36" />
                      </div>
                      
                      {/* Main content mock */}
                      <div className="flex-1 space-y-3">
                        <div className="flex gap-3">
                          <div className="h-24 w-24 bg-slate-700/50 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-700/50 rounded w-3/4" />
                            <div className="h-3 bg-slate-700/30 rounded w-1/2" />
                            <div className="h-6 bg-purple-500/30 rounded w-24 mt-2" />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="h-24 w-24 bg-slate-700/50 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-700/50 rounded w-2/3" />
                            <div className="h-3 bg-slate-700/30 rounded w-1/3" />
                            <div className="h-6 bg-green-500/30 rounded w-20 mt-2" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Pulsing ring */}
                    <div className="absolute inset-0 -m-4 rounded-full bg-purple-500/30 animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="absolute inset-0 -m-2 rounded-full bg-purple-500/40 animate-pulse" />
                    
                    {/* Button */}
                    <Button 
                      size="lg"
                      className="relative w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-xl shadow-purple-500/40 border-0"
                    >
                      <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            ) : (
              <>
                {/* Video player - using a placeholder/embed */}
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-slate-400">Demo video yükleniyor...</p>
                    <p className="text-xs text-slate-500 mt-2">Video içeriği yakında eklenecek</p>
                  </div>
                </div>
                
                {/* Close button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlaying(false);
                  }}
                  className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </>
            )}
          </div>

          {/* Feature highlights below video */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-white font-semibold mb-1">Hızlı Aktarım</h3>
              <p className="text-sm text-slate-400">
                Binlerce ürünü saniyeler içinde aktarın
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-white font-semibold mb-1">AI Optimizasyon</h3>
              <p className="text-sm text-slate-400">
                Başlık ve açıklamalar otomatik optimize edilir
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="text-white font-semibold mb-1">Çift Yönlü Sync</h3>
              <p className="text-sm text-slate-400">
                Stok ve fiyat değişiklikleri anında senkronize
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
