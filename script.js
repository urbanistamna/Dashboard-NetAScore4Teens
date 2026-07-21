let map;
let currentCity     = 'salzburg';
let currentMode      = 'walkability';
let threshold        = 0.0;
let breakdownChart   = null;
let currentChartType = 'group';
let currentProps     = null;
let pinnedId         = null;
let pinnedProps      = null;
let lastHoverId      = null;
let hoverTimer       = null;
let pinMarker        = null;

// ── INTRO OVERLAY ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const introOverlay = document.getElementById('intro-overlay');
    const introCta     = document.getElementById('intro-cta-btn');
    if (introCta && introOverlay) {
        introCta.addEventListener('click', () => {
            introOverlay.classList.add('hiding');
            setTimeout(() => { introOverlay.style.display = 'none'; }, 560);
        });
    }

    // Typewriter for "Small Steps Matter"
    const taglineEl = document.getElementById('intro-tagline-text');
    const cursorEl  = document.getElementById('intro-tagline-cursor');
    if (taglineEl) {
        const phrases = ['Small Steps Matter', 'Streets for Teens', 'Safer Routes, Happier Teens'];
        let pIdx = 0, cIdx = 0, deleting = false;
        function type() {
            const phrase = phrases[pIdx];
            if (!deleting) {
                taglineEl.textContent = phrase.slice(0, ++cIdx);
                if (cIdx === phrase.length) {
                    setTimeout(() => { deleting = true; type(); }, 2200);
                    return;
                }
                setTimeout(type, 68);
            } else {
                taglineEl.textContent = phrase.slice(0, --cIdx);
                if (cIdx === 0) {
                    deleting = false;
                    pIdx = (pIdx + 1) % phrases.length;
                    setTimeout(type, 420);
                    return;
                }
                setTimeout(type, 38);
            }
        }
        setTimeout(type, 600);
    }

    // Rotating footer stats
    const FOOTER_STATS = [
        { icon: 'ti-alert-triangle',      text: 'Road traffic injuries are the leading cause of death among children. - WHO',      color: '#B45309', bg: '#FEF3C7' },
        { icon: 'ti-building-skyscraper', text: 'By 2050, most urban residents will be children and young people. - UN-Habitat',   color: '#1D4ED8', bg: '#DBEAFE' },
        { icon: 'ti-road',                text: 'Streets are children\'s largest public space. - GDCI',                            color: '#6D28D9', bg: '#EDE9FE' },
        { icon: 'ti-heart',               text: 'Every child deserves safe journeys every day. - UNICEF',                         color: '#BE123C', bg: '#FFE4E6' },
        { icon: 'ti-shoe',                text: 'A child\'s world is often no bigger than the distance they can walk independently.', color: '#047857', bg: '#D1FAE5' },
        { icon: 'ti-star',                text: 'The best streets invite children to stay, not just pass through.',                color: '#B45309', bg: '#FFF7ED' },
        { icon: 'ti-walk',                text: 'A city can feel very different from the height of a child.',                     color: '#065F46', bg: '#ECFDF5' },
        { icon: 'ti-mood-sad',            text: 'Grey streets = grey feelings.',                                                  color: '#374151', bg: '#F3F4F6' },
        { icon: 'ti-palette',             text: 'Children see streets in colour, vibrancy, and motivation to walk & bike.',       color: '#5B21B6', bg: '#EDE9FE' },
        { icon: 'ti-ball-football',       text: 'Play is not an extra. It\'s essential.',                                        color: '#C2410C', bg: '#FFF7ED' },
        { icon: 'ti-school',              text: 'A street can be a playground, classroom, and a meeting place.',                  color: '#166534', bg: '#DCFCE7' },
    ];
    const statPill = document.getElementById('footer-stat-pill');
    const statIcon = document.getElementById('footer-stat-icon');
    const statText = document.getElementById('footer-stat-text');
    if (statPill && statIcon && statText) {
        let sIdx = 0;
        function showStat(idx) {
            statPill.classList.add('fading');
            setTimeout(() => {
                const s = FOOTER_STATS[idx];
                statPill.style.background = s.bg;
                statIcon.innerHTML        = `<i class="ti ${s.icon}" style="color:${s.color}"></i>`;
                statText.textContent      = s.text;
                statText.style.color      = s.color;
                statPill.classList.remove('fading');
            }, 380);
        }
        showStat(0);
        setInterval(() => { sIdx = (sIdx + 1) % FOOTER_STATS.length; showStat(sIdx); }, 5000);
    }
});

// ── CURIOUS FACT BUTTON + POPUP CARD ─────────────────────────────
(function() {
    const FACTS_BY_CITY = {
        salzburg: [
            { icon: 'ti-bike',           text: 'Many residential streets in Salzburg score well for child cyclists.',        bg: 'rgba(120,180,100,0.82)'  },
            { icon: 'ti-trees',          text: 'Green corridors along the Salzach river boost walkability scores notably.',  bg: 'rgba(74,158,82,0.82)'    },
            { icon: 'ti-school',         text: 'School routes in the Altstadt area show mixed safety scores for children.',  bg: 'rgba(210,155,50,0.82)'   },
            { icon: 'ti-mood-happy',     text: 'Over 40% of assessed streets are rated Child-Friendly or better.',          bg: 'rgba(80,160,100,0.82)'   },
            { icon: 'ti-alert-triangle', text: 'High-traffic arterial roads remain the biggest barrier to child mobility.', bg: 'rgba(195,90,80,0.82)'    },
            { icon: 'ti-mood-kid',       text: 'Proximity to parks and playgrounds is a key driver of high joy scores.',    bg: 'rgba(120,100,200,0.82)'  },
            { icon: 'ti-walk',           text: 'Pedestrian infrastructure quality varies widely across Salzburg districts.', bg: 'rgba(60,140,200,0.82)'  },
        ],
        olomouc: [
            { icon: 'ti-walk',           text: 'Olomouc\'s largely pedestrianized historic core scores strongly for child walkability.', bg: 'rgba(60,140,200,0.82)'  },
            { icon: 'ti-train',          text: 'A dense historic tram network shapes how many central streets are classified for mobility.', bg: 'rgba(120,100,200,0.82)' },
            { icon: 'ti-trees',          text: 'Parks such as Bezruč Gardens and Smetana Park anchor several high-scoring green routes.',  bg: 'rgba(74,158,82,0.82)'   },
            { icon: 'ti-school',         text: 'As a university town, the city center mixes many pedestrian and student routes.',           bg: 'rgba(210,155,50,0.82)'  },
            { icon: 'ti-alert-triangle', text: 'Streets leading out toward busier arterial roads show a steeper drop in child-friendly scores.', bg: 'rgba(195,90,80,0.82)' },
            { icon: 'ti-mood-neutral',  text: 'Streets rated Good or Excellent appear less common here than in Salzburg\'s core, worth a closer look at the full network.', bg: 'rgba(200,160,60,0.82)' },
        ]
    };

    let FACTS   = FACTS_BY_CITY.salzburg;
    let current = 0;

    function renderFact(idx, animate) {
        const card = document.getElementById('map-fact-card');
        const icon = document.getElementById('map-fact-icon');
        const text = document.getElementById('map-fact-text');
        const dots = document.getElementById('map-fact-dots');
        if (!card) return;
        const f = FACTS[idx];

        if (animate) {
            text.classList.add('fading');
            setTimeout(() => apply(), 180);
        } else { apply(); }

        function apply() {
            icon.className   = 'ti ' + f.icon + ' map-fact-icon';
            icon.style.color = 'rgba(255,255,255,0.92)';
            text.textContent = f.text;
            card.style.background   = f.bg;
            card.style.backdropFilter = 'blur(14px)';
            card.style.webkitBackdropFilter = 'blur(14px)';
            card.style.borderColor  = 'rgba(255,255,255,0.18)';
            dots.innerHTML = '';
            FACTS.forEach((_, i) => {
                const d = document.createElement('span');
                d.className = 'map-fact-dot' + (i === idx ? ' active' : '');
                dots.appendChild(d);
            });
            if (animate) text.classList.remove('fading');
        }
    }

    const btn   = document.getElementById('map-curious-btn');
    const card  = document.getElementById('map-fact-card');
    const next  = document.getElementById('map-fact-next');
    const close = document.getElementById('map-fact-close');

    function openCard()  { renderFact(current, false); card.classList.add('open'); }
    function closeCard() { card.classList.remove('open'); }

    if (btn) btn.addEventListener('click', e => {
        e.stopPropagation();
        card.classList.contains('open') ? closeCard() : openCard();
    });
    if (next) next.addEventListener('click', e => {
        e.stopPropagation();
        current = (current + 1) % FACTS.length;
        renderFact(current, true);
    });
    if (close) close.addEventListener('click', e => {
        e.stopPropagation();
        closeCard();
    });
    if (card) card.addEventListener('click', e => e.stopPropagation());

    document.addEventListener('click', () => closeCard());

    window.resetCityFacts = function(cityKey) {
        FACTS = FACTS_BY_CITY[cityKey] || FACTS_BY_CITY.salzburg;
        current = 0;
        closeCard();
    };
})();

// ── DARK MODE TOGGLE ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const btn   = document.getElementById('dark-toggle');
    const icon  = document.getElementById('dark-toggle-icon');
    const label = document.getElementById('dark-toggle-label');
    let dark    = false;

    function applyDark(on) {
        dark = on;
        document.body.classList.toggle('dark-mode', on);
        if (icon)  icon.className    = on ? 'ti ti-sun'  : 'ti ti-moon';
        if (label) label.textContent = on ? 'Light' : 'Dark';
        const style = on ? 'https://tiles.openfreemap.org/styles/dark' : 'https://tiles.openfreemap.org/styles/positron';
        if (map) {
            map.setStyle(style, { diff: false });
            map.once('styledata', () => {
                document.querySelectorAll('.maplibregl-ctrl-attrib').forEach(el => el.remove());
            });
        }
        localStorage.setItem('n4k-dark', on ? '1' : '0');
        if (currentProps) setTimeout(() => renderChart(currentProps), 50);
    }

    if (localStorage.getItem('n4k-dark') === '1') applyDark(true);

    if (btn) btn.addEventListener('click', () => applyDark(!dark));
});

function showMapLoadError() {
    const overlay  = document.getElementById('map-loading-overlay');
    const spinner  = document.getElementById('map-loading-spinner');
    const text     = document.getElementById('map-loading-text');
    const reloadBtn= document.getElementById('map-loading-reload-btn');
    if (overlay) overlay.classList.remove('hidden');
    if (spinner) spinner.style.display = 'none';
    if (text) text.textContent = 'Map failed to load. Please check your connection.';
    if (reloadBtn) reloadBtn.style.display = 'inline-block';
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.__mapScriptFailed || typeof maplibregl === 'undefined') {
        console.error('MapLibre GL JS not loaded');
        showMapLoadError();
        return;
    }

    try {

    const CITIES = {
        salzburg: {
            label:       'Salzburg',
            country:     'Austria',
            tilesetUrl:  'https://urbanistamna.github.io/Dashboard-NetAScore4Teens/netascore.pmtiles',
            sourceLayer: 'netascore_salzburg_edges',
            center:      [13.055, 47.809],
            zoom:        12,
            hasPOI:      true,
            hasEnv:      true
        },
        olomouc: {
            label:       'Olomouc',
            country:     'Czech Republic',
            tilesetUrl:  'https://urbanistamna.github.io/Dashboard-NetAScore4Teens/netascore_olomouc.pmtiles',
            sourceLayer: 'netascore_olomouc_edges',
            center:      [17.2509, 49.5938],
            zoom:        12,
            hasPOI:      true,
            hasEnv:      true
        }
    };
    let TILESET_URL   = CITIES[currentCity].tilesetUrl;
    let SOURCE_LAYER  = CITIES[currentCity].sourceLayer;

    const WALK_INDICATORS = [
        { group:'safety',  key:'pedestrian_infrastructure_ft', label:'Foot Infrastructure', icon:'ti-walk',             color:'ind-slate',  weight:0.4,
          def:'Presence and type of pedestrian infrastructure ; footways, sidewalks, pedestrian areas. The single most important safety indicator for walking children.' },
        { group:'safety',  key:'road_category',                label:'Road Category',       icon:'ti-road',             color:'ind-pink',   weight:0.4,
          def:'Road classification from primary to pedestrian-only. Residential and calmed streets score highest for child pedestrian safety.' },
        { group:'safety',  key:'max_speed_greatest',           label:'Max Speed Nearby',    icon:'ti-gauge-2',          color:'ind-coral',  weight:0.3,
          def:'Highest speed on nearby roads. Adjacent fast roads affect how safe children feel even when walking on a quiet street. It is also proxy for traffic volume.' },
        { group:'safety',  key:'lighting',                     label:'Street lighting',     icon:'ti-bulb',             color:'ind-amber',  weight:0.3,
          def:'Presence of street lighting. Critical for safety at night and during dark winter mornings and evenings when children travel to and from school.' },
        { group:'safety',  key:'crossings',                    label:'Crossings',           icon:'ti-arrows-cross',     color:'ind-pink',   weight:0.2,
          def:'Number of pedestrian crossings nearby. Safe crossings are essential for children to reach school, parks and shops independently.' },
        { group:'safety',  key:'number_lanes_ft',              label:'Number of lanes',     icon:'ti-layout-columns',   color:'ind-slate',  weight:0.1,
          def:'Number of traffic lanes. More lanes mean longer crossing distances and more traffic ; both increase risk for child pedestrians.' },
        { group:'safety',  key:'traffic_calming',              label:'Traffic Calming',     icon:'ti-shield-check',     color:'ind-green',  weight:0,
          def:'Presence of traffic calming measures such as speed bumps, chicanes, or raised tables. These slow vehicles and make streets safer for children on foot.' },
        { group:'safety',  key:'designated_route_ft',          label:'Designated Route',    icon:'ti-route-square',     color:'ind-blue',   weight:0,
          def:'Whether this segment is part of an official pedestrian or school route. Designated routes are typically safer, better maintained and signposted.' },
        { group:'comfort', key:'gradient_ft',                  label:'Gradient',            icon:'ti-trending-up',      color:'ind-coral',  weight:0.3,
          def:'Steepness of the road. Steep slopes are demanding for young children and pushchairs. Flat routes strongly encourage active travel.' },
        { group:'comfort', key:'greenness',                    label:'Greenery',            icon:'ti-trees',            color:'ind-green',  weight:0.3,
          def:'Proportion of greenery surrounding the segment. Workshop findings show greenery is the top thing teens notice and want on streets.' },
        { group:'comfort', key:'noise',                        label:'Quietness',           icon:'ti-ear',              color:'ind-teal',   weight:0.3,
          def:'Ambient noise level. Nearly half of the teens from workshops identified noise as a negative aspect of their school journey.' },
        { group:'comfort', key:'water',                        label:'Water nearby',        icon:'ti-droplet',          color:'ind-blue',   weight:0.4,
          def:'Proximity to rivers, streams or fountains. Water features make streets more engaging and pleasant; children are naturally drawn to them.' },
        { group:'comfort', key:'buildings',                    label:'Buildings',           icon:'ti-building',         color:'ind-slate',  weight:0.1,
          def:'Density of surrounding buildings. Lower density scores higher here — a more open, less enclosed streetscape is treated as more comfortable, while heavily built-up surroundings score lower.' },
        { group:'comfort', key:'width',                        label:'Path width',          icon:'ti-arrows-horizontal',color:'ind-teal',   weight:0,
          def:'Width of the footpath or road. Wider paths give children more space to walk side by side, pass others safely, and feel less crowded.' },
        { group:'comfort', key:'parking',                      label:'On-street parking',   icon:'ti-parking',          color:'ind-coral',  weight:0,
          def:'Presence of on-street parking. Parked cars reduce visibility at crossings and can make footpaths feel narrower and less safe for children.' },
        { group:'comfort', key:'pavement',                     label:'Pavement surface',    icon:'ti-road-off',         color:'ind-amber',  weight:0,
          def:'Surface quality of the footpath. Smooth, well-maintained surfaces are safer and more comfortable; especially for younger children and those with pushchairs.' },
        { group:'joy',     key:'play_and_outdoor',             label:'Play & outdoor',      icon:'ti-mood-kid',         color:'ind-green',  weight:0.2,
          def:'Number of play areas and outdoor activity spaces nearby. Play spots transform a boring route into an adventure; key finding from workshops.' },
        { group:'joy',     key:'sights',                       label:'Sights & landmarks',  icon:'ti-eye',              color:'ind-purple', weight:0,
          def:'Points of interest and landmarks along the route. Interesting streets feel shorter and more enjoyable.' },
        { group:'joy',     key:'comfort_facilities',           label:'Rest facilities',     icon:'ti-armchair',         color:'ind-blue',   weight:0.1,
          def:'Comfort facilities like benches, shades, rest spots and shelters. Rest spots give children and caregivers places to pause on longer routes.' },
        { group:'joy',     key:'eating_facilities',            label:'Eating spots',        icon:'ti-tools-kitchen',    color:'ind-amber',  weight:0.1,
          def:'Cafes, kiosks, supermarkets and food shops nearby. In workshops with Teens, a supermarket (SPAR) was the most cited positive landmark on the school street.' },
        { group:'joy',     key:'attractiveness',               label:'Attractiveness',      icon:'ti-sparkles',         color:'ind-purple', weight:0,
          def:'Overall visual and sensory attractiveness of the street environment. Attractive streets motivate children to walk and make journeys feel shorter and more enjoyable.' },
    ];

    const BIKE_INDICATORS = [
        { group:'safety',  key:'bicycle_infrastructure_ft',    label:'Bike infrastructure', icon:'ti-bike',             color:'ind-blue',   weight:0.2,
          def:'Type of cycling facility: dedicated cycle path, shared lane, or none. A protected bike way is essential for children to cycle independently.' },
        { group:'safety',  key:'road_category',                label:'Road category',       icon:'ti-road',             color:'ind-pink',   weight:0.3,
          def:'Road classification. Residential and calmed streets are safest for child cyclists — well separated from fast-moving traffic.' },
        { group:'safety',  key:'lighting',                     label:'Street lighting',     icon:'ti-bulb',             color:'ind-amber',  weight:0.3,
          def:'Presence of street lighting. Lit routes give children and parents confidence to cycle in darker conditions.' },
        { group:'safety',  key:'designated_route_ft',          label:'Designated route',    icon:'ti-route-square',     color:'ind-blue',   weight:0.1,
          def:'Whether this is part of an official cycling route. Designated routes are better maintained and signposted for cyclists.' },
        { group:'safety',  key:'max_speed_ft',                 label:'Speed limit',         icon:'ti-gauge',            color:'ind-coral',  weight:0.1,
          def:'Maximum permitted vehicle speed. At 30 km/h survival chances in a collision are far higher than at 50+ km/h.' },
        { group:'safety',  key:'traffic_calming',              label:'Traffic calming',     icon:'ti-shield-check',     color:'ind-green',  weight:0,
          def:'Traffic calming measures such as speed bumps or raised junctions. These reduce vehicle speeds and make cycling safer for children.' },
        { group:'safety',  key:'number_lanes_ft',              label:'Number of lanes',     icon:'ti-layout-columns',   color:'ind-slate',  weight:0,
          def:'Number of traffic lanes. More lanes mean more traffic streams to cross and a more intimidating environment for child cyclists.' },
        { group:'comfort', key:'parking',                      label:'On-street parking',   icon:'ti-parking',          color:'ind-coral',  weight:0.1,
          def:'Whether on-street parking is allowed. Parked cars block sightlines and open doors unexpectedly — a real hazard for child cyclists.' },
        { group:'comfort', key:'pavement',                     label:'Pavement surface',    icon:'ti-road-off',         color:'ind-amber',  weight:0.1,
          def:'Surface type. Smooth surfaces matter for child cyclists — rough cobbles slow them and can cause falls.' },
        { group:'comfort', key:'gradient_ft',                  label:'Gradient',            icon:'ti-trending-up',      color:'ind-coral',  weight:0.1,
          def:'Steepness of the road. Steep hills are hard to cycle up and dangerous to descend — flat routes are strongly preferred for children.' },
        { group:'comfort', key:'width',                        label:'Path width',          icon:'ti-arrows-horizontal',color:'ind-teal',   weight:0,
          def:'Width of the cycling infrastructure. Wider paths allow children to cycle side by side and overtake safely without veering into traffic.' },
        { group:'comfort', key:'buildings',                    label:'Buildings',           icon:'ti-building',         color:'ind-slate',  weight:0,
          def:'Density of surrounding buildings. Built-up areas can create wind tunnels and blind corners — less dense environments are more comfortable for cycling.' },
        { group:'comfort', key:'greenness',                    label:'Greenery',            icon:'ti-trees',            color:'ind-green',  weight:0,
          def:'Green surroundings alongside the route. Greenery makes cycling more pleasant and can provide shade on hot days.' },
        { group:'comfort', key:'water',                        label:'Water nearby',        icon:'ti-droplet',          color:'ind-blue',   weight:0,
          def:'Proximity to water features. Interesting environments make cycling feel less like effort — children report water as a highlight of their routes.' },
        { group:'comfort', key:'noise',                        label:'Quietness',           icon:'ti-ear',              color:'ind-teal',   weight:0,
          def:'Ambient noise level. Quieter streets are less stressful and make it easier for child cyclists to hear approaching vehicles.' },
        { group:'joy',     key:'sights',                       label:'Sights & landmarks',  icon:'ti-eye',              color:'ind-purple', weight:0.4,
          def:'Number of points of interest nearby. Interesting streets reduce boredom — the top finding from the SALIS workshops.' },
        { group:'joy',     key:'play_and_outdoor',             label:'Play & outdoor',      icon:'ti-mood-kid',         color:'ind-green',  weight:0,
          def:'Play areas and outdoor spaces along the route. For children, a bike ride is much more appealing if it passes interesting places to stop.' },
        { group:'joy',     key:'attractiveness',               label:'Attractiveness',      icon:'ti-sparkles',         color:'ind-purple', weight:0,
          def:'Overall visual attractiveness of the street. Beautiful, varied environments make cycling feel like an exploration rather than a chore.' },
        { group:'joy',     key:'comfort_facilities',           label:'Rest facilities',     icon:'ti-armchair',         color:'ind-blue',   weight:0,
          def:'Benches, shelters and rest spots. Useful for longer cycling trips so children can take breaks and stay hydrated.' },
        { group:'joy',     key:'eating_facilities',            label:'Eating spots',        icon:'ti-tools-kitchen',    color:'ind-amber',  weight:0,
          def:'Food shops and kiosks nearby. A bakery or kiosk on the route is a motivating landmark — children cited these as highlights in SALIS workshops.' },
    ];

    function getIndicators() {
        return currentMode === 'walkability' ? WALK_INDICATORS : BIKE_INDICATORS;
    }

    const GROUPS = [
        { id:'safety',  label:'Safety',  color:'#E24B4A' },
        { id:'comfort', label:'Comfort', color:'#EF9F27' },
        { id:'joy',     label:'Joy',     color:'#9B59B6' },
    ];

    const MODEL_WEIGHTS = {
        walkability: {
            pedestrian_infrastructure: 0.4, road_category: 0.4, max_speed_greatest: 0.3,
            gradient: 0.3, number_lanes: 0.1, crossings: 0.2, buildings: 0.1,
            greenness: 0.3, water: 0.4, noise: 0.3, lighting: 0.3,
            play_and_outdoor: 0.2, attractiveness: 0.1, comfort_facilities: 0.1, eating_facilities: 0.1,
        },
        bikeability: {
            bicycle_infrastructure: 0.2, designated_route: 0.1, road_category: 0.3,
            max_speed: 0.1, parking: 0.1, pavement: 0.1, gradient: 0.1,
            sights: 0.4, lighting: 0.3, play_and_outdoor: 0.2, attractiveness: 0.1,
            comfort_facilities: 0.1, eating_facilities: 0.1,
        }
    };

    function toModelKey(key) {
        return key.replace(/_ft$/, '');
    }

    function getExplanationObj(props) {
        const field = currentMode === 'walkability' ? props.index_walk_ft_explanation : props.index_bike_ft_explanation;
        if (!field) return null;
        if (typeof field === 'object') return field;
        try { return JSON.parse(field); } catch (e) { return null; }
    }

    function getIndicatorScore(def, props) {
        const modelKey = toModelKey(def.key);
        const weights  = MODEL_WEIGHTS[currentMode];
        const expl     = getExplanationObj(props);

        if (expl && weights && Object.prototype.hasOwnProperty.call(expl, modelKey) && weights[modelKey]) {
            const totalActiveWeight = Object.keys(expl).reduce((sum, k) => sum + (weights[k] || 0), 0);
            const contribution = expl[modelKey];
            if (totalActiveWeight > 0 && typeof contribution === 'number') {
                const subscore = contribution * totalActiveWeight / weights[modelKey];
                return { value: Math.max(0, Math.min(1, subscore)), source: 'model' };
            }
        }
        const norm = normaliseField(def.key, props[def.key], props);
        return { value: norm, source: norm === null ? null : 'estimated' };
    }


    function normaliseField(key, raw, allProps) {
        if (raw === null || raw === undefined || raw === '') return null;
        const CAT = {
            bicycle_infrastructure_ft: {
                bicycle_way:1, mixed_way:0.9, mixed_way_non_designated:0.9,
                bicycle_road:0.85, bicycle_lane:0.75, bus_lane:0.75,
                shared_lane:0.5, undefined:0.2, no:0, no_separate:0
            },
            pedestrian_infrastructure_ft: {
                pedestrian_area:1, pedestrian_way:1, mixed_way:0.5,
                mixed_way_non_designated:0.5, stairs:0.3, sidewalk:0.85,
                no:0, no_separate:0
            },
            designated_route_ft: { international:1, national:0.9, regional:0.85, local:0.8, unknown:0.8, no:0 },
            road_category:       currentMode==='walkability'
                ? { no_mit:1, calmed:0.9, service:0.85, residential:0.8, secondary:0.2, primary:0, path:1 }
                : { no_mit:1, calmed:0.9, service:0.85, residential:0.8, secondary:0.2, primary:0 },
            parking:             { forbidden:1, implicit:0.5, allowed:0 },
            pavement:            { asphalt:1, gravel:0.75, soft:0.4, cobble:0 },
            lighting:            { yes:1, intermittent:0.5, no:0 },
        };
        if (CAT[key]) {
            const v = String(raw).toLowerCase().trim().replace(/ /g,'_');
            const m = CAT[key][v];
            return m !== undefined ? m : null;
        }
        if (['bridge','tunnel','stairs','access_bicycle_ft','access_pedestrian_ft'].includes(key))
            return (raw === true || raw === 'true') ? 1 : 0;
        const num = parseFloat(raw);
        if (isNaN(num)) return null;
        switch (key) {
            case 'greenness':        return num > 75 ? 1 : num > 50 ? 0.9 : num > 25 ? 0.8 : num > 0 ? 0.7 : 0;
            case 'water':            return num > 0 ? 1 : 0;
            case 'sights':           return num > 0 ? 1 : 0;
            case 'attractiveness':   return num > 0 ? 1 : 0;
            case 'traffic_calming': return num > 0 ? Math.min(1, num/3)  : 0;
            case 'play_and_outdoor': return num > 0 ? 1 : 0;
            case 'eating_facilities':return num > 0 ? 1 : 0;
            case 'facilities':       return num > 0 ? 1 : 0;
            case 'comfort_facilities':return num > 0 ? 1 : 0;
            case 'benches':          return num > 0 ? 1 : 0;
            case 'crossings': {
                if (num > 0) return 1;
                const rc = String((allProps && allProps.road_category) || '').toLowerCase();
                if (rc === 'primary' || rc === 'secondary' || rc === '') return 0;
                if (rc === 'residential') return 0.5;
                return 1;
            }
            case 'noise':            return num > 70 ? 0 : num > 55 ? 0.6 : num > 10 ? 0.8 : 1;
            case 'max_speed_ft': case 'max_speed_greatest':
                return num >= 100 ? 0 : num >= 80 ? 0.2 : num >= 70 ? 0.3 : num >= 60 ? 0.4 : num >= 50 ? 0.6 : num >= 30 ? 0.85 : num > 0 ? 0.9 : 1;
            case 'gradient_ft': {
                const gWalk = {4:0.25, 3:0.5, 2:0.7, 1:1, 0:1, '-1':1, '-2':0.7, '-3':0.5, '-4':0.25};
                const gBike = {4:0, 3:0.25, 2:0.4, 1:0.5, 0:0.9, '-1':1, '-2':0.95, '-3':0.35, '-4':0};
                const gMap  = currentMode === 'walkability' ? gWalk : gBike;
                const r = gMap[String(Math.round(num))];
                return r !== undefined ? r : 0.5;
            }
            case 'width':           return num > 5 ? 1 : num > 4 ? 0.9 : num > 3 ? 0.85 : num > 2 ? 0.5 : 0;
            case 'number_lanes_ft': return num > 4 ? 0 : num > 3 ? 0.1 : num > 2 ? 0.2 : num > 1 ? 0.5 : 1;
            case 'buildings':       return num >= 80 ? 0 : num > 60 ? 0.2 : num > 40 ? 0.4 : num > 20 ? 0.6 : num > 0 ? 0.8 : 1;
            default: return null;
        }
    }

    function fmtValue(key, raw) {
        if (raw === null || raw === undefined || raw === '') return '–';
        if (raw === true  || raw === 'true')  return 'Yes';
        if (raw === false || raw === 'false') return 'No';
        const CAT = ['bicycle_infrastructure_ft','pedestrian_infrastructure_ft','designated_route_ft','road_category','parking','pavement','lighting'];
        if (CAT.includes(key)) return String(raw).replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());
        const num = parseFloat(raw); if (isNaN(num)) return String(raw);
        if (['max_speed_ft','max_speed_greatest'].includes(key)) return num + ' km/h';
        if (key === 'width')       return num.toFixed(1) + ' m';
        if (key === 'noise')       return num.toFixed(0) + ' dB';
        if (['greenness','water','buildings'].includes(key)) return num + '%';
        if (key === 'gradient_ft') return (num > 0 ? '+' : '') + num;
        if (key === 'traffic_calming') return num > 0 ? num + ' measures' : 'None';
        return num % 1 === 0 ? String(num) : num.toFixed(1);
    }

    function scoreColor(v) {
        if (v === null || v === undefined || isNaN(v)) return '#9ca3af';
        if (v <= 0.20) return '#E24B4A'; if (v <= 0.40) return '#EF9F27';
        if (v <= 0.60) return '#F5C518'; if (v <= 0.80) return '#97C459';
        return '#378ADD';
    }

    function scoreLabel(v) {
        if (!v || isNaN(v)) return 'No data';
        if (v <= 0.20) return 'Poor'; if (v <= 0.40) return 'Average';
        if (v <= 0.60) return 'Moderate'; if (v <= 0.80) return 'Good';
        return 'Excellent';
    }

    const CHIP_RANGES = [
        { min:0.0,  max:0.20, label:'0.00 – 0.20' },
        { min:0.20, max:0.40, label:'0.21 – 0.40' },
        { min:0.40, max:0.60, label:'0.41 – 0.60' },
        { min:0.60, max:0.80, label:'0.61 – 0.80' },
        { min:0.80, max:1.00, label:'0.81 – 1.00' },
    ];
    let thresholdMax  = 1.0;
    let thresholdLabel = null;

    function applyThreshold() {
        const el = document.getElementById('threshold-value');
        if (el) el.textContent = (threshold === 0.0 && thresholdMax === 1.0)
            ? 'All routes'
            : (thresholdLabel || (threshold.toFixed(2) + ' – ' + thresholdMax.toFixed(2)));
        const mk = document.getElementById('legend-marker');
        if (mk) mk.style.left = (threshold * 100).toFixed(1) + '%';
        const lid  = currentMode === 'walkability' ? 'walkability-layer' : 'bikeability-layer';
        const prop = currentMode === 'walkability' ? 'index_walk_ft' : 'index_bike_ft';
        // Same sentinel guard as sharedPaint()/highlightColorExpr() — a road with
        // no score for the current mode (e.g. a pedestrian-only path has no
        // index_bike_ft key at all) makes ['get', prop] return null. Comparing
        // null directly against a number throws "Expected value to be of type
        // number, but found null instead", which previously left these roads in
        // an inconsistent render state (visible with a stale/wrong color until
        // clicked, at which point the real — missing — data showed "No data").
        // Coalescing to -1 first means the comparison always sees a real number,
        // so no-data roads are cleanly excluded by every tier filter instead.
        const val = ['coalesce', ['get', prop], -1];
        // Only gate on the layer existing, not isStyleLoaded() — see the mode
        // toggle handler for why: that check can be transiently false during
        // ordinary tile loading, causing a tier filter to silently fail to
        // apply and leave a stale/wrong filter (or no filter) on the layer.
        if (map && map.getLayer(lid)) {
            if (threshold === 0.0 && thresholdMax === 1.0) map.setFilter(lid, null);
            else if (thresholdMax < 1.0) {
                const lowerOp = threshold === 0.0 ? '>=' : '>';
                map.setFilter(lid, ['all', [lowerOp, val, threshold], ['<=', val, thresholdMax]]);
            }
            else map.setFilter(lid, ['>=', val, threshold]);
        }
    }

    document.querySelectorAll('.face-chip').forEach((chip, i) => {
        chip.addEventListener('click', () => {
            // A chip can be visually highlighted just to show which tier the
            // currently pinned road belongs to (see snapSliderToScore), without
            // any real filter being applied. Only treat it as "already active"
            // if threshold/thresholdMax have actually moved off the unfiltered
            // default — otherwise a manual click here would be misread as
            // "turn this filter off" when nothing was actually filtering yet.
            const already = chip.classList.contains('fc-active') && (threshold !== 0.0 || thresholdMax !== 1.0);
            document.querySelectorAll('.face-chip').forEach(c => c.classList.remove('fc-active'));
            if (already) {
                threshold = 0.0; thresholdMax = 1.0; thresholdLabel = null;
                document.getElementById('clear-filter').style.display = 'none';
            } else {
                chip.classList.add('fc-active');
                threshold      = CHIP_RANGES[i].min;
                thresholdMax   = CHIP_RANGES[i].max;
                thresholdLabel = CHIP_RANGES[i].label;
                document.getElementById('clear-filter').style.display = 'block';
            }
            applyThreshold();
            if (typeof clearPin === 'function') clearPin();
        });
    });

    document.getElementById('clear-filter-btn').addEventListener('click', () => {
        document.querySelectorAll('.face-chip').forEach(c => c.classList.remove('fc-active'));
        threshold = 0.0; thresholdMax = 1.0; thresholdLabel = null;
        document.getElementById('clear-filter').style.display = 'none';
        applyThreshold();
        if (typeof clearPin === 'function') clearPin();
    });

    let thresholdTimer = null;
    function applyThresholdDebounced() {
        clearTimeout(thresholdTimer);
        thresholdTimer = setTimeout(applyThreshold, 80);
    }

    const qualityTrack = document.getElementById('quality-track');
    if (qualityTrack) {
        let dragging = false;
        function handleSlider(e) {
            const r = qualityTrack.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            threshold = Math.round(Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * 100) / 100;
            thresholdMax = 1.0;
            thresholdLabel = null;
            document.querySelectorAll('.face-chip').forEach(c => c.classList.remove('fc-active'));
            document.getElementById('clear-filter').style.display = 'none';
            const mk = document.getElementById('legend-marker');
            if (mk) mk.style.left = (threshold * 100).toFixed(1) + '%';
            const el = document.getElementById('threshold-value');
            if (el) el.textContent = threshold === 0.0 ? 'All routes' : threshold.toFixed(2) + ' – 1.00';
            applyThresholdDebounced();
        }
        qualityTrack.addEventListener('click',      handleSlider);
        qualityTrack.addEventListener('mousedown',  () => { dragging = true; });
        document.addEventListener('mousemove', e => { if (dragging) handleSlider(e); });
        document.addEventListener('mouseup',   () => { if (dragging) { dragging = false; applyThreshold(); } });
    }

    document.querySelectorAll('.mode-btn[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode; if (mode === currentMode) return;
            currentMode = mode;
            threshold = 0.0;
            document.querySelectorAll('.face-chip').forEach(c => c.classList.remove('fc-active'));
            document.getElementById('clear-filter').style.display = 'none';
            document.querySelectorAll('.mode-btn[data-mode]').forEach(b => b.classList.remove('active-walk','active-bike'));
            btn.classList.add(mode === 'walkability' ? 'active-walk' : 'active-bike');
            const fsMode = document.getElementById('fs-hud-mode');
            if (fsMode) fsMode.innerHTML = mode === 'walkability'
                ? '<i class="ti ti-walk"></i> Walkability'
                : '<i class="ti ti-bike"></i> Bikeability';
            // Only gate on the layer actually existing — isStyleLoaded() can be
            // transiently false during ordinary tile loading (a pan, zoom, or
            // right after a city switch), which has nothing to do with whether
            // it's safe to call setLayoutProperty. Gating on it here meant this
            // visibility swap could silently no-op, leaving BOTH layers visible
            // at once — since bikeability-layer sits on top, any gap in it (a
            // filtered-out or no-data road) let walkability-layer's color show
            // through underneath. That's what caused roads to render one color
            // but report a different score on hover/click.
            if (map && map.getLayer('walkability-layer')) {
                map.setLayoutProperty('walkability-layer', 'visibility', mode === 'walkability' ? 'visible' : 'none');
                map.setLayoutProperty('bikeability-layer', 'visibility', mode === 'bikeability' ? 'visible' : 'none');
            }
            if (map && map.getLayer('highlight-layer-inner')) {
                map.setPaintProperty('highlight-layer-inner', 'line-color', highlightColorExpr());
            }
            applyThreshold();
            if (typeof clearPin === 'function') clearPin();
            if (currentProps) showDetail(currentProps);
        });
    });

    document.querySelectorAll('.mode-btn[data-city]').forEach(btn => {
        btn.addEventListener('click', () => {
            const city = btn.dataset.city;
            if (city === currentCity) return;
            if (typeof clearPin === 'function') clearPin();
            switchCity(city);
        });
    });

    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active'); currentChartType = tab.dataset.chart;
            if (currentProps) renderChart(currentProps);
        });
    });

    let rpTab = 'metrics';
    document.querySelectorAll('.rp-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            rpTab = btn.dataset.tab;
            document.querySelectorAll('.rp-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('rp-panel-metrics').style.display    = rpTab === 'metrics'    ? '' : 'none';
            document.getElementById('rp-panel-experience').style.display = rpTab === 'experience' ? '' : 'none';
            updateRingLabels();
        });
    });

    function showEmpty() {
        document.getElementById('detail-empty').style.display  = 'flex';
        document.getElementById('detail-loaded').style.display = 'none';
        if (breakdownChart) { breakdownChart.destroy(); breakdownChart = null; }
        currentProps = null;
        if (map) setHighlight(null);
        // Clear the road-tier chip indicator once nothing is selected — but
        // only if there's no real, user-applied filter currently active
        // (threshold/thresholdMax still at the unfiltered default). If the
        // user genuinely filtered by a chip themselves, that stays untouched.
        if (threshold === 0.0 && thresholdMax === 1.0) {
            document.querySelectorAll('.face-chip').forEach(c => c.classList.remove('fc-active'));
            const el = document.getElementById('threshold-value');
            if (el) el.textContent = 'All routes';
            const mk = document.getElementById('legend-marker');
            if (mk) mk.style.left = '0%';
        }
    }

    function showDetail(props) {
        currentProps = props;
        document.getElementById('detail-empty').style.display  = 'none';
        document.getElementById('detail-loaded').style.display = 'block';
        document.getElementById('map-hint').classList.add('hidden');

        const ik    = currentMode === 'walkability' ? 'index_walk_ft' : 'index_bike_ft';
        const score = parseFloat(props[ik]);
        const sc    = isNaN(score) ? null : score;
        const color = scoreColor(sc);
        const arc   = document.getElementById('ring-arc');
        const C     = 2 * Math.PI * 26;
        if (arc) { arc.style.strokeDashoffset = sc === null ? C : C*(1-sc); arc.style.stroke = color; }
        const rv = document.getElementById('ring-value');
        if (rv) rv.textContent = sc === null ? '-' : sc.toFixed(2);
        const sl = document.getElementById('detail-score-label');
        if (sl) { sl.textContent = scoreLabel(sc); sl.style.color = color; }

        const TIERS = [
            { max:0.2, key:'poor',      icon:'ti-mood-sad',    hero:'This street is Not Teens-Friendly',   svg:'<svg viewBox="0 0 24 24" fill="currentColor" width="38" height="38"><circle cx="12" cy="12" r="10"/><circle cx="9" cy="10" r="1.2" fill="white"/><circle cx="15" cy="10" r="1.2" fill="white"/><path d="M8.5 16 Q12 13 15.5 16" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>' },
            { max:0.4, key:'average',   icon:'ti-mood-empty',  hero:'This street Needs Improvement',       svg:'<svg viewBox="0 0 24 24" fill="currentColor" width="38" height="38"><circle cx="12" cy="12" r="10"/><circle cx="9" cy="10" r="1.2" fill="white"/><circle cx="15" cy="10" r="1.2" fill="white"/><line x1="9" y1="15.5" x2="15" y2="15.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>' },
            { max:0.6, key:'moderate',  icon:'ti-mood-smile',  hero:'This street is Fair for Teens',    svg:'<svg viewBox="0 0 24 24" fill="currentColor" width="38" height="38"><circle cx="12" cy="12" r="10"/><circle cx="9" cy="10" r="1.2" fill="white"/><circle cx="15" cy="10" r="1.2" fill="white"/><path d="M8.5 14 Q12 17 15.5 14" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>' },
            { max:0.8, key:'good',      icon:'ti-mood-happy',  hero:'This street is Teen-Friendly',       svg:'<svg viewBox="0 0 24 24" fill="currentColor" width="38" height="38"><circle cx="12" cy="12" r="10"/><circle cx="9" cy="10" r="1.2" fill="white"/><circle cx="15" cy="10" r="1.2" fill="white"/><path d="M8 13.5 Q12 18 16 13.5" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>' },
            { max:1.0, key:'excellent', icon:'ti-mood-wink',   hero:'A great Street for Teens',  svg:'<svg viewBox="0 0 24 24" fill="currentColor" width="38" height="38"><circle cx="12" cy="12" r="10"/><path d="M8 10 Q9 9 10 10" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/><circle cx="15" cy="10" r="1.2" fill="white"/><path d="M8 13.5 Q12 18 16 13.5" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>' },
        ];
        const tier = sc === null ? TIERS[2] : TIERS.find(t => sc <= t.max) || TIERS[4];
        const isDark = document.body.classList.contains('dark-mode');
        const hBg  = color;
        const hCol = '#ffffff';

        const heroEl   = document.getElementById('rp-hero');
        const heroText = document.getElementById('rp-hero-text');
        if (heroEl)   { heroEl.style.background = hBg; }
        if (heroText) { heroText.textContent = tier.hero; heroText.style.color = hCol; }

        const moodIcon = document.getElementById('rp-mood-icon');
        if (moodIcon) {
            const svgEl = tier.svg.replace('fill="currentColor"', 'fill="' + color + '"');
            moodIcon.innerHTML = svgEl;
            moodIcon.style.background = 'transparent';
            moodIcon.style.color = color;
        }

        const rt = document.getElementById('detail-road-type');
        if (rt) { rt.textContent = (props.road_category || props.net_type || '').replace(/_/g, ' '); }
        const dl = document.getElementById('detail-length');
        const len = parseFloat(props.length);
        if (dl) dl.textContent = isNaN(len) ? '' : (len < 1000 ? len.toFixed(0) + ' m' : (len/1000).toFixed(2) + ' km');

        renderChart(props);

        const indList = document.getElementById('indicator-list');
        indList.innerHTML = '';
        indList.className = 'indicator-grid';
        let lastGroup = null;
        getIndicators().forEach(def => {
            if (def.group !== lastGroup) {
                lastGroup = def.group;
                const g   = GROUPS.find(gr => gr.id === def.group);
                const hdr = document.createElement('div');
                hdr.className = 'ind-grid-group-header';
                hdr.innerHTML = '<span class="ind-group-dot" style="background:' + g.color + '"></span>' + g.label;
                indList.appendChild(hdr);
            }
            const raw    = props[def.key];
            const { value: norm } = getIndicatorScore(def, props);
            const isNull = norm === null;
            const isZeroWeight = def.weight === 0;
            const barPct   = isNull ? 0 : Math.max(0, Math.min(1, norm));
            const barColor = isNull ? '#d1d5db' : scoreColor(barPct);
            const valTxt   = fmtValue(def.key, raw);
            const card = document.createElement('div');
            card.className = 'ind-flip' + (isNull ? (isZeroWeight ? ' ind-pending' : ' ind-null') : '');
            card.innerHTML =
                '<div class="ind-flip-inner">' +
                  '<div class="ind-flip-front ' + (isNull ? 'ind-front-null' : def.color + ' ind-front-active') + '">' +
                    (def.key === 'traffic_calming' && isNull ? '<div class="ind-pending-badge">Soon</div>' : '') +
                    '<div class="ind-flip-front-icon"><i class="ti ' + def.icon + '"></i></div>' +
                    '<div class="ind-flip-front-label">' + def.label + '</div>' +
                    '<div class="ind-flip-front-val">' + valTxt + '</div>' +
                    '<div class="ind-flip-front-bar"><div class="ind-flip-front-bar-fill" style="width:' + (barPct*100).toFixed(1) + '%;background:' + barColor + '"></div></div>' +
                  '</div>' +
                  '<div class="ind-flip-back">' +
                    '<div class="ind-flip-back-title">' + def.label + '</div>' +
                    '<div class="ind-flip-back-scroll"><p class="ind-flip-back-text">' + def.def + '</p></div>' +
                  '</div>' +
                '</div>';
            card.addEventListener('click', () => card.classList.toggle('flipped'));
            indList.appendChild(card);
        });

        renderExperience(props, tier);
    }

    function renderExperience(props, tier) {
        const isWalk = currentMode === 'walkability';
        const overall = parseFloat(isWalk ? props.index_walk_ft : props.index_bike_ft);
        const sc = isNaN(overall) ? null : overall;

        const TIERS = [
            { max:0.2, key:'poor'      },
            { max:0.4, key:'average'   },
            { max:0.6, key:'moderate'  },
            { max:0.8, key:'good'      },
            { max:1.0, key:'excellent' },
        ];
        if (!tier) tier = sc === null ? TIERS[2] : TIERS.find(t => sc <= t.max) || TIERS[4];
        const tierKey = tier.key || (sc === null ? 'moderate'
            : sc > 0.8 ? 'excellent' : sc > 0.6 ? 'good'
            : sc > 0.4 ? 'moderate'  : sc > 0.2 ? 'average' : 'poor');

        const TIER_THEME = {
            excellent: { bg:'rgba(55,138,221,0.08)',  border:'rgba(55,138,221,0.22)',  text:'#185FA5', textDark:'#93c5fd', bgDark:'rgba(55,138,221,0.12)',  borderDark:'rgba(55,138,221,0.3)'  },
            good:      { bg:'rgba(59,109,17,0.07)',   border:'rgba(59,109,17,0.2)',    text:'#3B6D11', textDark:'#86c83c', bgDark:'rgba(59,109,17,0.12)',   borderDark:'rgba(59,109,17,0.3)'   },
            moderate:  { bg:'rgba(180,83,9,0.07)',    border:'rgba(180,83,9,0.2)',     text:'#92400e', textDark:'#fdba74', bgDark:'rgba(180,83,9,0.12)',    borderDark:'rgba(180,83,9,0.3)'    },
            average:   { bg:'rgba(239,159,39,0.08)',  border:'rgba(239,159,39,0.22)',  text:'#78350f', textDark:'#fbbf24', bgDark:'rgba(239,159,39,0.12)',  borderDark:'rgba(239,159,39,0.3)'  },
            poor:      { bg:'rgba(226,75,74,0.07)',   border:'rgba(226,75,74,0.2)',    text:'#991b1b', textDark:'#fca5a5', bgDark:'rgba(226,75,74,0.12)',   borderDark:'rgba(226,75,74,0.3)'   },
        };
        const isDark = document.body.classList.contains('dark-mode');
        const theme  = TIER_THEME[tierKey] || TIER_THEME.moderate;
        const qWrap  = document.getElementById('exp-quote-wrap');
        if (qWrap) {
            qWrap.style.background   = isDark ? theme.bgDark   : theme.bg;
            qWrap.style.borderColor  = isDark ? theme.borderDark: theme.border;
            const qMark = qWrap.querySelector('.exp-quote-mark');
            if (qMark) qMark.style.color = isDark ? theme.textDark : theme.text;
        }
        const quoteIcon = document.querySelector('.exp-quote-icon');
        if (quoteIcon) { quoteIcon.style.color = isDark ? theme.textDark : theme.text; }
        const qByline = document.querySelector('.exp-quote-byline');
        if (qByline) { qByline.style.color = isDark ? theme.textDark : theme.text; }

        const QUOTES = {
            excellent: "I love this street. I would totally come here by myself.",
            good:      "Pretty good. I feel safe here, even if it is not super exciting.",
            moderate:  "It is okay. Not scary, but not really fun either.",
            average:   "I do not love this street. The cars go too fast.",
            poor:      "This street makes me nervous. I would not want to walk here alone.",
        };
        const CONTEXT = {
            excellent: 'This street scores highly across safety, comfort, and joy. One of the best for teens to travel independently.',
            good:      'This street is easy to navigate and mostly safe for teens, with some room to improve on comfort or interest.',
            moderate:  'This street is accessible for teens but has some limitations. Higher traffic levels may make independent travel more challenging.',
            average:   'This street has gaps in safety or comfort. Teens would benefit from adult accompaniment here.',
            poor:      'This street scores poorly for teens mobility. Infrastructure improvements are needed before it is suitable for independent teen travel.',
        };
        const quoteEl = document.getElementById('exp-quote');
        if (quoteEl) {
            quoteEl.textContent = QUOTES[tierKey];
            quoteEl.style.color = isDark ? theme.textDark : theme.text;
        }
        const ctxEl = document.getElementById('exp-context');
        if (ctxEl) {
            ctxEl.textContent = CONTEXT[tierKey];
            ctxEl.style.color = isDark ? theme.textDark : theme.text;
        }

        const greenRaw = parseFloat(props['greenness']);
        const hasGreenery = !isNaN(greenRaw) && greenRaw > 40;

        let mood;
        if (sc === null || sc <= 0.2) {
            mood = { label:'Dangerous',  icon:'ti-alert-triangle', color:'#dc2626' };
        } else if (sc <= 0.4) {
            mood = { label:'Busy',       icon:'ti-car',            color:'#ea580c' };
        } else if (sc <= 0.6) {
            mood = hasGreenery
                 ? { label:'Relaxing',   icon:'ti-trees',          color:'#16a34a' }
                 : { label:'Dull',       icon:'ti-zzz',            color:'#ca8a04' };
        } else if (sc <= 0.8) {
            mood = hasGreenery
                 ? { label:'Relaxing',   icon:'ti-trees',          color:'#16a34a' }
                 : { label:'Welcoming',  icon:'ti-sun',            color:'#2563eb' };
        } else {
            mood = { label:'Welcoming',  icon:'ti-sun',            color:'#2563eb' };
        }

        const moodPill = document.getElementById('exp-mood-pill');
        if (moodPill) {
            moodPill.innerHTML = '<i class="ti ' + mood.icon + '" style="color:' + mood.color + '"></i> ' + mood.label;
            moodPill.style.color = mood.color;
        }

        const CHECKLIST_ITEMS = [
            { key: isWalk ? 'pedestrian_infrastructure_ft' : 'bicycle_infrastructure_ft',
              label: isWalk ? 'Dedicated footway' : 'Dedicated bike lane',
              icon: isWalk ? 'ti-walk' : 'ti-bike',
              passTest: v => v >= 0.5 },
            { key: 'lighting',        label: 'Street lighting',   icon: 'ti-bulb',          passTest: v => v >= 0.5 },
            { key: 'max_speed_ft',    label: 'Safe speed limit',  icon: 'ti-gauge',         passTest: v => v >= 0.6 },
            { key: 'crossings',       label: 'Crossings',         icon: 'ti-arrows-cross',  passTest: v => v > 0, walkOnly: true },
            { key: 'greenness',       label: 'Greenery',          icon: 'ti-trees',         passTest: v => v >= 0.7 },
            { key: 'noise',           label: 'Quiet environment', icon: 'ti-ear',           passTest: v => v >= 0.6 },
            { key: 'play_and_outdoor',label: 'Play areas',        icon: 'ti-mood-kid',      passTest: v => v > 0 },
            { key: 'eating_facilities',   label: 'Eating spots',          icon: 'ti-tools-kitchen', passTest: v => v > 0 },
            { key: 'comfort_facilities',  label: 'Comfort facilities',    icon: 'ti-armchair',  passTest: v => v > 0 },
        ];
        const expChecklist = document.getElementById('exp-checklist');
        if (expChecklist) {
            expChecklist.innerHTML = '';
            CHECKLIST_ITEMS.filter(item => !item.walkOnly || isWalk).forEach(item => {
                const raw    = props[item.key];
                const { value: norm } = getIndicatorScore(item, props);
                const isNull = norm === null;
                const pass   = !isNull && item.passTest(norm);
                const rowClass   = isNull ? 'row-miss' : (pass ? 'row-pass' : 'row-fail');
                const statusClass= isNull ? 'miss'     : (pass ? 'pass'     : 'fail');
                const statusIcon = isNull ? 'ti-minus' : (pass ? 'ti-check' : 'ti-x');
                const row = document.createElement('div');
                row.className = 'exp-check-row ' + rowClass;
                row.innerHTML =
                    '<i class="ti ' + item.icon + ' exp-check-ind-icon"></i>' +
                    '<span class="exp-check-label">' + item.label + '</span>' +
                    '<div class="exp-check-status ' + statusClass + '"><i class="ti ' + statusIcon + '"></i></div>';
                expChecklist.appendChild(row);
            });
        }

        const IMPROVE_MAP = [
            { key: isWalk ? 'pedestrian_infrastructure_ft' : 'bicycle_infrastructure_ft',
              threshold: 0.5, icon: isWalk ? 'ti-walk' : 'ti-bike',
              text: isWalk ? 'Add a dedicated footway' : 'Add a protected cycle lane',
              color: '#2563eb' },
            { key: 'greenness',          threshold: 0.7, icon: 'ti-trees',         text: 'Plant street trees and greenery',               color: '#16a34a' },
            { key: 'crossings',          threshold: 0.3, icon: 'ti-arrows-cross',  text: 'Add pedestrian crossings', walkOnly: true,       color: '#ca8a04' },
            { key: 'comfort_facilities', threshold: 0.1, icon: 'ti-armchair',      text: 'Add seating and rest spots',                    color: '#7c3aed' },
            { key: 'lighting',           threshold: 0.5, icon: 'ti-bulb',          text: 'Improve street lighting',                       color: '#f59e0b' },
            { key: 'noise',              threshold: 0.5, icon: 'ti-ear',           text: 'Reduce traffic noise',                          color: '#6b7280' },
            { key: 'max_speed_ft',       threshold: 0.6, icon: 'ti-gauge',         text: 'Enforce lower speed limits',                    color: '#dc2626' },
            { key: 'play_and_outdoor',   threshold: 0.1, icon: 'ti-mood-kid',      text: 'Add nearby play spaces',                        color: '#db2777' },
            { key: 'eating_facilities',  threshold: 0.05,icon: 'ti-tools-kitchen', text: 'Attract food kiosks or cafes',                  color: '#ea580c' },
            { key: 'road_category',      threshold: 0.8, icon: 'ti-road',          text: 'Improve road classification for children',      color: '#0891b2' },
        ];

        const ideas = [];
        IMPROVE_MAP.filter(item => !item.walkOnly || isWalk).forEach(item => {
            const raw  = props[item.key];
            const { value: norm } = getIndicatorScore(item, props);
            if (norm !== null && norm < item.threshold) ideas.push(item);
        });

        const improveWrap = document.getElementById('exp-improve-wrap');
        if (improveWrap) {
            if (ideas.length === 0) {
                improveWrap.style.display = 'none';
                const prevTitle = document.getElementById('exp-improve-title-el');
                if (prevTitle) prevTitle.style.display = 'none';
            } else {
                improveWrap.style.display = '';
                let titleEl = document.getElementById('exp-improve-title-el');
                if (!titleEl) {
                    titleEl = document.createElement('h3');
                    titleEl.id = 'exp-improve-title-el';
                    titleEl.className = 'detail-section-title sec-exp-improve';
                    titleEl.innerHTML = '<i class="ti ti-tool"></i> Improvement Ideas';
                    improveWrap.parentNode.insertBefore(titleEl, improveWrap);
                }
                titleEl.style.display = '';
                improveWrap.innerHTML =
                    '<div class="exp-improve-list">' +
                      ideas.slice(0, 5).map(x =>
                        '<div class="exp-improve-item" style="color:' + x.color + ';border-color:' + x.color + '22;background:' + x.color + '0d">' +
                          '<i class="ti ' + x.icon + '" style="color:' + x.color + '"></i>' + x.text +
                        '</div>'
                      ).join('') +
                    '</div>';
            }
        }
    }

    // =========================================================
    // CHART — only weighted indicators that have data  (FIXED)
    // =========================================================
    function renderChart(props) {
        if (breakdownChart) { breakdownChart.destroy(); breakdownChart = null; }
        const ctx = document.getElementById('breakdown-chart').getContext('2d');
        const labels=[], data=[], displayData=[], bg=[], bd=[];

        const indMeta = []; // parallel array to store def for tooltip

        GROUPS.forEach(g => {
            getIndicators()
                .filter(i => i.group === g.id && i.weight > 0) // only weighted indicators
                .forEach(ind => {
                    const { value: norm, source } = getIndicatorScore(ind, props);
                    if (norm === null) return; // only show indicators with real data
                    const col = scoreColor(norm);
                    const realPct = +(norm * 100).toFixed(1);
                    labels.push(ind.label);
                    data.push(realPct);
                    // Floor only the *drawn* bar width so a true 0 score is still
                    // visible as a thin sliver instead of disappearing entirely —
                    // the tooltip below still reports the real, unfloored value.
                    displayData.push(Math.max(2, realPct));
                    bg.push(col + 'cc');
                    bd.push(col);
                    indMeta.push({ key: ind.key, raw: props[ind.key], norm, source });
                });
        });

        // Compact rows — thin bars, tight spacing, matching the original design.
        const chartWrap = document.querySelector('.chart-wrap');
        if (chartWrap) chartWrap.style.height = Math.max(90, labels.length * 20) + 'px';

        breakdownChart = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets:[{
                data: displayData,
                backgroundColor: bg,
                borderColor: bd,
                borderWidth: 1,
                borderRadius: 3,
                borderSkipped: false,
                barPercentage: 0.5,
                categoryPercentage: 0.95,
            }]},
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 400 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        // Compact floating tooltip, back to appearing right at the
                        // hovered bar (not below the chart) — kept small (tight
                        // padding, single-line body, no color box) so it stays
                        // closer to the size of one row instead of the default
                        // Chart.js tooltip which is noticeably taller.
                        padding: 6,
                        displayColors: false,
                        titleFont: { family:'Nunito', size:10, weight:'700' },
                        bodyFont:  { family:'Nunito', size:10 },
                        callbacks: {
                            label: ctx => {
                                const m = indMeta[ctx.dataIndex];
                                if (!m) return '';
                                const raw  = fmtValue(m.key, m.raw);
                                const qual = scoreLabel(m.norm);
                                return raw + '  ·  ' + qual;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        min: 0, max: 100,
                        grid: { color: document.body.classList.contains('dark-mode') ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
                        ticks: {
                            font: { family:'Nunito', size:8 },
                            color: document.body.classList.contains('dark-mode') ? '#6b7280' : '#9ca3af',
                            callback: v => v + '%',
                            maxTicksLimit: 5
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            font: { family:'Nunito', size:9, weight:'600' },
                            color: document.body.classList.contains('dark-mode') ? '#d1d5db' : '#374151',
                            crossAlign: 'far',
                        }
                    }
                },
                layout: { padding: { right: 4 } }
            }
        });

        // Webfonts (Nunito, loaded with display:swap) can finish downloading
        // *after* Chart.js has already measured label metrics using a fallback
        // font. If that happens, tick labels end up laid out against the wrong
        // font's line-height/baseline and visually drift from their bars. Once
        // the real font is confirmed ready, force one re-layout to correct it.
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                if (breakdownChart) breakdownChart.update();
            });
        }
    }

    // =========================================================
    // FLOATING TOOLTIP
    // =========================================================
    const tooltip = document.createElement('div');
    tooltip.style.cssText = 'position:absolute;pointer-events:none;z-index:9999;border-radius:14px;padding:10px 13px;box-shadow:0 8px 28px rgba(15,23,42,0.14);font-family:Nunito,sans-serif;min-width:180px;display:none;backdrop-filter:blur(12px);transition:background 0.2s,border-color 0.2s;';
    const mapWrapperEl = document.querySelector('.map-wrapper');
    if (mapWrapperEl) mapWrapperEl.appendChild(tooltip);
    else document.body.appendChild(tooltip);

    function updateTooltipTheme() {
        const dark = document.body.classList.contains('dark-mode');
        tooltip.style.background   = dark ? 'rgba(30,40,55,0.97)' : 'rgba(255,252,248,0.97)';
        tooltip.style.border       = dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(120,110,95,0.18)';
        tooltip.style.color        = dark ? '#e5e7eb' : '#1f2937';
    }
    updateTooltipTheme();

    const darkToggleBtn = document.getElementById('dark-toggle');
    if (darkToggleBtn) darkToggleBtn.addEventListener('click', () => setTimeout(updateTooltipTheme, 20));

    function buildTooltip(props, clientX, clientY) {
        const isWalk = currentMode === 'walkability';
        const score  = parseFloat(isWalk ? props.index_walk_ft : props.index_bike_ft);
        const iconHtml = isWalk
            ? '<i class="ti ti-walk" style="font-size:18px;color:#3B6D11"></i>'
            : '<i class="ti ti-bike" style="font-size:18px;color:#185FA5"></i>';
        const road   = (props.road_category || props.net_type || '').replace(/_/g, ' ');
        const len    = parseFloat(props.length);
        const lenTxt = isNaN(len) ? '' : (len < 1000 ? len.toFixed(0) + ' m' : (len/1000).toFixed(2) + ' km');

        const v = isNaN(score) ? null : score;
        const c = scoreColor(v);
        const lbl = scoreLabel(v);
        const filled = Math.round((v || 0) * 10);
        const empty  = 10 - filled;

        updateTooltipTheme();
        const isDark = document.body.classList.contains('dark-mode');
        const textColor   = isDark ? '#f9fafb' : '#1f2937';
        const mutedColor  = isDark ? '#9ca3af' : '#6b7280';
        const dividerColor= isDark ? 'rgba(255,255,255,0.08)' : 'rgba(120,110,95,0.12)';
        const emptyBarClr = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';

        tooltip.innerHTML =
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:' + (road||lenTxt?'6':'0') + 'px">' +
              '<span style="display:flex;align-items:center">' + iconHtml + '</span>' +
              '<div style="flex:1">' +
                '<div style="display:flex;align-items:baseline;gap:6px;margin-bottom:2px">' +
                  '<span style="font-size:15px;font-weight:700;color:' + textColor + '">' + (v !== null ? v.toFixed(2) : '–') + '<span style="font-size:9px;color:' + mutedColor + '"> /1.0</span></span>' +
                  '<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:99px;background:' + c + '22;color:' + c + '">' + lbl + '</span>' +
                '</div>' +
                '<div style="font-size:12px;letter-spacing:1px;color:' + c + '">' + '█'.repeat(filled) + '<span style="color:' + emptyBarClr + '">' + '█'.repeat(empty) + '</span></div>' +
              '</div>' +
            '</div>' +
            (road || lenTxt ? '<div style="padding-top:5px;border-top:1px solid ' + dividerColor + ';font-size:10px;color:' + mutedColor + ';text-transform:capitalize">' + road + (road && lenTxt ? ' · ' : '') + lenTxt + '</div>' : '');

        const mapWrapper = document.querySelector('.map-wrapper');
        const rect = mapWrapper ? mapWrapper.getBoundingClientRect() : { left:0, top:0, width: window.innerWidth, height: window.innerHeight };
        const tw = 200, th = 120;
        const vw = rect.width;
        const vh = rect.height;
        let tx = clientX - rect.left + 16;
        let ty = clientY - rect.top  - 18;
        if (tx + tw > vw - 10) tx = (clientX - rect.left) - tw - 10;
        if (ty < 0) ty = 8;
        if (ty + th > vh - 10) ty = (clientY - rect.top) - th - 8;
        tooltip.style.left = tx + 'px';
        tooltip.style.top  = ty + 'px';
        tooltip.style.display = 'block';
    }

    // =========================================================
    // MAP
    // =========================================================
    map = new maplibregl.Map({
        container: 'map',
        style: 'https://tiles.openfreemap.org/styles/positron',
        center: [13.055, 47.809],
        zoom: 12,
        attributionControl: false,
        preserveDrawingBuffer: true
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.FullscreenControl({ container: document.querySelector('.map-wrapper') }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

    map.on('error', e => {
        console.error('Map error:', e && e.error);
    });
    let mapDidLoad = false;
    map.once('load', () => { mapDidLoad = true; });
    setTimeout(() => { if (!mapDidLoad) showMapLoadError(); }, 20000);

    function addMapLayers() {
        if (!map.getSource('netascore')) {
            map.addSource('netascore', { type:'vector', url:'pmtiles://' + TILESET_URL });
        }

        const sharedPaint = prop => {
            const val = ['coalesce', ['get', prop], -1];
            return {
                'line-width': ['interpolate',['linear'],['zoom'],10,0.6,12,1.4,14,2.2,16,4.0],
                'line-opacity': 0.85, 'line-blur': 0.1,
                'line-color': ['case',
                    ['<',  val, 0],    '#d1d5db',
                    ['<=', val, 0.20], '#E24B4A',
                    ['<=', val, 0.40], '#EF9F27',
                    ['<=', val, 0.60], '#F5C518',
                    ['<=', val, 0.80], '#97C459',
                    ['<=', val, 1.0],  '#378ADD',
                    '#9ca3af']
            };
        };

        const walkVis = currentMode === 'walkability' ? 'visible' : 'none';
        const bikeVis = currentMode === 'bikeability'  ? 'visible' : 'none';

        if (!map.getLayer('walkability-layer'))
            map.addLayer({ id:'walkability-layer', type:'line', source:'netascore', 'source-layer':SOURCE_LAYER, layout:{'line-cap':'round','line-join':'round', visibility: walkVis}, paint:sharedPaint('index_walk_ft') });
        if (!map.getLayer('bikeability-layer'))
            map.addLayer({ id:'bikeability-layer', type:'line', source:'netascore', 'source-layer':SOURCE_LAYER, layout:{'line-cap':'round','line-join':'round', visibility: bikeVis}, paint:sharedPaint('index_bike_ft') });
        if (!map.getLayer('highlight-layer'))
            map.addLayer({ id:'highlight-layer', type:'line', source:'netascore', 'source-layer':SOURCE_LAYER,
                layout:{'line-cap':'round','line-join':'round'},
                paint:{
                    'line-width':    ['interpolate',['linear'],['zoom'],10,4,12,6,14,9,16,13],
                    'line-color':    '#ffffff',
                    'line-opacity':  1,
                },
                filter:['==',['literal',false],true]} );
        if (!map.getLayer('highlight-layer-inner'))
            map.addLayer({ id:'highlight-layer-inner', type:'line', source:'netascore', 'source-layer':SOURCE_LAYER,
                layout:{'line-cap':'round','line-join':'round'},
                paint:{
                    'line-width':    ['interpolate',['linear'],['zoom'],10,2,12,3.5,14,5.5,16,8],
                    'line-color':    highlightColorExpr(),
                    'line-opacity':  1,
                },
                filter:['==',['literal',false],true]} );

        applyThreshold();
    }

    function highlightColorExpr() {
        const prop = currentMode === 'walkability' ? 'index_walk_ft' : 'index_bike_ft';
        const val  = ['coalesce', ['get', prop], -1];
        return ['case',
            ['<',  val, 0],    '#9ca3af',
            ['<=', val, 0.20], '#E24B4A',
            ['<=', val, 0.40], '#EF9F27',
            ['<=', val, 0.60], '#F5C518',
            ['<=', val, 0.80], '#97C459',
            '#378ADD'];
    }

    function setHighlight(osmId) {
        const f = osmId
            ? ['==', ['to-string', ['get','osm_id']], String(osmId)]
            : ['==', ['literal', false], true];
        if (map && map.getLayer('highlight-layer'))       map.setFilter('highlight-layer',       f);
        if (map && map.getLayer('highlight-layer-inner')) map.setFilter('highlight-layer-inner', f);
    }

    function switchCity(cityKey) {
        if (cityKey === currentCity || !CITIES[cityKey]) return;
        const cfg = CITIES[cityKey];
        currentCity  = cityKey;
        TILESET_URL  = cfg.tilesetUrl;
        SOURCE_LAYER = cfg.sourceLayer;

        ['highlight-layer-inner','highlight-layer','bikeability-layer','walkability-layer'].forEach(id => {
            if (map.getLayer(id)) map.removeLayer(id);
        });
        if (map.getSource('netascore')) map.removeSource('netascore');

        currentMode = 'walkability';
        threshold   = 0.0;
        document.querySelectorAll('.face-chip').forEach(c => c.classList.remove('fc-active'));
        const clearFilterEl = document.getElementById('clear-filter');
        if (clearFilterEl) clearFilterEl.style.display = 'none';
        document.querySelectorAll('.mode-btn[data-mode]').forEach(b => {
            b.classList.remove('active-walk','active-bike');
            if (b.dataset.mode === 'walkability') b.classList.add('active-walk');
        });
        const fsMode = document.getElementById('fs-hud-mode');
        if (fsMode) fsMode.innerHTML = '<i class="ti ti-walk"></i> Walkability';

        const locText = document.getElementById('map-location-text');
        if (locText) locText.textContent = cfg.label + ', ' + cfg.country;

        if (typeof clearPin === 'function') clearPin();

        const activePOITypes = [...document.querySelectorAll('.poi-chip[data-active="true"]')].map(b => b.dataset.poi);
        if (typeof clearAllPOIs === 'function') clearAllPOIs();

        const activeEnvKeys = [...document.querySelectorAll('.env-chip[data-active="true"]')].map(c => c.dataset.env);
        activeEnvKeys.forEach(key => {
            const layerId  = 'env-layer-' + key;
            const sourceId = 'env-' + key;
            if (map.getLayer(layerId + '-lowzoom')) map.removeLayer(layerId + '-lowzoom');
            if (map.getLayer(layerId))              map.removeLayer(layerId);
            if (map.getSource(sourceId))             map.removeSource(sourceId);
            const chip = document.querySelector(`.env-chip[data-env="${key}"]`);
            if (chip) { chip.dataset.active = 'false'; chip.classList.remove('active'); }
            if (key === 'lcu') { const el = document.getElementById('lcu-panel-legend'); if (el) el.style.display = 'none'; }
            if (key === 'stl') { const el = document.getElementById('stl-panel-legend'); if (el) el.style.display = 'none'; }
        });
        const anyEnvStillActive = document.querySelectorAll('.env-chip[data-active="true"]').length > 0;
        const envOpRow = document.getElementById('env-opacity-row');
        if (envOpRow && !anyEnvStillActive) envOpRow.style.display = 'none';

        const cityNote = document.getElementById('city-note');
        if (!cfg.hasEnv) {
            if (cityNote) cityNote.style.display = 'block';
        } else {
            if (cityNote) cityNote.style.display = 'none';
        }

        document.querySelectorAll('.mode-btn[data-city]').forEach(btn => {
            btn.classList.toggle('active-city', btn.dataset.city === cityKey);
        });

        const loadingOverlay = document.getElementById('map-loading-overlay');
        const loadingText    = document.getElementById('map-loading-text');
        if (loadingOverlay) { loadingOverlay.classList.remove('hidden'); if (loadingText) loadingText.textContent = 'Loading road network…'; }

        map.flyTo({ center: cfg.center, zoom: cfg.zoom, essential: true });
        addMapLayers();

        if (typeof resetCityFacts === 'function') resetCityFacts(cityKey);

        if (cfg.hasPOI) {
            activePOITypes.forEach(type => {
                const chip = document.querySelector(`.poi-chip[data-poi="${type}"]`);
                if (chip) chip.click();
            });
        }

        if (cfg.hasEnv) {
            activeEnvKeys.forEach(key => {
                const chip = document.querySelector(`.env-chip[data-env="${key}"]`);
                if (chip) chip.click();
            });
        }

        function checkRoadsVisible() {
            const features = map.queryRenderedFeatures(undefined, { layers: ['walkability-layer', 'bikeability-layer'] });
            if (features.length > 0) {
                if (loadingOverlay) loadingOverlay.classList.add('hidden');
                map.off('render', checkRoadsVisible);
            }
        }
        map.on('render', checkRoadsVisible);
        setTimeout(() => { if (loadingOverlay) loadingOverlay.classList.add('hidden'); map.off('render', checkRoadsVisible); }, 15000);
    }

    map.on('style.load', () => {
        addMapLayers();
        if (pinnedId) setHighlight(pinnedId);
        if (currentProps) setTimeout(() => renderChart(currentProps), 100);
    });

    map.on('load', () => {
        document.querySelectorAll('.maplibregl-ctrl-attrib').forEach(el => el.remove());

        const loadingOverlay = document.getElementById('map-loading-overlay');
        function hideLoadingOverlay() {
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
        }
        function checkRoadsVisible() {
            const features = map.queryRenderedFeatures(undefined, { layers: ['walkability-layer', 'bikeability-layer'] });
            if (features.length > 0) {
                hideLoadingOverlay();
                map.off('render', checkRoadsVisible);
            }
        }
        map.on('render', checkRoadsVisible);
        setTimeout(() => { hideLoadingOverlay(); map.off('render', checkRoadsVisible); }, 15000);

        const mlToggle  = document.getElementById('ml-toggle');
        const mlBody    = document.getElementById('ml-body');
        const mlChevron = document.getElementById('ml-chevron');
        if (mlToggle) {
            mlToggle.addEventListener('click', () => {
                const isOpen = mlBody.style.display !== 'none';
                mlBody.style.display = isOpen ? 'none' : 'block';
                mlChevron.classList.toggle('open', !isOpen);
            });
        }

        function setPinned(props) {
            pinnedId    = props ? String(props.osm_id) : null;
            pinnedProps = props || null;
            const badge = document.getElementById('pin-badge');
            if (badge) badge.style.display = props ? 'flex' : 'none';
            if (pinMarker) { pinMarker.remove(); pinMarker = null; }
        }

        function clearPin() {
            if (!pinnedId) return;
            setPinned(null);
            setHighlight(null);
            showEmpty();
        }

        function snapSliderToScore(score) {
            const chipIndex = score <= 0.2 ? 0 : score <= 0.4 ? 1 : score <= 0.6 ? 2 : score <= 0.8 ? 3 : 4;
            const range = CHIP_RANGES[chipIndex];
            // Purely a visual indicator of which tier this specific road falls
            // into — highlight the matching chip, move the slider marker, and
            // show the tier label. Deliberately does NOT touch the global
            // threshold/thresholdMax state or call applyThreshold(): clicking a
            // road to inspect it should never hide other tiers/roads on the
            // map. Only an actual chip click (or dragging the slider) should
            // ever filter what's visible.
            document.querySelectorAll('.face-chip').forEach((c, i) => {
                c.classList.toggle('fc-active', i === chipIndex);
            });
            const mk = document.getElementById('legend-marker');
            if (mk) mk.style.left = (range.min * 100).toFixed(1) + '%';
            const el = document.getElementById('threshold-value');
            if (el) el.textContent = range.label;
        }

        map.on('mousemove', e => {
            const feats = map.queryRenderedFeatures(e.point, { layers:['walkability-layer','bikeability-layer'] });
            if (!feats.length) {
                clearTimeout(hoverTimer); tooltip.style.display = 'none'; map.getCanvas().style.cursor = '';
                hoverTimer = setTimeout(() => {
                    if (!pinnedId) showEmpty();
                    else showDetail(pinnedProps);
                    lastHoverId = null;
                }, 150);
                return;
            }
            map.getCanvas().style.cursor = 'crosshair';
            const props = feats[0].properties; const osmId = String(props.osm_id);
            buildTooltip(props, e.originalEvent.clientX, e.originalEvent.clientY);
            if (osmId === lastHoverId) return;
            clearTimeout(hoverTimer); lastHoverId = osmId;
            hoverTimer = setTimeout(() => {
                showDetail(props);
                document.getElementById('map-hint').classList.add('hidden');
            }, 50);
        });

        map.on('mouseleave', () => {
            clearTimeout(hoverTimer); tooltip.style.display = 'none'; map.getCanvas().style.cursor = ''; lastHoverId = null;
            hoverTimer = setTimeout(() => {
                if (pinnedId) showDetail(pinnedProps);
                else showEmpty();
            }, 200);
        });

        map.on('click', e => {
            const t = e.originalEvent.target;
            if (t.closest('.poi-map-marker') || t.closest('.maplibregl-popup') || t.closest('.mapboxgl-popup')) return;
            const feats = map.queryRenderedFeatures(e.point, { layers:['walkability-layer','bikeability-layer'] });
            if (!feats.length) { setPinned(null); setHighlight(null); showEmpty(); return; }
            const props = feats[0].properties; const osmId = String(props.osm_id);
            if (pinnedId === osmId) {
                setPinned(null);
                setHighlight(null);
            } else {
                setPinned(props);
                setHighlight(osmId);
                const scoreVal = props[currentMode === 'walkability' ? 'index_walk_ft' : 'index_bike_ft'];
                if (scoreVal !== null && scoreVal !== undefined) snapSliderToScore(scoreVal);
            }
            document.getElementById('map-hint').classList.add('hidden');
        });

        ['walkability-layer','bikeability-layer'].forEach(id => {
            map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'crosshair'; });
            map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
        });

        const POI_BBOX = {
            salzburg: '47.77,12.98,47.84,13.13',
            olomouc:  '49.55,17.15,49.65,17.35',
        };

        const POI_CONFIG = {
            schools: {
                query: bbox => `[out:json][timeout:25];(node["amenity"="school"]["school:level"!="preschool"]["isced:level"!="0"](${bbox});way["amenity"="school"]["school:level"!="preschool"]["isced:level"!="0"](${bbox});node["amenity"="school"]["name"~"Gymnasium|Mittelschule|Hauptschule|Volksschule|Realschule|Schule|NMS|AHS|BHS|BMS|HTL|HAK|HLW",i](${bbox});way["amenity"="school"]["name"~"Gymnasium|Mittelschule|Hauptschule|Volksschule|Realschule|Schule|NMS|AHS|BHS|BMS|HTL|HAK|HLW",i](${bbox}););out center;`,
                color: '#DC2626', bg: '#FEE2E2',
                label: 'School'
            },
            sports: {
                query: bbox => `[out:json][timeout:25];(node["leisure"="pitch"](${bbox});way["leisure"="pitch"](${bbox});node["leisure"="sports_centre"](${bbox});way["leisure"="sports_centre"](${bbox});node["leisure"="stadium"](${bbox});way["leisure"="stadium"](${bbox}););out center;`,
                color: '#EA580C', bg: '#FFF7ED',
                label: 'Sports facility'
            },
            parks: {
                query: bbox => `[out:json][timeout:25];(way["leisure"="park"](${bbox});node["leisure"="park"](${bbox}););out center;`,
                color: '#16A34A', bg: '#DCFCE7',
                label: 'Park'
            },
            busstops: {
                query: bbox => `[out:json][timeout:25];node["highway"="bus_stop"](${bbox});out;`,
                color: '#2563EB', bg: '#DBEAFE',
                label: 'Bus stop'
            }
        };

        const poiCache   = {};
        const poiMarkers = {};
        const poiTooltip = document.createElement('div');
        poiTooltip.id = 'poi-tooltip';
        poiTooltip.style.cssText = `
            position: absolute;
            z-index: 9999;
            background: rgba(255,252,248,0.98);
            border: 1px solid rgba(120,110,95,0.18);
            border-radius: 10px;
            padding: 8px 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.12);
            font-family: Nunito, sans-serif;
            pointer-events: none;
            display: none;
            max-width: 200px;
            backdrop-filter: blur(10px);
        `;
        document.querySelector('.map-wrapper').appendChild(poiTooltip);

        function showPOITooltip(x, y, iconCfg, cfgLabel, name) {
            poiTooltip.innerHTML = 
                '<div style="font-size:10px;font-weight:700;color:' + iconCfg.color + ';margin-bottom:3px;text-transform:uppercase;letter-spacing:0.05em">' +
                '<i class="ti ' + iconCfg.icon + '"></i> ' + cfgLabel + '</div>' +
                '<div style="font-size:12px;font-weight:600;color:#1f2937">' + name + '</div>';
            const wrapper = document.querySelector('.map-wrapper').getBoundingClientRect();
            const tx = x - wrapper.left + 10;
            const ty = y - wrapper.top - 60;
            poiTooltip.style.left = tx + 'px';
            poiTooltip.style.top  = ty + 'px';
            poiTooltip.style.display = 'block';
        }

        function hidePOITooltip() {
            poiTooltip.style.display = 'none';
        }

        map.on('click', () => hidePOITooltip());
        map.on('dragstart', () => hidePOITooltip());

        async function fetchPOI(type) {
            const cacheKey = currentCity + '_' + type;
            if (poiCache[cacheKey]) return poiCache[cacheKey];
            const cfg  = POI_CONFIG[type];
            const bbox = POI_BBOX[currentCity];

            try {
                const resp = await fetch(`data/${type}_${currentCity}.geojson`);
                if (resp.ok) {
                    const geojson = await resp.json();
                    geojson.features = dedupePOIFeatures(geojson.features, type === 'busstops' ? 150 : 50);
                    poiCache[cacheKey] = geojson;
                    return geojson;
                }
            } catch (e) { /* fall through to live fetch */ }

            const endpoints = [
                'https://overpass.kumi.systems/api/interpreter',
                'https://overpass-api.de/api/interpreter',
                'https://overpass.openstreetmap.fr/api/interpreter',
            ];
            let data;
            const query = cfg.query(bbox);
            for (const endpoint of endpoints) {
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 20000);
                    const resp = await fetch(endpoint + '?data=' + encodeURIComponent(query), { signal: controller.signal });
                    clearTimeout(timeout);
                    if (!resp.ok) continue;
                    data = await resp.json();
                    break;
                } catch(e) { continue; }
            }
            if (!data) throw new Error('All Overpass endpoints failed');

            const features = data.elements.map(el => {
                const lat = el.lat ?? el.center?.lat;
                const lon = el.lon ?? el.center?.lon;
                if (!lat || !lon) return null;
                return {
                    type: 'Feature',
                    geometry: { type:'Point', coordinates:[lon, lat] },
                    properties: { name: el.tags?.name || cfg.label, type: cfg.label }
                };
            }).filter(Boolean);

            const geojson = { type:'FeatureCollection', features: dedupePOIFeatures(features, type === 'busstops' ? 150 : 50) };
            poiCache[cacheKey] = geojson;
            return geojson;
        }

        function dedupePOIFeatures(features, gridMeters = 50) {
            const kept = [];
            const cellSize = 111320 / gridMeters;
            const round = (n) => Math.round(n * cellSize) / cellSize;
            const normName = (s) => (s || '').trim().toLowerCase();
            for (const f of features) {
                const [lon, lat] = f.geometry.coordinates;
                const key = `${normName(f.properties.name)}|${round(lat)}|${round(lon)}`;
                if (!kept.some(k => k.key === key)) kept.push({ key, feature: f });
            }
            return kept.map(k => k.feature);
        }

        const poiSpinner = document.getElementById('poi-spinner');

        function showPOILoading(show) {
            if (poiSpinner) poiSpinner.style.display = show ? 'inline-block' : 'none';
        }

        const POI_ICONS = {
            schools: { icon: 'ti-school',         color: '#DC2626', bg: '#FEE2E2' },
            sports:  { icon: 'ti-ball-football',  color: '#92400E', bg: '#FEF3C7' },
            parks:   { icon: 'ti-trees',          color: '#16A34A', bg: '#DCFCE7' },
            busstops:{ icon: 'ti-bus',            color: '#2563EB', bg: '#DBEAFE' },
        };

        function addPOILayer(type, geojson) {
            const cfg     = POI_CONFIG[type];
            const iconCfg = POI_ICONS[type];
            if (poiMarkers[type]) {
                poiMarkers[type].forEach(m => m.remove());
            }
            poiMarkers[type] = [];

            geojson.features.forEach(feat => {
                const [lng, lat] = feat.geometry.coordinates;
                const name = feat.properties.name;

                const el = document.createElement('div');
                el.className = 'poi-map-marker';
                el.innerHTML = `<i class="ti ${iconCfg.icon}"></i>`;
                el.style.cssText = `
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: ${iconCfg.bg};
                    border: 1px solid ${iconCfg.color};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 6px;
                    color: ${iconCfg.color};
                    cursor: pointer;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                    flex-shrink: 0;
                    pointer-events: all;
                `;
                el.addEventListener('mouseenter', () => {
                    el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
                    el.style.borderWidth = '1.5px';
                });
                el.addEventListener('mouseleave', () => {
                    el.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2)';
                    el.style.borderWidth = '1px';
                });

                el.addEventListener('click', e => {
                    e.stopPropagation();
                    e.preventDefault();
                    const rect = el.getBoundingClientRect();
                    showPOITooltip(rect.left + rect.width / 2, rect.top, iconCfg, cfg.label, name);
                });

                el.addEventListener('mouseleave', () => {
                    setTimeout(hidePOITooltip, 2000);
                });

                const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
                    .setLngLat([lng, lat])
                    .addTo(map);

                poiMarkers[type].push(marker);
            });
        }

        function removePOILayer(type) {
            if (poiMarkers[type]) {
                poiMarkers[type].forEach(m => m.remove());
                poiMarkers[type] = [];
            }
        }

        function clearAllPOIs() {
            Object.keys(POI_CONFIG).forEach(type => {
                removePOILayer(type);
                const btn = document.querySelector(`.poi-chip[data-poi="${type}"]`);
                if (btn) { btn.dataset.active = 'false'; btn.classList.remove('active'); }
            });
            const clearPOI = document.getElementById('clear-poi');
            if (clearPOI) clearPOI.style.display = 'none';
        }

        const clearPOIBtn = document.getElementById('clear-poi-btn');
        if (clearPOIBtn) clearPOIBtn.addEventListener('click', clearAllPOIs);

        document.querySelectorAll('.poi-chip').forEach(btn => {
            btn.addEventListener('click', async () => {
                const type   = btn.dataset.poi;
                const active = btn.dataset.active === 'true';

                if (active) {
                    btn.dataset.active = 'false';
                    btn.classList.remove('active');
                    removePOILayer(type);
                    const anyActive = [...document.querySelectorAll('.poi-chip')].some(b => b.dataset.active === 'true');
                    const clearPOI = document.getElementById('clear-poi');
                    if (clearPOI) clearPOI.style.display = anyActive ? 'block' : 'none';
                } else {
                    btn.dataset.active = 'true';
                    btn.classList.add('active');
                    const clearPOI = document.getElementById('clear-poi');
                    if (clearPOI) clearPOI.style.display = 'block';

                    try {
                        showPOILoading(true);
                        const geojson = await fetchPOI(type);
                        showPOILoading(false);
                        addPOILayer(type, geojson);
                    } catch(err) {
                        console.error('POI fetch failed:', err);
                        showPOILoading(false);
                        btn.dataset.active = 'false';
                        btn.classList.remove('active');
                    }
                }
            });
        });
    });

    } catch (e) {
        console.error('Dashboard initialization failed:', e);
        showMapLoadError();
    }
});
// ══════════════════════════════════════════
// EXPORT MAP FEATURE
// ══════════════════════════════════════════
(function () {

    const SCORE_RANGES = {
        all:      { min: 0.0, max: 1.0  },
        poor:     { min: 0.0, max: 0.2  },
        average:  { min: 0.2, max: 0.4  },
        moderate: { min: 0.4, max: 0.6  },
        good:     { min: 0.6, max: 0.8  },
        excellent:{ min: 0.8, max: 1.01 },
    };

    const SCORE_COLORS = {
        poor:     '#E24B4A',
        average:  '#EF9F27',
        moderate: '#F5C518',
        good:     '#97C459',
        excellent:'#378ADD',
    };

    const openBtn   = document.getElementById('map-export-btn');
    const panel     = document.getElementById('export-panel');
    const closeBtn  = document.getElementById('export-panel-close');
    const btnPdf    = document.getElementById('export-btn-pdf');
    const btnPng    = document.getElementById('export-btn-png');

    if (!openBtn || !panel) return;

    function openPanel() {
        panel.classList.add('open');
    }
    function closePanel() { panel.classList.remove('open'); }

    openBtn.addEventListener('click', e => {
        e.stopPropagation();
        panel.classList.contains('open') ? closePanel() : openPanel();
    });
    closeBtn.addEventListener('click', closePanel);
    document.addEventListener('click', e => {
        if (!panel.contains(e.target) && e.target !== openBtn) closePanel();
    });
    panel.addEventListener('click', e => e.stopPropagation());

    btnPdf.addEventListener('click', () => doExport('pdf'));
    btnPng.addEventListener('click', () => doExport('png'));

    async function doExport(format) {
        const isWalk   = currentMode === 'walkability';
        const mapTitle = isWalk ? 'Child Walkability — Salzburg' : 'Child Bikeability — Salzburg';
        const tiers    = ['poor','average','moderate','good','excellent'];

        const mapCanvas = map.getCanvas();
        const W = mapCanvas.width;
        const H = mapCanvas.height;

        const canvas  = document.createElement('canvas');
        const HEADER  = 72;
        const FOOTER  = 48;
        const SIDEBAR = 0;
        canvas.width  = W;
        canvas.height = H + HEADER + FOOTER;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(mapCanvas, 0, HEADER, W, H);

        ctx.fillStyle = '#1a3a5c';
        ctx.fillRect(0, 0, W, HEADER);

        const logoImg = document.querySelector('.header-logo, img[alt="NetAScore4Kids Logo"], img[src*="logo"]');
        const LOGO_MAX_H = 44;
        const LOGO_X     = 18;

        let logoDrawW = LOGO_MAX_H;
        if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
            const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
            logoDrawW = LOGO_MAX_H * aspect;
            const LOGO_Y = (HEADER - LOGO_MAX_H) / 2;
            try {
                ctx.drawImage(logoImg, LOGO_X, LOGO_Y, logoDrawW, LOGO_MAX_H);
            } catch(e) { /* cross-origin fallback — skip logo */ }
        }
        const TEXT_X = LOGO_X + logoDrawW + 12;

        ctx.fillStyle = '#ffffff';
        ctx.font      = 'bold 16px Nunito, sans-serif';
        ctx.fillText('NetAScoreTeens', TEXT_X, 20);

        const modeLabel = isWalk ? 'Walkability' : 'Bikeability';
        ctx.font      = '12px Nunito, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.70)';
        ctx.fillText(modeLabel, TEXT_X, 35);

        ctx.font      = '10px Nunito, sans-serif';
        ctx.fillStyle = '#7aaace';
        ctx.fillText('Mobility Lab · Paris Lodron University of Salzburg · Palacký University of Olomouc', TEXT_X, 52);
        ctx.fillText('Developed by Amna Azeem · Copernicus Master in Digital Earth · 2026', TEXT_X, 65);

        const LX = 18, LY = HEADER + 16;
        const LW = 155, LH = 128;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        roundRect(ctx, LX, LY, LW, LH, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#111827';
        ctx.font      = 'bold 11px Nunito, sans-serif';
        const legendTitle = isWalk ? 'Walk score (children)' : 'Bike score (children)';
        ctx.fillText(legendTitle, LX + 10, LY + 18);

        const rows = [
            { label: 'Poor (0.0 – 0.20)',     color: '#E24B4A' },
            { label: 'Average (0.21 – 0.40)',  color: '#EF9F27' },
            { label: 'Moderate (0.41 – 0.60)', color: '#F5C518' },
            { label: 'Good (0.61 – 0.80)',     color: '#97C459' },
            { label: 'Excellent (0.8 – 1.0)', color: '#378ADD' },
        ];
        rows.forEach((row, i) => {
            const ry = LY + 30 + i * 19;
            ctx.fillStyle = row.color;
            ctx.beginPath();
            ctx.arc(LX + 18, ry, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#374151';
            ctx.font = '11px Nunito, sans-serif';
            ctx.fillText(row.label, LX + 29, ry + 4);
        });

        ctx.fillStyle = '#9ca3af';
        ctx.font      = '9px Nunito, sans-serif';
        ctx.fillText('Source: NetAScore model · OSM', LX + 10, LY + LH - 8);

        const SX = 18, SY = HEADER + H - 36;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        roundRect(ctx, SX, SY, 120, 28, 6);
        ctx.fill();

        const segW = 36;
        [[0,'#333'],[1,'#fff'],[2,'#333']].forEach(([i, fill]) => {
            ctx.fillStyle = fill;
            ctx.fillRect(SX + 8 + i * segW, SY + 8, segW, 7);
            if (fill === '#fff') { ctx.strokeStyle = '#999'; ctx.lineWidth = 0.5; ctx.strokeRect(SX + 8 + i * segW, SY + 8, segW, 7); }
        });
        ctx.fillStyle = '#374151';
        ctx.font      = '9px Nunito, sans-serif';
        ctx.fillText('0', SX + 8, SY + 24);
        ctx.fillText('500', SX + 8 + segW - 4, SY + 24);
        ctx.fillText('1000 m', SX + 8 + segW * 2, SY + 24);

        const NX = W - 38, NY = HEADER + 16;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.beginPath();
        ctx.arc(NX, NY + 11, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#1a3a5c';
        ctx.font      = 'bold 13px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('N', NX, NY + 16);
        ctx.textAlign = 'left';

        ctx.fillStyle = '#f5f5f3';
        ctx.fillRect(0, HEADER + H, W, FOOTER);
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(0, HEADER + H, W, 1);

        ctx.fillStyle = '#6b7280';
        ctx.font      = '10px Nunito, sans-serif';
        ctx.fillText('© 2026 Amna Azeem · Paris Lodron University of Salzburg · Palacký University of Olomouc · Copernicus Master in Digital Earth · EU Co-funded', 16, HEADER + H + 18);
        ctx.fillText('Map data © OpenFreeMap · © OpenStreetMap contributors · NetAScore model · EPSG:4326 · June 2026', 16, HEADER + H + 34);

        const filterNote = tiers.length === 5
            ? 'All roads shown'
            : 'Showing: ' + tiers.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
        ctx.textAlign = 'right';
        ctx.fillText(filterNote, W - 16, HEADER + H + 18);
        ctx.fillText(isWalk ? 'Walking mode' : 'Cycling mode', W - 16, HEADER + H + 34);
        ctx.textAlign = 'left';

        const slug = mapTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        if (format === 'png') {
            canvas.toBlob(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = slug + '.png';
                a.click();
            }, 'image/png');
        } else {
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const win = window.open('', '_blank');
                win.document.write(`
                    <!DOCTYPE html><html><head><title>${mapTitle}</title>
                    <style>
                        * { margin:0; padding:0; box-sizing:border-box; }
                        body { background:#fff; display:flex; align-items:center; justify-content:center; min-height:100vh; }
                        img  { max-width:100%; display:block; }
                        @media print {
                            body { min-height:auto; }
                            img  { width:100%; }
                            @page { margin:0; size: landscape; }
                        }
                    </style></head><body>
                    <img src="${url}" alt="${mapTitle}">
                    <script>window.onload = function() { window.print(); }<\/script>
                    </body></html>
                `);
                win.document.close();
            }, 'image/png');
        }

        closePanel();
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

})();
// ══════════════════════════════════════════
// ENVIRONMENTAL LAYERS — LCU + STL
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    const envInit = setInterval(() => {
        if (!map || !map.loaded()) return;
        clearInterval(envInit);
        initEnvLayers();
    }, 200);
});

function initEnvLayers() {
    const BASE = 'https://urbanistamna.github.io/Dashboard-NetAScore4Teens/';

    const ENV_URLS = {
        lcu: { salzburg: BASE + 'lcu.pmtiles', olomouc: BASE + 'lcu_olomouc.pmtiles' },
        stl: { salzburg: BASE + 'stl.pmtiles', olomouc: BASE + 'stl_olomouc.pmtiles' },
    };

    const ENV_LAYERS = {
        lcu: {
            sourceLayer:'land_cover',
            type:       'fill',
            label:      'Land Use (Urban Atlas 2021)',
            paint: {
                'fill-color': ['match', ['get', 'class_2021'],
                    'Forests',                                          '#14b8a6',
                    'Green urban areas (Public access)',                '#2dd4bf',
                    'Green urban areas (Private access)',               '#5eead4',
                    'Green urban areas (Unknown access conditions)',    '#99f6e4',
                    'Herbaceous vegetation associations (natural grassland, moors...)', '#67e8c9',
                    'Pastures',                                        '#eab308',
                    'Arable land (annual crops)',                      '#facc15',
                    'Continuous urban fabric (S.L. : > 80%)',          '#ec4899',
                    'Discontinuous dense urban fabric (S.L. : 50% -  80%)', '#f472b6',
                    'Discontinuous medium density urban fabric (S.L. : 30% - 50%)', '#f9a8d4',
                    'Discontinuous low density urban fabric (S.L. : 10% - 30%)',     '#fbcfe8',
                    'Discontinuous very low density urban fabric (S.L. : < 10%)',    '#fce7f3',
                    'Industrial, commercial, public, military and private units',     '#a855f7',
                    'Fast transit roads and associated land',          '#94a3b8',
                    'Other roads and associated land',                 '#94a3b8',
                    'Railways and associated land',                    '#7d8ba1',
                    'Airports',                                        '#a5b2c5',
                    'Construction sites',                              '#fb7185',
                    'Mineral extraction and dump sites',               '#f43f5e',
                    'Land without current use',                        '#cbd5e1',
                    'Isolated structures',                             '#c4b5fd',
                    'Open spaces with little or no vegetation (beaches, dunes, bare rocks, glaciers)', '#e2e8f0',
                    'Water',                                            '#38bdf8',
                    'Wetlands',                                         '#22d3ee',
                    'Permanent crops (vineyards, fruit trees, olive groves)', '#ca8a04',
                    'Sports and leisure facilities',                    '#84cc16',
                    '#cbd5e1'
                ],
                'fill-opacity': 0.55,
                'fill-outline-color': 'rgba(0,0,0,0.12)'
            }
        },
        stl: {
            sourceLayer:'street_trees',
            type:       'fill',
            label:      'Street Trees (Copernicus 2021)',
            paint: {
                'fill-pattern': 'tree-pattern',
                'fill-opacity': 0.75
            },
            patternMinZoom: 15,
            lowZoomPaint: {
                'fill-color':   '#5b7a4f',
                'fill-opacity': 0.55
            }
        }
    };

    let envOpacity    = 0.35;  // Land Use
    let envOpacityStl = 0.75;  // Street Trees — separate, independent slider

    function buildTreePatternImage() {
        const size = 110;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');

        const trees = [
            { x: 20, y: 26, r: 8  },
            { x: 68, y: 18, r: 6.5},
            { x: 90, y: 55, r: 7.5},
            { x: 42, y: 62, r: 9  },
            { x: 18, y: 88, r: 6  },
            { x: 78, y: 92, r: 8  },
        ];

        trees.forEach(t => {
            ctx.fillStyle = '#5b7a4f';
            ctx.beginPath();
            ctx.arc(t.x, t.y - t.r * 0.5, t.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#748f63';
            ctx.beginPath();
            ctx.arc(t.x - t.r * 0.4, t.y - t.r * 0.9, t.r * 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#78350f';
            ctx.fillRect(t.x - 1.5, t.y + t.r * 0.25, 3, t.r * 0.75);
        });

        return ctx.getImageData(0, 0, size, size);
    }
    if (!map.hasImage('tree-pattern')) {
        map.addImage('tree-pattern', buildTreePatternImage(), { pixelRatio: 2 });
    }
    map.on('style.load', () => {
        if (!map.hasImage('tree-pattern')) {
            map.addImage('tree-pattern', buildTreePatternImage(), { pixelRatio: 2 });
        }
    });

    const ENV_STACK_ORDER = ['lcu', 'stl'];
    function getEnvBeforeId(key) {
        const idx = ENV_STACK_ORDER.indexOf(key);
        for (let i = idx + 1; i < ENV_STACK_ORDER.length; i++) {
            const aboveKey     = ENV_STACK_ORDER[i];
            const aboveLowZoom = 'env-layer-' + aboveKey + '-lowzoom';
            const aboveMain    = 'env-layer-' + aboveKey;
            if (map.getLayer(aboveLowZoom)) return aboveLowZoom;
            if (map.getLayer(aboveMain))    return aboveMain;
        }
        return map.getLayer('walkability-layer') ? 'walkability-layer' : undefined;
    }

    function addEnvLayer(key) {
        const cfg      = ENV_LAYERS[key];
        const sourceId = 'env-' + key;
        const layerId  = 'env-layer-' + key;
        const spinner  = document.getElementById('env-spinner-' + key);

        const sourceAlreadyExists = !!map.getSource(sourceId);
        if (!sourceAlreadyExists) {
            map.addSource(sourceId, { type: 'vector', url: 'pmtiles://' + ENV_URLS[key][currentCity] });
        }

        if (!map.getLayer(layerId)) {
            const beforeId = getEnvBeforeId(key);

            if (cfg.lowZoomPaint) {
                map.addLayer({
                    id:     layerId + '-lowzoom',
                    type:   cfg.type,
                    source: sourceId,
                    'source-layer': cfg.sourceLayer,
                    maxzoom: cfg.patternMinZoom,
                    paint:  cfg.lowZoomPaint
                }, beforeId);
            }

            map.addLayer({
                id:     layerId,
                type:   cfg.type,
                source: sourceId,
                'source-layer': cfg.sourceLayer,
                minzoom: cfg.lowZoomPaint ? cfg.patternMinZoom : 0,
                paint:  cfg.paint
            }, beforeId);
        } else {
            map.setLayoutProperty(layerId, 'visibility', 'visible');
            if (map.getLayer(layerId + '-lowzoom')) {
                map.setLayoutProperty(layerId + '-lowzoom', 'visibility', 'visible');
            }
        }

        if (spinner && !sourceAlreadyExists) {
            spinner.style.display = 'inline-block';
            const checkLoaded = e => {
                if (e.sourceId === sourceId && e.isSourceLoaded) {
                    spinner.style.display = 'none';
                    map.off('sourcedata', checkLoaded);
                }
            };
            map.on('sourcedata', checkLoaded);
            setTimeout(() => { spinner.style.display = 'none'; map.off('sourcedata', checkLoaded); }, 15000);
        }
    }

    function removeEnvLayer(key) {
        const layerId = 'env-layer-' + key;
        if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', 'none');
        }
        if (map.getLayer(layerId + '-lowzoom')) {
            map.setLayoutProperty(layerId + '-lowzoom', 'visibility', 'none');
        }
    }

    function updateEnvOpacityLcu(opacity) {
        envOpacity = opacity / 100;
        const layerId = 'env-layer-lcu';
        if (map.getLayer(layerId)) {
            map.setPaintProperty(layerId, 'fill-opacity', envOpacity);
        }
        if (map.getLayer(layerId + '-lowzoom')) {
            map.setPaintProperty(layerId + '-lowzoom', 'fill-opacity', envOpacity);
        }
    }

    function updateEnvOpacityStl(opacity) {
        envOpacityStl = opacity / 100;
        const layerId = 'env-layer-stl';
        if (map.getLayer(layerId)) {
            map.setPaintProperty(layerId, 'fill-opacity', envOpacityStl);
        }
        if (map.getLayer(layerId + '-lowzoom')) {
            map.setPaintProperty(layerId + '-lowzoom', 'fill-opacity', envOpacityStl);
        }
    }

    map.on('style.load', () => {
        document.querySelectorAll('.env-chip[data-active="true"]').forEach(chip => {
            addEnvLayer(chip.dataset.env);
        });
    });

    document.querySelectorAll('.env-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const key    = chip.dataset.env;
            const active = chip.dataset.active === 'true';
            const opRowLcu = document.getElementById('env-opacity-row');
            const opRowStl = document.getElementById('env-opacity-row-stl');
            const lcuLegend = document.getElementById('lcu-panel-legend');
            const stlLegend = document.getElementById('stl-panel-legend');

            if (active) {
                chip.dataset.active = 'false';
                chip.classList.remove('active');
                removeEnvLayer(key);
            } else {
                chip.dataset.active = 'true';
                chip.classList.add('active');
                addEnvLayer(key);
            }

            // Each layer has its own independent opacity row — shown only
            // while that specific layer's chip is active.
            if (key === 'lcu' && opRowLcu) opRowLcu.style.display = chip.dataset.active === 'true' ? 'flex' : 'none';
            if (key === 'stl' && opRowStl) opRowStl.style.display = chip.dataset.active === 'true' ? 'flex' : 'none';

            if (key === 'lcu' && lcuLegend) {
                lcuLegend.style.display = chip.dataset.active === 'true' ? 'flex' : 'none';
            }
            if (key === 'stl' && stlLegend) {
                stlLegend.style.display = chip.dataset.active === 'true' ? 'flex' : 'none';
            }
        });
    });

    const envTooltip = document.getElementById('env-tooltip');
    if (envTooltip) {
        map.on('mousemove', e => {
            const roadFeats = map.queryRenderedFeatures(e.point, { layers:['walkability-layer','bikeability-layer'] });
            if (roadFeats.length) { envTooltip.style.display = 'none'; return; }

            const activeEnvLayers = [...document.querySelectorAll('.env-chip[data-active="true"]')]
                .map(c => 'env-layer-' + c.dataset.env)
                .filter(id => map.getLayer(id));
            if (!activeEnvLayers.length) { envTooltip.style.display = 'none'; return; }

            const feats = map.queryRenderedFeatures(e.point, { layers: activeEnvLayers });
            if (!feats.length) { envTooltip.style.display = 'none'; return; }

            const f = feats[0];
            let text;
            if (f.layer.id === 'env-layer-lcu') {
                text = f.properties.class_2021 || 'Land use';
            } else {
                text = 'Street trees';
            }
            const wrapperRect = document.querySelector('.map-wrapper').getBoundingClientRect();
            envTooltip.textContent = text;
            envTooltip.style.left = (e.originalEvent.clientX - wrapperRect.left) + 'px';
            envTooltip.style.top  = (e.originalEvent.clientY - wrapperRect.top) + 'px';
            envTooltip.style.display = 'block';
        });
        map.on('mouseleave', () => { envTooltip.style.display = 'none'; });
    }

    const slider = document.getElementById('env-opacity-slider');
    const valEl  = document.getElementById('env-opacity-value');
    if (slider) {
        slider.addEventListener('input', () => {
            valEl.textContent = slider.value + '%';
            updateEnvOpacityLcu(parseInt(slider.value));
        });
    }

    const sliderStl = document.getElementById('env-opacity-slider-stl');
    const valElStl  = document.getElementById('env-opacity-value-stl');
    if (sliderStl) {
        sliderStl.addEventListener('input', () => {
            valElStl.textContent = sliderStl.value + '%';
            updateEnvOpacityStl(parseInt(sliderStl.value));
        });
    }
}