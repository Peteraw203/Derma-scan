import { Cpu, Wifi } from "lucide-react";

export default function IotScreen() {
  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-6 py-6 md:py-10">
      <div className="flex items-center gap-3 mb-6">
        <Cpu className="w-6 h-6 text-health-green" />
        <h1 className="text-[22px] font-bold text-health-dark-blue">IoT Connection</h1>
      </div>
      
      <div className="w-full rounded-[20px] bg-card-white shadow-sm p-5 border border-gray-100 flex flex-col items-center justify-center mt-10">
        <div className="w-20 h-20 rounded-full bg-health-green/10 flex items-center justify-center mb-4">
          <Wifi className="w-10 h-10 text-health-green" />
        </div>
        <h2 className="text-lg font-bold text-health-dark-blue mb-2">Connect Device</h2>
        <p className="text-sm text-text-gray text-center mb-6">
          Pair with your skin cancer detection IoT device to sync data automatically.
        </p>
        <button className="w-full bg-health-green text-white font-bold py-3 rounded-xl hover:bg-health-green/90 transition-colors">
          Scan for Devices
        </button>
      </div>
    </div>
  );
}
