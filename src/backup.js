import{exportAllData,importAllData}from"./db";
export async function exportBackup(ownerEmail){
  try{
    const data=await exportAllData(ownerEmail);const json=JSON.stringify(data,null,2);
    const blob=new Blob([json],{type:"application/json"});
    const fn="obras-backup-"+new Date().toISOString().slice(0,10)+".json";
    if(navigator.share&&navigator.canShare){
      try{const file=new File([blob],fn,{type:"application/json"});const sd={files:[file],title:"Backup ObrasControle"};if(navigator.canShare(sd)){await navigator.share(sd);return{success:true,method:"share"}}}catch(shareErr){if(shareErr.name==="AbortError")return{success:false,cancelled:true}}
    }
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=fn;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
    return{success:true,method:"download"};
  }catch(err){if(err.name==="AbortError")return{success:false,cancelled:true};return{success:false,error:err.message}}
}
export function importBackupFile(){
  return new Promise(resolve=>{
    const input=document.createElement("input");input.type="file";input.accept=".json";
    input.onchange=async e=>{const file=e.target.files?.[0];if(!file){resolve({success:false});return}
      try{const text=await file.text();const data=JSON.parse(text);
        if(data.appName!=="ObrasControle"){resolve({success:false,error:"Arquivo inválido"});return}
        resolve({success:true,data,info:{date:data.exportDate?new Date(data.exportDate).toLocaleDateString("pt-BR"):"?",obras:data.obras?.length||0,gastos:data.gastos?.length||0,etapas:data.etapas?.length||0,pagamentos:data.pagamentos?.length||0,diario:data.diario?.length||0}});
      }catch{resolve({success:false,error:"Arquivo corrompido"})}
    };input.click();
  });
}
export async function confirmImport(data){try{await importAllData(data);return{success:true}}catch(err){return{success:false,error:err.message}}}
