'use client';
import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {Pause,Play} from 'lucide-react';
import {translator,type Locale} from './content';

const MotionContext=createContext(false);
export const useSiteMotion=()=>useContext(MotionContext);
export function HeartbeatTrace(){return <svg className="heartbeat-trace" viewBox="0 0 240 44" fill="none" aria-hidden="true" focusable="false"><path d="M0 24H75L85 16L96 30L111 4L126 40L137 18L147 24H240"/><path className="heartbeat-signal" pathLength="100" d="M0 24H75L85 16L96 30L111 4L126 40L137 18L147 24H240"/></svg>;}

export function MotionRoot({locale,children}:{locale:Locale;children:ReactNode}){
 const t=translator(locale),root=useRef<HTMLDivElement>(null);
 const [requested,setRequested]=useState(true),[reduced,setReduced]=useState(true),[visible,setVisible]=useState(true);
 const enabled=requested&&!reduced;
 useEffect(()=>{
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const sync=()=>setReduced(media.matches),visibility=()=>setVisible(!document.hidden);
  sync();visibility();
  try{setRequested(localStorage.getItem('amud-motion')!=='off');}catch{}
  media.addEventListener('change',sync);document.addEventListener('visibilitychange',visibility);
  return()=>{media.removeEventListener('change',sync);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 useEffect(()=>{
  if(!enabled||!root.current)return;
  const animations:Animation[]=[];
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){if(!entry.isIntersecting)continue;
    observer.unobserve(entry.target);
    if(entry.target.getBoundingClientRect().top<80)continue;
    animations.push(entry.target.animate([{opacity:.35,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.2,.7,.3,1)'}));
   }
  },{threshold:.12});
  root.current.querySelectorAll('.section-heading,.platform-audiences,.product-window,.logo-bridge').forEach(el=>observer.observe(el));
  return()=>{observer.disconnect();animations.forEach(a=>a.cancel());};
 },[enabled]);
 function toggle(){if(reduced)return;setRequested(value=>{try{localStorage.setItem('amud-motion',value?'off':'on');}catch{}return !value;});}
 return <MotionContext.Provider value={enabled&&visible}><div ref={root} className="amud-site" lang={locale} dir={locale==='ar'?'rtl':'ltr'} data-motion={enabled?'on':'off'} data-page-visible={visible} onClickCapture={event=>{
  if(!enabled)return;
  const icon=(event.target as Element).closest('a,button,[role="tab"]')?.querySelector('svg.lucide');
  icon?.animate([{scale:1},{scale:.8,offset:.25},{scale:1.16,offset:.65},{scale:1}],{duration:360,easing:'ease-out'});
 }}>{children}<button className="motion-toggle" type="button" onClick={toggle} disabled={reduced} aria-pressed={!enabled} aria-label={reduced?t("Mouvements réduits selon vos préférences","الحركة مخفّضة حسب تفضيلات جهازك","Bewegung gemäß Ihren Einstellungen reduziert","Motion reduced according to your device preferences"):enabled?t("Mettre les animations en pause","إيقاف الحركات","Animationen pausieren","Pause animations"):t("Activer les animations","تشغيل الحركات","Animationen aktivieren","Enable animations")}>
 {enabled?<Pause size={15}/>:<Play size={15}/>}<span>{reduced?t("Mouvement réduit","حركة مخفّضة","Reduzierte Bewegung","Reduced motion"):enabled?t("Pause animations","إيقاف الحركة","Animationen pausieren","Pause animations"):t("Activer animations","تشغيل الحركة","Animationen starten","Enable animations")}</span>
 </button></div></MotionContext.Provider>;
}

export function AnimatedFrame({children,variant='card',className=''}:{children:ReactNode;variant?:'hero'|'card';className?:string}){
 const frame=useRef<HTMLDivElement>(null),[inView,setInView]=useState(false);
 useEffect(()=>{const observer=new IntersectionObserver(([entry])=>setInView(entry.isIntersecting),{threshold:0});if(frame.current)observer.observe(frame.current);return()=>observer.disconnect();},[]);
 return <div ref={frame} className={'motion-frame '+className} data-in-view={inView} data-frame={variant}>{children}<svg className="orbit-border" viewBox="0 0 1000 900" preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false"><path pathLength="1000" d={variant==='hero'?'M300 6 H700 Q994 6 994 300 V870 Q994 894 970 894 H30 Q6 894 6 870 V300 Q6 6 300 6 Z':'M30 6 H970 Q994 6 994 30 V870 Q994 894 970 894 H30 Q6 894 6 870 V30 Q6 6 30 6 Z'}/></svg></div>;
}
