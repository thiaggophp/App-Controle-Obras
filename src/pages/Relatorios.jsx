import{useState,useEffect}from"react";
import{getObras,getGastos,getPagamentos,getEtapas}from"../db";
import Card from"../components/Card";

function fmt(v){return(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}
function fmtData(s){if(!s)return"";const[y,m,d]=s.split("-");return`${d}/${m}/${y}`}

export default function Relatorios({user}){
  const[obras,setObras]=useState([]);const[dados,setDados]=useState([]);const[carregando,setCarregando]=useState(true);
  const[obraId,setObraId]=useState("todas");

  useEffect(()=>{(async()=>{
    setCarregando(true);
    const os=await getObras(user.email);setObras(os);
    const d=await Promise.all(os.map(async o=>{
      const[gastos,pagamentos,etapas]=await Promise.all([getGastos(o.id),getPagamentos(o.id),getEtapas(o.id)]);
      const totalGasto=gastos.reduce((s,g)=>s+g.valor,0);
      const totalRecebido=pagamentos.filter(p=>p.tipo==="recebido"&&p.status==="pago").reduce((s,p)=>s+p.valor,0);
      const totalPago=pagamentos.filter(p=>p.tipo==="pago"&&p.status==="pago").reduce((s,p)=>s+p.valor,0);
      const aPagar=pagamentos.filter(p=>p.tipo==="pago"&&p.status==="pendente").reduce((s,p)=>s+p.valor,0);
      const aReceber=pagamentos.filter(p=>p.tipo==="recebido"&&p.status==="pendente").reduce((s,p)=>s+p.valor,0);
      const etapasConcluidas=etapas.filter(e=>e.status==="concluida").length;
      const progressoEtapas=etapas.length>0?Math.round((etapasConcluidas/etapas.length)*100):0;
      return{...o,totalGasto,totalRecebido,totalPago,aPagar,aReceber,etapasConcluidas,totalEtapas:etapas.length,progressoEtapas,gastos,pagamentos,etapas};
    }));
    setDados(d);setCarregando(false);
  })()},[user.email]);

  const filtrados=obraId==="todas"?dados:dados.filter(d=>d.id===obraId);
  const obra=filtrados[0];

  const totalGeral={gasto:dados.reduce((s,d)=>s+d.totalGasto,0),recebido:dados.reduce((s,d)=>s+d.totalRecebido,0),aReceber:dados.reduce((s,d)=>s+d.aReceber,0)};

  const imprimir=()=>{
    const conteudo=document.getElementById("relatorio-print");
    const janela=window.open("","_blank");
    janela.document.write(`<html><head><title>Relatório — ObrasControle</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;color:#111}h1{color:#d97706}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left}th{background:#fffbeb;color:#92400e}.verde{color:#16a34a;font-weight:700}.vermelho{color:#dc2626;font-weight:700}.total{background:#fffbeb;font-weight:700}</style>
    </head><body>${conteudo.innerHTML}</body></html>`);
    janela.document.close();janela.focus();setTimeout(()=>janela.print(),300);
  };

  const compartilharWhatsApp=()=>{
    let texto="*ObrasControle — Relatório*\n"+new Date().toLocaleDateString("pt-BR")+"\n\n";
    const alvo=obraId==="todas"?null:dados.find(d=>d.id===obraId);
    if(!alvo){
      texto+=`*Consolidado — ${dados.length} obras*\n`;
      texto+=`💸 Total gasto: R$ ${fmt(totalGeral.gasto)}\n`;
      texto+=`✅ Total recebido: R$ ${fmt(totalGeral.recebido)}\n`;
      texto+=`⏳ A receber: R$ ${fmt(totalGeral.aReceber)}\n\n`;
      dados.forEach(d=>{texto+=`🏗️ ${d.nome}${d.cliente?" ("+d.cliente+")":""}: R$ ${fmt(d.totalGasto)} gasto · ${d.progressoEtapas}% concluído\n`});
    }else{
      texto+=`🏗️ *${alvo.nome}*${alvo.cliente?" · "+alvo.cliente:""}\n\n`;
      if(alvo.orcamento>0)texto+=`📋 Orçamento: R$ ${fmt(alvo.orcamento)}\n`;
      texto+=`💸 Gasto: R$ ${fmt(alvo.totalGasto)}\n`;
      texto+=`✅ Recebido: R$ ${fmt(alvo.totalRecebido)}\n`;
      if(alvo.aReceber>0)texto+=`⏳ A receber: R$ ${fmt(alvo.aReceber)}\n`;
      if(alvo.totalEtapas>0)texto+=`\n📊 Etapas: ${alvo.etapasConcluidas}/${alvo.totalEtapas} (${alvo.progressoEtapas}%)`;
    }
    window.open("https://wa.me/?text="+encodeURIComponent(texto),"_blank");
  };

  if(carregando)return(<div style={{padding:"40px 0",textAlign:"center",color:"#475569"}}>Carregando relatório...</div>);

  return(<div style={{padding:"0 4px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <h2 style={{color:"#f1f5f9",margin:0,fontSize:20,fontWeight:700}}>Relatórios</h2>
      <div style={{display:"flex",gap:8}}>
        <button onClick={compartilharWhatsApp} style={{background:"rgba(37,211,102,.1)",border:"1px solid rgba(37,211,102,.25)",borderRadius:12,padding:"8px 14px",color:"#25d366",fontSize:13,fontWeight:700,cursor:"pointer"}}>📲 WhatsApp</button>
        <button onClick={imprimir} style={{background:"rgba(217,119,6,.1)",border:"1px solid rgba(217,119,6,.25)",borderRadius:12,padding:"8px 14px",color:"#fbbf24",fontSize:13,fontWeight:700,cursor:"pointer"}}>🖨️ PDF</button>
      </div>
    </div>

    <div style={{marginBottom:14}}>
      <select value={obraId} onChange={e=>setObraId(e.target.value)} style={{width:"100%",padding:"12px 16px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,color:"#f1f5f9",fontSize:14,outline:"none",colorScheme:"dark"}}>
        <option value="todas" style={{background:"#1a110a"}}>Todas as obras</option>
        {obras.map(o=><option key={o.id} value={o.id} style={{background:"#1a110a"}}>{o.nome}</option>)}
      </select>
    </div>

    {obraId==="todas"&&<>
      <div style={{background:"linear-gradient(135deg,#1a0d00,#2d1800)",borderRadius:18,padding:"18px",marginBottom:14,border:"1px solid rgba(217,119,6,.25)"}}>
        <div style={{color:"#fbbf24",fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:12}}>CONSOLIDADO — {dados.length} OBRAS</div>
        {[["Total gasto (materiais/serviços)","#ef4444",totalGeral.gasto],["Total recebido de clientes","#22c55e",totalGeral.recebido],["A receber (pendente)","#f59e0b",totalGeral.aReceber]].map(([l,c,v])=>
          <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{color:"#94a3b8",fontSize:13}}>{l}</span>
            <span style={{color:c,fontWeight:800,fontSize:15}}>R$ {fmt(v)}</span>
          </div>
        )}
      </div>
      {dados.map(d=><Card key={d.id}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div>
            <div style={{color:"#f1f5f9",fontWeight:700,fontSize:14}}>🏗️ {d.nome}</div>
            {d.cliente&&<div style={{color:"#64748b",fontSize:11}}>👤 {d.cliente}</div>}
          </div>
          <span style={{background:"rgba(217,119,6,.15)",color:"#f59e0b",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:10}}>
            {d.progressoEtapas}%
          </span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}>
          <div style={{textAlign:"center",background:"rgba(239,68,68,.06)",borderRadius:8,padding:"6px"}}>
            <div style={{color:"#ef4444",fontSize:12,fontWeight:700}}>R$ {fmt(d.totalGasto)}</div>
            <div style={{color:"#64748b",fontSize:10}}>gasto</div>
          </div>
          <div style={{textAlign:"center",background:"rgba(34,197,94,.06)",borderRadius:8,padding:"6px"}}>
            <div style={{color:"#22c55e",fontSize:12,fontWeight:700}}>R$ {fmt(d.totalRecebido)}</div>
            <div style={{color:"#64748b",fontSize:10}}>recebido</div>
          </div>
          <div style={{textAlign:"center",background:"rgba(245,158,11,.06)",borderRadius:8,padding:"6px"}}>
            <div style={{color:"#f59e0b",fontSize:12,fontWeight:700}}>R$ {fmt(d.aReceber)}</div>
            <div style={{color:"#64748b",fontSize:10}}>a receber</div>
          </div>
        </div>
      </Card>)}
    </>}

    {obraId!=="todas"&&obra&&<div>
      <div style={{background:"linear-gradient(135deg,#1a0d00,#2d1800)",borderRadius:18,padding:"18px",marginBottom:14,border:"1px solid rgba(217,119,6,.25)"}}>
        <div style={{color:"#fbbf24",fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:4}}>OBRA: {obra.nome.toUpperCase()}</div>
        {obra.cliente&&<div style={{color:"#64748b",fontSize:12,marginBottom:4}}>👤 {obra.cliente}</div>}
        {obra.dataInicio&&<div style={{color:"#475569",fontSize:11,marginBottom:14}}>Início: {fmtData(obra.dataInicio)}{obra.dataPrevisao?" · Previsão: "+fmtData(obra.dataPrevisao):""}</div>}
        {[
          obra.orcamento>0&&["Orçamento","#f59e0b",obra.orcamento],
          ["Total gasto","#ef4444",obra.totalGasto],
          obra.orcamento>0&&["Saldo orçamento",obra.orcamento-obra.totalGasto>=0?"#22c55e":"#ef4444",obra.orcamento-obra.totalGasto],
          ["Total recebido","#22c55e",obra.totalRecebido],
          obra.aReceber>0&&["A receber (pendente)","#f59e0b",obra.aReceber],
          obra.aPagar>0&&["A pagar (pendente)","#f97316",obra.aPagar],
        ].filter(Boolean).map(([l,c,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:8,paddingBottom:8,borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
          <span style={{color:"#94a3b8",fontSize:13}}>{l}</span>
          <span style={{color:c,fontWeight:700,fontSize:14}}>R$ {fmt(v)}</span>
        </div>)}
        {obra.totalEtapas>0&&<div style={{marginTop:8,color:"#fbbf24",fontSize:13,fontWeight:600}}>Etapas: {obra.etapasConcluidas}/{obra.totalEtapas} concluídas ({obra.progressoEtapas}%)</div>}
      </div>

      {obra.gastos.length>0&&<Card>
        <div style={{color:"#fbbf24",fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:10}}>GASTOS POR CATEGORIA</div>
        {["material","mao_de_obra","equipamento","outro"].map(cat=>{
          const total=obra.gastos.filter(g=>g.categoria===cat).reduce((s,g)=>s+g.valor,0);
          if(!total)return null;
          const labels={material:"Material",mao_de_obra:"Mão de obra",equipamento:"Equipamento",outro:"Outro"};
          return(<div key={cat} style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{color:"#94a3b8",fontSize:13}}>{labels[cat]}</span>
            <span style={{color:"#f1f5f9",fontWeight:600,fontSize:13}}>R$ {fmt(total)}</span>
          </div>);
        })}
      </Card>}
    </div>}

    <div id="relatorio-print" style={{display:"none"}}>
      <h1>ObrasControle — Relatório</h1>
      <p>Gerado em: {new Date().toLocaleDateString("pt-BR")}</p>
      {obraId==="todas"?<>
        <h2>Resultado Consolidado</h2>
        <table><thead><tr><th>Obra</th><th>Cliente</th><th>Total Gasto</th><th>Recebido</th><th>A Receber</th><th>Etapas</th></tr></thead>
        <tbody>{dados.map(d=><tr key={d.id}>
          <td>{d.nome}</td><td>{d.cliente||"—"}</td>
          <td className="vermelho">R$ {fmt(d.totalGasto)}</td>
          <td className="verde">R$ {fmt(d.totalRecebido)}</td>
          <td>R$ {fmt(d.aReceber)}</td>
          <td>{d.etapasConcluidas}/{d.totalEtapas}</td>
        </tr>)}
        <tr className="total"><td colSpan="2">TOTAL</td><td className="vermelho">R$ {fmt(totalGeral.gasto)}</td><td className="verde">R$ {fmt(totalGeral.recebido)}</td><td>R$ {fmt(totalGeral.aReceber)}</td><td></td></tr>
        </tbody></table>
      </>:obra&&<>
        <h2>Obra: {obra.nome}</h2>
        {obra.cliente&&<p>Cliente: {obra.cliente}</p>}
        <table><tbody>
          {obra.orcamento>0&&<tr><td>Orçamento</td><td>R$ {fmt(obra.orcamento)}</td></tr>}
          <tr><td>Total gasto</td><td className="vermelho">R$ {fmt(obra.totalGasto)}</td></tr>
          <tr><td>Total recebido</td><td className="verde">R$ {fmt(obra.totalRecebido)}</td></tr>
          {obra.aReceber>0&&<tr><td>A receber (pendente)</td><td>R$ {fmt(obra.aReceber)}</td></tr>}
          {obra.totalEtapas>0&&<tr className="total"><td>Progresso das etapas</td><td>{obra.etapasConcluidas}/{obra.totalEtapas} ({obra.progressoEtapas}%)</td></tr>}
        </tbody></table>
        {obra.gastos.length>0&&<><h3>Gastos por Categoria</h3>
        <table><tbody>
          {["material","mao_de_obra","equipamento","outro"].map(cat=>{
            const total=obra.gastos.filter(g=>g.categoria===cat).reduce((s,g)=>s+g.valor,0);
            if(!total)return null;
            const labels={material:"Material",mao_de_obra:"Mão de obra",equipamento:"Equipamento",outro:"Outro"};
            return <tr key={cat}><td>{labels[cat]}</td><td>R$ {fmt(total)}</td></tr>;
          })}
        </tbody></table></>}
      </>}
    </div>
  </div>);
}
