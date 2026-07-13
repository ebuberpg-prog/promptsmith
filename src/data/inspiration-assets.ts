import type { InspirationAsset } from '@/types'

const asset = (id: string, territory: string, alt: string, promptSeed: string, palette: string[], mood: string, composition: string): InspirationAsset => ({
  id,
  src: `/promptsmith/inspiration/${id}-640.avif`,
  srcSet: `/promptsmith/inspiration/${id}-320.avif 320w, /promptsmith/inspiration/${id}-640.avif 640w`,
  width: 640,
  height: 640,
  alt,
  territory,
  promptSeed,
  tagIds: [],
  palette,
  mood,
  composition,
  source: 'muse-original',
})

export const INSPIRATION_ASSETS: InspirationAsset[] = [
  asset('gesture-portrait', 'Portrait and gesture', 'Painterly portrait of a woman gesturing in warm window light', 'An expressive waist-up portrait with sculptural hand gestures and warm directional window light', ['warm umber', 'linen', 'lamp black'], 'quiet confidence', 'waist-up portrait with diagonal window light'),
  asset('brutalist-court', 'Environment and architecture', 'Solitary figure in a monumental curved concrete court', 'A solitary figure inside monumental curved brutalist architecture under an overcast sky', ['concrete gray', 'cloud white', 'charcoal'], 'austere stillness', 'tiny figure framed by sweeping architectural curves'),
  asset('quiet-still-life', 'Still life', 'Ceramic vessel, linen and pear in soft side light', 'A tactile still life of a weathered ceramic vessel, folded linen and a single pear in soft side light', ['stone', 'pear gold', 'warm shadow'], 'contemplative', 'asymmetrical tabletop still life'),
  asset('paper-geometry', 'Graphic composition', 'Layered red black and cream paper circles casting shadows', 'A bold cut-paper composition of circles, arcs and crisp shadows', ['vermilion', 'ink black', 'cream'], 'graphic energy', 'overlapping circles with strong negative space'),
  asset('watercolor-botanical', 'Watercolor and ink', 'Loose blue watercolor flowers and green leaves on fibrous paper', 'A loose watercolor and ink botanical study with translucent washes and energetic edges', ['cobalt', 'moss', 'paper white'], 'fresh and lyrical', 'open botanical cluster with generous paper space'),
  asset('rain-window', 'Cinematic light', 'Empty chair beside a rain-streaked night window and amber lamp', 'An empty chair beside a rain-streaked window at blue hour, warmed by one small amber lamp', ['midnight blue', 'amber', 'black'], 'solitary and cinematic', 'off-center chair with reflected practical light'),
  asset('material-folds', 'Texture and material', 'Macro folds of iridescent fabric and brushed metal', 'An extreme macro study of iridescent fabric folds against brushed metal', ['petrol blue', 'pearl', 'bronze'], 'tactile intrigue', 'edge-to-edge abstract folds'),
  asset('floating-stone', 'Surreal form', 'Pale carved stone form balancing above black water', 'A smooth pale stone sculpture balancing impossibly above shallow black water in mist', ['limestone', 'smoke', 'black water'], 'uncanny calm', 'centered impossible balance and reflection'),
  asset('charcoal-hands', 'Gesture study', 'Expressive charcoal drawing of hands and flowing cloth', 'An energetic charcoal study of expressive hands gathering flowing fabric', ['charcoal', 'graphite gray', 'paper'], 'urgent and human', 'layered gestures with visible construction marks'),
  asset('cobalt-courtyard', 'Architecture and color', 'Sunlit ochre courtyard with cobalt tiles and an olive tree', 'A sunlit Mediterranean courtyard with cobalt tile, ochre plaster and one old olive tree', ['cobalt', 'ochre', 'olive'], 'restorative warmth', 'central tree anchored by tiled geometry'),
  asset('glass-still-life', 'Product and color', 'Translucent purple orange and blue glass with citrus and chrome', 'A playful studio still life of translucent colored glass, chrome and small citrus fruit', ['violet', 'orange', 'cobalt', 'chrome'], 'playful precision', 'clustered product arrangement with crisp shadows'),
  asset('ink-mountains', 'Ink landscape', 'Monochrome ink-wash mountain peaks dissolving into fog', 'Sparse ink-wash mountains dissolving into fog with expansive negative space', ['ink black', 'mist gray', 'paper white'], 'meditative distance', 'layered peaks fading into open space'),
  asset('pleated-silhouette', 'Fashion form', 'Fully clothed figure in sweeping pleated crimson fabric', 'An elegant side-profile fashion silhouette in sweeping crimson pleats against pale concrete', ['crimson', 'concrete', 'deep shadow'], 'poised drama', 'full-length profile with fabric extending across frame'),
  asset('forest-terrarium', 'Miniature world', 'Misty miniature forest growing inside a glass sphere', 'A miniature misty forest ecosystem growing inside a clear glass terrarium on dark wood', ['moss green', 'glass', 'dark wood'], 'contained wonder', 'centered glass sphere with internal depth'),
  asset('salt-flat-aerial', 'Natural abstraction', 'Aerial salt flats with rust channels and turquoise water', 'An aerial abstract of white salt flats cut by rust-colored channels beside turquoise water', ['turquoise', 'rust', 'salt white'], 'elemental', 'organic channels dividing broad color fields'),
  asset('coastal-monochrome', 'Monochrome study', 'Distant figure on a stormy coastal cliff in sea spray', 'A high-contrast monochrome coastal cliff in wind and sea spray with one distant figure', ['silver', 'storm gray', 'black'], 'windswept solitude', 'tiny figure at the upper edge of a dark cliff'),
]
