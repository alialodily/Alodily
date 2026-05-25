/* ============================================================================
   CARE PLAN FEATURE — Patient Link AI v1.5
   Integration guide for App.jsx
   
   WHAT THIS ADDS:
   - carePlan object per room (goals, interventions, activity, diet, restrictions, notes)
   - CarePlanEditor: Charge Nurse edits inside RoomDetailModal
   - CarePlanPatientView: Patient sees bilingual care plan card in PatientHome
   - setCarePlan() in RequestsCtx — propagates changes across all views
   
   HOW TO INTEGRATE — 5 steps clearly marked below:
   STEP 1 → Add constants (after SITTER_STATUSES block ~line 247)
   STEP 2 → Add setCarePlan to RequestsCtx (after completeRequestsForRoom in context)
   STEP 3 → Add carePlan to initial rooms state in App() useState
   STEP 4 → Add CarePlanEditor inside RoomDetailModal
   STEP 5 → Add CarePlanPatientView inside PatientHome
   ============================================================================ */


/* ═══════════════════════════════════════════════════════════════════════════
   STEP 1 — ADD THESE CONSTANTS
   Insert after the SITTER_STATUSES block (after getSitter function ~line 250)
   ═══════════════════════════════════════════════════════════════════════════ */

const ACTIVITY_LEVELS = [
  {
    id: "bed_rest",
    label: "Complete Bed Rest",
    labelAr: "راحة تامة في السرير",
    short: "Bed rest",
    shortAr: "راحة تامة",
    icon: BedDouble,
    color: T.red,
    bg: T.redBg,
    patientHint_en: "Stay in bed. Press your call bell if you need to move.",
    patientHint_ar: "ابقَ في السرير. اضغط جرس النداء لو احتجت تتحرك.",
  },
  {
    id: "assisted",
    label: "Activity with Assistance",
    labelAr: "نشاط بمساعدة",
    short: "Assisted",
    shortAr: "بمساعدة",
    icon: Users,
    color: T.amber,
    bg: T.amberBg,
    patientHint_en: "You can move with nurse help. Always ask before getting up.",
    patientHint_ar: "تقدر تتحرك بمساعدة الممرض. اطلب قبل ما تقوم دايماً.",
  },
  {
    id: "independent",
    label: "Independent Ambulation",
    labelAr: "نشاط مستقل",
    short: "Independent",
    shortAr: "مستقل",
    icon: Footprints,
    color: T.green,
    bg: T.greenBg,
    patientHint_en: "You may walk independently. Take your time and call us if you need anything.",
    patientHint_ar: "تقدر تمشي بمفردك. خذ وقتك وانادنا لو احتجت شي.",
  },
];

const DIET_OPTIONS = [
  { id: "regular",  label: "Regular Diet",        labelAr: "وجبات اعتيادية",       icon: Utensils,    color: T.accent },
  { id: "diabetic", label: "Diabetic Diet",        labelAr: "حمية سكري",            icon: Droplet,     color: T.amber  },
  { id: "low_salt", label: "Low Sodium",           labelAr: "قليل الملح",           icon: Coffee,      color: T.blue   },
  { id: "soft",     label: "Soft Diet",            labelAr: "طعام طري",             icon: Utensils,    color: T.green  },
  { id: "fluid",    label: "Fluids Only",          labelAr: "سوائل فقط",            icon: Droplet,     color: T.indigo },
  { id: "npo",      label: "NPO — Nothing by mouth",labelAr:"لا شيء عن طريق الفم", icon: XCircle,     color: T.red    },
  { id: "cardiac",  label: "Cardiac Diet",         labelAr: "حمية قلبية",           icon: Heart,       color: T.red    },
];

const INTERVENTION_CATEGORIES = [
  { id: "medication",   label: "Medication",   labelAr: "دواء",      color: T.blue,   bg: T.blueBg   },
  { id: "nursing",      label: "Nursing",      labelAr: "تمريض",     color: T.green,  bg: T.greenBg  },
  { id: "monitoring",   label: "Monitoring",   labelAr: "مراقبة",    color: T.amber,  bg: T.amberBg  },
  { id: "therapy",      label: "Therapy",      labelAr: "علاج طبيعي",color: T.accent, bg: T.accentSft},
  { id: "other",        label: "Other",        labelAr: "أخرى",      color: T.inkSoft,bg: T.cardCool  },
];

const GOAL_STATUSES = [
  { id: "not_started", label: "Not started", labelAr: "لم يبدأ",    color: T.inkMute, icon: "·"  },
  { id: "in_progress", label: "In progress", labelAr: "قيد التنفيذ",color: T.blue,    icon: "→"  },
  { id: "achieved",    label: "Achieved",    labelAr: "تحقق",       color: T.green,   icon: "✓"  },
];

// Helper getters
const getActivity   = (id) => ACTIVITY_LEVELS.find(a => a.id === id) || ACTIVITY_LEVELS[1];
const getDietOption = (id) => DIET_OPTIONS.find(d => d.id === id)    || DIET_OPTIONS[0];
const getIvCat      = (id) => INTERVENTION_CATEGORIES.find(c => c.id === id) || INTERVENTION_CATEGORIES[4];
const getGoalStatus = (id) => GOAL_STATUSES.find(s => s.id === id)   || GOAL_STATUSES[0];

const DEFAULT_CARE_PLAN = () => ({
  active:        false,
  goals:         [],
  interventions: [],
  activityLevel: "assisted",
  diet:          "regular",
  restrictions:  [],
  nurseNotes:    "",
  updatedBy:     null,
  updatedAt:     null,
});


/* ═══════════════════════════════════════════════════════════════════════════
   STEP 2 — ADD setCarePlan TO RequestsCtx
   
   A) In the RequestsCtx.createContext default value, add:
      setCarePlan: () => {},
   
   B) In App() — add setCarePlan function (paste after completeRequestsForRoom):
   ═══════════════════════════════════════════════════════════════════════════ */

/* --- Paste this INSIDE App() component, after completeRequestsForRoom --- */
const setCarePlan = (roomNum, planUpdates, byRole) => {
  const old = rooms.find(r => String(r.room) === String(roomNum));
  if (!old) return;

  const prev = old.carePlan || DEFAULT_CARE_PLAN();
  const next  = { ...prev, ...planUpdates, active: true,
                  updatedBy: byRole || "Charge Nurse",
                  updatedAt: Date.now() };

  auditLog({
    actor:  byRole || "charge_nurse",
    action: "care_plan_updated",
    target: `room ${roomNum} · ${old.patient}`,
    note:   `goals:${next.goals.length} · iv:${next.interventions.length} · activity:${next.activityLevel} · diet:${next.diet}`,
  });

  setRooms(rs => rs.map(r =>
    String(r.room) === String(roomNum)
      ? { ...r, carePlan: next }
      : r
  ));
};
/* --- End paste --- */

/* Also add setCarePlan to requestsCtxValue object:
   const requestsCtxValue = {
     ...existing fields...
     setCarePlan,         ← add this line
   };
*/


/* ═══════════════════════════════════════════════════════════════════════════
   STEP 3 — ADD carePlan TO INITIAL ROOMS STATE
   
   In App() useState for rooms, inside the .map() callback,
   add this field to each room object (after the turnSchedule field):
   ═══════════════════════════════════════════════════════════════════════════ */

/*
  carePlan: status === "idle" ? DEFAULT_CARE_PLAN() : {
    active: true,
    goals: [
      { id: "g1", text: "Maintain pain ≤3/10", status: "in_progress" },
      { id: "g2", text: "Ambulate with support by Day 2", status: "not_started" },
    ],
    interventions: [
      { id: "i1", text: "Vitals q4h", cat: "monitoring" },
      { id: "i2", text: "Daily wound care", cat: "nursing" },
    ],
    activityLevel: acuity >= 4 ? "bed_rest" : acuity === 3 ? "assisted" : "independent",
    diet: "regular",
    restrictions: [],
    nurseNotes: "Your care team is looking after you. Rest well and let us know if you need anything.",
    updatedBy: "Charge Nurse · shift handoff",
    updatedAt: Date.now() - Math.random() * 4 * 3600 * 1000,
  },
*/


/* ═══════════════════════════════════════════════════════════════════════════
   STEP 4 — CarePlanEditor COMPONENT
   
   Add this component anywhere before RoomDetailModal in App.jsx.
   Then inside RoomDetailModal, add <CarePlanEditor /> in the JSX body
   (after the Positioning Order section, before Room Lifecycle section).
   ═══════════════════════════════════════════════════════════════════════════ */

const CarePlanEditor = ({ room, onSetCarePlan }) => {
  const cp = room.carePlan || DEFAULT_CARE_PLAN();

  // Local draft state — only saved on "Publish"
  const [goals,         setGoals]         = useState(() => cp.goals         || []);
  const [interventions, setInterventions] = useState(() => cp.interventions || []);
  const [activityLevel, setActivityLevel] = useState(() => cp.activityLevel || "assisted");
  const [diet,          setDiet]          = useState(() => cp.diet          || "regular");
  const [restrictions,  setRestrictions]  = useState(() => cp.restrictions  || []);
  const [nurseNotes,    setNurseNotes]    = useState(() => cp.nurseNotes    || "");
  const [saved,         setSaved]         = useState(false);

  // New item inputs
  const [newGoal,       setNewGoal]       = useState("");
  const [newIvText,     setNewIvText]     = useState("");
  const [newIvCat,      setNewIvCat]      = useState("nursing");
  const [newRestriction,setNewRestriction]= useState("");

  const [goalIdCtr, setGoalIdCtr] = useState(() => goals.length + 1);
  const [ivIdCtr,   setIvIdCtr]   = useState(() => interventions.length + 1);

  const addGoal = () => {
    const t = newGoal.trim();
    if (!t) return;
    setGoals(g => [...g, { id: `g${goalIdCtr}`, text: t, status: "not_started" }]);
    setGoalIdCtr(c => c + 1);
    setNewGoal("");
  };

  const cycleGoalStatus = (id) => {
    const order = ["not_started", "in_progress", "achieved"];
    setGoals(g => g.map(gx =>
      gx.id === id
        ? { ...gx, status: order[(order.indexOf(gx.status) + 1) % 3] }
        : gx
    ));
  };

  const removeGoal = (id) => setGoals(g => g.filter(gx => gx.id !== id));

  const addIntervention = () => {
    const t = newIvText.trim();
    if (!t) return;
    setInterventions(iv => [...iv, { id: `i${ivIdCtr}`, text: t, cat: newIvCat }]);
    setIvIdCtr(c => c + 1);
    setNewIvText("");
  };

  const removeIntervention = (id) => setInterventions(iv => iv.filter(x => x.id !== id));

  const addRestriction = () => {
    const t = newRestriction.trim();
    if (!t) return;
    setRestrictions(r => [...r, t]);
    setNewRestriction("");
  };

  const removeRestriction = (i) => setRestrictions(r => r.filter((_, idx) => idx !== i));

  const publish = () => {
    onSetCarePlan(room.room, {
      goals, interventions, activityLevel,
      diet, restrictions, nurseNotes,
    }, "Charge Nurse");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const currentActivity = getActivity(activityLevel);
  const currentDiet     = getDietOption(diet);
  const ActivityIcon    = currentActivity.icon;
  const DietIcon        = currentDiet.icon;

  return (
    <div className="rounded-xl overflow-hidden mb-3"
         style={{ border: `1.5px solid ${T.accent}40`, background: "#fff" }}>

      {/* Header */}
      <div className="px-3 py-2.5 flex items-center justify-between"
           style={{ background: T.accentSft, borderBottom: `1px solid ${T.accent}30` }}>
        <div className="flex items-center gap-2">
          <ClipboardList size={14} style={{ color: T.accent }} />
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: T.accent }}>
              Current Care Plan
            </div>
            <div className="text-[9px]" style={{ color: T.inkMute }}>
              {cp.updatedBy ? `Last updated by ${cp.updatedBy}` : "No plan set yet"} · Visible to patient
            </div>
          </div>
        </div>
        {cp.active && (
          <span className="text-[9px] px-2 py-0.5 rounded-full"
                style={{ background: T.green, color: "#fff", fontWeight: 700 }}>
            LIVE
          </span>
        )}
      </div>

      {/* Goals section */}
      <div className="px-3 py-2.5 border-b" style={{ borderColor: T.lineSoft }}>
        <div className="text-[10px] uppercase tracking-wider mb-2"
             style={{ color: T.inkMute, fontWeight: 700 }}>
          Care Goals
        </div>

        {goals.length === 0 && (
          <div className="text-[10px] italic mb-2" style={{ color: T.inkMute }}>
            No goals yet — add goals below
          </div>
        )}

        <div className="space-y-1 mb-2">
          {goals.map(g => {
            const s = getGoalStatus(g.status);
            return (
              <div key={g.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                   style={{ background: T.cardWarm, border: `1px solid ${T.lineSoft}` }}>
                {/* Status toggle */}
                <button
                  onClick={() => cycleGoalStatus(g.id)}
                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[11px]"
                  style={{ background: s.color + "20", color: s.color, fontWeight: 700, border: `1px solid ${s.color}40` }}
                  title={`Status: ${s.label} · click to advance`}>
                  {s.icon}
                </button>
                <span className="flex-1 text-[11px]"
                      style={{ color: g.status === "achieved" ? T.inkMute : T.ink,
                               textDecoration: g.status === "achieved" ? "line-through" : "none" }}>
                  {g.text}
                </span>
                <button onClick={() => removeGoal(g.id)}
                        className="text-[12px] hover:text-red-500"
                        style={{ color: T.inkMute, background: "none", border: "none", cursor: "pointer" }}>
                  ×
                </button>
              </div>
            );
          })}
        </div>

        {/* Add goal input */}
        <div className="flex gap-1.5">
          <input
            value={newGoal}
            onChange={e => setNewGoal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addGoal()}
            placeholder="e.g. Pain ≤3/10 by Day 3"
            className="flex-1 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:ring-2"
            style={{ background: "#fff", border: `1px solid ${T.line}`, color: T.ink,
                     outlineColor: T.accent }}
          />
          <button onClick={addGoal}
                  className="px-2.5 py-1 rounded-lg text-[11px] hover:opacity-90"
                  style={{ background: T.accent, color: "#fff", fontWeight: 600, border: "none", cursor: "pointer" }}>
            + Add
          </button>
        </div>
      </div>

      {/* Activity Level */}
      <div className="px-3 py-2.5 border-b" style={{ borderColor: T.lineSoft }}>
        <div className="text-[10px] uppercase tracking-wider mb-2"
             style={{ color: T.inkMute, fontWeight: 700 }}>
          Activity Level
        </div>
        <div className="flex gap-1.5">
          {ACTIVITY_LEVELS.map(a => {
            const Ic = a.icon;
            const sel = activityLevel === a.id;
            return (
              <button key={a.id}
                      onClick={() => setActivityLevel(a.id)}
                      className="flex-1 rounded-lg py-1.5 px-1 text-center text-[10px] transition hover:-translate-y-0.5"
                      style={{ background: sel ? a.color : "#fff",
                               color: sel ? "#fff" : a.color,
                               border: `1.5px solid ${sel ? a.color : a.color + "40"}`,
                               fontWeight: sel ? 700 : 500, cursor: "pointer" }}>
                <Ic size={12} className="mx-auto mb-0.5" />
                {a.short}
              </button>
            );
          })}
        </div>
      </div>

      {/* Diet */}
      <div className="px-3 py-2.5 border-b" style={{ borderColor: T.lineSoft }}>
        <div className="text-[10px] uppercase tracking-wider mb-2"
             style={{ color: T.inkMute, fontWeight: 700 }}>
          Diet Order
        </div>
        <div className="flex flex-wrap gap-1">
          {DIET_OPTIONS.map(d => {
            const Ic = d.icon;
            const sel = diet === d.id;
            return (
              <button key={d.id}
                      onClick={() => setDiet(d.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] transition"
                      style={{ background: sel ? d.color : "#fff",
                               color: sel ? "#fff" : d.color,
                               border: `1px solid ${sel ? d.color : d.color + "40"}`,
                               fontWeight: sel ? 700 : 500, cursor: "pointer" }}>
                <Ic size={10} />
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interventions */}
      <div className="px-3 py-2.5 border-b" style={{ borderColor: T.lineSoft }}>
        <div className="text-[10px] uppercase tracking-wider mb-2"
             style={{ color: T.inkMute, fontWeight: 700 }}>
          Active Interventions
        </div>

        <div className="space-y-1 mb-2">
          {interventions.map(iv => {
            const cat = getIvCat(iv.cat);
            return (
              <div key={iv.id} className="flex items-center gap-2 rounded-md px-2 py-1"
                   style={{ background: cat.bg, border: `1px solid ${cat.color}25` }}>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ background: cat.color, color: "#fff" }}>
                  {cat.label}
                </span>
                <span className="flex-1 text-[11px]" style={{ color: T.ink }}>{iv.text}</span>
                <button onClick={() => removeIntervention(iv.id)}
                        style={{ background: "none", border: "none", color: T.inkMute, cursor: "pointer", fontSize: 12 }}>
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex gap-1">
          <select value={newIvCat} onChange={e => setNewIvCat(e.target.value)}
                  className="rounded-md px-1.5 py-1 text-[10px] focus:outline-none"
                  style={{ background: "#fff", border: `1px solid ${T.line}`, color: T.ink }}>
            {INTERVENTION_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <input
            value={newIvText}
            onChange={e => setNewIvText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addIntervention()}
            placeholder="Describe intervention..."
            className="flex-1 rounded-md px-2 py-1 text-[11px] focus:outline-none focus:ring-2"
            style={{ background: "#fff", border: `1px solid ${T.line}`, color: T.ink, outlineColor: T.accent }}
          />
          <button onClick={addIntervention}
                  className="px-2 py-1 rounded-md text-[10px]"
                  style={{ background: T.accent, color: "#fff", fontWeight: 600, border: "none", cursor: "pointer" }}>
            +
          </button>
        </div>
      </div>

      {/* Restrictions / Precautions */}
      <div className="px-3 py-2.5 border-b" style={{ borderColor: T.lineSoft }}>
        <div className="text-[10px] uppercase tracking-wider mb-2"
             style={{ color: T.inkMute, fontWeight: 700 }}>
          Restrictions / Precautions
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {restrictions.map((r, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded"
                  style={{ background: T.redBg, color: T.red, border: `1px solid ${T.red}30`, fontWeight: 600 }}>
              {r}
              <button onClick={() => removeRestriction(i)}
                      style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 12, lineHeight: 1 }}>
                ×
              </button>
            </span>
          ))}
          {restrictions.length === 0 && (
            <span className="text-[10px] italic" style={{ color: T.inkMute }}>None added</span>
          )}
        </div>
        <div className="flex gap-1.5">
          <input
            value={newRestriction}
            onChange={e => setNewRestriction(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addRestriction()}
            placeholder="e.g. No IM injections"
            className="flex-1 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:ring-2"
            style={{ background: "#fff", border: `1px solid ${T.line}`, color: T.ink, outlineColor: T.red }}
          />
          <button onClick={addRestriction}
                  className="px-2.5 py-1 rounded-lg text-[11px]"
                  style={{ background: T.red, color: "#fff", fontWeight: 600, border: "none", cursor: "pointer" }}>
            +
          </button>
        </div>
      </div>

      {/* Nurse Notes to Patient */}
      <div className="px-3 py-2.5 border-b" style={{ borderColor: T.lineSoft }}>
        <div className="text-[10px] uppercase tracking-wider mb-1.5"
             style={{ color: T.inkMute, fontWeight: 700 }}>
          Nurse Message to Patient (shown on their screen)
        </div>
        <textarea
          value={nurseNotes}
          onChange={e => setNurseNotes(e.target.value)}
          placeholder="A short message shown to the patient in their language..."
          rows={2}
          className="w-full rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:ring-2 resize-none"
          style={{ background: "#fff", border: `1px solid ${T.line}`, color: T.ink,
                   outlineColor: T.accent }}
        />
      </div>

      {/* Publish button */}
      <div className="px-3 py-2.5">
        <button
          onClick={publish}
          className="w-full rounded-lg py-2 text-[12px] inline-flex items-center justify-center gap-2 transition hover:opacity-90"
          style={{ background: saved ? T.green : T.accent, color: "#fff", fontWeight: 600, border: "none", cursor: "pointer" }}>
          {saved ? (
            <><CheckCircle2 size={13} /> Saved · Visible to patient now</>
          ) : (
            <><ClipboardCheck size={13} /> Save & Publish to Patient Screen</>
          )}
        </button>
        <div className="text-[9px] mt-1 text-center flex items-center justify-center gap-1"
             style={{ color: T.inkMute }}>
          <ScrollText size={9} /> Every update is audit-trailed with your identity + timestamp
        </div>
      </div>
    </div>
  );
};

/* HOW TO INSERT CarePlanEditor inside RoomDetailModal:
   
   Find the "Quick actions" Card block in RoomDetailModal (near the end).
   BEFORE that block, add:
   
   {(isOccupied || isDischarged) && onSetCarePlan && (
     <CarePlanEditor room={room} onSetCarePlan={onSetCarePlan} />
   )}
   
   Then update the RoomDetailModal props to include onSetCarePlan:
   const RoomDetailModal = ({ room, ..., onSetCarePlan }) => {
   
   And update the ChargeApp where RoomDetailModal is rendered:
   <RoomDetailModal
     ...existing props...
     onSetCarePlan={setCarePlan}
   />
*/


/* ═══════════════════════════════════════════════════════════════════════════
   STEP 5 — CarePlanPatientView COMPONENT
   
   Add this component anywhere before PatientHome in App.jsx.
   Then inside PatientHome, add it after the sitter status block and
   before the active requests strip.
   ═══════════════════════════════════════════════════════════════════════════ */

const CarePlanPatientView = ({ room, lang }) => {
  const cp = room?.carePlan;
  if (!cp?.active) return null;

  const isAr = lang === "ar";
  const dir  = isAr ? "rtl" : "ltr";

  const activity = getActivity(cp.activityLevel);
  const diet     = getDietOption(cp.diet);
  const ActivityIcon = activity.icon;
  const DietIcon     = diet.icon;

  const activeGoals = (cp.goals || []).filter(g => g.status !== "achieved");
  const achieved    = (cp.goals || []).filter(g => g.status === "achieved");

  return (
    <div className="rounded-2xl overflow-hidden mb-4"
         style={{ border: `1.5px solid ${T.accent}30`, background: "#fff" }}>

      {/* Header */}
      <div className="px-4 py-3"
           style={{ background: T.accentSft, borderBottom: `1px solid ${T.accent}25` }}
           dir={dir}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: T.accent }}>
            <ClipboardList size={18} style={{ color: "#fff" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] uppercase tracking-wider font-bold" style={{ color: T.accent }}>
              {isAr ? "خطة رعايتك اليوم" : "Your care plan today"}
            </div>
            <div className={cx("text-sm font-semibold", isAr && "font-arabic")} style={{ color: T.ink }}>
              {isAr ? "محدّثة من فريق رعايتك" : "Updated by your care team"}
            </div>
            {cp.updatedBy && (
              <div className="text-[10px]" style={{ color: T.inkSoft }}>
                {isAr ? `آخر تحديث: ${cp.updatedBy}` : `By: ${cp.updatedBy}`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Goals */}
      {(cp.goals || []).length > 0 && (
        <div className="px-4 py-3 border-b" style={{ borderColor: T.lineSoft }}>
          <div className="text-[9px] uppercase tracking-wider mb-2"
               style={{ color: T.inkMute, fontWeight: 700 }}
               dir={dir}>
            {isAr ? "أهداف علاجك" : "Your care goals"}
          </div>
          <div className="space-y-1.5">
            {activeGoals.map(g => {
              const s = getGoalStatus(g.status);
              return (
                <div key={g.id} className="flex items-start gap-2" dir={dir}>
                  <div className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-[9px]"
                       style={{ background: s.color + "20", color: s.color }}>
                    {s.icon}
                  </div>
                  <span className={cx("text-[12px] leading-snug", isAr && "font-arabic")}
                        style={{ color: T.ink }}>
                    {g.text}
                  </span>
                </div>
              );
            })}
            {achieved.length > 0 && (
              <div className="text-[10px] mt-1" style={{ color: T.green }} dir={dir}>
                ✓ {achieved.length} {isAr ? "هدف تحقق" : "goal achieved"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity + Diet badges */}
      <div className="px-4 py-3 flex gap-3 flex-wrap border-b" style={{ borderColor: T.lineSoft }}>
        {/* Activity */}
        <div>
          <div className="text-[9px] uppercase tracking-wider mb-1.5"
               style={{ color: T.inkMute, fontWeight: 700 }}>
            {isAr ? "النشاط" : "Activity"}
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px]"
               style={{ background: activity.bg, color: activity.color, fontWeight: 600 }}>
            <ActivityIcon size={12} />
            <span className={isAr ? "font-arabic" : ""}>
              {isAr ? activity.labelAr : activity.label}
            </span>
          </div>
          <div className="text-[10px] mt-1 max-w-[140px]"
               style={{ color: T.inkSoft, lineHeight: 1.3 }}>
            {isAr ? activity.patientHint_ar : activity.patientHint_en}
          </div>
        </div>

        {/* Diet */}
        <div>
          <div className="text-[9px] uppercase tracking-wider mb-1.5"
               style={{ color: T.inkMute, fontWeight: 700 }}>
            {isAr ? "الحمية الغذائية" : "Diet"}
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px]"
               style={{ background: diet.color + "15", color: diet.color, fontWeight: 600 }}>
            <DietIcon size={12} />
            <span className={isAr ? "font-arabic" : ""}>
              {isAr ? diet.labelAr : diet.label}
            </span>
          </div>
        </div>
      </div>

      {/* Interventions — simplified for patient */}
      {(cp.interventions || []).length > 0 && (
        <div className="px-4 py-3 border-b" style={{ borderColor: T.lineSoft }}>
          <div className="text-[9px] uppercase tracking-wider mb-2"
               style={{ color: T.inkMute, fontWeight: 700 }} dir={dir}>
            {isAr ? "رعايتك الحالية" : "Your current care"}
          </div>
          <div className="flex flex-wrap gap-1">
            {(cp.interventions || []).map((iv, i) => {
              const cat = getIvCat(iv.cat);
              return (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px]"
                      style={{ background: cat.bg, color: cat.color, fontWeight: 600 }}>
                  {iv.text}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Restrictions — prominent warning */}
      {(cp.restrictions || []).length > 0 && (
        <div className="px-4 py-3 border-b" style={{ borderColor: T.lineSoft, background: T.redBg }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={13} style={{ color: T.red }} />
            <div className="text-[9px] uppercase tracking-wider font-bold" style={{ color: T.red }}>
              {isAr ? "تعليمات مهمة" : "Important restrictions"}
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {(cp.restrictions || []).map((r, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded font-semibold"
                    style={{ background: "#fff", color: T.red, border: `1px solid ${T.red}30` }}>
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Nurse message */}
      {cp.nurseNotes && (
        <div className="px-4 py-3" style={{ background: T.goldSft, borderTop: `1px solid ${T.gold}30` }}>
          <div className="text-[9px] uppercase tracking-wider mb-1"
               style={{ color: T.gold, fontWeight: 700 }}>
            {isAr ? "رسالة من فريق الرعاية" : "Message from your care team"}
          </div>
          <div className={cx("text-[12px] leading-relaxed", isAr && "font-arabic")}
               style={{ color: T.ink }} dir={dir}>
            "{cp.nurseNotes}"
          </div>
        </div>
      )}
    </div>
  );
};

/* HOW TO INSERT CarePlanPatientView inside PatientHome:
   
   Find the "Active requests strip" block (the one that shows requests.length > 0).
   BEFORE that block (and after the sitter status block), add:
   
   {roomRec?.carePlan?.active && (
     <CarePlanPatientView room={roomRec} lang={lang} />
   )}
   
   The roomRec already exists in PatientHome from the useRequests hook.
   If not, add: const { rooms } = useRequests();
   and:         const roomRec = rooms.find(rm => String(rm.room) === String(patient.room));
*/


/* ═══════════════════════════════════════════════════════════════════════════
   SUMMARY — QUICK REFERENCE
   ═══════════════════════════════════════════════════════════════════════════
   
   Files changed:    App.jsx only
   New components:   CarePlanEditor · CarePlanPatientView
   New constants:    ACTIVITY_LEVELS · DIET_OPTIONS · INTERVENTION_CATEGORIES
                     GOAL_STATUSES · DEFAULT_CARE_PLAN()
   New helper fns:   getActivity() · getDietOption() · getIvCat() · getGoalStatus()
   Context update:   setCarePlan added to RequestsCtx + requestsCtxValue
   State update:     carePlan field added to initial rooms[] in App()
   Audit trail:      every setCarePlan() call logs to AUDIT array
   CBAHI alignment:  care plan documented, timestamped, auditable per shift
   
   INTEGRATION ORDER (do exactly this):
   1. Add constants block (ACTIVITY_LEVELS etc.) → after getSitter()
   2. Add setCarePlan() function → inside App(), after completeRequestsForRoom()
   3. Add setCarePlan to requestsCtxValue object
   4. Add setCarePlan: () => {} to RequestsCtx.createContext default
   5. Add carePlan field to initial rooms state
   6. Add CarePlanEditor component → anywhere before RoomDetailModal
   7. Add CarePlanPatientView component → anywhere before PatientHome
   8. Insert <CarePlanEditor /> into RoomDetailModal JSX + update props
   9. Insert <CarePlanPatientView /> into PatientHome JSX
   ═══════════════════════════════════════════════════════════════════════════ */
