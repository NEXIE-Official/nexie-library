import './style.css';
import { supabase } from './supabase.js';

const people = [
['LEE SEUNG-WON','CEO','Executive','sw.lee@nexielibrary.com'],
['Kang Seo-jin','CEO','Executive','sj.kang@nexielibrary.com'],
['Go Eun-ah','CHRO','People & Culture','ea.go@nexielibrary.com'],
['Shin Ah-in','CSO','Executive','ai.shin@nexielibrary.com'],
['Cha Min-seo','Chief Legal Officer','Legal','ms.cha@nexielibrary.com'],
['Han Ji-sub','CFO','Finance','js.han@nexielibrary.com'],
['Lee Do-hyun','CTO','Technology','dh.lee@nexielibrary.com'],
['Andressa Correia','Artistic Director','Creative Direction','a.correia@nexielibrary.com'],
['Lee Juhye','Chief Creative Director','Creative Direction','jh.lee@nexielibrary.com'],
['Park Ji-eu','Associate Creative Director — ZHYT SONG','Creative Direction','je.park@nexielibrary.com'],
['Yoon Su-ah','Beauty & Image Director','Image & Styling','sa.yoon@nexielibrary.com'],
['Keeva Novak','Fashion & Styling Director — ZHYT SONG','Image & Styling','k.novak@nexielibrary.com'],
['Scarlett Hayes','Brand Development and Concepts','Brand & Marketing','s.hayes@nexielibrary.com'],
['Kim Min-jae','Producing Director','Production','mj.kim@nexielibrary.com'],
['Lĩ Xiāopéng','Producer','Production','xp.li@nexielibrary.com'],
['Lucca Kingsley','Choreographer','Performance','l.kingsley@nexielibrary.com'],
['Lim Min-seo','Head of A&R','Artist Operations','ms.lim@nexielibrary.com'],
['Maizie Alarcón','Head of Artist Operations','Artist Operations','m.alarcon@nexielibrary.com'],
['Cho Eun-ji','Marketing','Brand & Marketing','ej.cho@nexielibrary.com'],
['Seo Jin-woo','PR','Brand & Marketing','jw.seo@nexielibrary.com'],
['Arthur Vega','Tech Lead / Engineering Manager','Technology','a.vega@nexielibrary.com'],
['Isabella Mendoza','UI/UX Developer','Technology','i.mendoza@nexielibrary.com'],
['Eduarda Barroso','Frontend Developer','Technology','e.barroso@nexielibrary.com'],
['Eun-Woo','Frontend Developer','Technology','eunwoo@nexielibrary.com'],
['Joshua Thorne','Security Engineer','Technology','j.thorne@nexielibrary.com'],
['Kaelen','Backend Developer','Technology','kaelen@nexielibrary.com'],
['Jung Sung-min','Team member','Gatherverse','sm.jung@gatherverse.com'],
['Chen Ziyi','Team member','Gatherverse','zy.chen@gatherverse.com'],
['Min-jun Kwak','Team member','Gatherverse','mj.kwak@gatherverse.com'],
['Kwon Eun-seon','Team member','Gatherverse','es.kwon@gatherverse.com'],
['Park Hyeon-woo','Team member','Gatherverse','hw.park@gatherverse.com'],
['Aoi Sato','Team member','Gatherverse','a.sato@gatherverse.com'],
['Park Si-w','Team member','Gatherverse','sw.park@gatherverse.com']
];
const artists=[];
const teams=['Creative Direction','Production','Artist Operations','Image & Styling','Performance','Brand & Marketing','Technology','People & Culture','Legal','Finance','Executive','Gatherverse'];
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem('nexie_'+k))??d}catch{return d}};
const save=(k,v)=>localStorage.setItem('nexie_'+k,JSON.stringify(v));
let tasks=[];
let messages=[];
let directory=[];
let teamRecords=[];
let teamMembers=[];
let ticketRecords=[];
let realtimeChannel=null;
let active='overview', search='', filter='Todos', current=null, profile=null, chatOpen=false;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initials=s=>String(s||'NX').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
const me=()=>profile?[profile.full_name,profile.job_title,profile.department]:people.find(p=>p[0]===current)||people[0];
const canSee=t=>!current||t.assignee===current||t.createdBy===current||t.team===me()[2]||me()[2]==='Executive';
const visibleTasks=()=>tasks.filter(canSee);
const logo='<img class="brand-logo" src="/nexie-logo.svg" alt="N·EXIE LIBRARY">';
function shell(){return `<aside class="sidebar"><div class="brand"><div class="brand-symbol">N</div><div><b>N·EXIE</b><small>CREATIVE ARCHIVE</small></div></div><div class="side-label">WORKSPACE</div><nav>${[['overview','⌂','Overview'],['newfile','＋','New Project'],['tasks','▤','My Dashboard'],['people','♙','Team']].map(([id,ic,l])=>`<button class="nav ${active===id?'selected':''}" data-page="${id}"><i>${ic}</i>${l}</button>`).join('')}</nav><div class="side-bottom"><div class="side-note">PRIVATE WORKSPACE<br><b>N·EXIE GROUP</b></div><div class="profile"><div class="avatar">${initials(current||'NX')}</div><div><b>${esc(current||'Workspace guest')}</b><small>${esc(me()[1])}</small></div><button class="switch-user" id="switchUser">⌄</button></div></div></aside><main class="main"><header><div class="crumb">N·EXIE Library <span>/</span> ${({overview:'Overview',tasks:'My dashboard',newfile:'New Project',artists:'Artists',people:'People & Teams',chat:'Messages',support:'IT Support'})[active]}</div><div class="header-right"><span class="workspace-user">My workspace / ${esc(current||'N·EXIE')}</span><div class="avatar small">${initials(current||'NX')}</div></div></header><section id="content"></section><button class="chat-float" id="helpBtn" aria-label="Abrir chat de suporte"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-5.2A7.5 7.5 0 1 1 20 11.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 11.5h8M8 14.5h5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button><footer>© N·EXIE GROUP. ALL RIGHTS RESERVED. <span>PRIVATE WORKSPACE · CREATIVE ARCHIVE</span></footer></main>`;}
function overview(){return `<div class="home-intro"><div class="eyebrow">THE N·EXIE CREATIVE HOUSE</div><h1>A home for<br>every story.</h1><p>A considered space for the ideas, identities and creative work shaping our universe. Explore the archive from the parent company to the artists and worlds within it.</p></div><div class="archive-banner"><div><small>N·EXIE / ARCHIVE SYSTEM</small><span>EST. 2026</span></div><strong>N·X</strong><div class="archive-foot">IDEAS INTO LEGACY <span>001 — 026</span></div></div><div class="library-heading"><div><div class="eyebrow">CONNECTED SPACES</div><h2>Explore the libraries</h2><p>Three connected spaces. One creative universe.</p></div><button class="text-action" data-page="artists">VIEW ALL LIBRARIES ↗</button></div><div class="library-search"><span>⌕</span><input id="librarySearch" placeholder="Search libraries, documents, artists..."><select><option>Recently updated</option><option>Name A–Z</option></select></div><div class="library-tabs">ALL LIBRARIES <span>/</span> ALL COLLECTIONS</div><div class="library-grid"><button class="library-card" data-page="people"><div class="library-cover"><b>N·EXIE</b></div><div class="library-meta"><b>N·EXIE</b><small>PARENT COMPANY<br>Creative direction · Operations · Archive</small></div></button><button class="library-card" data-page="artists"><div class="library-cover zhy"><b>ZHYT<br>SONG</b></div><div class="library-meta"><b>ZHYT SONG</b><small>MUSIC LABEL — N·EXIE<br>Artist operations · Music · Performance</small></div></button><button class="library-card compact-card" data-page="tasks"><div class="library-cover"><b>A.X.S.</b></div><div class="library-meta"><b>A.X.S. / ARTISTS</b><small>ARTIST ROSTER<br>Creative projects and releases</small></div></button></div>`;}
function taskRow(t){return `<div class="task-row"><div class="task-icon">▤</div><div class="task-info"><b>${esc(t.title)}</b><small>${esc(t.artist)} · ${esc(t.team)} · Responsável: ${esc(t.assignee)}</small></div><span class="status ${t.status==='Concluído'?'done':t.status==='Em revisão'?'review':''}">${esc(t.status)}</span><span class="priority">${esc(t.priority)}</span>${t.assignee===current||profile?.email==="admin@nexielibrary.com"?`<button class="more" data-edit="${t.id}">Fazer</button>`:""}</div>`;}
function tasksPage(){let list=visibleTasks().filter(t=>(filter==='Todos'||t.status===filter)&&JSON.stringify(t).toLowerCase().includes(search.toLowerCase()));return `<div class="page-title"><div class="eyebrow">PERSONAL PRODUCTION PIPELINE</div><h1>My dashboard</h1><p>Trabalhos atribuídos a você, criados por você ou direcionados à sua equipe.</p></div><div class="toolbar"><input id="search" placeholder="⌕ Buscar trabalho..." value="${esc(search)}"><select id="filter">${['Todos','A fazer','Em andamento','Em revisão','Revisão solicitada','Concluído','Cancelado'].map(x=>`<option ${filter===x?'selected':''}>${x}</option>`).join('')}</select><button class="primary" data-page="newfile">＋ New file</button></div><div class="task-list">${list.map(taskRow).join('')||'<div class="empty">Nenhum trabalho disponível para este perfil.</div>'}</div>`;}
function newFile(){return `<div class="page-title"><div class="eyebrow">WORKSPACE / NEW PROJECT</div><h1>New Project</h1><p>Create a project, choose its library destination and assign the delivery to an active teammate.</p></div><div class="step-tabs"><span class="active">01 / PROJECT DETAILS</span><span>02 / ASSIGNMENT</span><span>03 / DESTINATION</span></div><div class="form-panel"><div class="panel-head"><div><small>01 / PROJECT INFORMATION</small><h2>Project brief</h2></div><span>REQUIRED</span></div><form id="taskForm"><label>Project name<input name="title" required placeholder="Project title"></label><label>Creative brief / instructions<textarea name="description" rows="4" required placeholder="Describe the objective, expected delivery and references..."></textarea></label><div class="two"><label>Library<select name="library" required><option>N·EXIE</option><option>ZHYT SONG</option><option>A.X.S.</option></select></label><label>Collection<input name="collection" placeholder="Collection name"></label></div><div class="two"><label>New folder (optional)<input name="folder_name" placeholder="Create a folder"></label><label>Target team<select name="team"><option value="">No team selected</option>${[...new Set([...teams,...teamRecords.map(t=>t.name)])].map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select></label></div><div class="panel-head second"><div><small>02 / ASSIGN THE WORK</small><h2>Who will receive this task?</h2></div></div><div class="two"><label>Responsible person<select name="assignee" required>${directory.filter(p=>p.account_status==='active').map(p=>`<option value="${esc(p.id)}" ${p.id===profile?.id?'selected':''}>${esc(p.full_name)} — ${esc(p.job_title)}</option>`).join('')}</select></label><label>Collaborate with (optional)<select name="collaborator"><option value="">No additional collaborator</option>${directory.filter(p=>p.id!==profile?.id&&p.account_status==='active').map(p=>`<option value="${esc(p.id)}">${esc(p.full_name)} — ${esc(p.job_title)}</option>`).join('')}</select></label></div><div class="two"><label>Task format<select name="single_person"><option value="yes">One responsible person</option><option value="no">Shared collaboration</option></select></label><label>Delivery date<input name="due" type="date"></label></div><div class="form-actions"><button type="button" class="text-action" data-page="overview">CANCEL</button><button class="primary">Create project ↗</button></div></form></div>`;}
function peoplePage(){return teamPage();}
function teamPage(){return `<div class="page-title"><div class="eyebrow">PEOPLE / COLLABORATION</div><h1>Team</h1><p>Create working groups and organize the people collaborating on each delivery.</p></div>${profile?.email==='admin@nexielibrary.com'?`<div class="form-panel admin-provision-panel"><div class="panel-head"><div><small>PRIMARY ADMINISTRATOR ONLY</small><h2>Create an employee account</h2></div><span>${people.filter(p=>!directory.some(d=>d.email===p[3])).length} PENDING</span></div><p class="note">Create each employee account with a unique initial password. Employees keep the password issued by IT; password changes are disabled for standard accounts.</p><form id="employeeProvisionForm"><label>EMPLOYEE<select name="email" required>${people.filter(p=>!directory.some(d=>d.email===p[3])).map(p=>`<option value="${esc(p[3])}">${esc(p[0])} — ${esc(p[1])}</option>`).join('')}</select></label><label>INITIAL PASSWORD<input name="password" type="password" minlength="12" autocomplete="new-password" required placeholder="At least 12 characters"></label><div class="form-actions"><button class="primary">Create employee account ↗</button></div></form></div>`:''}${profile?.email==='admin@nexielibrary.com'?`<div class="form-panel employee-management-panel"><div class="panel-head"><div><small>PRIMARY ADMINISTRATOR / ACCOUNT CONTROL</small><h2>Manage employee accounts</h2></div></div><div class="employee-admin-list">${directory.filter(p=>p.email!=='admin@nexielibrary.com').map(p=>`<article class="employee-admin-card" data-employee-card data-user-id="${esc(p.id)}"><div class="employee-admin-head"><div><b>${esc(p.full_name)}</b><small>${esc(p.email)}</small></div><span class="status">${esc(p.account_status)}</span></div><div class="two"><label>JOB TITLE<input name="job_title" value="${esc(p.job_title)}"></label><label>DEPARTMENT<input name="department" value="${esc(p.department)}"></label></div><label>ACCOUNT STATUS<select name="account_status"><option value="active" ${p.account_status==='active'?'selected':''}>Active</option><option value="suspended" ${p.account_status==='suspended'?'selected':''}>Suspended</option></select></label><label>NEW INITIAL PASSWORD<input name="initial_password" type="password" minlength="12" autocomplete="new-password" placeholder="Only if resetting (12+ characters)"></label><div class="employee-admin-actions"><button type="button" class="text-action" data-employee-action="update_role">Save role</button><button type="button" class="text-action" data-employee-action="set_status">Save status</button><button type="button" class="primary" data-employee-action="reset_password">Reset password</button></div></article>`).join('')||'<div class="empty">No employee accounts created yet.</div>'}</div></div>`:''}<div class="form-panel"><div class="panel-head"><div><small>NEW WORKING GROUP</small><h2>Create a team</h2></div></div><form id="teamForm"><label>Team name<input name="name" required maxlength="80" placeholder="e.g. Visual Development"></label><label>Description<textarea name="description" rows="2" placeholder="Purpose and responsibilities"></textarea></label><label>Team members<select name="members" multiple size="5">${directory.filter(p=>p.id!==profile?.id).map(p=>`<option value="${esc(p.id)}">${esc(p.full_name)} — ${esc(p.job_title)}</option>`).join('')}</select></label><small class="note">You will automatically be added as the team leader.</small><div class="form-actions"><button class="primary">Create team ↗</button></div></form></div><div class="team-grid-live">${teamRecords.map(t=>{const members=teamMembers.filter(m=>m.team_id===t.id);return `<article class="team-live-card"><div class="eyebrow">WORKING GROUP</div><h2>${esc(t.name)}</h2><p>${esc(t.description||'')}</p><div class="team-live-foot">${members.length} member(s) <span>${t.created_by===profile?.id?'CREATED BY YOU':''}</span></div><div class="team-live-members">${members.map(m=>esc(directory.find(p=>p.id===m.employee_id)?.full_name||'Member')).join(' · ')}</div></article>`;}).join('')||'<div class="empty">No teams have been created yet.</div>'}</div>`}
function artistsPage(){return `<div class="page-title"><div class="eyebrow">ARTIST LIBRARIES</div><h1>Artist libraries</h1><p>Artist profiles and creative archives will appear here when they are officially registered.</p></div><div class="empty">No artist profiles have been registered yet.</div>`;}
function chatPage(){let mine=messages.filter(m=>m.from===current||m.to===current||me()[2]==='Technology');return `<div class="page-title"><div class="eyebrow">INTERNAL COMMUNICATION</div><h1>Mensagens</h1><p>Conversa de trabalho e solicitações internas. Prévia local neste dispositivo.</p></div><div class="support-card"><div class="chat-log">${mine.map(m=>`<div class="chat-message"><b>${esc(m.from)} → ${esc(m.to)}</b><p>${esc(m.text)}</p><small>${new Date(m.at).toLocaleString('pt-BR')}</small></div>`).join('')||'<div class="empty">Nenhuma mensagem nesta prévia.</div>'}</div><form id="chatForm"><label>DESTINATÁRIO<select name="to">${people.filter(p=>p[0]!==current).map(p=>`<option>${esc(p[0])}</option>`).join('')}</select></label><label>MENSAGEM<textarea name="text" required rows="3" placeholder="Escreva sua mensagem..."></textarea></label><button class="primary">Enviar mensagem</button></form></div>`;}
function supportPage(){return `<div class="page-title"><div class="eyebrow">N·EXIE / PRIVATE SERVICE DESK</div><h1>Support tickets</h1><p>Open a private ticket to contact a teammate or request technical support. Conversations stay attached to each ticket.</p></div><div class="support-card"><div class="support-icon">✳</div><h2>Open a new ticket</h2><form id="supportForm"><label>WHO SHOULD HELP?<select name="recipient"><option value="nixie">Nixie — help me find the right person</option><option value="andressa">Andressa Correia</option><option value="it">IT team</option><option value="general">General request</option></select></label><label>SUBJECT<input name="subject" required placeholder="What do you need help with?"></label><label>CATEGORY<select name="type"><option>Creative project</option><option>Access and permissions</option><option>Technical issue</option><option>Security incident</option><option>General question</option></select></label><label>MESSAGE<textarea name="message" required rows="5" placeholder="Describe your request and any relevant details..."></textarea></label><button class="primary">Open private ticket ↗</button></form><small class="note">Your request and replies are stored in your private workspace.</small></div><div class="ticket-list"><div class="panel-head"><div><small>YOUR CONVERSATIONS</small><h2>Open and recent tickets</h2></div></div>${ticketRecords.map(t=>`<button class="ticket-row" data-ticket="${t.id}"><span class="ticket-dot"></span><span class="ticket-row-info"><b>${esc(t.subject)}</b><small>${esc(t.category)} · ${new Date(t.created_at).toLocaleDateString('pt-BR')}</small></span><span class="status">${esc(t.status)}</span></button>`).join('')||'<div class="empty">No tickets yet.</div>'}</div>`}
async function ticketDialog(id){
  const {data:ticket,error}=await supabase.from('support_tickets').select('*').eq('id',id).maybeSingle();
  if(error||!ticket){alert('Este chamado não está disponível para sua conta.');return;}
  const {data:messages}=await supabase.from('ticket_messages').select('*').eq('ticket_id',id).order('created_at');
  const modal=document.createElement('div');modal.className='modal-back';
  const thread=(messages||[]).map(m=>`<div class="ticket-message ${m.sender_id===profile.id?'mine':''}"><b>${esc(directory.find(p=>p.id===m.sender_id)?.full_name||'N·EXIE Team')}</b><p>${esc(m.message)}</p><small>${new Date(m.created_at).toLocaleString('pt-BR')}</small></div>`).join('');
  modal.innerHTML=`<section class="modal ticket-modal"><button type="button" class="close" id="closeTicket">×</button><div class="eyebrow">PRIVATE TICKET / ${esc(ticket.status)}</div><h2>${esc(ticket.subject)}</h2><p>${esc(ticket.category)} · ${esc(ticket.routing_target)}</p><div class="ticket-thread"><div class="ticket-message"><b>${esc(directory.find(p=>p.id===ticket.requester_id)?.full_name||'You')}</b><p>${esc(ticket.message)}</p><small>${new Date(ticket.created_at).toLocaleString('pt-BR')}</small></div>${thread||'<div class="empty">No replies yet.</div>'}</div><form id="ticketReply"><label>YOUR REPLY<textarea name="message" required rows="3" placeholder="Write a reply..."></textarea></label><button class="primary">Send reply</button></form></section>`;
  document.body.append(modal);$('#closeTicket').onclick=()=>modal.remove();
  $('#ticketReply').onsubmit=async e=>{e.preventDefault();const message=new FormData(e.target).get('message');const button=e.submitter;button.disabled=true;const {error}=await supabase.from('ticket_messages').insert({ticket_id:id,sender_id:profile.id,message});if(error){alert('Could not send your reply.');button.disabled=false;return;}modal.remove();ticketDialog(id);};
}
async function loadProjectAssets(projectId){
  const target=$('#assetList');if(!target||!projectId)return;
  const {data,error}=await supabase.storage.from('nexie-library-assets').list(projectId,{limit:100,sortBy:{column:'created_at',order:'desc'}});
  if(error){target.textContent='Could not load project files.';return;}
  if(!data?.length){target.innerHTML='<div class="empty">No files uploaded to this project yet.</div>';return;}
  target.innerHTML=data.map(file=>`<button type="button" class="asset-file" data-asset-name="${esc(file.name)}"><span>▧</span><b>${esc(file.name)}</b><small>${Math.round((file.metadata?.size||0)/1024)} KB</small></button>`).join('');
  target.querySelectorAll('[data-asset-name]').forEach(button=>button.onclick=async()=>{const {data:link,error}=await supabase.storage.from('nexie-library-assets').createSignedUrl(projectId+'/'+button.dataset.assetName,300);if(error||!link?.signedUrl){alert('Could not open this file.');return;}window.open(link.signedUrl,'_blank','noopener');});
}
function taskDialog(id){
  let t=tasks.find(x=>x.id===id)||{};
  const job=profile?.job_title||'';
  let tools=['Project brief','Working notes','Delivery checklist'];
  if(/creative|artistic|beauty|fashion|image/i.test(job))tools=['Visual references','Concept development','Art direction checklist','Approval notes'];
  else if(/produc|choreograph|artist operations|a&r/i.test(job))tools=['Production plan','Asset checklist','Schedule and milestones','Delivery log'];
  else if(/tech|developer|engineer|cto/i.test(job))tools=['Technical specification','Implementation notes','Quality assurance checklist','Release notes'];
  else if(/marketing|brand|pr/i.test(job))tools=['Campaign brief','Copy and messaging','Publication checklist','Performance notes'];
  const modal=document.createElement('div');modal.className='modal-back';
  modal.innerHTML=`<form class="modal development-modal" id="editTask"><button type="button" class="close" id="close">×</button><div class="eyebrow">TASK DETAIL / DEVELOPMENT SPACE</div><h2>${esc(t.title)}</h2><p>Responsible: ${esc(t.assignee)} · Assigned by: ${esc(t.createdBy||'—')} · Due: ${esc(t.due||'Not set')}</p><p>Library: ${esc(t.library||'—')} · Collection: ${esc(t.collection||'—')} · Folder: ${esc(t.folder||'—')}</p><div class="development-tools"><small>WORK TOOLS / ${esc(job||'CREATIVE WORKSPACE')}</small><div>${tools.map(x=>`<span>${esc(x)}</span>`).join('')}</div></div><div class="task-instructions"><small>PROJECT BRIEF / INSTRUCTIONS</small><p>${esc(t.description||'No additional instructions.')}</p></div><div class="asset-panel"><div><small>PROJECT LIBRARY / FILES</small><b>Shared project assets</b></div><input id="assetUpload" type="file" multiple><div id="assetList" class="asset-list">Loading files…</div></div><label>PROGRESS STATUS<select name="status">${['A fazer','Em andamento','Em revisão','Revisão solicitada','Concluído','Cancelado'].map(x=>`<option ${t.status===x?'selected':''}>${x}</option>`).join('')}</select></label><label>WORK NOTES / DELIVERY DETAILS<textarea name="submission_notes" rows="6" placeholder="Record progress, links, decisions and final delivery details...">${esc(t.submission_notes||'')}</textarea></label><div class="modal-actions"><button class="text-action" type="submit" value="save">Save progress</button><button class="primary" type="submit" value="deliver">Submit delivery ↗</button></div></form>`;
  document.body.append(modal);$('#close').onclick=()=>modal.remove();
  loadProjectAssets(t.project_id);
  $('#assetUpload')?.addEventListener('change',async e=>{const files=[...e.target.files||[]];if(!t.project_id||!files.length)return;const input=e.target;input.disabled=true;for(const file of files){const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const path=t.project_id+'/'+crypto.randomUUID()+'-'+safeName;const {error}=await supabase.storage.from('nexie-library-assets').upload(path,file,{contentType:file.type||'application/octet-stream',upsert:false});if(error){alert('Upload failed for '+file.name+': '+error.message);break;}}input.value='';input.disabled=false;await loadProjectAssets(t.project_id);});
  $('#editTask').onsubmit=async e=>{
    e.preventDefault();
    const d=Object.fromEntries(new FormData(e.target));
    const statusMap={'A fazer':'assigned','Em andamento':'in_progress','Em revisão':'submitted','Revisão solicitada':'revision','Concluído':'approved','Cancelado':'cancelled'};
    const delivering=e.submitter?.value==='deliver';
    const update={status:delivering?'submitted':(statusMap[d.status]||'in_progress'),submission_notes:d.submission_notes};
    if(delivering)update.submitted_at=new Date().toISOString();
    const {error}=await supabase.from('tasks').update(update).eq('id',id);
    if(error){alert('Could not save this update.');return;}
    modal.remove();await loadWorkspaceData();render();
  };
}
function render(){const c=$('#content');const pages={overview,tasks:tasksPage,newfile:newFile,artists:artistsPage,people:teamPage,chat:chatPage,support:supportPage};c.innerHTML=pages[active]();document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{active=b.dataset.page;search='';render()});const s=$('#search');if(s)s.oninput=e=>{search=e.target.value;const pos=s.selectionStart;render();$('#search').focus();$('#search').setSelectionRange(pos,pos)};const f=$('#filter');if(f)f.onchange=e=>{filter=e.target.value;render()};document.querySelectorAll('[data-ticket]').forEach(b=>b.onclick=()=>ticketDialog(b.dataset.ticket));document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>taskDialog(b.dataset.edit));const tf=$('#taskForm');if(tf)tf.onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(tf));const assignee=directory.find(p=>p.id===d.assignee);if(!assignee){alert('Selecione uma pessoa com conta ativa.');return;}const collaborator=directory.find(p=>p.id===d.collaborator);const button=tf.querySelector('button.primary');if(button)button.disabled=true;const {data:project,error:projectError}=await supabase.from('projects').insert({name:d.title,library:d.library,collection:d.collection||null,folder_name:d.folder_name||null,brief:d.description,target_team:d.team,collaborator_ids:collaborator?[collaborator.id]:[],is_single_person:d.single_person==='yes',created_by:profile.id,owner_id:assignee.id,due_date:d.due||null,status:'active'}).select('id').single();if(projectError||!project){alert('Não foi possível criar o projeto. Verifique suas permissões e tente novamente.');if(button)button.disabled=false;return;}const taskAssignees=[assignee.id,...(collaborator&&collaborator.id!==assignee.id?[collaborator.id]:[])];const taskRows=taskAssignees.map(assignee_id=>({project_id:project.id,title:d.title,instructions:d.description,assigned_by:profile.id,assignee_id,due_date:d.due||null,status:'assigned'}));const {error:taskError}=await supabase.from('tasks').insert(taskRows);if(taskError){alert('O projeto foi salvo, mas uma ou mais tarefas não foram criadas. Contate o administrador.');if(button)button.disabled=false;return;}await loadWorkspaceData();active='tasks';render();};const provisionForm=$('#employeeProvisionForm');if(provisionForm)provisionForm.onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(provisionForm));const person=people.find(p=>p[3]===d.email);if(!person||d.password.length<12){alert('Selecione um funcionário e use uma senha de pelo menos 12 caracteres.');return;}const button=provisionForm.querySelector('button');if(button)button.disabled=true;const {data,error}=await supabase.functions.invoke('admin-provision-employee',{body:{email:person[3],full_name:person[0],job_title:person[1],department:person[2],initial_password:d.password}});if(error||data?.error){alert(data?.error||error?.message||'Não foi possível criar a conta.');if(button)button.disabled=false;return;}provisionForm.reset();await loadWorkspaceData();render();alert('Conta criada. Guarde e entregue a senha por um canal privado.');};document.querySelectorAll('[data-employee-action]').forEach(b=>b.onclick=async()=>{const card=b.closest('[data-employee-card]');const action=b.dataset.employeeAction;const body={user_id:card.dataset.userId,action};if(action==='update_role'){body.job_title=card.querySelector('[name="job_title"]').value;body.department=card.querySelector('[name="department"]').value;}if(action==='set_status')body.account_status=card.querySelector('[name="account_status"]').value;if(action==='reset_password'){body.initial_password=card.querySelector('[name="initial_password"]').value;if(!body.initial_password||body.initial_password.length<12){alert('Informe uma senha inicial de pelo menos 12 caracteres.');return;}}b.disabled=true;const {data,error}=await supabase.functions.invoke('admin-manage-employee',{body});if(error||data?.error){alert(data?.error||error?.message||'Não foi possível atualizar a conta.');b.disabled=false;return;}await loadWorkspaceData();render();alert(action==='reset_password'?'Senha redefinida. A nova senha já está válida.':'Conta atualizada.');});const teamForm=$('#teamForm');if(teamForm)teamForm.onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(teamForm));const selected=[...teamForm.querySelector('[name="members"]').selectedOptions].map(o=>o.value).filter(id=>id!==profile.id);const button=teamForm.querySelector('button');if(button)button.disabled=true;const {data:team,error}=await supabase.from('teams').insert({name:d.name.trim(),description:d.description||'',created_by:profile.id}).select('id').single();if(error||!team){alert('Não foi possível criar a equipe. Confira se já existe uma equipe com esse nome.');if(button)button.disabled=false;return;}const members=[{team_id:team.id,employee_id:profile.id,team_role:'leader'},...selected.map(employee_id=>({team_id:team.id,employee_id,team_role:'member'}))];const {error:memberError}=await supabase.from('team_members').insert(members);if(memberError){alert('Equipe criada, mas não foi possível adicionar todos os integrantes.');}await loadWorkspaceData();render();};const sf=$('#supportForm');if(sf)sf.onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(sf));let assignedTo=null;if(d.recipient==='andressa')assignedTo=directory.find(p=>p.email==='a.correia@nexielibrary.com'&&p.account_status==='active')?.id||null;if(d.recipient==='it')assignedTo=directory.find(p=>p.email==='dh.lee@nexielibrary.com'&&p.account_status==='active')?.id||null;if(d.recipient==='general')assignedTo='3424810e-b872-43b2-98c7-803e33e671ec';if(d.recipient==='nixie'){const routeDepartment=d.type==='Creative project'?'Creative Direction':d.type==='General question'?'Executive':'Technology';assignedTo=directory.find(p=>p.department===routeDepartment&&p.id!==profile.id&&p.account_status==='active')?.id||'3424810e-b872-43b2-98c7-803e33e671ec';}const button=sf.querySelector('button');if(button)button.disabled=true;const {error}=await supabase.from('support_tickets').insert({requester_id:profile.id,subject:d.subject,category:d.type,message:d.message,status:'open',routing_target:d.recipient,assigned_to:assignedTo});if(error){alert('Não foi possível registrar o chamado. Tente novamente.');if(button)button.disabled=false;return;}await loadWorkspaceData();render();};const cf=$('#chatForm');if(cf)cf.onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(cf));messages.push({...d,from:current||'Workspace',at:new Date().toISOString()});save('messages',messages);render()};}
function accountDialog(){
  if(document.querySelector('.login-screen')) return;
  const modal=document.createElement('div');
  modal.className='login-screen';
  modal.innerHTML=`<div class="login-photo"><div class="photo-brand">N·EXIE<br><span>LIBRARY</span></div><div class="photo-bottom">Secure. Organize. Create.<br>All N·EXIE assets, in one place.</div></div><div class="login-panel"><div class="login-form"><div class="login-mark">N·EXIE <span>LIBRARY</span></div><h1>Welcome to N·EXIE LIBRARY</h1><p>Secure employee access.<br>Staff Only</p><form id="accountForm"><label>Email address<input name="email" type="email" autocomplete="username" required placeholder="Work email address"></label><label>Password<input name="password" type="password" autocomplete="current-password" required placeholder="Password"></label><button class="login-submit">Login</button><p id="loginError" role="alert" style="color:#a22;min-height:18px"></p><div class="login-help">Need access? Contact the primary administrator.</div></form></div><footer>© N·EXIE Co., Ltd. All rights reserved.</footer></div>`;
  document.body.append(modal);
  $('#accountForm').onsubmit=async e=>{
    e.preventDefault();
    const button=e.submitter;
    button.disabled=true;
    $('#loginError').textContent='Authenticating…';
    const data=Object.fromEntries(new FormData(e.target));
    const {data:authData,error}=await supabase.auth.signInWithPassword({email:data.email,password:data.password});
    if(error||!authData.user){
      $('#loginError').textContent='Unable to sign in. Check your credentials or contact the administrator.';
      button.disabled=false;
      return;
    }
    const {data:record,error:profileError}=await supabase.from('employee_profiles').select('*').eq('id',authData.user.id).maybeSingle();
    if(profileError||!record||record.account_status!=='active'){
      await supabase.auth.signOut();
      $('#loginError').textContent='This account is not active. Contact the primary administrator.';
      button.disabled=false;
      return;
    }
    profile=record;
    current=record.full_name;
    await loadWorkspaceData();
    modal.remove();
    if(record.must_change_password){ await supabase.from('employee_profiles').update({must_change_password:false}).eq('id',record.id); record.must_change_password=false; }
    startRealtimeNotifications();
    render();
  };
}
function forcePasswordChange(){
  const modal=document.createElement('div');
  modal.className='modal-back';
  modal.innerHTML=`<form class="modal" id="firstPasswordForm"><div class="eyebrow">ACCOUNT SECURITY / FIRST ACCESS</div><h2>Set your personal password</h2><p>For security, you must replace the initial password before entering the workspace. Use at least 12 characters.</p><label>Current initial password<input name="current_password" type="password" autocomplete="current-password" required></label><label>New password<input name="password" type="password" minlength="12" autocomplete="new-password" required></label><label>Confirm new password<input name="confirm" type="password" minlength="12" autocomplete="new-password" required></label><p id="passwordError" role="alert" style="color:#a22;min-height:18px"></p><div class="modal-actions"><button class="primary">Save new password</button></div></form>`;
  document.body.append(modal);
  $('#firstPasswordForm').onsubmit=async e=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(e.target));
    if(data.password.length<12){$('#passwordError').textContent='Use at least 12 characters.';return;}
    if(data.password!==data.confirm){$('#passwordError').textContent='The passwords do not match.';return;}
    const button=e.submitter;button.disabled=true;
    const {error}=await supabase.auth.updateUser({password:data.password,currentPassword:data.current_password});
    if(error){$('#passwordError').textContent=error.message;button.disabled=false;return;}
    const {error:completeError}=await supabase.from('employee_profiles').update({must_change_password:false}).eq('id',profile.id);
    if(completeError){$('#passwordError').textContent='Password changed, but the first-access confirmation failed. Please contact the administrator.';button.disabled=false;return;}
    profile={...profile,must_change_password:false};
    await loadWorkspaceData();
    startRealtimeNotifications();
    modal.remove();
    render();
  };
}
function startRealtimeNotifications(){
  if(realtimeChannel) supabase.removeChannel(realtimeChannel);
  if(!profile) return;
  realtimeChannel=supabase.channel('nexie-ticket-notifications-'+profile.id)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'tasks',filter:'assignee_id=eq.'+profile.id},async payload=>{
      await loadWorkspaceData();
      alert('A new project task has been assigned to you.');
    })
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'support_tickets',filter:'assigned_to=eq.'+profile.id},async payload=>{
      await loadWorkspaceData();
      alert('A new support ticket has been assigned to you.');
    })
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'ticket_messages'},async payload=>{
      if(payload.new.sender_id!==profile.id){
        await loadWorkspaceData();
        alert('There is a new reply in one of your support tickets.');
      }
    })
    .subscribe();
}
async function loadWorkspaceData(){
  const {data:teamRows}=await supabase.from('teams').select('*').order('name');
  const {data:memberRows}=await supabase.from('team_members').select('*');
  teamRecords=teamRows||[];
  teamMembers=memberRows||[];

  let staffQuery=supabase.from('employee_profiles').select('id,email,full_name,job_title,department,account_status').order('full_name');if(profile?.email!=='admin@nexielibrary.com')staffQuery=staffQuery.eq('account_status','active');const {data:staff,error:staffError}=await staffQuery;
  if(!staffError) directory=staff||[];
  const {data:ticketRows}=await supabase.from('support_tickets').select('*').order('created_at',{ascending:false});
  ticketRecords=ticketRows||[];
  const {data:rows,error:taskError}=await supabase.from('tasks').select('id,title,instructions,assigned_by,assignee_id,status,due_date,project_id,submission_notes,projects(name,library,collection,folder_name,brief,target_team)').order('created_at',{ascending:false});
  if(!taskError){
    const statusLabels={assigned:'A fazer',in_progress:'Em andamento',submitted:'Em revisão',revision:'Revisão solicitada',approved:'Concluído',cancelled:'Cancelado'};
    tasks=(rows||[]).map(t=>({id:t.id,title:t.title,artist:t.projects?.library||'N·EXIE',team:t.projects?.target_team||'Team',assignee:directory.find(p=>p.id===t.assignee_id)?.full_name||'Team member',createdBy:directory.find(p=>p.id===t.assigned_by)?.full_name||'Team member',status:statusLabels[t.status]||t.status,priority:'Normal',due:t.due_date||'',description:t.instructions||'',submission_notes:t.submission_notes||'',library:t.projects?.library||'',collection:t.projects?.collection||'',folder:t.projects?.folder_name||'',projectBrief:t.projects?.brief||'',project_id:t.project_id,submission_notes:t.submission_notes||''}));
  }
}
async function restoreAuthentication(){
  const {data,error}=await supabase.auth.getSession();
  if(error||!data.session){accountDialog();return;}
  const {data:record,error:profileError}=await supabase.from('employee_profiles').select('*').eq('id',data.session.user.id).maybeSingle();
  if(profileError||!record||record.account_status!=='active'){
    await supabase.auth.signOut();accountDialog();return;
  }
  profile=record;current=record.full_name;
  await loadWorkspaceData();
  if(record.must_change_password){await supabase.from('employee_profiles').update({must_change_password:false}).eq('id',record.id);record.must_change_password=false;}
  startRealtimeNotifications();
  render();
}
document.querySelector('#app').innerHTML=shell();render();
$('#helpBtn')?.addEventListener('click',()=>{active='support';render()});
$('#switchUser')?.addEventListener('click',async()=>{await supabase.auth.signOut();if(realtimeChannel)supabase.removeChannel(realtimeChannel);realtimeChannel=null;profile=null;current=null;accountDialog()});
restoreAuthentication();
supabase.auth.onAuthStateChange((event,session)=>{
  if(event==='SIGNED_OUT'&&!session){profile=null;current=null;if(!document.querySelector('.login-screen'))accountDialog();}
});
