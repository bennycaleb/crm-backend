import React from 'react';
import { useNavigate } from 'react-router-dom';

function OperatorWelcome() {
  const navigate = useNavigate();
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',background:'#f7f8fa'}}>
      <div style={{background:'#fff',borderRadius:16,padding:48,boxShadow:'0 2px 16px rgba(0,0,0,0.08)',textAlign:'center',maxWidth:420}}>
        <h1 style={{fontWeight:900,fontSize:'2.1rem',letterSpacing:1,marginBottom:18,color:'#e53935'}}>Bienvenue à <span style={{color:'#222'}}>C-<span style={{color:'#e53935'}}>INNOVATECH</span> SOLUTIONS</span></h1>
        <p style={{fontSize:'1.15rem',marginBottom:32}}>Connectez-vous pour recevoir les appels.</p>
        <button onClick={()=>navigate('/operateur')} style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:8,padding:'14px 38px',fontWeight:700,fontSize:'1.1rem',cursor:'pointer',boxShadow:'0 2px 8px rgba(25,118,210,0.10)'}}>Débuter</button>
      </div>
    </div>
  );
}

export default OperatorWelcome; 