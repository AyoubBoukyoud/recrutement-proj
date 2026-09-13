export function CountryFlag({country}:{country:'MA'|'DE'|'CA'}){
 return <svg className="country-flag" viewBox="0 0 30 20" aria-hidden="true" focusable="false">{country==='CA'?<><path fill="#fff" d="M0 0h30v20H0z"/><path fill="#D52B1E" d="M0 0h6v20H0zM24 0h6v20h-6zM15 3l1.3 3.3 1.5-.8-.7 4 2.7-1.8.2 1.6 2 .3-3.6 3.2.6 1.4-3.6-.4.2 3.2h-1.2l.2-3.2-3.6.4.6-1.4-3.6-3.2 2-.3.2-1.6 2.7 1.8-.7-4 1.5.8Z"/></>:country==='DE'?<><path fill="#202020" d="M0 0h30v7H0z"/><path fill="#D12E35" d="M0 7h30v6H0z"/><path fill="#EDBD3B" d="M0 13h30v7H0z"/></>:<><path fill="#C1272D" d="M0 0h30v20H0z"/><path d="m15 4 3.53 10.86-9.23-6.71h11.4l-9.23 6.71Z" stroke="#006233" strokeWidth="1.1" fill="none"/></>}</svg>;
}
export function StepConnector(){return <>
 <svg className="step-route route-horizontal" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 28C45 -8 55 62 100 28S155 -8 200 28"/><path className="step-signal" pathLength="100" d="M0 28C45 -8 55 62 100 28S155 -8 200 28"/></svg>
 <svg className="step-route route-vertical" viewBox="0 0 44 180" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M22 0C-6 40 50 62 22 90S-6 144 22 180"/><path className="step-signal" pathLength="100" d="M22 0C-6 40 50 62 22 90S-6 144 22 180"/></svg>
 </>;}
