'use client';

import {useSyncExternalStore} from 'react';
import DesktopJourney from './JourneyDesktop';
import TabletJourney from './JourneyTablet';
import MobileJourney from './JourneyMobile';
import type {Locale} from './content';
import type {JourneyDevice} from './JourneyLayout';
import {journeyCopy} from './journey-copy';

function getDevice():JourneyDevice{
  if(typeof window==='undefined')return 'desktop';
  if(window.innerWidth<=720)return 'mobile';
  if(window.innerWidth<=1180)return 'tablet';
  return 'desktop';
}

function subscribe(callback:()=>void){
  window.addEventListener('resize',callback,{passive:true});
  return()=>window.removeEventListener('resize',callback);
}

export default function JourneyLanding({locale='fr'}:{locale?:Locale}){
  const device=useSyncExternalStore<JourneyDevice|null>(subscribe,getDevice,()=>null);
  if(!device){const copy=journeyCopy(locale);return <main aria-busy="true" style={{minHeight:'100vh',padding:'80px 6%',background:'#fffdf9',color:'#09274d'}}><h1 style={{fontSize:36,fontWeight:800}}>{copy.heroTitle} {copy.heroAccent}</h1><p>{copy.heroBody}</p></main>;}
  if(device==='mobile')return <MobileJourney locale={locale}/>;
  if(device==='tablet')return <TabletJourney locale={locale}/>;
  return <DesktopJourney locale={locale}/>;
}
