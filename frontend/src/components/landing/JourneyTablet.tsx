import JourneyLayout from './JourneyLayout';
import type {Locale} from './content';

export default function TabletJourney({locale}:{locale:Locale}){
  return <JourneyLayout locale={locale} device="tablet"/>;
}
