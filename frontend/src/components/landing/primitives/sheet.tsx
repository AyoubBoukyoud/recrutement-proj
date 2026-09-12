'use client';
import {Dialog} from '@base-ui/react/dialog';
import {useLanguage} from '@/context/LanguageContext';
export function Sheet(props:Dialog.Root.Props){return <Dialog.Root {...props}/>;}
export function SheetTrigger(props:Dialog.Trigger.Props){return <Dialog.Trigger {...props}/>;}
export function SheetClose(props:Dialog.Close.Props){return <Dialog.Close {...props}/>;}
export function SheetTitle(props:Dialog.Title.Props){return <Dialog.Title {...props}/>;}
export function SheetDescription(props:Dialog.Description.Props){return <Dialog.Description {...props}/>;}
export function SheetContent({side='right',showCloseButton=false,children,...props}:Dialog.Popup.Props&{side?:'left'|'right';showCloseButton?:boolean}){
 const {language,dir}=useLanguage();
 return <Dialog.Portal><div className="amud-site" lang={language} dir={dir}><Dialog.Backdrop className="landing-backdrop"/><Dialog.Popup data-slot="sheet-content" data-side={side} {...props}>{children}{showCloseButton&&<Dialog.Close aria-label="Close">×</Dialog.Close>}</Dialog.Popup></div></Dialog.Portal>;
}
