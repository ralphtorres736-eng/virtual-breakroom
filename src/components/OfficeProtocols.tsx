import React, { useState, useMemo } from 'react';
import {
  Video,
  Clock,
  Calendar,
  BookOpen,
  Search,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Lock,
  Unlock,
  ShieldCheck,
} from 'lucide-react';

const FIRM_PASSCODE = 'Potter2026';

const CALENDAR_TEMPLATE =
  "HOLD for – [Client First Name] [Client Last Name] (Cause No.) – [OUR/OC]'s Hearing on [TYPE OF CASE] via [METHOD] – [Court #], [County] – [Address or Zoom ID] – [REASON FOR HOLD] – [Your Initials]";

interface AcronymItem {
  acronym: string;
  definition: string;
  category?: string;
}

const ACRONYMS_DATA: AcronymItem[] = [
  { acronym: 'CMRR', definition: 'Certified Mail Return Receipt Requested', category: 'Service & Filings' },
  { acronym: 'CPS', definition: 'Child Protective Services', category: 'Agencies' },
  { acronym: 'CYA', definition: 'Cover Your Ass!', category: 'Internal Practice' },
  { acronym: 'DCO', definition: 'Docket Control Order / Scheduling Order', category: 'Court Orders' },
  { acronym: 'DIV', definition: 'Divorce', category: 'Matter Types' },
  { acronym: 'DOB', definition: 'Date of Birth', category: 'Client Data' },
  { acronym: 'DOM', definition: 'Date of Marriage', category: 'Client Data' },
  { acronym: 'DWOP', definition: 'Dismissed for Want of Prosecution', category: 'Court Orders' },
  { acronym: 'E-File', definition: 'Electronic Filing', category: 'Service & Filings' },
  { acronym: 'ENF', definition: 'Enforcement', category: 'Matter Types' },
  { acronym: 'E-Service', definition: 'Electronic Service', category: 'Service & Filings' },
  { acronym: 'HCDC', definition: 'Harris County District Clerk', category: 'Courts & Clerks' },
  { acronym: 'IMMO', definition: 'In the Matter of the Marriage Of', category: 'Pleadings & Titles' },
  { acronym: 'ITIO', definition: 'In the Interest Of', category: 'Pleadings & Titles' },
  { acronym: 'IWO', definition: 'Income Withholding Order', category: 'Court Orders' },
  { acronym: 'LOR', definition: 'Letter of Representation', category: 'Correspondence' },
  { acronym: 'LVM', definition: 'Left Voicemail', category: 'Communications' },
  { acronym: 'MOD', definition: 'Modification', category: 'Matter Types' },
  { acronym: 'MSA', definition: 'Mediated Settlement Agreement', category: 'Agreements' },
  { acronym: 'MTW', definition: 'Motion to Withdraw', category: 'Pleadings & Motions' },
  { acronym: 'NOCP', definition: 'Notice of Court Proceeding', category: 'Notices' },
  { acronym: 'NOH', definition: 'Notice of Hearing', category: 'Notices' },
  { acronym: 'OAG', definition: 'Office of Attorney General', category: 'Agencies' },
  { acronym: 'OC', definition: 'Opposing Counsel', category: 'Parties & Attorneys' },
  { acronym: 'OP', definition: 'Opposing Party', category: 'Parties & Attorneys' },
  { acronym: 'PET', definition: 'Petition / Petitioner', category: 'Parties & Pleadings' },
  { acronym: 'PO', definition: 'Protective Order', category: 'Court Orders' },
  { acronym: 'POA', definition: 'Power of Attorney', category: 'Legal Instruments' },
  { acronym: 'PDI', definition: 'Proposed Disposition of Issue', category: 'Trial & Hearings' },
  { acronym: 'PTO', definition: 'Paid Time Off', category: 'Firm Admin' },
  { acronym: 'PUA', definition: 'Prove Up Affidavit', category: 'Affidavits' },
  { acronym: 'RFA', definition: 'Request for Admissions', category: 'Discovery' },
  { acronym: 'RFP', definition: 'Request for Production', category: 'Discovery' },
  { acronym: 'ROGGS', definition: 'Written Interrogatories', category: 'Discovery' },
  { acronym: 'SAPCR', definition: 'Suit Affecting the Parent Child Relationship', category: 'Matter Types' },
  { acronym: 'SBN', definition: 'State Bar Number', category: 'Credentials' },
  { acronym: 'SSN', definition: 'Social Security Number', category: 'Client Data' },
  { acronym: 'SWD', definition: 'Special Warranty Deed', category: 'Legal Instruments' },
  { acronym: 'T/C', definition: 'Telephone Call', category: 'Communications' },
  { acronym: 'TFC', definition: 'Texas Family Code', category: 'Statutes & Rules' },
  { acronym: 'TOH', definition: 'Temporary Orders Hearing', category: 'Trial & Hearings' },
  { acronym: 'TRCP', definition: 'Texas Rules of Civil Procedure', category: 'Statutes & Rules' },
  { acronym: 'TRO', definition: 'Temporary Restraining Order', category: 'Court Orders' },
];

interface OfficeProtocolsProps {
  isAuthenticated?: boolean;
  onAuthenticate?: () => void;
}

export const OfficeProtocols: React.FC<OfficeProtocolsProps> = ({
  isAuthenticated: parentAuthenticated,
  onAuthenticate,
}) => {
  // Local auth state synced with sessionStorage
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return parentAuthenticated || sessionStorage.getItem('firm_auth') === 'true';
  });
  const [passcodeAttempt, setPasscodeAttempt] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Search state for Acronym live filter
  const [acronymQuery, setAcronymQuery] = useState('');

  // Copy button feedback state
  const [isCopied, setIsCopied] = useState(false);

  // Sync with prop changes
  React.useEffect(() => {
    if (parentAuthenticated) {
      setIsUnlocked(true);
    }
  }, [parentAuthenticated]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeAttempt.trim() === FIRM_PASSCODE) {
      sessionStorage.setItem('firm_auth', 'true');
      setIsUnlocked(true);
      setPasscodeError('');
      if (onAuthenticate) {
        onAuthenticate();
      }
    } else {
      setPasscodeError('Invalid Firm Passcode. Please contact administration.');
    }
  };

  const handleCopyFormat = async () => {
    try {
      await navigator.clipboard.writeText(CALENDAR_TEMPLATE);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy calendar format:', err);
    }
  };

  const filteredAcronyms = useMemo(() => {
    const q = acronymQuery.toLowerCase().trim();
    if (!q) return ACRONYMS_DATA;
    return ACRONYMS_DATA.filter(
      (item) =>
        item.acronym.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))
    );
  }, [acronymQuery]);

  // Passcode Wall if not authenticated
  if (!isUnlocked) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-6 sm:p-10 bg-white rounded-2xl border border-brand-gold/30 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-law-navy flex items-center justify-center border border-brand-gold/40 shadow-inner">
          <Lock className="w-8 h-8 text-brand-gold-bright" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-brand-gold/25 text-xs font-semibold uppercase tracking-wider">
            Confidential Staff Document
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-law-navy">
            Office Protocols & Practice Standards
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            The Potter Law Group internal protocols are restricted to authorized personnel. Enter your firm passcode to view.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="max-w-sm mx-auto space-y-3 pt-2">
          <div className="text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Firm Passcode
            </label>
            <input
              type="password"
              required
              value={passcodeAttempt}
              onChange={(e) => {
                setPasscodeAttempt(e.target.value);
                setPasscodeError('');
              }}
              placeholder="Enter firm passcode (e.g., Potter2026)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold text-sm font-medium"
            />
            {passcodeError && (
              <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {passcodeError}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-5 rounded-xl bg-brand-law-navy hover:bg-brand-primary text-white text-sm font-semibold border border-brand-gold/30 hover:border-brand-gold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Unlock className="w-4 h-4 text-brand-gold-bright" />
            <span>Unlock Official Protocols</span>
          </button>
        </form>

        <p className="text-[11px] text-slate-400">
          Protected by The Potter Law Group Session Auth & Standards Compliance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Document Header Banner */}
      <header className="bg-gradient-to-br from-brand-law-navy to-slate-900 rounded-2xl p-6 sm:p-8 md:p-10 text-white border border-brand-gold/30 shadow-xl relative overflow-hidden">
        {/* Subtle decorative gold glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold/20 text-brand-gold-bright border border-brand-gold/30 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Internal Staff Document · Confidential
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-slate-200 text-xs font-medium border border-white/10">
                Production v1.0
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-slate-200 text-xs font-medium border border-white/10">
                July 2026
              </span>
              <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-200 border border-rose-500/30 text-xs font-semibold">
                For Internal Use Only
              </span>
            </div>
          </div>

          <div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-brand-gold-bright">
              The Potter Law Group
            </h1>
            <p className="text-base sm:text-lg text-slate-300 font-light mt-1">
              Official Virtual Office Protocols & Practice Standards
            </p>
          </div>

          {/* Quick Jump Links */}
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Quick Jump:</span>
            <a
              href="#zoom"
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
            >
              <Video className="w-3 h-3 text-brand-gold-bright" />
              <span>01. Zoom Rules</span>
            </a>
            <a
              href="#timesheets"
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
            >
              <Clock className="w-3 h-3 text-brand-gold-bright" />
              <span>02. Clio Timesheets</span>
            </a>
            <a
              href="#calendaring"
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
            >
              <Calendar className="w-3 h-3 text-brand-gold-bright" />
              <span>03. Master Calendaring</span>
            </a>
            <a
              href="#acronyms"
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3 text-brand-gold-bright" />
              <span>04. 42 Acronyms</span>
            </a>
          </div>
        </div>
      </header>

      {/* PROTOCOL 1: ZOOM */}
      <section
        id="zoom"
        className="bg-white rounded-2xl border border-brand-gold/20 shadow-sm p-6 sm:p-8 space-y-6 scroll-mt-24"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-serif font-bold text-sm">
              01
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold block">
                Protocol 01
              </span>
              <h2 className="font-serif text-2xl font-bold text-brand-law-navy">
                Virtual Office & Zoom Environment Rules
              </h2>
            </div>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-law-navy" />
            <span>Mandatory Zoom Hours: 8:30 AM – 5:30 PM CST · 1-Hour Lunch Break</span>
          </div>
        </div>

        {/* Critical Red Alert Block */}
        <div className="bg-rose-50 border-l-4 border-rose-600 rounded-r-xl p-4 sm:p-5 text-rose-950 space-y-1 shadow-sm">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold tracking-tight text-rose-900 block text-sm sm:text-base">
                CAMERA RULE: If your camera is not on and your face is not showing at login, you are considered LATE.
              </strong>
              <p className="text-xs sm:text-sm text-rose-800 mt-1">
                If you are going to be late, inform Attorney Potter and Alie in advance with the reason why.
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Grid: DOs & DON'Ts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Column 1: DO — Required Standards (Emerald Theme) */}
          <div className="bg-emerald-50/50 rounded-xl border border-emerald-200/80 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-emerald-200 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-serif text-lg font-bold">DO — Required Standards</h3>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-emerald-950">Morning Greeting:</strong> Say good morning to everyone when you come on — and everyone says good morning back.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-emerald-950">Camera Position:</strong> Your entire face must be visible at all times. Side of your head does not count.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-emerald-950">Stepping Away:</strong> Type &quot;brb&quot; in the main chat AND turn off your camera.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-emerald-950">Lunch Break:</strong> Log out completely when you leave for lunch. This is required.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-emerald-950">Unmute for Case Questions:</strong> Unmute yourself if you have a call and need to know who is working on a case.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-emerald-950">Phone Transfers:</strong> Put callers on hold before asking the floor who is working on a case. Then call that person on their office extension to transfer the call.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-emerald-950">Breakout Rooms:</strong> Use only for instructional time — screen sharing or showing a co-worker how to do something.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-emerald-950">Snacks at Desk:</strong> Perfectly fine — we need to keep your strength up.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-emerald-950">Dress Code:</strong> Bathrobe and bunny slippers welcome, if you so desire.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-emerald-950">Respond in Chat:</strong> Respond when someone asks a question in chat or sends an announcement.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-emerald-950">After-Hours Tasks:</strong> Feel free to finish tasks after Zoom ends. Zoom appearance is mandatory 8:30 AM–5:30 PM, but tasks may run a bit longer.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-emerald-950">Attorney Potter on Zoom:</strong> Unmute yourself when Attorney Potter joins Zoom and STAY UNMUTED for the entire time she is on.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-emerald-950">Quickie Assignments:</strong> Complete in less than 2 weeks. Citation received = assignment complete.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-emerald-950">Non-Quickie Assignments:</strong> Complete in less than 4 weeks — hearing date confirmed and calendared, Notice of Hearing sent out.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-emerald-950">Suggestions Welcome:</strong> Bring any ideas to improve our Zoom experience. Thanks!
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-emerald-950">Personal Time:</strong> Keep personal conversations for off hours — you are being paid for your time.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-emerald-950">Announcements:</strong> Respond when someone is speaking in a meeting or giving an announcement.
                </div>
              </li>
            </ul>
          </div>

          {/* Column 2: DO NOT — Prohibited Actions (Rose Theme) */}
          <div className="bg-rose-50/50 rounded-xl border border-rose-200/80 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-rose-200 text-rose-900">
              <XCircle className="w-5 h-5 text-rose-600" />
              <h3 className="font-serif text-lg font-bold">DO NOT — Prohibited Actions</h3>
            </div>
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-rose-950">No 1-on-1 Zoom Chats:</strong> Do not have conversations with each other on Zoom. Use your office phone — not your cell. This is considerate of others on the floor who are trying to work.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-rose-950">No Lunch Log-On:</strong> Do not stay logged on to Zoom during your lunch break.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-rose-950">No Breakout Room Chatter:</strong> Do not use breakout rooms to chat about work. Use the office phone.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-rose-950">Pick Up the Phone:</strong> If someone asks on Zoom whether you called a client, do not respond on Zoom — pick up the phone and call.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-rose-950">Off-Hours Contact:</strong> Do not get upset if Attorney Potter contacts you during off hours. This will ONLY happen when you failed to complete something during business hours. Handle your work during business hours so she does not have to reach out on personal time.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-2" />
                <div>
                  <strong className="font-semibold text-rose-950">Do Not Log Off Without Dismissal:</strong> Never log off Zoom without being explicitly dismissed.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* PROTOCOL 2: TIMESHEETS */}
      <section
        id="timesheets"
        className="bg-white rounded-2xl border border-brand-gold/20 shadow-sm p-6 sm:p-8 space-y-6 scroll-mt-24"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-brand-gold/30 text-amber-800 flex items-center justify-center font-serif font-bold text-sm">
              02
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold block">
                Protocol 02
              </span>
              <h2 className="font-serif text-2xl font-bold text-brand-law-navy">
                Clio Timer & Daily Timesheet Mandate
              </h2>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-brand-gold/25 text-xs font-semibold">
            Legal & Financial Audit Record
          </span>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed">
          Accurate daily time entries are essential for client billing, compliance and audit trails, demonstrating workload and productivity, and protecting the firm and our clients. Your timesheet is a legal and financial record.
        </p>

        {/* Critical Red Alert Block */}
        <div className="bg-rose-50 border-l-4 border-rose-600 rounded-r-xl p-4 sm:p-5 text-rose-950 space-y-1 shadow-sm">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold tracking-tight text-rose-900 block text-sm sm:text-base">
                END OF DAY SUBMISSION: Your Activity Report must be emailed to Attorney Potter AND Alie before MIDNIGHT every workday. NO EXCEPTIONS.
              </strong>
            </div>
          </div>
        </div>

        {/* Core Timer Requirements */}
        <div className="space-y-3 pt-1">
          <h3 className="font-serif text-lg font-bold text-brand-law-navy flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-gold" />
            <span>Core Timer Requirements</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold block">Rule 1</span>
              <h4 className="font-semibold text-brand-law-navy text-sm">Clio TIMER is Mandatory</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                All work must be recorded using the Clio TIMER. You may not estimate time later or type in one total block for the day.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold block">Rule 2</span>
              <h4 className="font-semibold text-brand-law-navy text-sm">Every Task Must Be Its Own Entry</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                You cannot submit one time entry for the entire day that includes multiple tasks.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold block">Rule 3</span>
              <h4 className="font-semibold text-brand-law-navy text-sm">Timers Must Match Reality</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                If you are preparing exhibits for three different clients, you must run three separate timers — one per client.
              </p>
            </div>
          </div>
        </div>

        {/* Direct Outbound Link: Clio Timer Training Video */}
        <div className="pt-2">
          <a
            href="https://vimeo.com/815705935?autoplay=1&muted=1"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-brand-law-navy hover:bg-brand-primary text-white text-sm font-semibold border border-brand-gold/40 hover:border-brand-gold shadow-md hover:shadow-lg transition-all"
          >
            <span className="w-8 h-8 rounded-lg bg-brand-gold/20 flex items-center justify-center text-brand-gold-bright group-hover:scale-110 transition-transform">
              ▶
            </span>
            <div className="text-left">
              <span className="block text-brand-gold-bright font-bold">Watch Clio Timer Training Video</span>
              <span className="text-[11px] text-slate-300 font-normal">Official walkthrough on Vimeo (Opens in new tab)</span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white ml-2 transition-colors" />
          </a>
        </div>

        {/* Generating & Submitting Daily Activity Report */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-serif text-lg font-bold text-brand-law-navy flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-gold" />
            <span>Generating & Submitting Your Daily Activity Report</span>
          </h3>

          <ol className="space-y-3 text-xs sm:text-sm text-slate-700">
            <li className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-brand-law-navy text-white text-xs font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <div className="pt-0.5">
                Go to <strong>Reports</strong> in Clio Manage.
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-brand-law-navy text-white text-xs font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <div className="pt-0.5">
                Under <strong>Billing</strong>, select <strong>Activity → Activity Report</strong>.
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-brand-law-navy text-white text-xs font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <div className="pt-0.5">
                Set <strong>Start Date = Today</strong> and <strong>End Date = Today</strong>. Select your name under <strong>User</strong>.
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-brand-law-navy text-white text-xs font-bold flex items-center justify-center shrink-0">
                4
              </span>
              <div className="pt-0.5">
                Generate and review report for accuracy against tasks completed.
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-brand-law-navy text-white text-xs font-bold flex items-center justify-center shrink-0">
                5
              </span>
              <div className="pt-0.5 space-y-1">
                <div>
                  Export as PDF using naming format:
                </div>
                <div className="bg-slate-900 text-brand-gold-bright px-3 py-1.5 rounded font-mono text-xs inline-block">
                  MM-DD-YYYY – Timesheet – YOUR FULL NAME
                </div>
                <div className="text-xs text-slate-500">
                  Example: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">1-14-2026 – Timesheet – ALIE</code>
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-brand-law-navy text-white text-xs font-bold flex items-center justify-center shrink-0">
                6
              </span>
              <div className="pt-0.5">
                Email PDF to <strong>Attorney Potter</strong> and <strong>Alie</strong> before <strong>12:00 AM midnight CST</strong> every workday.
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* PROTOCOL 3: CALENDARING */}
      <section
        id="calendaring"
        className="bg-white rounded-2xl border border-brand-gold/20 shadow-sm p-6 sm:p-8 space-y-6 scroll-mt-24"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-serif font-bold text-sm">
              03
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold block">
                Protocol 03 · Revised 2/5/2026
              </span>
              <h2 className="font-serif text-2xl font-bold text-brand-law-navy">
                Master Clio Calendaring Rules
              </h2>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
            Strict Hold Integrity
          </span>
        </div>

        {/* Critical Red Alert Block */}
        <div className="bg-rose-50 border-l-4 border-rose-600 rounded-r-xl p-4 sm:p-5 text-rose-950 space-y-1 shadow-sm">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold tracking-tight text-rose-900 block text-sm sm:text-base">
                ABSOLUTE RULE: NOBODY REMOVES HOLDS OTHER THAN ATTORNEY POTTER!!!
              </strong>
              <p className="text-xs sm:text-sm text-rose-800 mt-1">
                When all hold conditions are cleared, text Attorney Potter — she removes it.
              </p>
            </div>
          </div>
        </div>

        {/* Mandatory Event Title Format & Copy Button */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-serif text-lg font-bold text-brand-law-navy flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-gold" />
              <span>Mandatory Event Title Format</span>
            </h3>

            {/* Copy Format clipboard button */}
            <button
              type="button"
              onClick={handleCopyFormat}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                isCopied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-law-navy hover:bg-brand-primary text-brand-gold-bright border border-brand-gold/30 hover:border-brand-gold'
              }`}
              title="Copy template to clipboard"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>✓ Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Format</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 text-slate-100 font-mono text-xs sm:text-sm leading-relaxed border border-brand-gold/30 shadow-inner overflow-x-auto">
            <code>{CALENDAR_TEMPLATE}</code>
          </div>

          <div className="bg-brand-cream rounded-xl p-4 border border-brand-gold/20 space-y-1.5 text-xs sm:text-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold block">
              Live Field Example
            </span>
            <code className="text-slate-800 font-mono text-xs block bg-white p-2.5 rounded border border-slate-200">
              HOLD for – Jane Doe (2024-12345) – OUR Temporary Orders Hearing on Divorce via Zoom – Court 2, Travis County – Zoom ID 123-456-7890 – CLIENT HAS TO HIRE – AB
            </code>
          </div>
        </div>
      </section>

      {/* PROTOCOL 4: ACRONYMS */}
      <section
        id="acronyms"
        className="bg-white rounded-2xl border border-brand-gold/20 shadow-sm p-6 sm:p-8 space-y-6 scroll-mt-24"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center font-serif font-bold text-sm">
              04
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold block">
                Protocol 04
              </span>
              <h2 className="font-serif text-2xl font-bold text-brand-law-navy">
                Firm Acronym Reference Sheet
              </h2>
            </div>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-brand-cream border border-brand-gold/30 text-xs font-semibold text-brand-law-navy flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-brand-gold" />
            <span>42 Standard Texas Family Law & Firm Acronyms</span>
          </div>
        </div>

        {/* Live Search Filter Bar */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={acronymQuery}
              onChange={(e) => setAcronymQuery(e.target.value)}
              placeholder="Search acronyms (e.g., CMRR, SAPCR, TOH, Clio, CYA)..."
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold text-xs sm:text-sm"
            />
            {acronymQuery && (
              <button
                type="button"
                onClick={() => setAcronymQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 justify-between sm:justify-end text-xs text-slate-500 font-medium">
            <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200">
              Showing {filteredAcronyms.length} of {ACRONYMS_DATA.length} entries
            </span>
          </div>
        </div>

        {/* Responsive Acronyms Grid */}
        {filteredAcronyms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAcronyms.map((item) => (
              <div
                key={item.acronym}
                className="bg-white rounded-xl p-3.5 border border-slate-200 hover:border-brand-gold/40 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-brand-law-navy text-brand-gold-bright font-mono font-bold text-xs tracking-wider shadow-inner">
                    {item.acronym}
                  </span>
                  {item.category && (
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                      {item.category}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-700 leading-snug">
                  {item.definition}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <p className="text-sm text-slate-500 font-medium">
              No acronyms found matching &quot;{acronymQuery}&quot;
            </p>
            <button
              type="button"
              onClick={() => setAcronymQuery('')}
              className="text-xs text-brand-law-navy font-semibold underline hover:text-brand-gold"
            >
              Clear search filter
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default OfficeProtocols;
