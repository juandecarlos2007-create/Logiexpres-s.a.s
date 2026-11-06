import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
const form=document.getElementById('loginForm'), message=document.getElementById('authMessage'), submit=document.getElementById('submitText');
const toggle=document.getElementById('togglePassword');toggle.addEventListener('click',()=>{const p=document.getElementById('password');p.type=p.type==='password'?'text':'password';toggle.textContent=p.type==='password'?'Mostrar':'Ocultar';});
const configured= firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('PEGA_AQUI') && firebaseConfig.projectId && !firebaseConfig.projectId.includes('TU-PROYECTO');
if(!configured){message.textContent='Firebase aún no está configurado. Completa firebase-config.js para habilitar el acceso.';form.querySelector('button[type=submit]').disabled=true;form.querySelector('button[type=submit]').style.opacity='.55';}
else{
 const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
 onAuthStateChanged(auth,async user=>{if(!user)return;try{const profile=await getDoc(doc(db,'users',user.uid));if(!profile.exists()){await signOut(auth);message.textContent='Tu usuario no tiene un perfil empresarial asignado. Contacta al administrador.';return;}const data=profile.data();if(data.active===false){await signOut(auth);message.textContent='Este usuario se encuentra desactivado. Contacta al administrador.';return;}window.location.href='dashboard.html';}catch(err){await signOut(auth);message.textContent='No fue posible validar tu perfil. Revisa los permisos de Firestore.';}});
 form.addEventListener('submit',async e=>{e.preventDefault();message.textContent='';submit.textContent='Validando...';form.querySelector('button[type=submit]').disabled=true;try{await signInWithEmailAndPassword(auth,document.getElementById('email').value.trim(),document.getElementById('password').value);}catch(err){message.textContent=err.code==='auth/invalid-credential'?'Correo o contraseña incorrectos.':err.code==='auth/too-many-requests'?'Demasiados intentos. Inténtalo más tarde.':'No se pudo iniciar sesión. Verifica tus datos e inténtalo de nuevo.';submit.textContent='Iniciar sesión';form.querySelector('button[type=submit]').disabled=false;}});
}
