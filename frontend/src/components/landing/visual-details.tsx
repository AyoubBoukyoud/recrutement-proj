import {CountryFlag} from './journey-details';

export function EditorialImage({name,className=''}:{name:string;className?:string}){
 return <img className={'editorial-image '+className} src={'/landing-assets/editorial/'+name+'.webp'} alt="" width="480" height="480" loading="lazy" decoding="async"/>;
}

export function LogoBridge(){return <div className="logo-bridge" aria-hidden="true" dir="ltr">
 <span className="bridge-country"><CountryFlag country="MA"/></span>
 <svg className="bridge-route" viewBox="0 0 360 100" preserveAspectRatio="none"><path d="M0 65 C65 65 65 20 145 45 S280 75 360 35"/><path className="bridge-signal" pathLength="100" d="M0 65 C65 65 65 20 145 45 S280 75 360 35"/></svg>
 <img src="/landing-assets/amud-logo-brand.svg" alt="" width="140" height="140" loading="lazy"/>
 <span className="bridge-country"><CountryFlag country="DE"/></span>
 </div>;}
