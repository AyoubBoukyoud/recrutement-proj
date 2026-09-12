'use client';
import {Tabs as Primitive} from '@base-ui/react/tabs';
export function Tabs(props:Primitive.Root.Props){return <Primitive.Root data-slot="tabs" {...props}/>;}
export function TabsList(props:Primitive.List.Props){return <Primitive.List data-slot="tabs-list" {...props}/>;}
export function TabsTrigger(props:Primitive.Tab.Props){return <Primitive.Tab data-slot="tabs-trigger" {...props}/>;}
export function TabsContent(props:Primitive.Panel.Props){return <Primitive.Panel data-slot="tabs-content" {...props}/>;}
