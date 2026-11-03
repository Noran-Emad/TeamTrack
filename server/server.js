// TeamTrack server. Uses Supabase when configured; JSON file is for local development only.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),PUBLIC_DIR=path.join(ROOT,'dist'),DATA_DIR=path.join(ROOT,'data'),DB_FILE=path.join(DATA_DIR,'teamtrack.json');
const PORT=Number(process.env.PORT||3000),BOOTSTRAP_KEY=process.env.TEAMTRACK_ADMIN_KEY||'';
const SUPABASE_URL=(process.env.SUPABASE_URL||'').replace(/\/$/,''),SUPABASE_KEY=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'';
const REMOTE=!!(SUPABASE_URL&&SUPABASE_KEY),SESSION_SECRET=process.env.TEAMTRACK_SESSION_SECRET||(REMOTE?'':crypto.randomBytes(32).toString('hex'));
if(REMOTE&&!SESSION_SECRET)throw new Error('Set TEAMTRACK_SESSION_SECRET when using Supabase.');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
fs.mkdirSync(DATA_DIR,{recursive:true});
let store=fs.existsSync(DB_FILE)?JSON.parse(fs.readFileSync(DB_FILE,'utf8')):{users:[],classroom:null};
function localPersist(){if(!REMOTE)fs.writeFileSync(DB_FILE,JSON.stringify(store,null,2),'utf8')}
async function remoteRequest(table,query='',options={}){const response=await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`,{method:options.method||'GET',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json',Prefer:options.prefer||'return=representation'},...(options.body?{body:JSON.stringify(options.body)}:{})});if(!response.ok)throw new Error(`Database error (${response.status}): ${await response.text()}`);return response.json().catch(()=>[])}
async function persist(){localPersist();if(!REMOTE)return;const users=store.users.map(u=>({id:u.id,name:u.name,email:u.email,role:u.role,password_hash:u.passwordHash,created_at:u.createdAt}));await remoteRequest('teamtrack_users','?on_conflict=id',{method:'POST',body:users,prefer:'resolution=merge-duplicates,return=minimal'});if(store.classroom)await remoteRequest('teamtrack_classroom','?on_conflict=id',{method:'POST',body:{id:'main',state:store.classroom,updated_at:new Date().toISOString()},prefer:'resolution=merge-duplicates,return=minimal'})}
async function loadRemote(){if(!REMOTE)return;const [users,classrooms]=await Promise.all([remoteRequest('teamtrack_users','?select=*'),remoteRequest('teamtrack_classroom','?select=state&id=eq.main')]);store.users=users.map(u=>({id:u.id,name:u.name,email:u.email,role:u.role,passwordHash:u.password_hash,createdAt:u.created_at}));store.classroom=classrooms[0]?.state||null}
function send(res,status,payload,headers={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'no-store',...headers});res.end(JSON.stringify(payload))}
function readBody(req){return new Promise((resolve,reject)=>{let raw='';req.on('data',c=>{raw+=c;if(raw.length>2_000_000){reject(new Error('Request too large'));req.destroy()}});req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{})}catch{reject(new Error('Invalid JSON'))}});req.on('error',reject)})}
function cookie(req,name){const p=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'='));return p?decodeURIComponent(p.slice(name.length+1)):''}
function makeSession(user){const payload=Buffer.from(JSON.stringify({id:user.id,exp:Date.now()+7*24*60*60*1000})).toString('base64url');const sig=crypto.createHmac('sha256',SESSION_SECRET).update(payload).digest('base64url');return `${payload}.${sig}`}
function sessionUser(req){try{const [payload,sig]=cookie(req,'teamtrack_session').split('.');if(!payload||!sig)return null;const expected=crypto.createHmac('sha256',SESSION_SECRET).update(payload).digest(),actual=Buffer.from(sig,'base64url');if(expected.length!==actual.length||!crypto.timingSafeEqual(expected,actual))return null;const session=JSON.parse(Buffer.from(payload,'base64url').toString());if(session.exp<Date.now())return null;return store.users.find(u=>u.id===session.id)||null}catch{return null}}
function cookieHeader(value,maxAge=604800){return `teamtrack_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${process.env.NODE_ENV==='production'?'; Secure':''}`}
function safeUser(u){return {id:u.id,name:u.name,email:u.email,role:u.role,createdAt:u.createdAt}}
function passwordHash(password,salt=crypto.randomBytes(16).toString('hex')){return new Promise((resolve,reject)=>crypto.scrypt(password,salt,64,(e,key)=>e?reject(e):resolve(`${salt}:${key.toString('hex')}`)))}
async function passwordMatches(password,stored){const [salt,hex]=stored.split(':');const value=await passwordHash(password,salt),a=Buffer.from(value.split(':')[1],'hex'),b=Buffer.from(hex,'hex');return a.length===b.length&&crypto.timingSafeEqual(a,b)}
function validEmail(value){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value||'')}
function staticFile(url,res){
  let pathname;
  try{pathname=decodeURIComponent(new URL(url,'http://localhost').pathname)}catch{return send(res,400,{error:'Bad request'})}
  if(pathname.includes('\0'))return send(res,400,{error:'Bad request'});
  if(pathname==='/')pathname='/index.html';
  const full=path.resolve(PUBLIC_DIR,'.'+pathname);
  if(!full.startsWith(PUBLIC_DIR+path.sep))return send(res,404,{error:'Not found'});
  const serve=(file,bytes)=>{res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':path.extname(file)==='.html'?'no-cache':'public, max-age=3600'});res.end(bytes)};
  fs.readFile(full,(err,bytes)=>{
    if(!err)return serve(full,bytes);
    if(path.extname(full))return send(res,404,{error:'Not found'});
    const index=path.join(PUBLIC_DIR,'index.html');
    fs.readFile(index,(e2,b2)=>e2?send(res,404,{error:'Not found'}):serve(index,b2));
  });
}const server=http.createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith('/api/'))return staticFile(req.url,res);try{
  if(req.method==='GET'&&url.pathname==='/api/health')return send(res,200,{ok:true,accounts:store.users.length,database:REMOTE?'supabase':'local'});
  if(req.method==='POST'&&url.pathname==='/api/auth/register'){const b=await readBody(req),name=String(b.name||'').trim(),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');if(name.length<2||!validEmail(email)||password.length<10)return send(res,400,{error:'Enter a name, valid email, and password of at least 10 characters.'});if(store.users.some(u=>u.email===email))return send(res,409,{error:'An account with that email already exists.'});const admin=!!BOOTSTRAP_KEY&&b.adminKey===BOOTSTRAP_KEY&&!store.users.some(u=>u.role==='admin');const user={id:crypto.randomUUID(),name,email,role:admin?'admin':'teacher',passwordHash:await passwordHash(password),createdAt:new Date().toISOString()};store.users.push(user);await persist();return send(res,201,{user:safeUser(user)},{'Set-Cookie':cookieHeader(makeSession(user))})}
  if(req.method==='POST'&&url.pathname==='/api/auth/login'){const b=await readBody(req),email=String(b.email||'').trim().toLowerCase(),user=store.users.find(u=>u.email===email);if(!user||!await passwordMatches(String(b.password||''),user.passwordHash))return send(res,401,{error:'Email or password is incorrect.'});return send(res,200,{user:safeUser(user)},{'Set-Cookie':cookieHeader(makeSession(user))})}
  if(req.method==='POST'&&url.pathname==='/api/auth/logout')return send(res,200,{ok:true},{'Set-Cookie':cookieHeader('',0)});
  if(req.method==='GET'&&url.pathname==='/api/auth/me'){const u=sessionUser(req);return u?send(res,200,{user:safeUser(u)}):send(res,401,{error:'Sign in required.'})}
  const user=sessionUser(req);if(!user)return send(res,401,{error:'Sign in required.'});
  if(req.method==='GET'&&url.pathname==='/api/state')return send(res,200,{state:store.classroom||null});
  if(req.method==='PUT'&&url.pathname==='/api/state'){const b=await readBody(req);if(!b.state||typeof b.state!=='object')return send(res,400,{error:'State object is required.'});store.classroom=b.state;await persist();return send(res,200,{ok:true})}
  if(url.pathname==='/api/admin/users'){if(user.role!=='admin')return send(res,403,{error:'Administrator access required.'});if(req.method==='GET')return send(res,200,{users:store.users.map(safeUser)});if(req.method==='PATCH'){const b=await readBody(req),target=store.users.find(u=>u.id===b.id);if(!target)return send(res,404,{error:'Account not found.'});if(target.id===user.id&&b.role!=='admin')return send(res,400,{error:'You cannot remove your own administrator role.'});if(!['admin','teacher'].includes(b.role))return send(res,400,{error:'Role must be admin or teacher.'});target.role=b.role;await persist();return send(res,200,{user:safeUser(target)})}}
  return send(res,404,{error:'API route not found.'});
}catch(error){console.error(error);return send(res,error.message==='Request too large'?413:500,{error:REMOTE?'The server could not save to the database. Check its Supabase settings.':error.message||'Request failed.'})}});
loadRemote().then(()=>server.listen(PORT,()=>console.log(`TeamTrack is available on port ${PORT}${REMOTE?' (Supabase connected)':''}`))).catch(error=>{console.error('Could not load Supabase data:',error.message);process.exit(1)});
