import { User, Settings, LogOut, FileText } from "lucide-react";

export default function ProfileScreen() {
  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto md:py-10">
      <div className="bg-health-green text-white px-5 py-10 md:rounded-[30px] rounded-b-[30px] flex flex-col items-center shadow-md md:mx-0">
        <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white flex items-center justify-center text-4xl font-bold mb-4 shadow-inner">
          U
        </div>
        <h1 className="text-[22px] font-bold">User Name</h1>
        <p className="text-white/80 text-sm">user@example.com</p>
      </div>

      <div className="px-5 mt-6 flex flex-col gap-3">
        <div className="w-full rounded-[16px] bg-card-white shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-health-green/10 flex items-center justify-center">
            <User className="w-5 h-5 text-health-green" />
          </div>
          <span className="font-semibold text-health-dark-blue flex-1">Edit Profile</span>
        </div>

        <div className="w-full rounded-[16px] bg-card-white shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-health-green/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-health-green" />
          </div>
          <span className="font-semibold text-health-dark-blue flex-1">Medical History</span>
        </div>

        <div className="w-full rounded-[16px] bg-card-white shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-health-green/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-health-green" />
          </div>
          <span className="font-semibold text-health-dark-blue flex-1">Settings</span>
        </div>

        <div className="w-full rounded-[16px] bg-card-white shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:bg-red-50 transition-colors mt-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-500" />
          </div>
          <span className="font-semibold text-red-500 flex-1">Log Out</span>
        </div>
      </div>
    </div>
  );
}
