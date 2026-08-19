import {getItem,proxySource} from '../_shared/archive.js';
export async function onRequest(context){const item=await getItem(context.request,context.params.slug);if(!item||!['image','video'].includes(item.type||item.item_type))return new Response('Not found',{status:404});return proxySource(item,context.request,'inline')}
