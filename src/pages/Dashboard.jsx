import{useState,useEffect}from"react";
import{getObras,getGastos,getPagamentos}from"../db";
import Card from"../components/Card";

function fmt(v){return(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}

export default function Dashboard({user}){
  const[obras,setObras]=useState([]);
  const[resumo,setResumo]=useState({obrasAtivas:0,totalOrcado:0,totalGasto:0,totalRecebido:0,totalPendente:0});
  const[carregando,setCarregando]=useState(true);

  useEffect(()=>{(async()=>{
    setCarregando(true);
    const os=await getObras(user.email);
    setObras(os);
    let totalOrcado=0,totalGasto=0,totalRecebido=0,totalPendente=0;
    const obrasAtivas=os.filter(o=>o.status==="andamento").length;
    for(const o of os){
      totalOrcado+=o.orcamento||0;
      const gastos=await getGastos(o.id);
      totalGasto+=gastos.reduce((s,g)=>s+g.valor,0);
      const pags=await getPagamentos(o.id);
      totalRecebido+=pags.filter(p=>p.tipo==="recebido"&&p.status==="pago").reduce((s,p)=>s+p.valor,0);
      totalPendente+=pags.filter(p=>p.tipo==="recebido"&&p.status==="pendente").reduce((s,p)=>s+p.valor,0);
    }
    setResumo({obrasAtivas,totalOrcado,totalGasto,totalRecebido,totalPendente});
    setCarregando(false);
  })()},[user.email]);

  if(carregando)return(<div style={{padding:"40px 0",textAlign:"center",color:"#475569"}}>Carregando dados...</div>);

  const saldo=resumo.totalRecebido-resumo.totalGasto;

  return(<div style={{padding:"0 4px 8px"}}>
    <div style={{background:"linear-gradient(135deg,#1c0f02,#3a1f00)",borderRadius:20,padding:"20px",marginBottom:14,border:"1px solid rgba(217,119,6,.25)",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:"rgba(217,119,6,.12)"}}/>
      <div style={{color:"#fcd34d",fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:4}}>SALDO GERAL</div>
      <div style={{color:saldo>=0?"#fef3c7":"#ef4444",fontSize:28,fontWeight:800,letterSpacing:-.5}}>R$ {fmt(saldo)}</div>
      <div style={{color:"#f59e0b",fontSize:12,marginTop:4}}>{saldo>=0?"Recebido − Gasto":"Deficit acumulado"}</div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
      <div style={{background:"rgba(217,119,6,.08)",borderRadius:16,padding:"14px 16px",border:"1px solid rgba(217,119,6,.15)"}}>
        <div style={{color:"#fcd34d",fontSize:10,fontWeight:700,letterSpacing:.8,marginBottom:4}}>OBRAS ATIVAS</div>
        <div style={{color:"#fbbf24",fontSize:22,fontWeight:800}}>{resumo.obrasAtivas}</div>
      </div>
      <div style={{background:"rgba(59,130,246,.08)",borderRadius:16,padding:"14px 16px",border:"1px solid rgba(59,130,246,.15)"}}>
        <div style={{color:"#93c5fd",fontSize:10,fontWeight:700,letterSpacing:.8,marginBottom:4}}>TOTAL ORCADO</div>
        <div style={{color:"#60a5fa",fontSize:16,fontWeight:800}}>R$ {fmt(resumo.totalOrcado)}</div>
      </div>
      <div style={{background:"rgba(239,68,68,.08)",borderRadius:16,padding:"14px 16px",border:"1px solid rgba(239,68,68,.15)"}}>
        <div style={{color:"#fca5a5",fontSize:10,fontWeight:700,letterSpacing:.8,marginBottom:4}}>TOTAL GASTO</div>
        <div style={{color:"#ef4444",fontSize:16,fontWeight:800}}>R$ {fmt(resumo.totalGasto)}</div>
      </div>
      <div style={{background:"rgba(34,197,94,.08)",borderRadius:16,padding:"14px 16px",border:"1px solid rgba(34,197,94,.15)"}}>
        <div style={{color:"#86efac",fontSize:10,fontWeight:700,letterSpacing:.8,marginBottom:4}}>A RECEBER</div>
        <div style={{color:"#22c55e",fontSize:16,fontWeight:800}}>R$ {fmt(resumo.totalPendente)}</div>
      </div>
    </div>

    {obras.length>0&&<>
      <div style={{color:"#64748b",fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:10}}>ULTIMAS OBRAS</div>
      {obras.slice(0,3).map(o=><Card key={o.id}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:"#f1f5f9",fontWeight:600,fontSize:14}}>{o.nome}</div>
            <div style={{color:"#64748b",fontSize:12,marginTop:2}}>{o.cliente||"Cliente nao informado"}</div>
          </div>
          <span style={{background:o.status==="andamento"?"rgba(217,119,6,.15)":o.status==="concluida"?"rgba(59,130,246,.15)":"rgba(100,116,139,.15)",color:o.status==="andamento"?"#f59e0b":o.status==="concluida"?"#60a5fa":"#94a3b8",fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20}}>
            {o.status==="andamento"?"Em andamento":o.status==="concluida"?"Concluida":"Pausada"}
          </span>
        </div>
      </Card>)}
    </>}

    {obras.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"#475569"}}>
      <div style={{fontSize:40,marginBottom:10}}>🏗️</div>
      <div style={{fontSize:15,fontWeight:600,color:"#64748b",marginBottom:6}}>Nenhuma obra cadastrada</div>
      <div style={{fontSize:13}}>Va em "Obras" para criar sua primeira obra</div>
    </div>}
  </div>);
}
