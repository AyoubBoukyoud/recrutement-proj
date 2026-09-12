'use client';
import {createContext,useContext,useEffect,type ComponentProps} from 'react';
import useEmblaCarousel,{type UseEmblaCarouselType} from 'embla-carousel-react';
export type CarouselApi=UseEmblaCarouselType[1];
const Context=createContext<UseEmblaCarouselType|null>(null);
type Props=ComponentProps<'div'>&{opts?:Parameters<typeof useEmblaCarousel>[0];setApi?:(api:CarouselApi)=>void};
export function Carousel({opts,setApi,children,...props}:Props){
 const value=useEmblaCarousel(opts),api=value[1];
 useEffect(()=>{setApi?.(api);},[api,setApi]);
 return <Context.Provider value={value}><div role="region" aria-roledescription="carousel" data-slot="carousel" {...props}>{children}</div></Context.Provider>;
}
export function CarouselContent({className='',...props}:ComponentProps<'div'>){
 const value=useContext(Context);if(!value)throw Error('CarouselContent needs Carousel');
 return <div ref={value[0]} data-slot="carousel-content"><div className={'carousel-track '+className} {...props}/></div>;
}
export function CarouselItem(props:ComponentProps<'div'>){return <div role="group" aria-roledescription="slide" data-slot="carousel-item" {...props}/>;}
