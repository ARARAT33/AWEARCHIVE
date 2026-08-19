function cleanSlug(value){return String(value||'').trim().replace(/^\/+|\/+$/g,'')}
export async function getItem(request,slug){
  try{
    const r=await fetch(new URL('/data/archive.json',request.url).toString(),{headers:{accept:'application/json'}});
    if(!r.ok)return null;
    const data=await r.json();
    const key=cleanSlug(slug);
    return Array.isArray(data)?data.find(x=>x&&x.status!=='hidden'&&cleanSlug(x.slug)===key)||null:null;
  }catch{return null}
}
export async function proxySource(item,request,disposition='inline'){
  const source=item?.url||item?.source_url;
  if(!source)return new Response('Source unavailable',{status:404});
  const range=request.headers.get('range');
  const h={}; if(range)h.Range=range;
  const r=await fetch(source,{headers:h,redirect:'follow'});
  const out=new Headers();
  for(const k of ['content-type','content-length','content-range','accept-ranges','etag','last-modified','cache-control']){const v=r.headers.get(k);if(v)out.set(k,v)}
  out.set('content-disposition',`${disposition}; filename="${String(item.title||'archive').replace(/[\r\n"\\]/g,'_')}"`);
  out.set('x-content-source','AWEARCHIVE');
  return new Response(r.body,{status:r.status,headers:out});
}
