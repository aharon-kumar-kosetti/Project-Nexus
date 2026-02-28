import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════
const STATUSES = ["Upcoming", "Ongoing", "Completed", "Paused"];
const STATUS_CFG = {
  Upcoming:  { color: "#00BFFF", glow: "#00BFFF35", tag: "UPCOMING",  icon: "◈" },
  Ongoing:   { color: "#FF003C", glow: "#FF003C35", tag: "ONGOING",   icon: "◉" },
  Completed: { color: "#FFD700", glow: "#FFD70035", tag: "DONE",      icon: "◆" },
  Paused:    { color: "#AA55FF", glow: "#AA55FF35", tag: "PAUSED",    icon: "⏸" },
};
const PRIORITIES = ["Low","Medium","High","Critical"];
const PRI_CFG = {
  Low:      { color: "#666",    bg: "#66666620", label: "LOW"  },
  Medium:   { color: "#00BFFF", bg: "#00BFFF20", label: "MED"  },
  High:     { color: "#FFD700", bg: "#FFD70020", label: "HIGH" },
  Critical: { color: "#FF003C", bg: "#FF003C20", label: "CRIT" },
};
const TECH_LIST = [
  { label:"React",         icon:"⚛",  color:"#61DAFB" },
  { label:"Next.js",       icon:"▲",  color:"#ffffff" },
  { label:"Vue",           icon:"◈",  color:"#42b883" },
  { label:"Angular",       icon:"⬡",  color:"#DD0031" },
  { label:"Svelte",        icon:"◊",  color:"#FF3E00" },
  { label:"TypeScript",    icon:"TS", color:"#3178C6" },
  { label:"JavaScript",    icon:"JS", color:"#F7DF1E" },
  { label:"Python",        icon:"Py", color:"#3776AB" },
  { label:"Node.js",       icon:"⬡",  color:"#539E43" },
  { label:"Express",       icon:"Ex", color:"#aaaaaa" },
  { label:"Django",        icon:"Dj", color:"#44b78b" },
  { label:"FastAPI",       icon:"⚡",  color:"#009688" },
  { label:"React Native",  icon:"📱", color:"#61DAFB" },
  { label:"Flutter",       icon:"Ft", color:"#54C5F8" },
  { label:"TensorFlow",    icon:"TF", color:"#FF6F00" },
  { label:"PyTorch",       icon:"PT", color:"#EE4C2C" },
  { label:"scikit-learn",  icon:"SK", color:"#F7931E" },
  { label:"MongoDB",       icon:"Mg", color:"#47A248" },
  { label:"PostgreSQL",    icon:"Pg", color:"#336791" },
  { label:"Firebase",      icon:"🔥", color:"#FFCA28" },
  { label:"Supabase",      icon:"Sb", color:"#3ECF8E" },
  { label:"Docker",        icon:"🐳", color:"#2496ED" },
  { label:"AWS",           icon:"☁",  color:"#FF9900" },
  { label:"Vercel",        icon:"▲",  color:"#aaaaaa" },
  { label:"Netlify",       icon:"Nt", color:"#00C7B7" },
  { label:"HTML/CSS",      icon:"🌐", color:"#E34F26" },
  { label:"Tailwind",      icon:"~",  color:"#38BDF8" },
  { label:"Java",          icon:"☕", color:"#007396" },
  { label:"Go",            icon:"Go", color:"#00ADD8" },
  { label:"Rust",          icon:"⚙",  color:"#CE422B" },
  { label:"C++",           icon:"C+", color:"#00599C" },
];

const genId = () => Math.random().toString(36).slice(2,10);
const calcProgress = tasks => tasks?.length ? Math.round(tasks.filter(t=>t.done).length/tasks.length*100) : null;
const daysLeft = dl => dl ? Math.ceil((new Date(dl)-new Date())/86400000) : null;
const fmtTime = iso => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US",{month:"short",day:"numeric"})+" · "+d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
};

const DEFAULT_PROJECTS = [
  { id:"dp1", title:"Portfolio Website", description:"Personal portfolio showcasing projects & skills. Mobile-first, deployed on Vercel.", status:"Ongoing", priority:"High", progress:60, tags:["Personal","Design"], techStack:["React","Tailwind","Vercel"], repoLink:"https://github.com", deployLink:"https://mysite.vercel.app", deployStatus:"live", deployLabel:"", docs:[], deadline:"2026-03-15", createdAt:"2026-01-10", tasks:[{id:"t1",text:"Design mockup",done:true},{id:"t2",text:"Homepage build",done:true},{id:"t3",text:"Projects section",done:false},{id:"t4",text:"Deploy & test",done:false}], notes:"Focus on animations and mobile experience.", activityLog:[{ts:"2026-01-10T09:00:00Z",action:"Project created"},{ts:"2026-01-14T14:00:00Z",action:"Status → Ongoing"}] },
  { id:"dp2", title:"ML Image Classifier", description:"CNN model for CIFAR-10 classification using PyTorch. Research project.", status:"Upcoming", priority:"Medium", progress:0, tags:["ML","Research"], techStack:["Python","PyTorch","scikit-learn"], repoLink:"https://github.com", deployLink:"", deployStatus:"not-deployed", deployLabel:"", docs:[], deadline:"2026-05-01", createdAt:"2026-02-10", tasks:[{id:"t5",text:"Data preprocessing pipeline",done:false},{id:"t6",text:"Model architecture",done:false},{id:"t7",text:"Training loop",done:false}], notes:"", activityLog:[{ts:"2026-02-10T10:00:00Z",action:"Project created"}] },
];

// ═══════════════════════════════════════════════════
// PROGRESS RING
// ═══════════════════════════════════════════════════
function ProgressRing({ progress=0, size=56, stroke=4, color="#FF003C" }) {
  const r = (size-stroke)/2;
  const circ = 2*Math.PI*r;
  const offset = circ - (progress/100)*circ;
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)",flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1a2e" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{transition:"stroke-dashoffset 0.6s ease",filter:`drop-shadow(0 0 4px ${color}80)`}}/>
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill={color}
        fontSize={size/5.2} fontWeight="800"
        style={{transform:"rotate(90deg)",transformOrigin:"center",fontFamily:"'Orbitron',monospace"}}>
        {progress}%
      </text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════
// TECH BADGE
// ═══════════════════════════════════════════════════
function TechBadge({ label, small=false }) {
  const tech = TECH_LIST.find(t=>t.label===label) || {icon:"?",color:"#888",label};
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,background:tech.color+"18",border:`1px solid ${tech.color}40`,color:tech.color,fontSize:small?9:10,padding:small?"1px 6px":"2px 8px",borderRadius:4,fontFamily:"'Orbitron',monospace",fontWeight:700,letterSpacing:0.3,whiteSpace:"nowrap"}}>
      <span style={{fontSize:small?8:10}}>{tech.icon}</span>{label}
    </span>
  );
}

// ═══════════════════════════════════════════════════
// DEPLOY BADGE
// ═══════════════════════════════════════════════════
function DeployBadge({ project }) {
  if (project.deployStatus==="live" && project.deployLink) {
    return (
      <a href={project.deployLink} target="_blank" rel="noreferrer"
        style={{display:"inline-flex",alignItems:"center",gap:5,background:"#00FF8820",border:"1px solid #00FF8860",color:"#00FF88",fontSize:10,padding:"2px 8px",borderRadius:4,fontFamily:"'Orbitron',monospace",fontWeight:700,textDecoration:"none",cursor:"pointer"}}
        onClick={e=>e.stopPropagation()}>
        <span style={{width:5,height:5,borderRadius:"50%",background:"#00FF88",display:"inline-block",animation:"pulse 1.5s infinite"}}/>
        LIVE
      </a>
    );
  }
  const label = project.deployStatus==="custom" && project.deployLabel ? project.deployLabel : "NOT DEPLOYED";
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,background:"#FF003C18",border:"1px solid #FF003C40",color:"#FF003C80",fontSize:10,padding:"2px 8px",borderRadius:4,fontFamily:"'Orbitron',monospace",fontWeight:700}}>
      ⊘ {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════
// PROJECT CARD (Grid)
// ═══════════════════════════════════════════════════
function ProjectCard({ project, onClick, onDragStart }) {
  const sc = STATUS_CFG[project.status];
  const pc = PRI_CFG[project.priority];
  const dl = daysLeft(project.deadline);
  const prog = calcProgress(project.tasks) ?? project.progress;
  const doneTasks = project.tasks?.filter(t=>t.done).length || 0;

  return (
    <div
      draggable onDragStart={e=>onDragStart(e,project.id)}
      onClick={()=>onClick(project)}
      style={{
        background:"#0c0c1e",
        border:`1px solid ${sc.color}30`,
        borderRadius:12,
        padding:20,
        cursor:"pointer",
        position:"relative",
        overflow:"hidden",
        transition:"all 0.2s ease",
        userSelect:"none",
      }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=sc.color+"80";e.currentTarget.style.boxShadow=`0 0 20px ${sc.glow}, inset 0 0 20px ${sc.glow}30`;e.currentTarget.style.transform="translateY(-3px)";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=sc.color+"30";e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="translateY(0)";}}
    >
      {/* Top color bar */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${sc.color},transparent)`,borderRadius:"12px 12px 0 0"}}/>
      {/* Corner HUD brackets */}
      <div style={{position:"absolute",top:8,left:8,width:12,height:12,borderTop:`1px solid ${sc.color}`,borderLeft:`1px solid ${sc.color}`}}/>
      <div style={{position:"absolute",top:8,right:8,width:12,height:12,borderTop:`1px solid ${sc.color}`,borderRight:`1px solid ${sc.color}`}}/>
      <div style={{position:"absolute",bottom:8,left:8,width:12,height:12,borderBottom:`1px solid ${sc.color}`,borderLeft:`1px solid ${sc.color}`}}/>
      <div style={{position:"absolute",bottom:8,right:8,width:12,height:12,borderBottom:`1px solid ${sc.color}`,borderRight:`1px solid ${sc.color}`}}/>
      {/* Halftone dot bg */}
      <div style={{position:"absolute",inset:0,backgroundImage:`radial-gradient(${sc.color}08 1px, transparent 1px)`,backgroundSize:"18px 18px",pointerEvents:"none"}}/>

      <div style={{position:"relative"}}>
        {/* Header row */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div style={{flex:1,marginRight:10}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
              <span style={{fontSize:9,color:sc.color,fontFamily:"'Orbitron',monospace",fontWeight:700,letterSpacing:1.5,background:sc.glow,padding:"2px 7px",borderRadius:3}}>
                {sc.icon} {sc.tag}
              </span>
              <span style={{fontSize:9,color:pc.color,background:pc.bg,padding:"2px 7px",borderRadius:3,fontFamily:"'Orbitron',monospace",fontWeight:700,letterSpacing:1}}>
                {pc.label}
              </span>
            </div>
            <h3 style={{margin:0,fontSize:15,fontWeight:800,color:"#f0eeff",fontFamily:"'Rajdhani',sans-serif",lineHeight:1.2,letterSpacing:0.3}}>
              {project.title}
            </h3>
          </div>
          <ProgressRing progress={prog} size={52} color={sc.color}/>
        </div>

        {/* Description */}
        <p style={{margin:"0 0 10px",fontSize:11.5,color:"#666",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
          {project.description || "No description provided."}
        </p>

        {/* Tech Stack */}
        {project.techStack?.length > 0 && (
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
            {project.techStack.slice(0,4).map(t=><TechBadge key={t} label={t} small/>)}
            {project.techStack.length>4 && <span style={{fontSize:9,color:"#555",padding:"1px 6px"}}>+{project.techStack.length-4}</span>}
          </div>
        )}

        {/* Tags */}
        {project.tags?.length > 0 && (
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
            {project.tags.map(t=>(
              <span key={t} style={{fontSize:9,color:"#888",background:"#ffffff08",border:"1px solid #ffffff12",padding:"1px 7px",borderRadius:3,fontFamily:"'Orbitron',monospace",letterSpacing:0.5}}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Footer row */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:6,flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            <DeployBadge project={project}/>
            {project.repoLink && (
              <a href={project.repoLink} target="_blank" rel="noreferrer"
                onClick={e=>e.stopPropagation()}
                style={{fontSize:9,color:"#888",background:"#ffffff08",border:"1px solid #ffffff12",padding:"2px 8px",borderRadius:3,fontFamily:"'Orbitron',monospace",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4}}>
                ⌥ REPO
              </a>
            )}
            {project.docs?.length>0 && (
              <span style={{fontSize:9,color:"#888",fontFamily:"'Orbitron',monospace"}}>📎 {project.docs.length}</span>
            )}
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {project.tasks?.length>0 && (
              <span style={{fontSize:9,color:"#555",fontFamily:"'Orbitron',monospace"}}>{doneTasks}/{project.tasks.length} tasks</span>
            )}
            {dl!==null && (
              <span style={{fontSize:9,fontFamily:"'Orbitron',monospace",color:dl<0?"#FF003C":dl<7?"#FF003C":dl<30?"#FFD700":"#555",background:(dl<7?"#FF003C":"dl<30"?"#FFD700":"#ffffff")+"12",padding:"2px 7px",borderRadius:3}}>
                {dl<0?`${Math.abs(dl)}d OVERDUE`:dl===0?"DUE TODAY":`${dl}d LEFT`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// KANBAN COLUMN
// ═══════════════════════════════════════════════════
function KanbanColumn({ status, projects, onDrop, onDragOver, onProjectClick, onDragStart }) {
  const sc = STATUS_CFG[status];
  const [over, setOver] = useState(false);
  return (
    <div style={{flex:"1 1 220px",minWidth:220,maxWidth:320}}
      onDragOver={e=>{e.preventDefault();setOver(true);onDragOver(e);}}
      onDragLeave={()=>setOver(false)}
      onDrop={e=>{setOver(false);onDrop(e,status);}}>
      {/* Column header */}
      <div style={{marginBottom:12,padding:"10px 14px",background:`${sc.glow}`,border:`1px solid ${sc.color}40`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:11,color:sc.color,fontFamily:"'Orbitron',monospace",fontWeight:700,letterSpacing:1.5}}>
          {sc.icon} {sc.tag}
        </span>
        <span style={{fontSize:11,color:sc.color,fontFamily:"'Orbitron',monospace",fontWeight:700,background:sc.color+"20",padding:"1px 8px",borderRadius:3}}>
          {projects.length}
        </span>
      </div>
      {/* Drop zone */}
      <div style={{
        minHeight:200,border:`1px dashed ${over?sc.color:sc.color+"30"}`,borderRadius:8,padding:8,
        background:over?sc.glow:"transparent",transition:"all 0.15s",display:"flex",flexDirection:"column",gap:8
      }}>
        {projects.length===0 && (
          <div style={{textAlign:"center",padding:"30px 0",color:"#333",fontSize:11,fontFamily:"'Orbitron',monospace"}}>
            DROP HERE
          </div>
        )}
        {projects.map(p=>(
          <div key={p.id} draggable onDragStart={e=>onDragStart(e,p.id)} onClick={()=>onProjectClick(p)}
            style={{background:"#0c0c1e",border:`1px solid ${sc.color}25`,borderRadius:8,padding:"12px 14px",cursor:"pointer",position:"relative",overflow:"hidden",transition:"border-color 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=sc.color+"70"}
            onMouseLeave={e=>e.currentTarget.style.borderColor=sc.color+"25"}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${sc.color},transparent)`}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{flex:1}}>
                <p style={{margin:"0 0 4px",fontSize:13,fontWeight:700,color:"#f0eeff",fontFamily:"'Rajdhani',sans-serif"}}>{p.title}</p>
                <p style={{margin:"0 0 8px",fontSize:10.5,color:"#555",lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.description}</p>
                {p.techStack?.length>0 && (
                  <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:6}}>
                    {p.techStack.slice(0,3).map(t=><TechBadge key={t} label={t} small/>)}
                    {p.techStack.length>3&&<span style={{fontSize:8,color:"#555"}}>+{p.techStack.length-3}</span>}
                  </div>
                )}
                <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                  <DeployBadge project={p}/>
                  {p.repoLink&&<a href={p.repoLink} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:8,color:"#777",textDecoration:"none",fontFamily:"'Orbitron',monospace",background:"#ffffff08",padding:"1px 6px",borderRadius:2}}>⌥ REPO</a>}
                </div>
              </div>
              <ProgressRing progress={calcProgress(p.tasks)??p.progress} size={38} stroke={3} color={sc.color}/>
            </div>
            {p.deadline && (
              <div style={{marginTop:8,fontSize:9,color:daysLeft(p.deadline)<7?"#FF003C":"#555",fontFamily:"'Orbitron',monospace"}}>
                {daysLeft(p.deadline)<0?`${Math.abs(daysLeft(p.deadline))}d OVERDUE`:daysLeft(p.deadline)===0?"DUE TODAY":`${daysLeft(p.deadline)}d LEFT`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════
function Modal({ project, onClose, onSave, onDelete }) {
  const isNew = !project;
  const [form, setForm] = useState(project ? { ...project } : {
    id:genId(), title:"", description:"", status:"Upcoming", priority:"Medium",
    progress:0, tags:[], techStack:[], repoLink:"", deployLink:"",
    deployStatus:"not-deployed", deployLabel:"", docs:[],
    deadline:"", createdAt:new Date().toISOString().slice(0,10),
    tasks:[], notes:"", activityLog:[],
  });
  const [tab, setTab] = useState("overview");
  const [tagIn, setTagIn] = useState("");
  const [taskIn, setTaskIn] = useState("");
  const [techSearch, setTechSearch] = useState("");
  const fileRef = useRef();

  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const prog = calcProgress(form.tasks) ?? form.progress;

  const addTag = () => { if(tagIn.trim()&&!form.tags.includes(tagIn.trim())){set("tags",[...form.tags,tagIn.trim()]);setTagIn("");} };
  const removeTag = t => set("tags",form.tags.filter(x=>x!==t));
  const toggleTech = t => set("techStack",form.techStack.includes(t)?form.techStack.filter(x=>x!==t):[...form.techStack,t]);
  const addTask = () => { if(taskIn.trim()){set("tasks",[...form.tasks,{id:genId(),text:taskIn.trim(),done:false}]);setTaskIn("");} };
  const toggleTask = id => set("tasks",form.tasks.map(t=>t.id===id?{...t,done:!t.done}:t));
  const removeTask = id => set("tasks",form.tasks.filter(t=>t.id!==id));

  const handleFileUpload = e => {
    const files = Array.from(e.target.files);
    files.forEach(file=>{
      if(file.size>4*1024*1024){alert(`${file.name} exceeds 4MB limit.`);return;}
      const reader = new FileReader();
      reader.onload = ev => {
        const doc = {id:genId(),name:file.name,type:file.type,size:file.size,data:ev.target.result,uploadedAt:new Date().toISOString()};
        set("docs",[...(form.docs||[]),doc]);
      };
      reader.readAsDataURL(file);
    });
  };
  const removeDoc = id => set("docs",form.docs.filter(d=>d.id!==id));
  const viewDoc = doc => { const w=window.open(); w.document.write(`<iframe src="${doc.data}" style="width:100%;height:100vh;border:none"/>`); };

  const handleSave = () => {
    if(!form.title.trim()){alert("Title required!");return;}
    // Build activity log
    const newLog = [...(form.activityLog||[])];
    if(isNew) { newLog.push({ts:new Date().toISOString(),action:"Project created"}); }
    else {
      const changes = [];
      if(project.status!==form.status) changes.push(`Status → ${form.status}`);
      if(project.priority!==form.priority) changes.push(`Priority → ${form.priority}`);
      if(project.repoLink!==form.repoLink && form.repoLink) changes.push("Repo link added");
      if(project.deployStatus!==form.deployStatus) changes.push(`Deploy → ${form.deployStatus==="live"?"Live":form.deployLabel||"Not Deployed"}`);
      const newDone = form.tasks.filter(t=>t.done&&!project.tasks?.find(pt=>pt.id===t.id&&pt.done)).map(t=>t.text);
      newDone.forEach(t=>changes.push(`Task done: "${t}"`));
      if((form.docs?.length||0)>(project.docs?.length||0)) changes.push(`Docs uploaded`);
      if(changes.length>0) newLog.push({ts:new Date().toISOString(),action:changes.join(" · ")});
      else newLog.push({ts:new Date().toISOString(),action:"Project updated"});
    }
    onSave({...form, progress:prog, activityLog:newLog});
  };

  const INP = {width:"100%",background:"#090915",border:"1px solid #ffffff12",borderRadius:7,color:"#f0eeff",padding:"9px 12px",fontSize:12.5,fontFamily:"'Rajdhani',sans-serif",outline:"none",boxSizing:"border-box"};
  const LBL = {fontSize:9.5,color:"#555",fontFamily:"'Orbitron',monospace",letterSpacing:1.2,marginBottom:6,display:"block"};
  const filteredTech = TECH_LIST.filter(t=>t.label.toLowerCase().includes(techSearch.toLowerCase()));
  const TABS = ["overview","tech","tasks","docs","activity"];

  return (
    <div style={{position:"fixed",inset:0,background:"#000000dd",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#0a0a1a",borderRadius:16,border:"1px solid #FF003C30",width:"100%",maxWidth:640,maxHeight:"92vh",overflowY:"auto",position:"relative",boxShadow:"0 0 40px #FF003C20, 0 0 80px #00BFFF10"}}>
        {/* HUD corners */}
        {[["top:0,left:0","borderTop:1px solid #FF003C,borderLeft:1px solid #FF003C"],["top:0,right:0","borderTop:1px solid #FF003C,borderRight:1px solid #FF003C"],["bottom:0,left:0","borderBottom:1px solid #FF003C,borderLeft:1px solid #FF003C"],["bottom:0,right:0","borderBottom:1px solid #FF003C,borderRight:1px solid #FF003C"]].map(([pos],i)=>(
          <div key={i} style={{position:"absolute",width:16,height:16,...Object.fromEntries(pos.split(",").map(s=>{const[k,v]=s.split(":");return[k,v];})),...Object.fromEntries(["borderTop","borderLeft","borderBottom","borderRight"].filter((_,j)=>i<2?j<(i%2===0?2:3):j>(i%2===0?0:1)).map(b=>[b,b.includes("Top")||b.includes("Bottom")?"1px solid #FF003C":"1px solid #FF003C"]))}} />
        ))}

        {/* Modal header */}
        <div style={{padding:"22px 28px 0",position:"sticky",top:0,background:"#0a0a1a",zIndex:5}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div>
              <div style={{fontSize:9,color:"#FF003C",fontFamily:"'Orbitron',monospace",letterSpacing:2,marginBottom:4}}>
                {isNew?"// NEW MISSION":"// EDIT MISSION"}
              </div>
              <h2 style={{margin:0,fontFamily:"'Rajdhani',sans-serif",fontSize:22,fontWeight:800,color:"#f0eeff"}}>
                {form.title||"Untitled Project"}
              </h2>
            </div>
            <button onClick={onClose} style={{background:"none",border:"1px solid #ffffff15",color:"#555",fontSize:16,cursor:"pointer",padding:"4px 10px",borderRadius:5,fontFamily:"'Orbitron',monospace"}}>✕</button>
          </div>
          {/* Tabs */}
          <div style={{display:"flex",gap:2,borderBottom:"1px solid #ffffff08",paddingBottom:0}}>
            {TABS.map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",padding:"7px 14px",cursor:"pointer",fontSize:9,fontFamily:"'Orbitron',monospace",letterSpacing:1,color:tab===t?"#FF003C":"#444",borderBottom:`2px solid ${tab===t?"#FF003C":"transparent"}`,transition:"all 0.15s",textTransform:"uppercase"}}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{padding:"20px 28px 28px"}}>

          {/* ── OVERVIEW TAB ── */}
          {tab==="overview" && (
            <div style={{display:"grid",gap:16}}>
              <div>
                <label style={LBL}>PROJECT TITLE *</label>
                <input style={INP} value={form.title} onChange={e=>set("title",e.target.value)} placeholder="What are you building?"/>
              </div>
              <div>
                <label style={LBL}>DESCRIPTION</label>
                <textarea style={{...INP,minHeight:70,resize:"vertical"}} value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Brief overview of the project..."/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={LBL}>STATUS</label>
                  <select style={{...INP,cursor:"pointer"}} value={form.status} onChange={e=>set("status",e.target.value)}>
                    {STATUSES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LBL}>PRIORITY</label>
                  <select style={{...INP,cursor:"pointer"}} value={form.priority} onChange={e=>set("priority",e.target.value)}>
                    {PRIORITIES.map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={LBL}>DEADLINE</label>
                <input type="date" style={{...INP,colorScheme:"dark"}} value={form.deadline} onChange={e=>set("deadline",e.target.value)}/>
              </div>
              {/* Repo link */}
              <div>
                <label style={LBL}>⌥ REPO LINK (GitHub / GitLab)</label>
                <input style={INP} value={form.repoLink} onChange={e=>set("repoLink",e.target.value)} placeholder="https://github.com/you/project"/>
              </div>
              {/* Deploy section */}
              <div>
                <label style={LBL}>🚀 DEPLOYMENT</label>
                <div style={{display:"flex",gap:6,marginBottom:8}}>
                  {[["live","LIVE ↗"],["not-deployed","NOT DEPLOYED"],["custom","CUSTOM LABEL"]].map(([v,l])=>(
                    <button key={v} onClick={()=>set("deployStatus",v)}
                      style={{flex:1,background:form.deployStatus===v?"#FF003C":"#090915",border:`1px solid ${form.deployStatus===v?"#FF003C":"#ffffff15"}`,color:form.deployStatus===v?"#fff":"#555",borderRadius:6,padding:"7px 0",cursor:"pointer",fontSize:9,fontFamily:"'Orbitron',monospace",letterSpacing:0.8,transition:"all 0.15s"}}>
                      {l}
                    </button>
                  ))}
                </div>
                {form.deployStatus==="live" && <input style={INP} value={form.deployLink} onChange={e=>set("deployLink",e.target.value)} placeholder="https://yourapp.vercel.app"/>}
                {form.deployStatus==="custom" && <input style={INP} value={form.deployLabel} onChange={e=>set("deployLabel",e.target.value)} placeholder="e.g. Desktop Only · Internal Tool · Beta Testing"/>}
              </div>
              {/* Manual progress (only if no tasks) */}
              {form.tasks.length===0 && (
                <div>
                  <label style={LBL}>PROGRESS — {form.progress}% (manual, add tasks to auto-calculate)</label>
                  <input type="range" min={0} max={100} value={form.progress} onChange={e=>set("progress",+e.target.value)}
                    style={{width:"100%",accentColor:"#FF003C"}}/>
                </div>
              )}
              {/* Notes */}
              <div>
                <label style={LBL}>NOTES</label>
                <textarea style={{...INP,minHeight:70,resize:"vertical"}} value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Quick thoughts, blockers, ideas..."/>
              </div>
              {/* Tags */}
              <div>
                <label style={LBL}>TAGS</label>
                <div style={{display:"flex",gap:6,marginBottom:8}}>
                  <input style={{...INP,flex:1}} value={tagIn} onChange={e=>setTagIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),addTag())} placeholder="Add tag + Enter"/>
                  <button onClick={addTag} style={{background:"#FF003C",border:"none",color:"#fff",borderRadius:6,padding:"0 14px",cursor:"pointer",fontSize:13,fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>+</button>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {form.tags.map(t=>(
                    <span key={t} onClick={()=>removeTag(t)} style={{fontSize:10,color:"#888",background:"#ffffff08",border:"1px solid #ffffff12",padding:"2px 10px",borderRadius:3,cursor:"pointer",fontFamily:"'Orbitron',monospace",display:"inline-flex",alignItems:"center",gap:5}}>
                      {t} <span style={{color:"#FF003C",fontSize:9}}>✕</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TECH TAB ── */}
          {tab==="tech" && (
            <div>
              <div style={{marginBottom:12}}>
                <label style={LBL}>SELECTED STACK</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,minHeight:30,padding:"8px",background:"#090915",border:"1px solid #ffffff10",borderRadius:7,marginBottom:12}}>
                  {form.techStack.length===0&&<span style={{fontSize:10,color:"#333",fontFamily:"'Orbitron',monospace"}}>No tech selected yet</span>}
                  {form.techStack.map(t=>(
                    <span key={t} onClick={()=>toggleTech(t)} style={{cursor:"pointer"}}>
                      <TechBadge label={t}/>
                    </span>
                  ))}
                </div>
              </div>
              <input style={{...INP,marginBottom:10}} value={techSearch} onChange={e=>setTechSearch(e.target.value)} placeholder="Search tech stack..."/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:6,maxHeight:320,overflowY:"auto"}}>
                {filteredTech.map(t=>{
                  const sel = form.techStack.includes(t.label);
                  return (
                    <button key={t.label} onClick={()=>toggleTech(t.label)}
                      style={{background:sel?t.color+"20":"#090915",border:`1px solid ${sel?t.color:t.color+"30"}`,color:sel?t.color:t.color+"80",borderRadius:6,padding:"8px 10px",cursor:"pointer",fontSize:10,fontFamily:"'Orbitron',monospace",letterSpacing:0.5,display:"flex",alignItems:"center",gap:6,transition:"all 0.15s",textAlign:"left"}}>
                      <span style={{fontSize:12}}>{t.icon}</span>{t.label}
                      {sel&&<span style={{marginLeft:"auto",fontSize:8,color:t.color}}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TASKS TAB ── */}
          {tab==="tasks" && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <label style={{...LBL,margin:0}}>TASKS — {form.tasks.filter(t=>t.done).length}/{form.tasks.length} DONE</label>
                {form.tasks.length>0 && (
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:80,height:4,background:"#1a1a2e",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${prog}%`,background:"linear-gradient(90deg,#FF003C,#00BFFF)",borderRadius:2,transition:"width 0.4s"}}/>
                    </div>
                    <span style={{fontSize:10,color:"#FF003C",fontFamily:"'Orbitron',monospace",fontWeight:700}}>{prog}%</span>
                  </div>
                )}
              </div>
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                <input style={{...INP,flex:1}} value={taskIn} onChange={e=>setTaskIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),addTask())} placeholder="New task + Enter"/>
                <button onClick={addTask} style={{background:"#FF003C",border:"none",color:"#fff",borderRadius:6,padding:"0 14px",cursor:"pointer",fontWeight:700,fontFamily:"'Rajdhani',sans-serif",fontSize:14}}>+</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {form.tasks.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:"#333",fontFamily:"'Orbitron',monospace",fontSize:11}}>NO TASKS YET</div>}
                {form.tasks.map(task=>(
                  <div key={task.id} style={{display:"flex",alignItems:"center",gap:10,background:"#090915",border:`1px solid ${task.done?"#00FF8830":"#ffffff0a"}`,borderRadius:7,padding:"9px 12px",transition:"border-color 0.15s"}}>
                    <input type="checkbox" checked={task.done} onChange={()=>toggleTask(task.id)} style={{accentColor:"#FF003C",width:14,height:14,cursor:"pointer",flexShrink:0}}/>
                    <span style={{flex:1,fontSize:13,color:task.done?"#333":"#ccc",textDecoration:task.done?"line-through":"none",fontFamily:"'Rajdhani',sans-serif"}}>{task.text}</span>
                    {task.done&&<span style={{fontSize:9,color:"#00FF88",fontFamily:"'Orbitron',monospace"}}>DONE</span>}
                    <button onClick={()=>removeTask(task.id)} style={{background:"none",border:"none",color:"#333",cursor:"pointer",fontSize:12,padding:2,fontFamily:"'Orbitron',monospace"}}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── DOCS TAB ── */}
          {tab==="docs" && (
            <div>
              <label style={LBL}>ATTACHED DOCUMENTS</label>
              <div onClick={()=>fileRef.current?.click()} style={{border:"1px dashed #FF003C40",borderRadius:8,padding:"24px",textAlign:"center",cursor:"pointer",marginBottom:16,transition:"all 0.15s",background:"#090915"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#FF003C80"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#FF003C40"}>
                <div style={{fontSize:24,marginBottom:8}}>📎</div>
                <div style={{fontSize:11,color:"#555",fontFamily:"'Orbitron',monospace",letterSpacing:0.8}}>CLICK TO UPLOAD</div>
                <div style={{fontSize:9.5,color:"#333",marginTop:4,fontFamily:"'Rajdhani',sans-serif"}}>PDF · Images · Word Docs · max 4MB each</div>
                <input ref={fileRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.txt,.md" style={{display:"none"}} onChange={handleFileUpload}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {form.docs?.length===0&&<div style={{textAlign:"center",padding:"20px 0",color:"#333",fontFamily:"'Orbitron',monospace",fontSize:10}}>NO DOCS ATTACHED</div>}
                {form.docs?.map(doc=>{
                  const isImg=doc.type?.startsWith("image/");
                  const isPdf=doc.type==="application/pdf";
                  const size = doc.size>1024*1024?(doc.size/1024/1024).toFixed(1)+"MB":(doc.size/1024).toFixed(0)+"KB";
                  return (
                    <div key={doc.id} style={{display:"flex",alignItems:"center",gap:10,background:"#090915",border:"1px solid #ffffff0a",borderRadius:7,padding:"10px 14px"}}>
                      <span style={{fontSize:18}}>{isImg?"🖼️":isPdf?"📄":"📝"}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,color:"#ccc",fontFamily:"'Rajdhani',sans-serif",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{doc.name}</div>
                        <div style={{fontSize:9,color:"#444",fontFamily:"'Orbitron',monospace"}}>{size} · {fmtTime(doc.uploadedAt)}</div>
                      </div>
                      <button onClick={()=>viewDoc(doc)} style={{background:"#00BFFF20",border:"1px solid #00BFFF40",color:"#00BFFF",borderRadius:5,padding:"4px 10px",cursor:"pointer",fontSize:9,fontFamily:"'Orbitron',monospace"}}>VIEW</button>
                      <button onClick={()=>removeDoc(doc.id)} style={{background:"none",border:"none",color:"#333",cursor:"pointer",fontSize:12,fontFamily:"'Orbitron',monospace"}}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── ACTIVITY TAB ── */}
          {tab==="activity" && (
            <div>
              <label style={LBL}>ACTIVITY LOG</label>
              <div style={{display:"flex",flexDirection:"column",gap:0}}>
                {(form.activityLog?.length===0||!form.activityLog)&&<div style={{textAlign:"center",padding:"30px 0",color:"#333",fontFamily:"'Orbitron',monospace",fontSize:10}}>NO ACTIVITY YET</div>}
                {[...(form.activityLog||[])].reverse().map((entry,i)=>(
                  <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"10px 0",borderBottom:"1px solid #ffffff05"}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:"#FF003C",marginTop:5,flexShrink:0,boxShadow:"0 0 6px #FF003C"}}/>
                    <div>
                      <div style={{fontSize:12,color:"#ccc",fontFamily:"'Rajdhani',sans-serif",lineHeight:1.4}}>{entry.action}</div>
                      <div style={{fontSize:9,color:"#444",fontFamily:"'Orbitron',monospace",marginTop:2}}>{fmtTime(entry.ts)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:24,paddingTop:16,borderTop:"1px solid #ffffff08"}}>
            <div>
              {!isNew&&<button onClick={()=>onDelete(project.id)} style={{background:"#FF003C15",border:"1px solid #FF003C40",color:"#FF003C",borderRadius:7,padding:"10px 18px",cursor:"pointer",fontSize:10,fontFamily:"'Orbitron',monospace",letterSpacing:0.8}}>
                DELETE
              </button>}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={onClose} style={{background:"none",border:"1px solid #ffffff12",color:"#555",borderRadius:7,padding:"10px 18px",cursor:"pointer",fontSize:10,fontFamily:"'Orbitron',monospace",letterSpacing:0.8}}>CANCEL</button>
              <button onClick={handleSave} style={{background:"linear-gradient(135deg,#FF003C,#00BFFF)",border:"none",color:"#fff",borderRadius:7,padding:"10px 24px",cursor:"pointer",fontSize:10,fontFamily:"'Orbitron',monospace",fontWeight:700,letterSpacing:1,boxShadow:"0 0 20px #FF003C30"}}>
                {isNew?"DEPLOY PROJECT":"SAVE CHANGES"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════
export default function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [view, setView] = useState("grid"); // "grid" | "kanban"
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("deadline");
  const [search, setSearch] = useState("");
  const [dragId, setDragId] = useState(null);

  useEffect(()=>{
    (async()=>{
      try {
        const res = await window.storage.get("stark_webb_tracker_v2");
        if(res?.value) setProjects(JSON.parse(res.value));
        else setProjects(DEFAULT_PROJECTS);
      } catch { setProjects(DEFAULT_PROJECTS); }
      setLoading(false);
    })();
  },[]);

  const persist = async list => {
    setProjects(list);
    try { await window.storage.set("stark_webb_tracker_v2",JSON.stringify(list)); } catch {}
  };

  const handleSave = p => {
    const exists = projects.find(x=>x.id===p.id);
    persist(exists ? projects.map(x=>x.id===p.id?p:x) : [...projects,p]);
    setModal(null);
  };
  const handleDelete = id => {
    if(confirm("Destroy this project?")) { persist(projects.filter(p=>p.id!==id)); setModal(null); }
  };

  // Drag and drop for kanban
  const onDragStart = (e,id) => { setDragId(id); e.dataTransfer.effectAllowed="move"; };
  const onDragOver = e => { e.preventDefault(); e.dataTransfer.dropEffect="move"; };
  const onDrop = (e,status) => {
    e.preventDefault();
    if(!dragId) return;
    const updated = projects.map(p=>{
      if(p.id!==dragId) return p;
      const log = [...(p.activityLog||[]),{ts:new Date().toISOString(),action:`Status → ${status} (drag)`}];
      return {...p,status,activityLog:log};
    });
    persist(updated);
    setDragId(null);
  };

  // Filtered + sorted
  const displayed = projects
    .filter(p=>filter==="All"||p.status===filter)
    .filter(p=>!search||p.title.toLowerCase().includes(search.toLowerCase())||p.tags?.some(t=>t.toLowerCase().includes(search.toLowerCase()))||p.techStack?.some(t=>t.toLowerCase().includes(search.toLowerCase())))
    .sort((a,b)=>{
      if(sort==="deadline") return (a.deadline||"9999")>(b.deadline||"9999")?1:-1;
      if(sort==="priority") return PRIORITIES.indexOf(b.priority)-PRIORITIES.indexOf(a.priority);
      if(sort==="progress") return (calcProgress(b.tasks)??b.progress)-(calcProgress(a.tasks)??a.progress);
      return 0;
    });

  const stats = {
    total: projects.length,
    ongoing: projects.filter(p=>p.status==="Ongoing").length,
    upcoming: projects.filter(p=>p.status==="Upcoming").length,
    completed: projects.filter(p=>p.status==="Completed").length,
    overdue: projects.filter(p=>p.deadline&&daysLeft(p.deadline)<0&&p.status!=="Completed").length,
  };
  const avgProg = projects.length ? Math.round(projects.reduce((s,p)=>s+(calcProgress(p.tasks)??p.progress),0)/projects.length) : 0;

  if(loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#070710",color:"#FF003C",fontFamily:"'Orbitron',monospace",fontSize:12,letterSpacing:2}}>
      INITIALIZING STARK·WEBB SYSTEM...
    </div>
  );

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      <style>{`
        * { box-sizing:border-box; }
        body { margin:0; background:#070710; }
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#070710}
        ::-webkit-scrollbar-thumb{background:#FF003C40;border-radius:2px}
        select option{background:#0a0a1a;color:#f0eeff}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes scan{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
      `}</style>

      <div style={{minHeight:"100vh",background:"#070710",color:"#f0eeff",fontFamily:"'Rajdhani',sans-serif",position:"relative",overflowX:"hidden"}}>
        {/* Halftone BG */}
        <div style={{position:"fixed",inset:0,backgroundImage:"radial-gradient(#FF003C0a 1px,transparent 1px),radial-gradient(#00BFFF08 1px,transparent 1px)",backgroundSize:"30px 30px",backgroundPosition:"0 0,15px 15px",pointerEvents:"none",zIndex:0}}/>
        {/* Scan line */}
        <div style={{position:"fixed",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,#FF003C30,transparent)",animation:"scan 8s linear infinite",pointerEvents:"none",zIndex:1}}/>

        {/* ── HEADER ── */}
        <div style={{position:"sticky",top:0,zIndex:100,background:"#070710ee",borderBottom:"1px solid #FF003C20",backdropFilter:"blur(16px)"}}>
          <div style={{maxWidth:1200,margin:"0 auto",padding:"16px 24px",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
            {/* Logo */}
            <div style={{flex:1}}>
              <div style={{fontSize:9,color:"#FF003C",fontFamily:"'Orbitron',monospace",letterSpacing:3,marginBottom:3}}>◈ STARK·WEBB COMMAND ◈</div>
              <h1 style={{margin:0,fontFamily:"'Orbitron',monospace",fontSize:18,fontWeight:900,letterSpacing:2}}>
                <span style={{color:"#FF003C"}}>PROJECT</span>
                <span style={{color:"#f0eeff"}}> NEXUS</span>
                <span style={{color:"#00BFFF",fontSize:10,marginLeft:8,verticalAlign:"middle"}}>v2.0</span>
              </h1>
            </div>

            {/* View toggle */}
            <div style={{display:"flex",gap:2,background:"#0a0a1a",border:"1px solid #ffffff10",borderRadius:8,padding:3}}>
              {[["grid","⊞ GRID"],["kanban","⊟ KANBAN"]].map(([v,l])=>(
                <button key={v} onClick={()=>setView(v)} style={{background:view===v?"#FF003C":"none",border:"none",color:view===v?"#fff":"#444",borderRadius:6,padding:"7px 14px",cursor:"pointer",fontSize:9,fontFamily:"'Orbitron',monospace",letterSpacing:1,transition:"all 0.15s"}}>
                  {l}
                </button>
              ))}
            </div>

            <button onClick={()=>setModal("new")} style={{background:"linear-gradient(135deg,#FF003C,#FF6B00)",border:"none",color:"#fff",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontSize:10,fontFamily:"'Orbitron',monospace",fontWeight:700,letterSpacing:1,boxShadow:"0 0 20px #FF003C40",display:"flex",alignItems:"center",gap:6}}>
              + NEW MISSION
            </button>
          </div>
        </div>

        <div style={{maxWidth:1200,margin:"0 auto",padding:"20px 24px",position:"relative",zIndex:2}}>

          {/* ── STATS ── */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10,marginBottom:20}}>
            {[
              {label:"TOTAL",value:stats.total,color:"#f0eeff"},
              {label:"ONGOING",value:stats.ongoing,color:"#FF003C"},
              {label:"UPCOMING",value:stats.upcoming,color:"#00BFFF"},
              {label:"COMPLETED",value:stats.completed,color:"#FFD700"},
              {label:"OVERDUE",value:stats.overdue,color:stats.overdue>0?"#FF003C":"#333"},
            ].map(s=>(
              <div key={s.label} style={{background:"#0c0c1e",border:`1px solid ${s.color}20`,borderRadius:10,padding:"14px 18px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,${s.color},transparent)`}}/>
                <div style={{fontSize:8,color:"#444",fontFamily:"'Orbitron',monospace",letterSpacing:1.5,marginBottom:6}}>{s.label}</div>
                <div style={{fontSize:26,fontWeight:900,color:s.color,fontFamily:"'Orbitron',monospace",lineHeight:1}}>{s.value}</div>
              </div>
            ))}
            <div style={{background:"#0c0c1e",border:"1px solid #FF003C20",borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
              <ProgressRing progress={avgProg} size={50} stroke={3} color="#FF003C"/>
              <div>
                <div style={{fontSize:8,color:"#444",fontFamily:"'Orbitron',monospace",letterSpacing:1.2,marginBottom:3}}>AVG PROGRESS</div>
                <div style={{fontSize:10,color:"#888",fontFamily:"'Orbitron',monospace"}}>All projects</div>
              </div>
            </div>
          </div>

          {/* ── FILTERS ── */}
          <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="⌕  Search title · tag · tech..."
              style={{background:"#0c0c1e",border:"1px solid #ffffff10",borderRadius:7,color:"#f0eeff",padding:"9px 14px",fontSize:12,outline:"none",width:240,fontFamily:"'Rajdhani',sans-serif"}}/>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {["All",...STATUSES].map(s=>{
                const sc = STATUS_CFG[s];
                return (
                  <button key={s} onClick={()=>setFilter(s)} style={{background:filter===s?(sc?.color||"#FF003C"):"#0c0c1e",border:`1px solid ${filter===s?(sc?.color||"#FF003C"):"#ffffff10"}`,color:filter===s?"#fff":"#444",borderRadius:7,padding:"8px 14px",cursor:"pointer",fontSize:9,fontFamily:"'Orbitron',monospace",letterSpacing:0.8,transition:"all 0.15s"}}>
                    {s==="All"?"ALL":sc?.tag}
                  </button>
                );
              })}
            </div>
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:9,color:"#333",fontFamily:"'Orbitron',monospace"}}>SORT</span>
              <select value={sort} onChange={e=>setSort(e.target.value)} style={{background:"#0c0c1e",border:"1px solid #ffffff10",borderRadius:7,color:"#666",padding:"8px 12px",fontSize:9,cursor:"pointer",outline:"none",fontFamily:"'Orbitron',monospace"}}>
                <option value="deadline">DEADLINE</option>
                <option value="priority">PRIORITY</option>
                <option value="progress">PROGRESS</option>
              </select>
            </div>
          </div>

          {/* ── GRID VIEW ── */}
          {view==="grid" && (
            displayed.length===0
              ? <div style={{textAlign:"center",padding:"80px 0",color:"#1a1a2e"}}>
                  <div style={{fontSize:40,marginBottom:12,fontFamily:"'Orbitron',monospace"}}>◎</div>
                  <div style={{fontSize:16,fontFamily:"'Orbitron',monospace",color:"#222",letterSpacing:2}}>NO MISSIONS FOUND</div>
                  <div style={{fontSize:12,color:"#1a1a2e",marginTop:6,fontFamily:"'Rajdhani',sans-serif"}}>Click + NEW MISSION to get started</div>
                </div>
              : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
                  {displayed.map(p=><ProjectCard key={p.id} project={p} onClick={setModal} onDragStart={onDragStart}/>)}
                </div>
          )}

          {/* ── KANBAN VIEW ── */}
          {view==="kanban" && (
            <div style={{display:"flex",gap:12,alignItems:"flex-start",overflowX:"auto",paddingBottom:20}}>
              {STATUSES.map(s=>(
                <KanbanColumn key={s} status={s}
                  projects={displayed.filter(p=>p.status===s)}
                  onDrop={onDrop} onDragOver={onDragOver}
                  onProjectClick={setModal} onDragStart={onDragStart}/>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <Modal
          project={modal==="new"?null:modal}
          onClose={()=>setModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}/>
      )}
    </>
  );
}
