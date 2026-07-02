"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Shield,
  Bell,
  Trash2,
  CheckCircle,
  Lock,
  Eye,
  AlertTriangle,
  Laptop,
  Smartphone,
  Globe,
  Settings,
  Languages
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PortalSettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "notifications" | "security">("profile");

  // Profile Form States
  const [name, setName] = useState("Roy Wedding Admin");
  const [email, setEmail] = useState("client@eventos.io");
  const [phone, setPhone] = useState("+91 99999 99999");
  const [address, setAddress] = useState("Vasant Kunj, New Delhi");
  const [emergencyContact, setEmergencyContact] = useState("Rahul Sharma (+91 98765 43210)");
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Preference Settings
  const [language, setLanguage] = useState("en");
  const [themeMode, setThemeMode] = useState("dark");
  const [downloadPath, setDownloadPath] = useState("Local storage");

  // Notification Preferences
  const [whatsappReminders, setWhatsappReminders] = useState(true);
  const [emailReminders, setEmailReminders] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securitySuccess, setSecuritySuccess] = useState(false);

  // Sessions log
  const [sessions, setSessions] = useState([
    { id: "1", device: "Current Device", browser: "Chrome &bull; Delhi, IN", active: true },
    { id: "2", device: "Mobile Device", browser: "Safari &bull; Noida, IN", active: false }
  ]);

  // Delete request
  const [deleteRequested, setDeleteRequested] = useState(false);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 2500);
  };

  const handleNotificationsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifSuccess(true);
    setTimeout(() => setNotifSuccess(false), 2500);
  };

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return;
    setSecuritySuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setSecuritySuccess(false), 2500);
  };

  const revokeSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-8 animate-slide-in text-zinc-300 select-none">
      
      {/* Header */}
      <header className="border-b border-zinc-800 pb-6">
        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
          Profile & Account Settings <User className="text-purple-400" size={20} />
        </h2>
        <p className="text-xs text-zinc-450 mt-1">
          Configure security channels, update notification preferences, and manage emergency contacts.
        </p>
      </header>

      {/* Sub-tab selection bar */}
      <div className="flex bg-[#111113]/60 border border-zinc-850 p-1 rounded-2xl gap-1.5 overflow-x-auto max-w-md">
        {([
          { id: "profile", label: "Profile Info", icon: User },
          { id: "notifications", label: "Notifications", icon: Bell },
          { id: "security", label: "Security & Sessions", icon: Shield }
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all shrink-0",
              activeSubTab === tab.id ? "bg-zinc-800 text-purple-400 shadow-md" : "text-zinc-550 hover:text-zinc-350"
            )}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Settings Frame */}
      <div className="max-w-2xl">
        <AnimatePresence mode="wait">
          
          {/* PROFILE SUB-TAB */}
          {activeSubTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 border border-zinc-800 bg-[#111113]/40 rounded-2xl space-y-6"
            >
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">Client Profile Details</h3>
                <p className="text-[10px] text-zinc-550 mt-0.5 font-bold">These details are synced with active event contract templates.</p>
              </div>

              {profileSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle size={14} /> Profile details saved successfully.
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-550 uppercase font-black">Full Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-550 uppercase font-black">Email Address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-550 uppercase font-black">Phone Number</label>
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-550 uppercase font-black">Emergency Contact Coordinator</label>
                    <input type="text" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Billing Address</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none" />
                </div>

                {/* Preference parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-zinc-850 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-555 uppercase font-black flex items-center gap-1"><Languages size={11} /> Language</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300">
                      <option value="en">English (US)</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-555 uppercase font-black flex items-center gap-1"><Globe size={11} /> Theme</label>
                    <select value={themeMode} onChange={(e) => setThemeMode(e.target.value)} className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300">
                      <option value="dark">Dark Theme</option>
                      <option value="light">Light Theme</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-555 uppercase font-black flex items-center gap-1"><Settings size={11} /> Downloads</label>
                    <select value={downloadPath} onChange={(e) => setDownloadPath(e.target.value)} className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300">
                      <option value="Local storage">Local storage</option>
                      <option value="Google Drive">Google Drive</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-zinc-850">
                  <button type="submit" className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md">
                    Update Profile
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* NOTIFICATIONS SUB-TAB */}
          {activeSubTab === "notifications" && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 border border-zinc-800 bg-[#111113]/40 rounded-2xl space-y-5"
            >
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">Communication Preferences</h3>
                <p className="text-[10px] text-zinc-550 mt-0.5 font-bold">Manage channels used for invoice updates, payment reminders, and media alerts.</p>
              </div>

              {notifSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle size={14} /> Preferences updated successfully.
                </div>
              )}

              <form onSubmit={handleNotificationsSubmit} className="space-y-4 text-xs">
                
                <div className="space-y-4 divide-y divide-zinc-900">
                  <div className="flex justify-between items-center py-2.5">
                    <div>
                      <span className="font-extrabold text-zinc-250 block">WhatsApp Messages</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5 font-medium">Real-time payment logs, milestone updates, and media download links.</span>
                    </div>
                    <input type="checkbox" checked={whatsappReminders} onChange={(e) => setWhatsappReminders(e.target.checked)} />
                  </div>

                  <div className="flex justify-between items-center py-2.5">
                    <div>
                      <span className="font-extrabold text-zinc-250 block">Email Reports</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5 font-medium">Weekly schedules summaries, quotation alerts, and security logs.</span>
                    </div>
                    <input type="checkbox" checked={emailReminders} onChange={(e) => setEmailReminders(e.target.checked)} />
                  </div>

                  <div className="flex justify-between items-center py-2.5">
                    <div>
                      <span className="font-extrabold text-zinc-250 block">SMS Alerts</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5 font-medium">Emergency venue or scheduling alerts on event day.</span>
                    </div>
                    <input type="checkbox" checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-850">
                  <button type="submit" className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md">
                    Save Preferences
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* SECURITY & SESSIONS SUB-TAB */}
          {activeSubTab === "security" && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 border border-zinc-800 bg-[#111113]/40 rounded-2xl space-y-6"
            >
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">Account Access & Security</h3>
                <p className="text-[10px] text-zinc-550 mt-0.5 font-bold">Update security credentials or request account deletion files.</p>
              </div>

              {securitySuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle size={14} /> Password updated successfully.
                </div>
              )}

              <form onSubmit={handleSecuritySubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-550 uppercase font-black">Current Password</label>
                  <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-550 uppercase font-black">New Password</label>
                    <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-550 uppercase font-black">Confirm Password</label>
                    <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none" />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-zinc-850">
                  <button type="submit" className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md">
                    Change Password
                  </button>
                </div>
              </form>

              {/* Active Sessions */}
              <div className="border-t border-zinc-850 pt-5 space-y-3.5 text-xs">
                <span className="font-extrabold text-zinc-300 block uppercase tracking-wider text-[9.5px]">Connected Devices</span>
                
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div key={s.id} className="p-3 bg-zinc-950/20 border border-zinc-850 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        {s.device.toLowerCase().includes("mac") ? <Laptop size={14} className="text-zinc-500" /> : <Smartphone size={14} className="text-zinc-500" />}
                        <div>
                          <span className="font-bold text-zinc-250 block">{s.device}</span>
                          <span className="text-[9px] text-zinc-555 block font-mono" dangerouslySetInnerHTML={{ __html: s.browser }} />
                        </div>
                      </div>
                      {s.active ? (
                        <span className="text-[8.5px] text-purple-400 bg-purple-550/5 border border-purple-500/10 px-2 py-0.5 rounded-full font-black uppercase">Current Session</span>
                      ) : (
                        <button onClick={() => revokeSession(s.id)} className="p-1 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 rounded-lg text-[9px] font-bold">
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Delete account request */}
              <div className="border-t border-zinc-850 pt-5 space-y-3 text-xs">
                <span className="font-extrabold text-red-400 block uppercase tracking-wider text-[9.5px]">Danger Zone</span>
                <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">Request full deletion of your client data and media archives. This notifies the database administrator to review active event payments and contracts before purging records.</p>
                {deleteRequested ? (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black">Purge Request Registered</p>
                      <p className="text-[9.5px] opacity-90 mt-0.5 font-semibold">Your coordinator will contact you to confirm final contract closures.</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteRequested(true)}
                    className="px-3.5 py-1.5 bg-red-650/15 hover:bg-red-650/30 text-red-400 border border-red-550/20 rounded-xl font-bold transition-all shadow-md"
                  >
                    Request Account Deletion
                  </button>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
