import { useState } from "react";
import { Settings, Image, Globe } from "lucide-react";

const tools = [
  {
    id: "optimize",
    label: "Ürünleri optimize et",
    icon: Settings,
    image: "/placeholder.svg",
  },
  {
    id: "studio",
    label: "Fotoğraf stüdyosu",
    icon: Image,
    image: "/placeholder.svg",
  },
  {
    id: "channels",
    label: "Kanalları aktifleştir",
    icon: Globe,
    image: "/placeholder.svg",
  },
];

export function ToolsShowcase() {
  const [activeTab, setActiveTab] = useState("optimize");

  const activeTool = tools.find(t => t.id === activeTab);

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white rounded-full p-1 shadow-sm">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTab(tool.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
                  activeTab === tool.id
                    ? "bg-foreground text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tool.icon className="w-4 h-4" />
                {tool.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <activeTool.icon className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">{activeTool?.label}</p>
              <p className="text-sm mt-2">Görsel önizleme alanı</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
