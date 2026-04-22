import{useState,useEffect}from"react";
import{getObras,saveObra,deleteObraCascade}from"../db";
import{Btn,Input,InputMoney,Select}from"../components/FormElements";
import Modal from"../components/Modal";

const STATUS=[{value:"andamento",label:"Em andamento"},{value:"pausada",label:"Pausada"},{value:"concluida",label:"Concluida"}];
const HOJE=new Date().toISOString().slice(0,10);
function fmtData(s){if(!s)return"";const[y,m,d]=s.split("-");return`${d}/${m}/${y}`}
function fmt(v){return(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}

export default function Obras({user,onAbrirObra}){
  const[obras,setObras]=useState([]);
  const[modal,setModal]=useState(false);const[deleteModal,setDeleteModal]=useState(null);
  const[edit,setEdit]=useState(null);const[filtro,setFiltro]=useState("andamento");
  const[form,setForm]=useState({nome:"",cliente:"",endereco:"",dataInicio:HOJE,dataPrevisao:"",orcamento:"",obs:""});

  const recarregar=async()=>setObras(await getObras(user.email));
  useEffect(()=>{recarregar()},[user.email]);
  useEffect(()=>{const s=localStorage.getItem("obras_obra_form");if(s)try{setForm(f=>({...f,...JSON.parse(s)}))}catch{}},[]);
  useEffect(()=>{if(!edit)try{localStorage.setItem("obras_obra_form",JSON.stringify(form))}catch{}},[form,edit]);

  const abrirNovo=()=>{setEdit(null);setForm({nome:"",cliente:"",endereco:"",dataInicio:HOJE,dataPrevisao:"",orcamento:"",obs:""});setModal(true)};
  const abrirEditar=(o)=>{setEdit(o);setForm({...o,orcamento:String(o.orcamento||"")});setModal(true)};

  const salvar=async()=>{
    if(!form.nome.trim())return;
    const o={...form,ownerEmail:user.email,status:form.status||"andamento",orcamento:parseFloat(form.orcamento)||0};
    if(edit)o.id=edit.id;
    await saveObra(o);localStorage.removeItem("obras_obra_form");setModal(false);await recarregar();
  };

  const excluir=async()=>{await deleteObraCascade(deleteModal.id);setDeleteModal(null);await recarregar()};

  const diasRestantes=(o)=>{
    if(!o.dataPrevisao)return null;
    return Math.floor((new Date(o.dataPrevisao+"T12:00")-new Date())/(1000*60*60*24));
  };

  const obrasFiltradas=obras.filter(o=>filtro==="todas"||o.status===filtro);

  return(<div style={{padding:"0 4px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <h2 style={{color:"#f1f5f9",margin:0,fontSize:20,fontWeight:700}}>Obras</h2>
      <button onClick={abrirNovo} style={{background:"linear-gradient(135deg,#d97706,#92400e)",border:"none",borderRadius:12,padding:"8px 16px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Nova Obra</button>
    </div>

    <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
      {[{v:"andamento",l:"Em andamento"},{v:"pausada",l:"Pausadas"},{v:"concluida",l:"Concluidas"},{v:"todas",l:"Todas"}].map(f=>
        <button key={f.v} onClick={()=>setFiltro(f.v)} style={{padding:"6px 14px",borderRadius:20,border:"none",background:filtro===f.v?"#d97706":"rgba(255,255,255,0.05)",color:filtro===f.v?"#fff":"#94a3b8",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>{f.l}</button>
      )}
    </div>

    {obrasFiltradas.map(o=>{
      const dias=diasRestantes(o);
      return(<div key={o.id} style={{background:"#1a110a",borderRadius:18,marginBottom:10,border:"1px solid rgba(255,255,255,0.06)",overflow:"hidden"}}>
        <div onClick={()=>onAbrirObra(o)} style={{padding:"16px",cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                <span style={{color:"#f1f5f9",fontWeight:700,fontSize:16}}>🏗️ {o.nome}</span>
                <span style={{background:o.status==="andamento"?"rgba(217,119,6,.15)":o.status==="concluida"?"rgba(59,130,246,.15)":"rgba(100,116,139,.15)",color:o.status==="andamento"?"#f59e0b":o.status==="concluida"?"#60a5fa":"#94a3b8",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>
                  {o.status==="andamento"?"Em andamento":o.status==="concluida"?"Concluida":"Pausada"}
                </span>
              </div>
              {o.cliente&&<div style={{color:"#64748b",fontSize:12}}>👤 {o.cliente}</div>}
              {o.endereco&&<div style={{color:"#475569",fontSize:11,marginTop:2}}>📍 {o.endereco}</div>}
              {o.orcamento>0&&<div style={{color:"#f59e0b",fontSize:12,marginTop:4,fontWeight:600}}>Orcamento: R$ {fmt(o.orcamento)}</div>}
              {o.dataInicio&&<div style={{color:"#475569",fontSize:11,marginTop:4}}>Inicio: {fmtData(o.dataInicio)}{o.dataPrevisao?" · Previsao: "+fmtData(o.dataPrevisao):""}</div>}
            </div>
            {dias!==null&&o.status==="andamento"&&<div style={{background:dias<0?"rgba(239,68,68,.1)":dias<7?"rgba(245,158,11,.1)":"rgba(217,119,6,.1)",borderRadius:12,padding:"8px 12px",textAlign:"center",flexShrink:0,marginLeft:8}}>
              <div style={{color:dias<0?"#ef4444":dias<7?"#f59e0b":"#fbbf24",fontSize:18,fontWeight:800}}>{Math.abs(dias)}</div>
              <div style={{color:"#64748b",fontSize:10}}>{dias<0?"atraso":"dias"}</div>
            </div>}
          </div>
        </div>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.04)",padding:"8px 16px",display:"flex",gap:8}}>
          <button onClick={()=>abrirEditar(o)} style={{background:"rgba(217,119,6,.08)",border:"1px solid rgba(217,119,6,.2)",borderRadius:8,padding:"5px 14px",color:"#f59e0b",fontSize:12,fontWeight:600,cursor:"pointer"}}>Editar</button>
          <button onClick={()=>setDeleteModal(o)} style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:8,padding:"5px 14px",color:"#ef4444",fontSize:12,fontWeight:600,cursor:"pointer"}}>Excluir</button>
        </div>
      </div>);
    })}

    {obrasFiltradas.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"#475569"}}>
      <div style={{fontSize:36,marginBottom:8}}>📋</div>
      <div style={{fontSize:14}}>Nenhuma obra {filtro==="andamento"?"em andamento":filtro==="concluida"?"concluida":""}</div>
    </div>}

    <Modal open={modal} onClose={()=>setModal(false)} title={edit?"Editar Obra":"Nova Obra"}>
      <Input label="Nome da obra" value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} placeholder="Ex: Reforma Casa Joao"/>
      <Input label="Cliente" value={form.cliente||""} onChange={e=>setForm({...form,cliente:e.target.value})} placeholder="Nome do cliente"/>
      <Input label="Endereco" value={form.endereco||""} onChange={e=>setForm({...form,endereco:e.target.value})} placeholder="Rua, numero, bairro..."/>
      <Input label="Data de inicio" type="date" value={form.dataInicio} onChange={e=>setForm({...form,dataInicio:e.target.value})}/>
      <Input label="Previsao de termino" type="date" value={form.dataPrevisao||""} onChange={e=>setForm({...form,dataPrevisao:e.target.value})}/>
      <InputMoney label="Orcamento (R$)" value={form.orcamento} onChange={e=>setForm({...form,orcamento:e.target.value})} placeholder="0,00"/>
      {edit&&<Select label="Status" value={form.status} onChange={e=>setForm({...form,status:e.target.value})} options={STATUS}/>}
      <Input label="Observacoes (opcional)" value={form.obs||""} onChange={e=>setForm({...form,obs:e.target.value})} placeholder="Detalhes adicionais..."/>
      <Btn onClick={salvar}>{edit?"Salvar Alteracoes":"Criar Obra"}</Btn>
    </Modal>

    <Modal open={!!deleteModal} onClose={()=>setDeleteModal(null)} title="Excluir obra">
      {deleteModal&&<>
        <p style={{color:"#94a3b8",fontSize:14,marginBottom:20,textAlign:"center"}}>Excluir a obra <strong style={{color:"#f1f5f9"}}>{deleteModal.nome}</strong>? Todos os dados vinculados serao perdidos.</p>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={()=>setDeleteModal(null)} color="rgba(255,255,255,0.06)" style={{flex:1,border:"1px solid rgba(255,255,255,0.08)",color:"#94a3b8"}}>Cancelar</Btn>
          <Btn onClick={excluir} color="linear-gradient(135deg,#ef4444,#dc2626)" style={{flex:1}}>Excluir</Btn>
        </div>
      </>}
    </Modal>
  </div>);
}
