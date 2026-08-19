const enc=new TextEncoder();
function b64u(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function unb64(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const bin=atob(s);return Uint8Array.from(bin,c=>c.charCodeAt(0));}
async function sign(v,secret){const k=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return b64u(new Uint8Array(await crypto.subtle.sign('HMAC',k,enc.encode(v))));}
export async function makeSession(env,user){const p=b64u(enc.encode(JSON.stringify({u:user,e:Date.now()+86400000})));return `${p}.${await sign(p,env.ADMIN_SESSION_SECRET||env.ADMIN_PASSWORD)}`;}
export async function isAdmin(request,env){const c=request.headers.get('Cookie')||'';const m=c.match(/AWE_ADMIN=([^;]+)/);if(!m)return false;const [p,s]=m[1].split('.');if(!p||!s)return false;const expected=await sign(p,env.ADMIN_SESSION_SECRET||env.ADMIN_PASSWORD);if(s!==expected)return false;try{return JSON.parse(new TextDecoder().decode(unb64(p))).e>Date.now();}catch{return false;}}
export function cookie(v,max=86400){return `AWE_ADMIN=${v}; Path=/; Max-Age=${max}; HttpOnly; Secure; SameSite=Strict`}
export function clearCookie(){return 'AWE_ADMIN=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict'}
