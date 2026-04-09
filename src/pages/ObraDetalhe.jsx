import{useState,useEffect}from"react";
import{getGastos,saveGasto,deleteGasto,getEtapas,saveEtapa,deleteEtapa,getPagamentos,savePagamento,deletePagamento,getDiario,saveDiario,deleteDiario,saveObra}from"../db";
import{Btn,Input,InputMoney,Select}from"../components/FormElements";
import Modal from"../components/Modal";
import Card from"../components/Card";

const TIPOS_GASTO=[{value:"material",label:"Material"},{value:"mao_de_obra",label:"Mao de obra"},{value:"equipamento",label:"Equipamento"},{value:"outro",label:"Outro"}];
const ETAPAS_PADRAO=["Servicos preliminares","Fundacao","Estrutura","Alvenaria","Cobertura","Instalacoes eletricas","Instalacoes hidraulicas","Revestimento","Acabamento","Limpeza/Entrega"];
const HOJE=new Date().toISOString().slice(0,10);
function fmt(v){return(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}
function fmtData(s){if(!s)return"";const[y,m,d]=s.split("-");return`${d}/${m}/${y}`}

export default function ObraDetalhe({obra,user,onVoltar,onAtualizar}){
  const[aba,setAba]=useState("etapas");
  const[gastos,setGastos]=useState([]);
  const[etapas,setEtapas]=useState([]);
  const[pagamentos,setPagamentos]=useState([]);
  const[diario,setDiario]=useState([]);

  const[gastoModal,setGastoModal]=useState(false);
  const[etapaModal,setEtapaModal]=useState(false);
  const[pagModal,setPagModal]=useState(false);
  const[diarioModal,setDiarioModal]=useState(false);
  const[deleteModal,setDeleteModal]=useState(null);
  const[editGasto,setEditGasto]=useState(null);

  const[gastoForm,setGastoForm]=useState({data:HOJE,tipo:"material",descricao:"",valor:"",fornecedor:""});
  const[etapaForm,setEtapaForm]=useState({nome:"",dataInicio:"",dataFim:""});
  const[pagForm,setPagForm]=useState({data:HOJE,valor:"",tipo:"recebido",descricao:"",status:"pendente"});
  const[diarioForm,setDiarioForm]=useState({data:HOJE,descricao:"",trabalhadores:"",clima:"",obs:""});

  const recarregar=async()=>{
    const[g,e,p,d]=await Promise.all([getGastos(obra.id),getEtapas(obra.id),getPagamentos(obra.id),getDiario(obra.id)]);
    setGastos(g);setEtapas(e);setPagamentos(p);setDiario(d);
  };
  useEffect(()=>{recarregar()},[obra.id]);

  const salvarGasto=async()=>{
    if(!gastoForm.valor)return;
    const g={...gastoForm,ownerEmail:user.email,obraId:obra.id,valor:parseFloat(gastoForm.valor)||0};
    if(editGasto)g.id=editGasto.id;
    await saveGasto(g);setGastoModal(false);setEditGasto(null);await recarregar();
  };

  const adicionarEtapasPadrao=async()=>{
    for(let i=0;i<ETAPAS_PADRAO.length;i++){
      await saveEtapa({ownerEmail:user.email,obraId:obra.id,nome:ETAPAS_PADRAO[i],ordem:i+1,status:"pendente",percentual:0});
    }
    await recarregar();
  };

  const salvarEtapa=async()=>{
    if(!etapaForm.nome.trim())return;
    const e={...etapaForm,ownerEmail:user.email,obraId:obra.id,ordem:etapas.length+1,status:"pendente"};
    await saveEtapa(e);setEtapaModal(false);setEtapaForm({nome:"",dataInicio:"",dataFim:""});await recarregar();
  };

  const alterarStatusEtapa=async(etapa)=>{
    const proxStatus={pendente:"andamento",andamento:"concluida",concluida:"pendente"};
    await saveEtapa({...etapa,status:proxStatus[etapa.status]});await recarregar();
  };

  const salvarPag=async()=>{
    if(!pagForm.valor)return;
    const p={...pagForm,ownerEmail:user.email,obraId:obra.id,valor:parseFloat(pagForm.valor)||0};
    await savePagamento(p);setPagModal(false);await recarregar();
  };

  const salvarDiario=async()=>{
    if(!diarioForm.descricao.trim())return;
    const d={...diarioForm,ownerEmail:user.email,obraId:obra.id,trabalhadores:parseInt(diarioForm.trabalhadores)||0};
    await saveDiario(d);setDiarioModal(false);setDiarioForm({data:HOJE,descricao:"",trabalhadores:"",clima:"",obs:""});await recarregar();
  };

  const totalGasto=gastos.reduce((s,g)=>s+g.valor,0);
  const totalRecebido=pagamentos.filter(p=>p.tipo==="recebido"&&p.status==="pago").reduce((s,p)=>s+p.valor,0);
  const totalPendente=pagamentos.filter(p=>p.tipo==="recebido"&&p.status==="pendente").reduce((s,p)=>s+p.valor,0);
  const saldo=totalRecebido-totalGasto;
  const etapasConcluidas=etapas.filter(e=>e.status==="concluida").length;
  const progresso=etapas.length>0?Math.round((etapasConcluidas/etapas.length)*100):0;

  const ABAS=[{id:"etapas",label:"Etapas",n:etapas.length},{id:"gastos",label:"Gastos",n:gastos.length},{id:"pagamentos",label:"Pagamentos",n:pagamentos.length},{id:"diario",label:"Diario",n:diario.length}];

  const statusEtapaColor={pendente:"#64748b",andamento:"#f59e0b",concluida:"#22c55e"};
  const statusEtapaLabel={pendente:"Pendente",andamento:"Em andamento",concluida:"Concluida"};

  return(<div style={{padding:"0 4px"}}>
    <button onClick={onVoltar} style={{background:"none",border:"none",color:"#64748b",fontSize:13,cursor:"pointer",marginBottom:12,display:"flex",alignItems:"center",gap:4}}>← Voltar</button>

    <div style={{background:"linear-gradient(135deg,#1c0f02,#3a1f00)",borderRadius:18,padding:"16px",marginBottom:14,border:"1px solid rgba(217,119,6,.25)"}}>
      <div style={{color:"#f1f5f9",fontWeight:800,fontSize:18,marginBottom:4}}>🏗️ {obra.nome}</div>
      {obra.cliente&&<div style={{color:"#94a3b8",fontSize:12}}>👤 {obra.cliente}</div>}
      {obra.endereco&&<div style={{color:"#64748b",fontSize:11,marginTop:2}}>📍 {obra.endereco}</div>}
      {etapas.length>0&&<div style={{marginTop:12}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{color:"#fcd34d",fontSize:11,fontWeight:700}}>PROGRESSO</span>
          <span style={{color:"#f59e0b",fontSize:12,fontWeight:700}}>{progresso}%</span>
        </div>
        <div style={{background:"rgba(255,255,255,0.08)",borderRadius:6,height:8,overflow:"hidden"}}>
          <div style={{background:"linear-gradient(90deg,#d97706,#f59e0b)",height:"100%",width:progresso+"%",borderRadius:6,transition:"width .4s"}}/>
        </div>
        <div style={{color:"#64748b",fontSize:11,marginTop:4}}>{etapasConcluidas}/{etapas.length} etapas concluidas</div>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:14}}>
        <div style={{textAlign:"center"}}>
          <div style={{color:"#ef4444",fontSize:13,fontWeight:800}}>R$ {fmt(totalGasto)}</div>
          <div style={{color:"#64748b",fontSize:10}}>Gasto</div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{color:"#22c55e",fontSize:13,fontWeight:800}}>R$ {fmt(totalRecebido)}</div>
          <div style={{color:"#64748b",fontSize:10}}>Recebido</div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{color:saldo>=0?"#4ade80":"#ef4444",fontSize:13,fontWeight:800}}>R$ {fmt(saldo)}</div>
          <div style={{color:"#64748b",fontSize:10}}>Saldo</div>
        </div>
      </div>
    </div>

    {obra.orcamento>0&&(()=>{
      const pct=totalGasto/obra.orcamento;
      const diasDecorridos=obra.dataInicio?Math.max(1,Math.floor((new Date()-new Date(obra.dataInicio+"T12:00"))/(1000*60*60*24))):null;
      const diasTotal=obra.dataInicio&&obra.dataPrevisao?Math.max(1,Math.floor((new Date(obra.dataPrevisao+"T12:00")-new Date(obra.dataInicio+"T12:00"))/(1000*60*60*24))):null;
      const percTempo=diasDecorridos&&diasTotal?diasDecorridos/diasTotal:null;
      const alerta=pct>=1?"Orçamento estourado!":pct>=0.9?"Alerta: 90%+ do orçamento gasto.":percTempo&&pct>percTempo*1.15?"Ritmo de gasto acima do planejado.":null;
      if(!alerta)return null;
      return(<div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:16}}>⚠️</span>
        <span style={{color:"#fca5a5",fontSize:13,fontWeight:600}}>{alerta} Gasto: {Math.round(pct*100)}% do orçamento.</span>
      </div>);
    })()}
    <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
      {ABAS.map(a=><button key={a.id} onClick={()=>setAba(a.id)}
        style={{padding:"7px 14px",borderRadius:12,border:"none",background:aba===a.id?"#d97706":"rgba(255,255,255,0.05)",color:aba===a.id?"#fff":"#94a3b8",fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
        {a.label} <span style={{background:aba===a.id?"rgba(255,255,255,.2)":"rgba(255,255,255,.08)",borderRadius:10,padding:"1px 6px",fontSize:11}}>{a.n}</span>
      </button>)}
    </div>

    {aba==="etapas"&&<div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <button onClick={()=>setEtapaModal(true)} style={{flex:1,background:"linear-gradient(135deg,#d97706,#92400e)",border:"none",borderRadius:12,padding:"10px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Nova Etapa</button>
        {etapas.length===0&&<button onClick={adicionarEtapasPadrao} style={{flex:1,background:"rgba(217,119,6,.1)",border:"1px solid rgba(217,119,6,.25)",borderRadius:12,padding:"10px",color:"#f59e0b",fontSize:12,fontWeight:700,cursor:"pointer"}}>Usar etapas padrao</button>}
      </div>
      {etapas.map(e=>{
        const atrasada=e.status!=="concluida"&&e.dataFim&&new Date(e.dataFim+"T23:59")< new Date();
        return(<Card key={e.id}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <span style={{color:"#f1f5f9",fontWeight:600,fontSize:14}}>{e.nome}</span>
                {atrasada&&<span style={{background:"rgba(239,68,68,.15)",color:"#ef4444",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:10}}>⚠ ATRASADA</span>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4,flexWrap:"wrap"}}>
                <span style={{color:statusEtapaColor[e.status],fontSize:11,fontWeight:700}}>● {statusEtapaLabel[e.status]}</span>
                {e.dataInicio&&<span style={{color:"#475569",fontSize:11}}>De {fmtData(e.dataInicio)}</span>}
                {e.dataFim&&<span style={{color:atrasada?"#ef4444":"#475569",fontSize:11}}>até {fmtData(e.dataFim)}</span>}
              </div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <button onClick={()=>alterarStatusEtapa(e)} style={{background:"rgba(217,119,6,.1)",border:"1px solid rgba(217,119,6,.2)",borderRadius:8,padding:"6px 10px",color:"#f59e0b",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                {e.status==="pendente"?"Iniciar":e.status==="andamento"?"Concluir":"Reabrir"}
              </button>
              <button onClick={()=>setDeleteModal({id:e.id,tipo:"etapa",desc:e.nome})} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:14}}>✕</button>
            </div>
          </div>
        </Card>);
      })}
      {etapas.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:"#475569"}}>Nenhuma etapa cadastrada</div>}
    </div>}

    {aba==="gastos"&&<div>
      <button onClick={()=>{setEditGasto(null);setGastoForm({data:HOJE,tipo:"material",descricao:"",valor:"",fornecedor:""});setGastoModal(true)}} style={{width:"100%",background:"linear-gradient(135deg,#d97706,#92400e)",border:"none",borderRadius:12,padding:"11px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:12}}>+ Registrar Gasto</button>
      {gastos.map(g=><Card key={g.id}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:"#f1f5f9",fontWeight:600,fontSize:14}}>{g.descricao||g.tipo}</div>
            <div style={{color:"#64748b",fontSize:12,marginTop:2}}>{TIPOS_GASTO.find(t=>t.value===g.tipo)?.label} · {fmtData(g.data)}{g.fornecedor?" · "+g.fornecedor:""}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{color:"#ef4444",fontWeight:800,fontSize:15}}>R$ {fmt(g.valor)}</div>
            <button onClick={()=>setDeleteModal({id:g.id,tipo:"gasto",desc:g.descricao||g.tipo})} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:14}}>✕</button>
          </div>
        </div>
      </Card>)}
      {gastos.length>0&&<div style={{background:"rgba(239,68,68,.08)",borderRadius:14,padding:"14px 16px",border:"1px solid rgba(239,68,68,.15)",marginTop:8}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          <span style={{color:"#fca5a5",fontSize:13,fontWeight:600}}>Total gasto</span>
          <span style={{color:"#ef4444",fontWeight:800,fontSize:15}}>R$ {fmt(totalGasto)}</span>
        </div>
        {obra.orcamento>0&&<>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{color:"#94a3b8",fontSize:12}}>Orcamento restante</span>
            <span style={{color:obra.orcamento-totalGasto>=0?"#22c55e":"#ef4444",fontWeight:700,fontSize:13}}>R$ {fmt(obra.orcamento-totalGasto)}</span>
          </div>
          <div style={{background:"rgba(255,255,255,0.08)",borderRadius:4,height:6,overflow:"hidden",marginBottom:12}}>
            <div style={{background:totalGasto/obra.orcamento>0.9?"#ef4444":totalGasto/obra.orcamento>0.7?"#f59e0b":"#22c55e",height:"100%",width:Math.min(100,(totalGasto/obra.orcamento)*100)+"%",borderRadius:4}}/>
          </div>
        </>}
        <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:10,marginTop:4}}>
          <div style={{color:"#94a3b8",fontSize:11,fontWeight:700,marginBottom:8}}>POR TIPO</div>
          {[{v:"material",l:"Material"},{v:"mao_de_obra",l:"Mão de obra"},{v:"equipamento",l:"Equipamento"},{v:"outro",l:"Outro"}].map(({v,l})=>{
            const tot=gastos.filter(g=>g.tipo===v).reduce((s,g)=>s+g.valor,0);
            if(!tot)return null;
            const pct=totalGasto>0?Math.round((tot/totalGasto)*100):0;
            return(<div key={v} style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{color:"#94a3b8",fontSize:12}}>{l}</span>
                <span style={{color:"#f1f5f9",fontSize:12,fontWeight:600}}>R$ {fmt(tot)} <span style={{color:"#64748b",fontSize:11}}>({pct}%)</span></span>
              </div>
              <div style={{background:"rgba(255,255,255,0.06)",borderRadius:3,height:4,overflow:"hidden"}}>
                <div style={{background:"#f59e0b",height:"100%",width:pct+"%",borderRadius:3}}/>
              </div>
            </div>);
          })}
        </div>
      </div>}
      {gastos.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:"#475569"}}>Nenhum gasto registrado</div>}
    </div>}

    {aba==="pagamentos"&&<div>
      <button onClick={()=>{setPagForm({data:HOJE,valor:"",tipo:"recebido",descricao:"",status:"pendente"});setPagModal(true)}} style={{width:"100%",background:"linear-gradient(135deg,#d97706,#92400e)",border:"none",borderRadius:12,padding:"11px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:12}}>+ Registrar Pagamento</button>
      {pagamentos.map(p=><Card key={p.id}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:"#f1f5f9",fontWeight:600,fontSize:14}}>{p.descricao||p.tipo}</div>
            <div style={{color:"#64748b",fontSize:12,marginTop:2}}>{fmtData(p.data)} · {p.tipo==="recebido"?"Recebimento":"Pagamento"}</div>
            <div style={{color:p.status==="pago"?"#22c55e":"#f59e0b",fontSize:11,marginTop:2,fontWeight:700}}>{p.status==="pago"?"● Pago":"● Pendente"}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{color:p.tipo==="recebido"?"#22c55e":"#ef4444",fontWeight:800,fontSize:15}}>R$ {fmt(p.valor)}</div>
            <button onClick={()=>setDeleteModal({id:p.id,tipo:"pagamento",desc:p.descricao||p.tipo})} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:14}}>✕</button>
          </div>
        </div>
        {p.status==="pendente"&&p.tipo==="recebido"&&<button onClick={async()=>{await savePagamento({...p,status:"pago"});await recarregar()}} style={{marginTop:8,width:"100%",background:"rgba(22,163,74,.1)",border:"1px solid rgba(22,163,74,.2)",borderRadius:8,padding:"6px",color:"#22c55e",fontSize:12,fontWeight:700,cursor:"pointer"}}>Marcar como recebido</button>}
      </Card>)}
      {pagamentos.length>0&&<div style={{background:"rgba(22,163,74,.08)",borderRadius:14,padding:"12px 16px",border:"1px solid rgba(22,163,74,.15)",marginTop:8}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{color:"#86efac",fontSize:13,fontWeight:600}}>Total recebido</span>
          <span style={{color:"#22c55e",fontWeight:800,fontSize:15}}>R$ {fmt(totalRecebido)}</span>
        </div>
        {totalPendente>0&&<div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{color:"#fcd34d",fontSize:13,fontWeight:600}}>A receber</span>
          <span style={{color:"#f59e0b",fontWeight:800,fontSize:15}}>R$ {fmt(totalPendente)}</span>
        </div>}
      </div>}
      {pagamentos.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:"#475569"}}>Nenhum pagamento registrado</div>}
    </div>}

    {aba==="diario"&&<div>
      <button onClick={()=>{setDiarioForm({data:HOJE,descricao:"",trabalhadores:"",clima:"",obs:""});setDiarioModal(true)}} style={{width:"100%",background:"linear-gradient(135deg,#d97706,#92400e)",border:"none",borderRadius:12,padding:"11px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:12}}>+ Registro do Dia</button>
      {diario.map(d=><Card key={d.id}>
        <div style={{padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            <div style={{color:"#fbbf24",fontWeight:700,fontSize:13}}>{fmtData(d.data)}{d.clima?" · "+d.clima:""}{d.trabalhadores?" · "+d.trabalhadores+" trabalhadores":""}</div>
            <div style={{color:"#f1f5f9",fontSize:13,marginTop:4,lineHeight:1.5}}>{d.descricao}</div>
            {d.obs&&<div style={{color:"#64748b",fontSize:11,marginTop:4}}>{d.obs}</div>}
          </div>
          <button onClick={()=>setDeleteModal({id:d.id,tipo:"diario",desc:"registro de "+fmtData(d.data)})} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:14,marginLeft:8}}>✕</button>
        </div>
      </Card>)}
      {diario.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:"#475569"}}>Nenhum registro no diario</div>}
    </div>}

    <Modal open={gastoModal} onClose={()=>setGastoModal(false)} title={editGasto?"Editar Gasto":"Registrar Gasto"}>
      <Input label="Data" type="date" value={gastoForm.data} onChange={e=>setGastoForm({...gastoForm,data:e.target.value})}/>
      <Select label="Tipo" value={gastoForm.tipo} onChange={e=>setGastoForm({...gastoForm,tipo:e.target.value})} options={TIPOS_GASTO}/>
      <Input label="Descricao" value={gastoForm.descricao} onChange={e=>setGastoForm({...gastoForm,descricao:e.target.value})} placeholder="Ex: Cimento, servico de pedreiro..."/>
      <InputMoney label="Valor (R$)" value={gastoForm.valor} onChange={e=>setGastoForm({...gastoForm,valor:e.target.value})} placeholder="0,00"/>
      <Input label="Fornecedor / Responsavel (opcional)" value={gastoForm.fornecedor||""} onChange={e=>setGastoForm({...gastoForm,fornecedor:e.target.value})} placeholder="Nome do fornecedor..."/>
      <Btn onClick={salvarGasto}>{editGasto?"Salvar":"Registrar Gasto"}</Btn>
    </Modal>

    <Modal open={etapaModal} onClose={()=>setEtapaModal(false)} title="Nova Etapa">
      <Input label="Nome da etapa" value={etapaForm.nome} onChange={e=>setEtapaForm({...etapaForm,nome:e.target.value})} placeholder="Ex: Fundacao, Alvenaria..."/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Input label="Data início (opcional)" type="date" value={etapaForm.dataInicio||""} onChange={e=>setEtapaForm({...etapaForm,dataInicio:e.target.value})}/>
        <Input label="Data fim (opcional)" type="date" value={etapaForm.dataFim||""} onChange={e=>setEtapaForm({...etapaForm,dataFim:e.target.value})}/>
      </div>
      <Btn onClick={salvarEtapa}>Adicionar Etapa</Btn>
    </Modal>

    <Modal open={pagModal} onClose={()=>setPagModal(false)} title="Registrar Pagamento">
      <Input label="Data" type="date" value={pagForm.data} onChange={e=>setPagForm({...pagForm,data:e.target.value})}/>
      <Select label="Tipo" value={pagForm.tipo} onChange={e=>setPagForm({...pagForm,tipo:e.target.value})} options={[{value:"recebido",label:"Recebimento do cliente"},{value:"pago",label:"Pagamento a terceiro"}]}/>
      <Input label="Descricao" value={pagForm.descricao||""} onChange={e=>setPagForm({...pagForm,descricao:e.target.value})} placeholder="Ex: Medicao 1, parcela inicial..."/>
      <InputMoney label="Valor (R$)" value={pagForm.valor} onChange={e=>setPagForm({...pagForm,valor:e.target.value})} placeholder="0,00"/>
      <Select label="Status" value={pagForm.status} onChange={e=>setPagForm({...pagForm,status:e.target.value})} options={[{value:"pendente",label:"Pendente"},{value:"pago",label:"Pago/Recebido"}]}/>
      <Btn onClick={salvarPag}>Salvar Pagamento</Btn>
    </Modal>

    <Modal open={diarioModal} onClose={()=>setDiarioModal(false)} title="Registro do Dia">
      <Input label="Data" type="date" value={diarioForm.data} onChange={e=>setDiarioForm({...diarioForm,data:e.target.value})}/>
      <Input label="O que foi feito hoje" value={diarioForm.descricao} onChange={e=>setDiarioForm({...diarioForm,descricao:e.target.value})} placeholder="Descreva o que foi realizado..."/>
      <Input label="Trabalhadores presentes" type="number" value={diarioForm.trabalhadores||""} onChange={e=>setDiarioForm({...diarioForm,trabalhadores:e.target.value})} placeholder="0" inputMode="numeric"/>
      <Input label="Clima (opcional)" value={diarioForm.clima||""} onChange={e=>setDiarioForm({...diarioForm,clima:e.target.value})} placeholder="Ex: Sol, chuva, nublado..."/>
      <Input label="Observacoes (opcional)" value={diarioForm.obs||""} onChange={e=>setDiarioForm({...diarioForm,obs:e.target.value})} placeholder="Ocorrencias, problemas..."/>
      <Btn onClick={salvarDiario}>Salvar Registro</Btn>
    </Modal>

    <Modal open={!!deleteModal} onClose={()=>setDeleteModal(null)} title="Excluir registro">
      {deleteModal&&<>
        <p style={{color:"#94a3b8",fontSize:14,marginBottom:20,textAlign:"center"}}>Excluir {deleteModal.tipo} <strong style={{color:"#f1f5f9"}}>{deleteModal.desc}</strong>?</p>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={()=>setDeleteModal(null)} color="rgba(255,255,255,0.06)" style={{flex:1,border:"1px solid rgba(255,255,255,0.08)",color:"#94a3b8"}}>Cancelar</Btn>
          <Btn onClick={async()=>{
            if(deleteModal.tipo==="gasto")await deleteGasto(deleteModal.id);
            else if(deleteModal.tipo==="etapa")await deleteEtapa(deleteModal.id);
            else if(deleteModal.tipo==="pagamento")await deletePagamento(deleteModal.id);
            else if(deleteModal.tipo==="diario")await deleteDiario(deleteModal.id);
            setDeleteModal(null);await recarregar();
          }} color="linear-gradient(135deg,#ef4444,#dc2626)" style={{flex:1}}>Excluir</Btn>
        </div>
      </>}
    </Modal>
  </div>);
}
