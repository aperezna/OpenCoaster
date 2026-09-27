import en from '../locales/en.json';
import es from '../locales/es.json';

const english = en as Record<string, string>;
const spanish = es as Record<string, string>;

const visitPlannerAndAttractionKeys = [
  'common.create',
  'attractions.empty',
  'attractions.bellIndicator',
  'attractions.outOfService',
  'visitPlanner.createItinerary',
  'visitPlanner.parkNamePlaceholder',
  'visitPlanner.datePlaceholder',
  'visitPlanner.emptyTitle',
  'visitPlanner.emptySubtitle',
  'visitPlanner.dateTbd',
  'visitPlanner.attractionsCount',
  'visitPlanner.attractionsCount_plural',
  'itineraryPicker.title',
  'itineraryPicker.empty',
  'itineraryPicker.createNew',
  'itineraryDetail.deleteTitle',
  'itineraryDetail.deleteConfirm',
  'itineraryDetail.closed',
  'itineraryDetail.down',
  'itineraryDetail.notFound',
  'itineraryDetail.delete',
] as const;

describe('visit planner and attraction locale contract', () => {
  it('keeps English and Spanish dictionaries in parity', () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
  });

  it.each(visitPlannerAndAttractionKeys)('defines %s in both locales', (key) => {
    expect(english[key]).toBeTruthy();
    expect(spanish[key]).toBeTruthy();
  });

  it('provides Spanish onboarding copy instead of English fallbacks', () => {
    expect(spanish['onboarding.welcomeTitle']).toBe('Te damos la bienvenida a OpenCoaster');
    expect(spanish['onboarding.welcomeBody']).toBe(
      'Descubre parques de atracciones increíbles en todo el mundo.',
    );
  });
});
