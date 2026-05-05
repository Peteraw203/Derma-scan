import { MessageSquare, Stethoscope, Video } from "lucide-react";

export default function ConsultScreen() {
  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-6 py-6 md:py-10">
      <div className="flex items-center gap-3 mb-6">
        <Stethoscope className="w-6 h-6 text-health-green" />
        <h1 className="text-[22px] font-bold text-health-dark-blue">Consultation</h1>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Chat AI */}
        <div className="w-full rounded-[20px] bg-card-white shadow-sm p-5 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-[14px] bg-health-green/10 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-health-green" />
            </div>
            <div>
              <h2 className="text-base font-bold text-health-dark-blue">AI Assistant</h2>
              <p className="text-xs text-text-gray">24/7 Oral Health Bot</p>
            </div>
          </div>
          <p className="text-sm text-health-dark-blue mb-4">Chat with our AI model for quick assessments and general inquiries.</p>
          <button className="w-full bg-health-green text-white font-bold py-2 rounded-xl text-sm">Start Chat</button>
        </div>

        {/* Doctor Consultation */}
        <div className="w-full rounded-[20px] bg-card-white shadow-sm p-5 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-[14px] bg-health-dark-blue/10 flex items-center justify-center">
              <Video className="w-6 h-6 text-health-dark-blue" />
            </div>
            <div>
              <h2 className="text-base font-bold text-health-dark-blue">Online Doctor</h2>
              <p className="text-xs text-text-gray">Specialist Telemedicine</p>
            </div>
          </div>
          <p className="text-sm text-health-dark-blue mb-4">Book a session or chat live with our certified oral health specialists.</p>
          <button className="w-full bg-health-dark-blue text-white font-bold py-2 rounded-xl text-sm">Find Doctor</button>
        </div>
      </div>
    </div>
  );
}
