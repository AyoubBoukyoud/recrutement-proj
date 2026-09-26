import JourneyLayout from './JourneyLayout';
import type {Locale} from './content';

export default function DesktopJourney({locale}:{locale:Locale}){
  return <JourneyLayout locale={locale} device="desktop"/>;
}
