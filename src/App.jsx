import{useState,useEffect}from"react";
import{initAdmin,getAccount,saveAccount}from"./db";
import Login from"./pages/Login";
import Dashboard from"./pages/Dashboard";
import Obras from"./pages/Obras";
import ObraDetalhe from"./pages/ObraDetalhe";
import Relatorios from"./pages/Relatorios";
import Config from"./pages/Config";
import Admin from"./pages/Admin";
import Modal from"./components/Modal";
import{Btn,Input}from"./components/FormElements";

const ABAS=[
  {id:"dashboard",label:"Início",icon:"🏠"},
  {id:"obras",label:"Obras",icon:"🏗️"},
  {id:"relatorios",label:"Relatórios",icon:"📊"},
  {id:"config",label:"Config",icon:"⚙️"},
];
const ABAS_VALIDAS=["dashboard","obras","relatorios","config","admin"];
const getHashAba=()=>{const h=window.location.hash.slice(1);return ABAS_VALIDAS.includes(h)?h:"dashboard"};

export default function App(){
  const[usuario,setUsuario]=useState(null);
  const[aba,setAba]=useState(getHashAba);
  const[pronto,setPronto]=useState(false);
  const[senhaModal,setSenhaModal]=useState(false);
  const[novaSenha,setNovaSenha]=useState("");const[confirmarSenha,setConfirmarSenha]=useState("");const[senhaMsg,setSenhaMsg]=useState(null);
  const[refreshKey,setRefreshKey]=useState(0);
  const[obraAberta,setObraAberta]=useState(null);
  const[novaVersao,setNovaVersao]=useState(false);

  useEffect(()=>{if(!("serviceWorker"in navigator))return;const h=()=>setNovaVersao(true);navigator.serviceWorker.addEventListener("controllerchange",h);return()=>navigator.serviceWorker.removeEventListener("controllerchange",h)},[]);

  useEffect(()=>{(async()=>{
    initAdmin().catch(()=>{});
    const salvo=localStorage.getItem("obras_usuario");
    if(salvo){
      const cache=JSON.parse(salvo);
      try{
        const atualizado=await getAccount(cache.email);
        if(!atualizado||atualizado.status==="blocked"){localStorage.removeItem("obras_usuario")}
        else if(atualizado.status==="active"){setUsuario(atualizado);localStorage.setItem("obras_usuario",JSON.stringify(atualizado));if(atualizado.mustChangePassword)setSenhaModal(true)}
        else{setUsuario(cache)}
      }catch{setUsuario(cache)}
    }
    setPronto(true);
  })()},[]);

  useEffect(()=>{
    const aoMudarHash=()=>setAba(getHashAba());
    window.addEventListener("hashchange",aoMudarHash);
    return()=>window.removeEventListener("hashchange",aoMudarHash);
  },[]);

  useEffect(()=>{
    const aoVoltar=()=>{if(document.visibilityState==="visible")setRefreshKey(k=>k+1)};
    document.addEventListener("visibilitychange",aoVoltar);
    return()=>document.removeEventListener("visibilitychange",aoVoltar);
  },[]);

  const mudarAba=(id)=>{setAba(id);window.location.hash=id;if(id!=="obras")setObraAberta(null)};

  const aoFazerLogin=(acc)=>{
    setUsuario(acc);localStorage.setItem("obras_usuario",JSON.stringify(acc));
    mudarAba("dashboard");if(acc.mustChangePassword)setSenhaModal(true);
  };

  const salvarNovaSenha=async()=>{
    if(!novaSenha||novaSenha.length<6){setSenhaMsg("Mínimo 6 caracteres");return}
    if(novaSenha!==confirmarSenha){setSenhaMsg("Senhas não conferem");return}
    usuario.password=novaSenha;usuario.mustChangePassword=false;await saveAccount(usuario);
    setUsuario({...usuario});setSenhaModal(false);setNovaSenha("");setConfirmarSenha("");setSenhaMsg(null);
  };

  const sair=()=>{setUsuario(null);localStorage.removeItem("obras_usuario");window.location.hash="";setObraAberta(null)};

  if(!pronto)return(<div style={{minHeight:"100vh",background:"#0a0806",display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{textAlign:"center"}}>
      <div style={{width:64,height:64,borderRadius:20,background:"linear-gradient(135deg,#d97706,#92400e)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:32,boxShadow:"0 12px 40px rgba(217,119,6,.35)"}}>🏗️</div>
      <div style={{color:"#d97706",fontSize:14,animation:"pulse 1.2s infinite",fontWeight:600}}>Carregando...</div>
    </div>
  </div>);

  if(!usuario)return <Login onLogin={aoFazerLogin}/>;

  const todasAbas=usuario.role==="admin"?[...ABAS,{id:"admin",label:"Admin",icon:"🛡️"}]:ABAS;

  const renderizarPagina=()=>{
    if(aba==="obras"){
      if(obraAberta)return<ObraDetalhe obra={obraAberta} user={usuario} onVoltar={()=>setObraAberta(null)} onAtualizar={o=>setObraAberta({...o})}/>;
      return<Obras user={usuario} onAbrirObra={o=>setObraAberta(o)}/>;
    }
    switch(aba){
      case"dashboard":return<Dashboard user={usuario}/>;
      case"relatorios":return<Relatorios user={usuario}/>;
      case"config":return<Config user={usuario} onAtualizar={u=>setUsuario({...u})}/>;
      case"admin":return<Admin currentUser={usuario}/>;
      default:return<Dashboard user={usuario}/>;
    }
  };

  return(<div style={{minHeight:"100vh",background:"#0a0806",paddingBottom:80}}>
    {novaVersao&&<div onClick={()=>window.location.reload()} style={{position:"fixed",top:0,left:0,right:0,zIndex:9999,background:"#d97706",color:"#fff",textAlign:"center",padding:"12px 16px",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,userSelect:"none",WebkitUserSelect:"none"}}><span>Nova versão disponível</span><span style={{background:"rgba(255,255,255,0.2)",borderRadius:8,padding:"3px 10px",fontSize:12}}>Toque para atualizar</span></div>}
    <div style={{padding:"14px 20px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"rgba(10,8,6,.92)",zIndex:100,backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
      <div>
        <div style={{fontSize:18,fontWeight:800,background:"linear-gradient(135deg,#fcd34d,#d97706)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:-.3}}>ObrasControle</div>
        <div style={{color:"#475569",fontSize:11,marginTop:1}}>Olá, {usuario.name.split(" ")[0]}</div>
      </div>
      <button onClick={sair} style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",borderRadius:10,padding:"7px 14px",color:"#ef4444",fontSize:13,fontWeight:600,cursor:"pointer"}}>Sair</button>
    </div>

    <div style={{padding:"16px 16px 0"}} key={refreshKey}>{renderizarPagina()}</div>

    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(10,8,6,.95)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"space-around",padding:"8px 0 env(safe-area-inset-bottom,10px)",zIndex:100}}>
      {todasAbas.map(t=>{
        const ativo=aba===t.id;
        return(<button key={t.id} onClick={()=>mudarAba(t.id)}
          style={{background:"none",border:"none",color:ativo?"#fbbf24":"#475569",display:"flex",flexDirection:"column",alignItems:"center",cursor:"pointer",gap:2,padding:"4px 8px",minWidth:44,transition:"color .15s"}}>
          <div style={{width:36,height:28,borderRadius:10,background:ativo?"rgba(217,119,6,.2)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,transition:"all .15s"}}>{t.icon}</div>
          <span style={{fontSize:9,fontWeight:ativo?700:500,letterSpacing:.3}}>{t.label}</span>
        </button>);
      })}
    </div>

    <Modal open={senhaModal} onClose={()=>{}} title="Redefina sua senha">
      <p style={{color:"#94a3b8",fontSize:13,marginBottom:16}}>Você precisa criar uma nova senha antes de continuar.</p>
      {senhaMsg&&<div style={{color:"#ef4444",fontSize:12,marginBottom:10,background:"rgba(239,68,68,.1)",padding:"8px 12px",borderRadius:10}}>{senhaMsg}</div>}
      <Input label="Nova senha" type="password" value={novaSenha} onChange={e=>setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres"/>
      <Input label="Confirmar senha" type="password" value={confirmarSenha} onChange={e=>setConfirmarSenha(e.target.value)} placeholder="Repita a senha"/>
      <Btn onClick={salvarNovaSenha}>Salvar e Continuar</Btn>
    </Modal>
  </div>);
}
