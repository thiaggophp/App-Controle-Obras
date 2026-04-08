import PocketBase from"pocketbase";
const PB_URL=import.meta.env.VITE_PB_URL||"https://api.financascasa.online";
export const pb=new PocketBase(PB_URL);

// ─── ACCOUNTS ───
export async function getAccount(email){try{return await pb.collection("obras_accounts").getFirstListItem(`email="${email}"`)}catch{return null}}
export async function getAllAccounts(){try{return await pb.collection("obras_accounts").getFullList()}catch{return[]}}
export async function saveAccount(acc){
  const existing=await pb.collection("obras_accounts").getFirstListItem(`email="${acc.email}"`).catch(()=>null);
  if(existing)return pb.collection("obras_accounts").update(existing.id,acc);
  return pb.collection("obras_accounts").create(acc);
}
export async function deleteAccount(email){try{const r=await pb.collection("obras_accounts").getFirstListItem(`email="${email}"`);await pb.collection("obras_accounts").delete(r.id)}catch{}}

// ─── SIGNUP REQUESTS ───
export async function getSignupRequests(){try{return await pb.collection("obras_signup_requests").getFullList()}catch{return[]}}
export async function addSignupRequest(req){
  const existing=await pb.collection("obras_signup_requests").getFirstListItem(`email="${req.email}"`).catch(()=>null);
  if(existing)return;
  await pb.collection("obras_signup_requests").create(req);
}
export async function deleteSignupRequest(email){try{const r=await pb.collection("obras_signup_requests").getFirstListItem(`email="${email}"`);await pb.collection("obras_signup_requests").delete(r.id)}catch{}}

// ─── OBRAS ───
export async function getObras(ownerEmail){try{return await pb.collection("obras_obras").getFullList({filter:`ownerEmail="${ownerEmail}"`,sort:"-dataInicio"})}catch{return[]}}
export async function saveObra(o){
  if(o.id)return pb.collection("obras_obras").update(o.id,o);
  const c=await pb.collection("obras_obras").create(o);o.id=c.id;return c;
}
export async function deleteObra(id){try{await pb.collection("obras_obras").delete(id)}catch{}}

// ─── GASTOS ───
export async function getGastos(obraId){try{return await pb.collection("obras_gastos").getFullList({filter:`obraId="${obraId}"`,sort:"-data"})}catch{return[]}}
export async function saveGasto(g){
  if(g.id)return pb.collection("obras_gastos").update(g.id,g);
  const c=await pb.collection("obras_gastos").create(g);g.id=c.id;return c;
}
export async function deleteGasto(id){try{await pb.collection("obras_gastos").delete(id)}catch{}}

// ─── ETAPAS ───
export async function getEtapas(obraId){try{return await pb.collection("obras_etapas").getFullList({filter:`obraId="${obraId}"`,sort:"ordem"})}catch{return[]}}
export async function saveEtapa(e){
  if(e.id)return pb.collection("obras_etapas").update(e.id,e);
  const c=await pb.collection("obras_etapas").create(e);e.id=c.id;return c;
}
export async function deleteEtapa(id){try{await pb.collection("obras_etapas").delete(id)}catch{}}

// ─── PAGAMENTOS ───
export async function getPagamentos(obraId){try{return await pb.collection("obras_pagamentos").getFullList({filter:`obraId="${obraId}"`,sort:"-data"})}catch{return[]}}
export async function savePagamento(p){
  if(p.id)return pb.collection("obras_pagamentos").update(p.id,p);
  const c=await pb.collection("obras_pagamentos").create(p);p.id=c.id;return c;
}
export async function deletePagamento(id){try{await pb.collection("obras_pagamentos").delete(id)}catch{}}

// ─── DIÁRIO ───
export async function getDiario(obraId){try{return await pb.collection("obras_diario").getFullList({filter:`obraId="${obraId}"`,sort:"-data"})}catch{return[]}}
export async function saveDiario(d){
  if(d.id)return pb.collection("obras_diario").update(d.id,d);
  const c=await pb.collection("obras_diario").create(d);d.id=c.id;return c;
}
export async function deleteDiario(id){try{await pb.collection("obras_diario").delete(id)}catch{}}

// ─── INIT ADMIN ───
export async function initAdmin(){
  // Admin account is created once via API — no credentials compiled into the bundle
}
