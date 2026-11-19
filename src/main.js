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
const artists=['Ryu Soo-min','Nyla Black','Kang Tae-oh','Han Joo-won'];
const teams=['Creative Direction','Production','Artist Operations','Image & Styling','Performance','Brand & Marketing','Technology','People & Culture','Legal','Finance','Executive','Gatherverse'];
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem('nexie_'+k))??d}catch{return d}};
const save=(k,v)=>localStorage.setItem('nexie_'+k,JSON.stringify(v));
let tasks=[];
let messages=[];
let directory=[];
let active='overview', search='', filter='Todos', current=null, profile=null, chatOpen=false;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initials=s=>String(s||'NX').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
const me=()=>profile?[profile.full_name,profile.job_title,profile.department]:people.find(p=>p[0]===current)||people[0];
const canSee=t=>!current||t.assignee===current||t.createdBy===current||t.team===me()[2]||me()[2]==='Executive';
const visibleTasks=()=>tasks.filter(canSee);
const logo='<img class="brand-logo" src="/nexie-logo.svg" alt="N·EXIE LIBRARY">';
function shell(){return `<aside class="sidebar"><div class="brand"><div class="brand-symbol">N</div><div><b>N·EXIE</b><small>CREATIVE ARCHIVE</small></div></div><div class="side-label">WORKSPACE</div><nav>${[['overview','⌂','Overview'],['newfile','＋','New Project'],['tasks','▤','My Dashboard'],['people','♙','Team']].map(([id,ic,l])=>`<button class="nav ${active===id?'selected':''}" data-page="${id}"><i>${ic}</i>${l}</button>`).join('')}</nav><div class="side-bottom"><div class="side-note">PRIVATE WORKSPACE<br><b>N·EXIE GROUP</b></div><div class="profile"><div class="avatar">${initials(current||'NX')}</div><div><b>${esc(current||'Workspace guest')}</b><small>${esc(me()[1])}</small></div><button class="switch-user" id="switchUser">⌄</button></div></div></aside><main class="main"><header><div class="crumb">N·EXIE Library <span>/</span> ${({overview:'Overview',tasks:'My dashboard',newfile:'New Project',artists:'Artists',people:'People & Teams',chat:'Messages',support:'IT Support'})[active]}</div><div class="header-right"><span class="workspace-user">My workspace / ${esc(current||'N·EXIE')}</span><div class="avatar small">${initials(current||'NX')}</div></div></header><section id="content"></section><footer>© N·EXIE GROUP. ALL RIGHTS RESERVED. <span>PRIVATE WORKSPACE · CREATIVE ARCHIVE</span></footer></main>`;}
function overview(){let list=visibleTasks(),open=list.filter(t=>t.status!=='Concluído').length,done=list.filter(t=>t.status==='Concluído').length;return `<div class="home-intro"><div class="eyebrow">THE N·EXIE CREATIVE HOUSE</div><h1>A home for<br>every story.</h1><p>A considered space for the ideas, identities and creative work shaping our universe. Explore the archive from the parent company to the artists and worlds within it.</p><div class="home-actions"><button class="primary" data-page="newfile">＋ Create new project</button><button class="text-action" data-page="tasks">VIEW MY DASHBOARD ↗</button></div></div><div class="archive-banner"><div><small>N·EXIE / ARCHIVE SYSTEM</small><span>EST. 2026</span></div><strong>N·X</strong><div class="archive-foot">IDEAS INTO LEGACY <span>001 — 026</span></div></div><div class="library-heading"><div><div class="eyebrow">CONNECTED SPACES</div><h2>Explore the libraries</h2><p>Three connected spaces. One creative universe.</p></div><button class="text-action" data-page="artists">VIEW ALL LIBRARIES ↗</button></div><div class="library-search"><span>⌕</span><input id="librarySearch" placeholder="Search libraries, documents, artists..."><select><option>Recently updated</option><option>Name A–Z</option></select></div><div class="library-tabs">ALL LIBRARIES <span>/</span> ALL COLLECTIONS</div><div class="library-grid"><button class="library-card" data-page="people"><div class="library-cover"><b>N·EXIE</b></div><div class="library-meta"><b>N·EXIE</b><small>PARENT COMPANY<br>Creative direction · Operations · Archive</small></div></button><button class="library-card" data-page="artists"><div class="library-cover zhy"><b>ZHYT<br>SONG</b></div><div class="library-meta"><b>ZHYT SONG</b><small>MUSIC LABEL — N·EXIE<br>Artist operations · Music · Performance</small></div></button><button class="library-card compact-card" data-page="tasks"><div class="library-cover"><b>A.X.S.</b></div><div class="library-meta"><b>A.X.S. / ARTISTS</b><small>ARTIST ROSTER<br>Creative projects and releases</small></div></button></div><div class="dashboard-strip"><div><div class="eyebrow">YOUR WORKSPACE</div><h2>Production at a glance</h2></div><div class="mini-stats"><span><b>${open}</b> Active</span><span><b>${done}</b> Completed</span><span><b>${people.length}</b> Members</span></div><button class="primary" data-page="tasks">Open dashboard ↗</button></div><div class="recent-list">${list.slice(0,3).map(taskRow).join('')}</div><button class="chat-float" id="helpBtn" aria-label="Support">●</button>`;}
function taskRow(t){return `<div class="task-row"><div class="task-icon">▤</div><div class="task-info"><b>${esc(t.title)}</b><small>${esc(t.artist)} · ${esc(t.team)} · Responsável: ${esc(t.assignee)}</small></div><span class="status ${t.status==='Concluído'?'done':t.status==='Em revisão'?'review':''}">${esc(t.status)}</span><span class="priority">${esc(t.priority)}</span><button class="more" data-edit="${t.id}">•••</button></div>`;}
function tasksPage(){let list=visibleTasks().filter(t=>(filter==='Todos'||t.status===filter)&&JSON.stringify(t).toLowerCase().includes(search.toLowerCase()));return `<div class="page-title"><div class="eyebrow">PERSONAL PRODUCTION PIPELINE</div><h1>My dashboard</h1><p>Trabalhos atribuídos a você, criados por você ou direcionados à sua equipe.</p></div><div class="toolbar"><input id="search" placeholder="⌕ Buscar trabalho..." value="${esc(search)}"><select id="filter">${['Todos','A fazer','Em andamento','Em revisão','Concluído'].map(x=>`<option ${filter===x?'selected':''}>${x}</option>`).join('')}</select><button class="primary" data-page="newfile">＋ New file</button></div><div class="task-list">${list.map(taskRow).join('')||'<div class="empty">Nenhum trabalho disponível para este perfil.</div>'}</div>`;}
function newFile(){return `<div class="page-title"><div class="eyebrow">WORKSPACE / NEW PROJECT</div><h1>New Project</h1><p>Create a project, choose its library destination and assign the delivery to an active teammate.</p></div><div class="step-tabs"><span class="active">01 / PROJECT DETAILS</span><span>02 / ASSIGNMENT</span><span>03 / DESTINATION</span></div><div class="form-panel"><div class="panel-head"><div><small>01 / PROJECT INFORMATION</small><h2>Project brief</h2></div><span>REQUIRED</span></div><form id="taskForm"><label>Project name<input name="title" required placeholder="Project title"></label><label>Creative brief / instructions<textarea name="description" rows="4" required placeholder="Describe the objective, expected delivery and references..."></textarea></label><div class="two"><label>Library<select name="library" required><option>N·EXIE</option><option>ZHYT SONG</option><option>A.X.S.</option></select></label><label>Collection<input name="collection" placeholder="Collection name"></label></div><div class="two"><label>New folder (optional)<input name="folder_name" placeholder="Create a folder"></label><label>Target team<select name="team">${teams.map(t=>`<option>${esc(t)}</option>`).join('')}</select></label></div><div class="panel-head second"><div><small>02 / ASSIGN THE WORK</small><h2>Who will receive this task?</h2></div></div><div class="two"><label>Responsible person<select name="assignee" required>${directory.map(p=>`<option value="${esc(p.id)}" ${p.id===profile?.id?'selected':''}>${esc(p.full_name)} — ${esc(p.job_title)}</option>`).join('')}</select></label><label>Collaborate with (optional)<select name="collaborator"><option value="">No additional collaborator</option>${directory.filter(p=>p.id!==profile?.id).map(p=>`<option value="${esc(p.id)}">${esc(p.full_name)} — ${esc(p.job_title)}</option>`).join('')}</select></label></div><div class="two"><label>Task format<select name="single_person"><option value="yes">One responsible person</option><option value="no">Shared collaboration</option></select></label><label>Delivery date<input name="due" type="date"></label></div><div class="form-actions"><button type="button" class="text-action" data-page="overview">CANCEL</button><button class="primary">Create project ↗</button></div></form></div><button class="chat-float" id="helpBtn">●</button>`;}
function peoplePage(){let list=people.filter(p=>p.join(' ').toLowerCase().includes(search.toLowerCase()));return `<div class="page-title"><div class="eyebrow">PEOPLE DIRECTORY</div><h1>Team</h1><p>Estrutura organizacional N·EXIE / Gatherverse.</p></div><div class="toolbar"><input id="search" placeholder="⌕ Buscar pessoa, cargo ou equipe..." value="${esc(search)}"><span class="count">${list.length} pessoas</span></div><div class="people-grid">${list.map(p=>`<article class="person"><div class="avatar">${initials(p[0])}</div><div><b>${esc(p[0])}</b><p>${esc(p[1])}</p><small>${esc(p[2])}</small></div></article>`).join('')}</div><h2 class="team-heading">Equipes por especialidade</h2><div class="team-grid">${teams.map((x,i)=>`<div class="team-card"><span>0${i+1}</span><b>${x}</b><small>${people.filter(p=>p[2]===x).length} integrantes</small></div>`).join('')}</div>`;}
function artistsPage(){return `<div class="page-title"><div class="eyebrow">ARTIST ROSTER</div><h1>Artistas</h1><p>Roster A.X.S. e trabalhos relacionados.</p></div><div class="artist-grid">${artists.map((a,i)=>`<article class="artist"><div class="artist-number">0${i+1} / A.X.S.</div><div class="artist-monogram">${initials(a)}</div><h2>${esc(a)}</h2><span>ARTIST · N·EXIE</span><div class="artist-foot">Projetos visíveis <b>${visibleTasks().filter(t=>t.artist===a||t.artist==='A.X.S.').length}</b></div></article>`).join('')}</div>`;}
function chatPage(){let mine=messages.filter(m=>m.from===current||m.to===current||me()[2]==='Technology');return `<div class="page-title"><div class="eyebrow">INTERNAL COMMUNICATION</div><h1>Mensagens</h1><p>Conversa de trabalho e solicitações internas. Prévia local neste dispositivo.</p></div><div class="support-card"><div class="chat-log">${mine.map(m=>`<div class="chat-message"><b>${esc(m.from)} → ${esc(m.to)}</b><p>${esc(m.text)}</p><small>${new Date(m.at).toLocaleString('pt-BR')}</small></div>`).join('')||'<div class="empty">Nenhuma mensagem nesta prévia.</div>'}</div><form id="chatForm"><label>DESTINATÁRIO<select name="to">${people.filter(p=>p[0]!==current).map(p=>`<option>${esc(p[0])}</option>`).join('')}</select></label><label>MENSAGEM<textarea name="text" required rows="3" placeholder="Escreva sua mensagem..."></textarea></label><button class="primary">Enviar mensagem</button></form></div>`;}
function supportPage(){return `<div class="page-title"><div class="eyebrow">N·EXIE IT SERVICE DESK</div><h1>Suporte TI</h1><p>Abra um chamado com a equipe de tecnologia e segurança.</p></div><div class="support-card"><div class="support-icon">✳</div><h2>Como podemos ajudar?</h2><p>Registre o problema com detalhes para facilitar a triagem. O chamado será registrado no sistema para triagem da equipe responsável.</p><form id="supportForm"><label>ASSUNTO<input name="subject" required placeholder="Ex.: Acesso ao workspace"></label><label>CATEGORIA<select name="type"><option>Problema técnico</option><option>Acesso e permissões</option><option>Solicitação de melhoria</option><option>Segurança / incidente</option></select></label><label>DESCRIÇÃO<textarea name="message" required rows="5" placeholder="O que aconteceu? Quando começou? Qual o impacto?"></textarea></label><button class="primary">Preparar chamado ↗</button></form><small class="note">Os chamados são privados e ficam associados à sua conta.</small></div>`;}
function taskDialog(id){let t=tasks.find(x=>x.id===id)||{};const modal=document.createElement('div');modal.className='modal-back';modal.innerHTML=`<form class="modal" id="editTask"><button type="button" class="close" id="close">×</button><div class="eyebrow">TASK DETAIL</div><h2>${esc(t.title)}</h2><p>Responsável: ${esc(t.assignee)} · Criado por: ${esc(t.createdBy||'—')}</p><label>STATUS<select name="status">${['A fazer','Em andamento','Em revisão','Concluído'].map(x=>`<option ${t.status===x?'selected':''}>${x}</option>`).join('')}</select></label><label>OBSERVAÇÕES / DEVOLUTIVA<textarea name="description" rows="5">${esc(t.description||'')}</textarea></label><div class="modal-actions"><button class="primary">Salvar atualização</button></div></form>`;document.body.append(modal);$('#close').onclick=()=>modal.remove();$('#editTask').onsubmit=e=>{e.preventDefault();let d=Object.fromEntries(new FormData(e.target));tasks=tasks.map(x=>x.id===id?{...x,...d}:x);save('tasks',tasks);modal.remove();render();};}
function render(){const c=$('#content');const pages={overview,tasks:tasksPage,newfile:newFile,artists:artistsPage,people:peoplePage,chat:chatPage,support:supportPage};c.innerHTML=pages[active]();document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{active=b.dataset.page;search='';render()});const s=$('#search');if(s)s.oninput=e=>{search=e.target.value;const pos=s.selectionStart;render();$('#search').focus();$('#search').setSelectionRange(pos,pos)};const f=$('#filter');if(f)f.onchange=e=>{filter=e.target.value;render()};document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>taskDialog(Number(b.dataset.edit)));const tf=$('#taskForm');if(tf)tf.onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(tf));const assignee=directory.find(p=>p.id===d.assignee);if(!assignee){alert('Selecione uma pessoa com conta ativa.');return;}const collaborator=directory.find(p=>p.id===d.collaborator);const button=tf.querySelector('button.primary');if(button)button.disabled=true;const {data:project,error:projectError}=await supabase.from('projects').insert({name:d.title,library:d.library,collection:d.collection||null,folder_name:d.folder_name||null,brief:d.description,target_team:d.team,collaborator_ids:collaborator?[collaborator.id]:[],is_single_person:d.single_person==='yes',created_by:profile.id,owner_id:assignee.id,due_date:d.due||null,status:'active'}).select('id').single();if(projectError||!project){alert('Não foi possível criar o projeto. Verifique suas permissões e tente novamente.');if(button)button.disabled=false;return;}const {error:taskError}=await supabase.from('tasks').insert({project_id:project.id,title:d.title,instructions:d.description,assigned_by:profile.id,assignee_id:assignee.id,due_date:d.due||null,status:'assigned'});if(taskError){alert('O projeto foi salvo, mas a tarefa não foi criada. Contate o administrador.');if(button)button.disabled=false;return;}await loadWorkspaceData();active='tasks';render();};const sf=$('#supportForm');if(sf)sf.onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(sf));const button=sf.querySelector('button');if(button)button.disabled=true;const {error}=await supabase.from('support_tickets').insert({requester_id:profile.id,subject:d.subject,category:d.type,message:d.message,status:'open'});if(error){alert('Não foi possível registrar o chamado. Tente novamente.');if(button)button.disabled=false;return;}sf.innerHTML='<p class="success-message">Chamado registrado. A equipe responsável fará a triagem.</p>';};const cf=$('#chatForm');if(cf)cf.onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(cf));messages.push({...d,from:current||'Workspace',at:new Date().toISOString()});save('messages',messages);render()};}
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
    if(record.must_change_password){ forcePasswordChange(); return; }
    render();
  };
}
function forcePasswordChange(){
  const modal=document.createElement('div');
  modal.className='modal-back';
  modal.innerHTML=`<form class="modal" id="firstPasswordForm"><div class="eyebrow">ACCOUNT SECURITY / FIRST ACCESS</div><h2>Set your personal password</h2><p>For security, you must replace the initial password before entering the workspace. Use at least 12 characters.</p><label>New password<input name="password" type="password" minlength="12" autocomplete="new-password" required></label><label>Confirm new password<input name="confirm" type="password" minlength="12" autocomplete="new-password" required></label><p id="passwordError" role="alert" style="color:#a22;min-height:18px"></p><div class="modal-actions"><button class="primary">Save new password</button></div></form>`;
  document.body.append(modal);
  $('#firstPasswordForm').onsubmit=async e=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(e.target));
    if(data.password.length<12){$('#passwordError').textContent='Use at least 12 characters.';return;}
    if(data.password!==data.confirm){$('#passwordError').textContent='The passwords do not match.';return;}
    const button=e.submitter;button.disabled=true;
    const {error}=await supabase.auth.updateUser({password:data.password});
    if(error){$('#passwordError').textContent=error.message;button.disabled=false;return;}
    const {error:completeError}=await supabase.rpc('complete_first_login_password_change');
    if(completeError){$('#passwordError').textContent='Password changed, but the first-access confirmation failed. Please contact the administrator.';button.disabled=false;return;}
    profile={...profile,must_change_password:false};
    modal.remove();
    render();
  };
}
async function loadWorkspaceData(){
  const {data:staff,error:staffError}=await supabase.from('employee_profiles').select('id,email,full_name,job_title,department,account_status').eq('account_status','active').order('full_name');
  if(!staffError) directory=staff||[];
  const {data:rows,error:taskError}=await supabase.from('tasks').select('id,title,instructions,assigned_by,assignee_id,status,due_date,project_id,projects(name,library,target_team)').order('created_at',{ascending:false});
  if(!taskError){
    const statusLabels={assigned:'A fazer',in_progress:'Em andamento',submitted:'Em revisão',revision:'Revisão solicitada',approved:'Concluído',cancelled:'Cancelado'};
    tasks=(rows||[]).map(t=>({id:t.id,title:t.title,artist:t.projects?.library||'N·EXIE',team:t.projects?.target_team||'Team',assignee:directory.find(p=>p.id===t.assignee_id)?.full_name||'Team member',createdBy:directory.find(p=>p.id===t.assigned_by)?.full_name||'Team member',status:statusLabels[t.status]||t.status,priority:'Normal',due:t.due_date||'',description:t.instructions||'',project_id:t.project_id}));
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
  if(record.must_change_password){forcePasswordChange();return;}
  render();
}
document.querySelector('#app').innerHTML=shell();render();
$('#helpBtn')?.addEventListener('click',()=>{active='support';render()});
$('#switchUser')?.addEventListener('click',async()=>{await supabase.auth.signOut();profile=null;current=null;accountDialog()});
restoreAuthentication();
supabase.auth.onAuthStateChange((event,session)=>{
  if(event==='SIGNED_OUT'&&!session){profile=null;current=null;if(!document.querySelector('.login-screen'))accountDialog();}
});
