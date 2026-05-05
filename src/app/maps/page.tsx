import { MapPin } from "lucide-react";

export default function MapsScreen() {
  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-6 py-6 md:py-10">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="w-6 h-6 text-health-green" />
        <h1 className="text-[22px] font-bold text-health-dark-blue">Maps & Clinics</h1>
      </div>
      <div className="flex-1 rounded-[20px] bg-card-white shadow-sm flex items-center justify-center border border-gray-100">
        <div className="text-center flex flex-col items-center">
          <MapPin className="w-12 h-12 text-gray-300 mb-2" />
          <p className="text-text-gray text-sm">Map integration will be displayed here.</p>
        </div>
      </div>
    </div>
  );
}
