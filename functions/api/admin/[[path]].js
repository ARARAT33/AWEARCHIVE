import {isAdmin,makeSession,cookie,clearCookie} from '../../_shared/auth.js';
import {readRepoFile,writeRepoFile} from '../../_shared/github.js';

const out=(data,status=200,headers={})=>Response.json(data,{status,headers});

export async function onRequest(context){
  const req=context.request;
  const env=context.env;
  const rawPath=context.params?.path;
  const path=Array.isArray(rawPath)?rawPath.join('/'):String(rawPath||'');

  if(req.method==='OPTIONS'){
    return new Response(null,{status:204,headers:{'Allow':'GET,POST,PUT,DELETE,OPTIONS'}});
  }

  if(req.method==='POST'&&path==='login'){
    const body=await req.json().catch(()=>null);
    const username=typeof body?.username==='string'?body.username:'';
    const password=typeof body?.password==='string'?body.password:'';

    // Keep the Cloudflare Secret names exactly as configured by the owner.
    if(typeof env.ADMIN_USERNAME!=='string'||typeof env.ADMIN_PASSWORD!=='string'||typeof env.ADMIN_SESSION_SECRET!=='string'){
      return out({error:'Admin authentication is not configured for this deployment'},503);
    }

    // Username/password are intentionally compared exactly. Do not trim or normalize passwords.
    if(username!==env.ADMIN_USERNAME||password!==env.ADMIN_PASSWORD){
      return out({error:'Invalid credentials'},401);
    }

    const session=await makeSession(env,username);
    return out({ok:true},200,{'Set-Cookie':cookie(session)});
  }

  if(req.method==='POST'&&path==='logout'){
    return out({ok:true},200,{'Set-Cookie':clearCookie()});
  }

  if(!await isAdmin(req,env))return out({error:'Unauthorized'},401);

  if(req.method==='GET'){
    const f=await readRepoFile(env,'data/archive.json');
    return out({ok:true,admin:true,items:Array.isArray(f.data)?f.data:[]});
  }

  const f=await readRepoFile(env,'data/archive.json');
  let items=Array.isArray(f.data)?f.data:[];

  if(req.method==='PUT'){
    const x=await req.json().catch(()=>null);
    if(!x||!x.title||!x.url||!x.type)return out({error:'title, url and type are required'},400);
    x.id=x.id||crypto.randomUUID();
    x.slug=x.slug||x.id.toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'');
    x.tags=Array.isArray(x.tags)?x.tags:[];
    x.status=x.status||'active';
    const now=new Date().toISOString();
    const i=items.findIndex(a=>a.id===x.id);
    if(i>=0){
      x.createdAt=items[i].createdAt||now;
      items[i]={...items[i],...x,updatedAt:now};
    }else{
      items.unshift({...x,createdAt:now,updatedAt:now});
    }
    await writeRepoFile(env,'data/archive.json',items,f.sha,`admin: ${i>=0?'update':'add'} archive item ${x.slug}`);
    return out({ok:true,item:x});
  }

  if(req.method==='DELETE'){
    const body=await req.json().catch(()=>({}));
    if(!body.id)return out({error:'id required'},400);
    items=items.filter(x=>x.id!==body.id);
    await writeRepoFile(env,'data/archive.json',items,f.sha,`admin: delete archive item ${body.id}`);
    return out({ok:true});
  }

  return out({error:'Method not allowed'},405);
}
