let map;
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
                    // pause at full word, then start deleting
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
        setTimeout(type, 600); // small delay after card enters
    }

    // Rotating footer stats — whole pill swaps background + text color
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
    const FACTS = [
        { icon: 'ti-bike',           text: 'Many residential streets in Salzburg score well for child cyclists.',        bg: 'rgba(120,180,100,0.82)'  },
        { icon: 'ti-trees',          text: 'Green corridors along the Salzach river boost walkability scores notably.',  bg: 'rgba(74,158,82,0.82)'    },
        { icon: 'ti-school',         text: 'School routes in the Altstadt area show mixed safety scores for children.',  bg: 'rgba(210,155,50,0.82)'   },
        { icon: 'ti-mood-happy',     text: 'Over 40% of assessed streets are rated Child-Friendly or better.',          bg: 'rgba(80,160,100,0.82)'   },
        { icon: 'ti-alert-triangle', text: 'High-traffic arterial roads remain the biggest barrier to child mobility.', bg: 'rgba(195,90,80,0.82)'    },
        { icon: 'ti-mood-kid',       text: 'Proximity to parks and playgrounds is a key driver of high joy scores.',    bg: 'rgba(120,100,200,0.82)'  },
        { icon: 'ti-walk',           text: 'Pedestrian infrastructure quality varies widely across Salzburg districts.', bg: 'rgba(60,140,200,0.82)'  },
    ];

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

    // Click outside closes the card
    document.addEventListener('click', () => closeCard());
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
            // setStyle works any time; layers are re-added via style.load handler
            // diff:false forces a full style replace — diffing between two unrelated
            // style JSONs (positron vs dark) can otherwise leave custom layers broken
            map.setStyle(style, { diff: false });
        }
        localStorage.setItem('n4k-dark', on ? '1' : '0');
        // Re-render chart with dark-aware colours
        if (currentProps) setTimeout(() => renderChart(currentProps), 50);
    }

    // Restore preference
    if (localStorage.getItem('n4k-dark') === '1') applyDark(true);

    if (btn) btn.addEventListener('click', () => applyDark(!dark));
});

document.addEventListener('DOMContentLoaded', () => {
    if (typeof maplibregl === 'undefined') { console.error('MapLibre GL JS not loaded'); return; }

    const TILESET_URL  = 'https://urbanistamna.github.io/Dashboard-NetAScore4Teens/netascore.pmtiles';
    const SOURCE_LAYER = 'netascore_salzburg_edges';

    // =========================================================
    // ALL INDICATORS — full list with definitions
    // =========================================================
    // =========================================================
    // INDICATOR DEFINITIONS — per mode, from YAML profiles
    // =========================================================

    // WALKABILITY (profile_walk_kids.yml) — all weighted indicators
    const WALK_INDICATORS = [
        // SAFETY
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
        // COMFORT
        { group:'comfort', key:'gradient_ft',                  label:'Gradient',            icon:'ti-trending-up',      color:'ind-coral',  weight:0.3,
          def:'Steepness of the road. Steep slopes are demanding for young children and pushchairs. Flat routes strongly encourage active travel.' },
        { group:'comfort', key:'greenness',                    label:'Greenery',            icon:'ti-trees',            color:'ind-green',  weight:0.3,
          def:'Proportion of greenery surrounding the segment. Workshop findings show greenery is the top thing teens notice and want on streets.' },
        { group:'comfort', key:'noise',                        label:'Quietness',           icon:'ti-ear',              color:'ind-teal',   weight:0.3,
          def:'Ambient noise level. Nearly half of the teens from workshops identified noise as a negative aspect of their school journey.' },
        { group:'comfort', key:'water',                        label:'Water nearby',        icon:'ti-droplet',          color:'ind-blue',   weight:0.4,
          def:'Proximity to rivers, streams or fountains. Water features make streets more engaging and pleasant; children are naturally drawn to them.' },
        { group:'comfort', key:'buildings',                    label:'Buildings',           icon:'ti-building',         color:'ind-slate',  weight:0.1,
          def:'Density of surrounding buildings. Building density is used as a proxy for access to destinations, with higher values indicating a greater concentration of nearby services and activities.' },
        { group:'comfort', key:'width',                        label:'Path width',          icon:'ti-arrows-horizontal',color:'ind-teal',   weight:0,
          def:'Width of the footpath or road. Wider paths give children more space to walk side by side, pass others safely, and feel less crowded.' },
        { group:'comfort', key:'parking',                      label:'On-street parking',   icon:'ti-parking',          color:'ind-coral',  weight:0,
          def:'Presence of on-street parking. Parked cars reduce visibility at crossings and can make footpaths feel narrower and less safe for children.' },
        { group:'comfort', key:'pavement',                     label:'Pavement surface',    icon:'ti-road-off',         color:'ind-amber',  weight:0,
          def:'Surface quality of the footpath. Smooth, well-maintained surfaces are safer and more comfortable; especially for younger children and those with pushchairs.' },
        // JOY
        { group:'joy',     key:'play_and_outdoor',             label:'Play & outdoor',      icon:'ti-mood-kid',         color:'ind-green',  weight:0.2,
          def:'Number of play areas and outdoor activity spaces nearby. Play spots transform a boring route into an adventure; key finding from workshops.' },
        { group:'joy',     key:'sights',                       label:'Sights & landmarks',  icon:'ti-eye',              color:'ind-purple', weight:0,
          def:'Points of interest and landmarks along the route. Interesting streets feel shorter and more enjoyable.' },
        { group:'joy',     key:'comfort_facilities',           label:'Rest facilities',     icon:'ti-armchair',         color:'ind-blue',   weight:0.1,
          def:'Comfort facilities like benches, shades, rest spots and shelters. Rest spots give children and caregivers places to pause on longer routes.' },
        { group:'joy',     key:'eating_facilities',            label:'Eating spots',        icon:'ti-fork',             color:'ind-amber',  weight:0.1,
          def:'Cafes, kiosks, supermarkets and food shops nearby. In workshops with Teens, a supermarket (SPAR) was the most cited positive landmark on the school street.' },
        { group:'joy',     key:'attractiveness',               label:'Attractiveness',      icon:'ti-sparkles',         color:'ind-purple', weight:0,
          def:'Overall visual and sensory attractiveness of the street environment. Attractive streets motivate children to walk and make journeys feel shorter and more enjoyable.' },
    ];

    // BIKEABILITY (profile_bike_kids.yml)
    const BIKE_INDICATORS = [
        // SAFETY
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
        // COMFORT
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
        // JOY
        { group:'joy',     key:'sights',                       label:'Sights & landmarks',  icon:'ti-eye',              color:'ind-purple', weight:0.4,
          def:'Number of points of interest nearby. Interesting streets reduce boredom — the top finding from the SALIS workshops.' },
        { group:'joy',     key:'play_and_outdoor',             label:'Play & outdoor',      icon:'ti-mood-kid',         color:'ind-green',  weight:0,
          def:'Play areas and outdoor spaces along the route. For children, a bike ride is much more appealing if it passes interesting places to stop.' },
        { group:'joy',     key:'attractiveness',               label:'Attractiveness',      icon:'ti-sparkles',         color:'ind-purple', weight:0,
          def:'Overall visual attractiveness of the street. Beautiful, varied environments make cycling feel like an exploration rather than a chore.' },
        { group:'joy',     key:'comfort_facilities',           label:'Rest facilities',     icon:'ti-armchair',         color:'ind-blue',   weight:0,
          def:'Benches, shelters and rest spots. Useful for longer cycling trips so children can take breaks and stay hydrated.' },
        { group:'joy',     key:'eating_facilities',            label:'Eating spots',        icon:'ti-fork',             color:'ind-amber',  weight:0,
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

    // =========================================================
    // NORMALISATION
    // =========================================================
    function normaliseField(key, raw) {
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
            road_category:       { no_mit:1, calmed:0.9, service:0.85, residential:0.8, secondary:0.2, primary:0, path:currentMode==='walkability'?1:0, track:0 },
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
            case 'sights':           return num > 0 ? Math.min(1, num/50) : 0;
            case 'attractiveness':   return num > 0 ? Math.min(1, num/50) : 0;
            case 'traffic_calming': return num > 0 ? Math.min(1, num/3)  : 0;
            case 'play_and_outdoor': return num > 0 ? Math.min(1, num/30) : 0;
            case 'eating_facilities':return num > 0 ? Math.min(1, num/20) : 0;
            case 'facilities':       return num > 0 ? Math.min(1, num/20) : 0;
            case 'comfort_facilities':return num > 0 ? Math.min(1, num/20) : 0;
            case 'benches':          return num > 0 ? 1 : 0;
            case 'crossings':        return num > 0 ? Math.min(1, num/5) : 0;
            case 'noise':            return num > 70 ? 0 : num > 55 ? 0.6 : num > 10 ? 0.8 : 1;
            case 'max_speed_ft': case 'max_speed_greatest':
                return num >= 100 ? 0 : num >= 80 ? 0.2 : num >= 70 ? 0.3 : num >= 60 ? 0.4 : num >= 50 ? 0.6 : num >= 30 ? 0.85 : num > 0 ? 0.9 : 1;
            case 'gradient_ft': {
                // Walk profile: 0,1→1; 2→0.7; 3→0.5; 4→0.25 (gentler penalty)
                // Bike profile: 0→0.9; -1→1; 1→0.5; 2→0.4; 3→0.25; 4→0
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
        if (v <= 0.2) return '#E24B4A'; if (v <= 0.4) return '#EF9F27';
        if (v <= 0.6) return '#FAC775'; if (v <= 0.8) return '#97C459';
        return '#378ADD';
    }

    function scoreLabel(v) {
        if (!v || isNaN(v)) return 'No data';
        if (v <= 0.2) return 'Poor'; if (v <= 0.4) return 'Average';
        if (v <= 0.6) return 'Moderate'; if (v <= 0.8) return 'Good';
        return 'Excellent';
    }

    function computeGroupScore(props, groupId) {
        const inds = getIndicators().filter(i => i.group === groupId && i.weight > 0);
        let wSum = 0, wTotal = 0;
        inds.forEach(ind => {
            const n = normaliseField(ind.key, props[ind.key]);
            if (n === null) return;
            wSum += n * ind.weight; wTotal += ind.weight;
        });
        return wTotal > 0 ? wSum / wTotal : null;
    }

    // =========================================================
    // THRESHOLD — gradient slider + 5 emoji chips
    // =========================================================
    const CHIP_RANGES = [
        { min:0.0, max:0.2 },  // Poor
        { min:0.2, max:0.4 },  // Average
        { min:0.4, max:0.6 },  // Moderate
        { min:0.6, max:0.8 },  // Good
        { min:0.8, max:1.0 },  // Excellent
    ];
    let thresholdMax = 1.0;

    function applyThreshold() {
        const el = document.getElementById('threshold-value');
        if (el) el.textContent = (threshold === 0.0 && thresholdMax === 1.0)
            ? 'All routes'
            : threshold.toFixed(2) + ' – ' + (thresholdMax === 1.0 ? '1.00' : thresholdMax.toFixed(2));
        const mk = document.getElementById('legend-marker');
        if (mk) mk.style.left = (threshold * 100).toFixed(1) + '%';
        const lid  = currentMode === 'walkability' ? 'walkability-layer' : 'bikeability-layer';
        const prop = currentMode === 'walkability' ? 'index_walk_ft' : 'index_bike_ft';
        if (map && map.isStyleLoaded() && map.getLayer(lid)) {
            if (threshold === 0.0 && thresholdMax === 1.0) map.setFilter(lid, null);
            else if (thresholdMax < 1.0) map.setFilter(lid, ['all', ['>=',['get',prop],threshold], ['<',['get',prop],thresholdMax]]);
            else map.setFilter(lid, ['>=', ['get', prop], threshold]);
        }
    }

    document.querySelectorAll('.face-chip').forEach((chip, i) => {
        chip.addEventListener('click', () => {
            const already = chip.classList.contains('fc-active');
            document.querySelectorAll('.face-chip').forEach(c => c.classList.remove('fc-active'));
            if (already) {
                threshold = 0.0; thresholdMax = 1.0;
                document.getElementById('clear-filter').style.display = 'none';
            } else {
                chip.classList.add('fc-active');
                threshold    = CHIP_RANGES[i].min;
                thresholdMax = CHIP_RANGES[i].max;
                document.getElementById('clear-filter').style.display = 'block';
            }
            applyThreshold();
            // Deselect pinned road when filter changes — it may no longer be visible
            if (typeof clearPin === 'function') clearPin();
        });
    });

    document.getElementById('clear-filter-btn').addEventListener('click', () => {
        document.querySelectorAll('.face-chip').forEach(c => c.classList.remove('fc-active'));
        threshold = 0.0; thresholdMax = 1.0;
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
            document.querySelectorAll('.face-chip').forEach(c => c.classList.remove('fc-active'));
            document.getElementById('clear-filter').style.display = 'none';
            // update thumb position immediately, debounce the map filter
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

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode; if (mode === currentMode) return;
            currentMode = mode;
            threshold = 0.0; // show all routes for the new mode
            document.querySelectorAll('.face-chip').forEach(c => c.classList.remove('fc-active'));
            document.getElementById('clear-filter').style.display = 'none';
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active-walk','active-bike'));
            btn.classList.add(mode === 'walkability' ? 'active-walk' : 'active-bike');
            // Update fullscreen HUD mode label
            const fsMode = document.getElementById('fs-hud-mode');
            if (fsMode) fsMode.innerHTML = mode === 'walkability'
                ? '<i class="ti ti-walk"></i> Walkability'
                : '<i class="ti ti-bike"></i> Bikeability';
            if (map && map.isStyleLoaded() && map.getLayer('walkability-layer')) {
                map.setLayoutProperty('walkability-layer', 'visibility', mode === 'walkability' ? 'visible' : 'none');
                map.setLayoutProperty('bikeability-layer', 'visibility', mode === 'bikeability' ? 'visible' : 'none');
            }
            applyThreshold();
            if (typeof clearPin === 'function') clearPin();
            if (currentProps) showDetail(currentProps);
        });
    });

    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active'); currentChartType = tab.dataset.chart;
            if (currentProps) renderChart(currentProps);
        });
    });

    // ── RIGHT PANEL TAB SWITCHER ──
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

    // =========================================================
    // PANEL
    // =========================================================
    function showEmpty() {
        document.getElementById('detail-empty').style.display  = 'flex';
        document.getElementById('detail-loaded').style.display = 'none';
        if (breakdownChart) { breakdownChart.destroy(); breakdownChart = null; }
        currentProps = null;
        if (map && map.isStyleLoaded()) setHighlight(null);
    }

    function showDetail(props) {
        currentProps = props;
        document.getElementById('detail-empty').style.display  = 'none';
        document.getElementById('detail-loaded').style.display = 'block';
        document.getElementById('map-hint').classList.add('hidden');

        // Score
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

        // Hero strip
        const heroEl   = document.getElementById('rp-hero');
        const heroText = document.getElementById('rp-hero-text');
        if (heroEl)   { heroEl.style.background = hBg; }
        if (heroText) { heroText.textContent = tier.hero; heroText.style.color = hCol; }

        // Mood icon — filled SVG face, score-colored
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

        // Metrics tab content
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
            const norm   = normaliseField(def.key, raw);
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

        // Experience tab — always render so data is ready
        renderExperience(props, tier);
    }

    // =========================================================
    // EXPERIENCE TAB
    // =========================================================
    function renderExperience(props, tier) {
        const isWalk = currentMode === 'walkability';
        const overall = parseFloat(isWalk ? props.index_walk_ft : props.index_bike_ft);
        const sc = isNaN(overall) ? null : overall;

        // Derive tier key
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

        // ── 1. QUOTE BOX — colour changes with score tier ──
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

        // ── 2. CHILD VOICE QUOTE (no italic) ──
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

        // ── 3. STREET MOOD PILL ──
        // Mood maps directly to the score colour band (mirrors the map colour scale):
        // Red   (0.0-0.2) = Dangerous
        // Orange(0.2-0.4) = Busy
        // Yellow(0.4-0.6) = Dull  ... unless greenness is high, then Relaxing
        // Green (0.6-0.8) = Relaxing
        // Blue  (0.8-1.0) = Welcoming
        const safeSc  = computeGroupScore(props, 'safety');
        const comfSc  = computeGroupScore(props, 'comfort');
        const joySc   = computeGroupScore(props, 'joy');
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

        // ── 4. GROUP SUMMARY CARDS ──
        const gScores = { safety: safeSc, comfort: comfSc, joy: joySc };
        const GROUP_META = [
            { id:'safety',  label:'Safety',  icon:'ti-shield-check', iconBg:'rgba(226,75,74,0.12)',  iconColor:'#E24B4A', cardBg:'rgba(226,75,74,0.06)',  cardBorder:'rgba(226,75,74,0.15)', sentences: {
                excellent:'Very safe. Calm road, slow traffic, good crossings.',
                good:     'Mostly safe, good infrastructure for children.',
                moderate: 'Some safety concerns. Watch out for traffic.',
                average:  'Feels unsafe in places. Cars move too fast.',
                poor:     'Serious safety issues for children.',
            }},
            { id:'comfort', label:'Comfort', icon:'ti-leaf',          iconBg:'rgba(239,159,39,0.12)', iconColor:'#EF9F27', cardBg:'rgba(239,159,39,0.06)', cardBorder:'rgba(239,159,39,0.15)', sentences: {
                excellent:'Very comfortable. Green, quiet and easy to walk.',
                good:     'Comfortable enough. Good surface, not too noisy.',
                moderate: 'Somewhat comfortable, but could be greener.',
                average:  'Not very comfortable. Noisy or lacking greenery.',
                poor:     'Hard to walk comfortably. Steep, loud, or exposed.',
            }},
            { id:'joy',     label:'Joy',     icon:'ti-star',          iconBg:'rgba(155,89,182,0.12)', iconColor:'#9B59B6', cardBg:'rgba(155,89,182,0.06)', cardBorder:'rgba(155,89,182,0.15)', sentences: {
                excellent:'Lots to see and do. A genuinely joyful route.',
                good:     'Some interesting spots make this route enjoyable.',
                moderate: 'Not much to look at. Could be more lively.',
                average:  'Pretty dull. Children would find this boring.',
                poor:     'Nothing to enjoy here. Grey and uninviting.',
            }},
        ];
        const expGroups = document.getElementById('exp-groups');
        if (expGroups) {
            expGroups.innerHTML = '';
            GROUP_META.forEach(gm => {
                const gsc = gScores[gm.id];
                const pct = gsc === null ? 0 : Math.round(gsc * 100);
                const col = scoreColor(gsc);
                const t   = gsc === null ? 'moderate'
                    : gsc > 0.8 ? 'excellent' : gsc > 0.6 ? 'good'
                    : gsc > 0.4 ? 'moderate'  : gsc > 0.2 ? 'average' : 'poor';
                const card = document.createElement('div');
                card.className = 'exp-group-card';
                card.style.background  = gm.cardBg;
                card.style.borderColor = gm.cardBorder;
                card.innerHTML =
                    '<div class="exp-group-card-top">' +
                      '<div class="exp-group-icon" style="background:' + gm.iconBg + ';color:' + gm.iconColor + '">' +
                        '<i class="ti ' + gm.icon + '"></i>' +
                      '</div>' +
                      '<span class="exp-group-pct" style="color:' + col + '">' + (gsc === null ? '–' : pct + '%') + '</span>' +
                    '</div>' +
                    '<div class="exp-group-name">' + gm.label + '</div>' +
                    '<div class="exp-group-bar-wrap"><div class="exp-group-bar-fill" style="width:' + pct + '%;background:' + col + '"></div></div>' +
                    '<p class="exp-group-sentence">' + gm.sentences[t] + '</p>';
                expGroups.appendChild(card);
            });
        }

        // ── 5. CHILD-FRIENDLY CHECKLIST ──
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
            { key: 'eating_facilities',   label: 'Eating spots',          icon: 'ti-fork',      passTest: v => v > 0 },
            { key: 'comfort_facilities',  label: 'Comfort facilities',    icon: 'ti-armchair',  passTest: v => v > 0 },
        ];
        const expChecklist = document.getElementById('exp-checklist');
        if (expChecklist) {
            expChecklist.innerHTML = '';
            CHECKLIST_ITEMS.filter(item => !item.walkOnly || isWalk).forEach(item => {
                const raw    = props[item.key];
                const norm   = normaliseField(item.key, raw);
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

        // ── 7. IMPROVEMENT IDEAS — only where data exists and score is low ──
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
            const norm = normaliseField(item.key, raw);
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
    // CHART — only weighted indicators that have data
    // =========================================================
    function renderChart(props) {
        if (breakdownChart) { breakdownChart.destroy(); breakdownChart = null; }
        const ctx = document.getElementById('breakdown-chart').getContext('2d');
        const labels=[], data=[], bg=[], bd=[];

        const indMeta = []; // parallel array to store def for tooltip

        GROUPS.forEach(g => {
            getIndicators()
                .filter(i => i.group === g.id && i.weight > 0) // only weighted indicators
                .forEach(ind => {
                    const norm = normaliseField(ind.key, props[ind.key]);
                    if (norm === null) return; // only show indicators with real data
                    labels.push(ind.label);
                    data.push(+(norm * 100).toFixed(1));
                    bg.push(g.color + 'cc');
                    bd.push(g.color);
                    indMeta.push({ key: ind.key, raw: props[ind.key], norm });
                });
        });

        // Set height before creating chart so canvas is sized correctly
        const chartWrap = document.querySelector('.chart-wrap');
        if (chartWrap) chartWrap.style.height = Math.max(80, labels.length * 18) + 'px';

        breakdownChart = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets:[{
                data,
                backgroundColor: bg,
                borderColor: bd,
                borderWidth: 1,
                borderRadius: 3,
                borderSkipped: false,
                barPercentage: 0.55,
                categoryPercentage: 0.85,
            }]},
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 400 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => {
                                const m = indMeta[ctx.dataIndex];
                                if (!m) return '';
                                const raw  = fmtValue(m.key, m.raw);
                                const qual = scoreLabel(m.norm);
                                return '  ' + raw + '  ·  ' + qual;
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

    // Keep tooltip theme in sync when dark mode toggles
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

        // Position relative to map-wrapper
        const mapWrapper = document.querySelector('.map-wrapper');
        const rect = mapWrapper ? mapWrapper.getBoundingClientRect() : { left:0, top:0, width: window.innerWidth, height: window.innerHeight };
        const tw = 200, th = 120;
        const vw = rect.width;
        const vh = rect.height;
        // cursor position relative to map-wrapper
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
        preserveDrawingBuffer: true   // required for canvas export to work
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.FullscreenControl({ container: document.querySelector('.map-wrapper') }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

    function addMapLayers() {
        if (!map.getSource('netascore')) {
            map.addSource('netascore', { type:'vector', url:'pmtiles://' + TILESET_URL });
        }

        const sharedPaint = prop => ({
            'line-width': ['interpolate',['linear'],['zoom'],10,0.6,12,1.4,14,2.2,16,4.0],
            'line-opacity': 0.85, 'line-blur': 0.1,
            'line-color': ['case',
                ['==',['get',prop],null],'#d1d5db',
                ['<=',['get',prop],0.2],'#E24B4A',
                ['<=',['get',prop],0.4],'#EF9F27',
                ['<=',['get',prop],0.6],'#FAC775',
                ['<=',['get',prop],0.8],'#97C459',
                ['<=',['get',prop],1.0],'#378ADD',
                '#9ca3af']
        });

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
                    'line-color': ['case',
                        ['==',['get', currentMode === 'walkability' ? 'index_walk_ft' : 'index_bike_ft'],null],'#9ca3af',
                        ['<=',['get',currentMode === 'walkability' ? 'index_walk_ft' : 'index_bike_ft'],0.2],'#E24B4A',
                        ['<=',['get',currentMode === 'walkability' ? 'index_walk_ft' : 'index_bike_ft'],0.4],'#EF9F27',
                        ['<=',['get',currentMode === 'walkability' ? 'index_walk_ft' : 'index_bike_ft'],0.6],'#FAC775',
                        ['<=',['get',currentMode === 'walkability' ? 'index_walk_ft' : 'index_bike_ft'],0.8],'#97C459',
                        '#378ADD'],
                    'line-opacity':  1,
                },
                filter:['==',['literal',false],true]} );

        applyThreshold();
    }

    function setHighlight(osmId) {
        const f = osmId
            ? ['==', ['to-string', ['get','osm_id']], String(osmId)]
            : ['==', ['literal', false], true];
        if (map && map.getLayer('highlight-layer'))       map.setFilter('highlight-layer',       f);
        if (map && map.getLayer('highlight-layer-inner')) map.setFilter('highlight-layer-inner', f);
    }

    // Re-add layers whenever style reloads (e.g. light ↔ dark swap)
    map.on('style.load', () => {
        addMapLayers();
        // Restore pinned highlight
        if (pinnedId) setHighlight(pinnedId);
        // Re-render chart with correct dark/light colours
        if (currentProps) setTimeout(() => renderChart(currentProps), 100);
    });

    map.on('load', () => {
        // Legend toggle — minimized by default, click to expand
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

        // Clears the pin, highlight, and resets the panel to empty
        function clearPin() {
            if (!pinnedId) return;
            setPinned(null);
            setHighlight(null);
            showEmpty();
        }

        // Snap slider + chip to match the score tier of a clicked road
        function snapSliderToScore(score) {
            const chipIndex = score < 0.2 ? 0 : score < 0.4 ? 1 : score < 0.6 ? 2 : score < 0.8 ? 3 : 4;
            const range = CHIP_RANGES[chipIndex];
            threshold    = range.min;
            thresholdMax = range.max;
            // Activate the matching chip
            document.querySelectorAll('.face-chip').forEach((c, i) => {
                c.classList.toggle('fc-active', i === chipIndex);
            });
            document.getElementById('clear-filter').style.display = 'block';
            // Move slider thumb to the start of the tier range
            const mk = document.getElementById('legend-marker');
            if (mk) mk.style.left = (range.min * 100).toFixed(1) + '%';
            const el = document.getElementById('threshold-value');
            if (el) el.textContent = range.min.toFixed(2) + ' – ' + range.max.toFixed(2);
            applyThreshold();
        }

        // HOVER — always update panel and tooltip
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

        // CLICK — pin/unpin to keep panel on mouseleave
        map.on('click', e => {
            const feats = map.queryRenderedFeatures(e.point, { layers:['walkability-layer','bikeability-layer'] });
            if (!feats.length) { setPinned(null); setHighlight(null); showEmpty(); return; }
            const props = feats[0].properties; const osmId = String(props.osm_id);
            if (pinnedId === osmId) {
                // Second click on same road = deselect
                setPinned(null);
                setHighlight(null);
            } else {
                setPinned(props);
                setHighlight(osmId);
                // Snap slider to the score tier of the clicked road
                const scoreVal = props[currentMode === 'walkability' ? 'index_walk_ft' : 'index_bike_ft'];
                if (scoreVal !== null && scoreVal !== undefined) snapSliderToScore(scoreVal);
            }
            document.getElementById('map-hint').classList.add('hidden');
        });

        ['walkability-layer','bikeability-layer'].forEach(id => {
            map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'crosshair'; });
            map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
        });

        // =========================================================
        // POI LAYER MANAGEMENT
        // =========================================================
        const SALZBURG_BBOX = '47.77,12.98,47.84,13.13'; // south,west,north,east

        const POI_CONFIG = {
            schools: {
                query: `[out:json][timeout:25];(node["amenity"="school"](${SALZBURG_BBOX});way["amenity"="school"](${SALZBURG_BBOX}););out center;`,
                color: '#DC2626', bg: '#FEE2E2', icon: 'S',
                label: 'School'
            },
            playgrounds: {
                query: `[out:json][timeout:25];(node["leisure"="playground"](${SALZBURG_BBOX});way["leisure"="playground"](${SALZBURG_BBOX}););out center;`,
                color: '#CA8A04', bg: '#FEF9C3', icon: 'P',
                label: 'Playground'
            },
            parks: {
                query: `[out:json][timeout:25];(node["leisure"="park"](${SALZBURG_BBOX});way["leisure"="park"](${SALZBURG_BBOX}););out center;`,
                color: '#16A34A', bg: '#DCFCE7', icon: 'Pk',
                label: 'Park'
            },
            busstops: {
                query: `[out:json][timeout:25];node["highway"="bus_stop"](${SALZBURG_BBOX});out;`,
                color: '#2563EB', bg: '#DBEAFE', icon: 'B',
                label: 'Bus stop'
            }
        };

        const poiCache   = {}; // cache fetched GeoJSON per type
        const poiPopup   = new maplibregl.Popup({ closeButton:true, closeOnClick:false, maxWidth:'220px' });

        async function fetchPOI(type) {
            if (poiCache[type]) return poiCache[type];
            const cfg  = POI_CONFIG[type];
            const url  = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(cfg.query);
            const resp = await fetch(url);
            const data = await resp.json();

            // Convert OSM elements to GeoJSON points
            const features = data.elements.map(el => {
                const lat = el.lat ?? el.center?.lat;
                const lon = el.lon ?? el.center?.lon;
                if (!lat || !lon) return null;
                return {
                    type: 'Feature',
                    geometry: { type:'Point', coordinates:[lon, lat] },
                    properties: {
                        name:  el.tags?.name || cfg.label,
                        type:  cfg.label,
                        color: cfg.color,
                        bg:    cfg.bg
                    }
                };
            }).filter(Boolean);

            const geojson = { type:'FeatureCollection', features };
            poiCache[type] = geojson;
            return geojson;
        }

        function addPOILayer(type, geojson) {
            const sourceId = 'poi-' + type;
            const layerId  = 'poi-layer-' + type;
            const cfg      = POI_CONFIG[type];

            if (map.getSource(sourceId)) {
                map.getSource(sourceId).setData(geojson);
                map.setLayoutProperty(layerId, 'visibility', 'visible');
                map.setPaintProperty(layerId, 'circle-radius', ['interpolate',['linear'],['zoom'], 10,2, 13,3, 16,5]);
                return;
            }

            map.addSource(sourceId, { type:'geojson', data:geojson });
            map.addLayer({
                id: layerId, type: 'circle',
                source: sourceId,
                paint: {
                    'circle-radius': ['interpolate',['linear'],['zoom'], 10,2, 13,3, 16,5],
                    'circle-color': cfg.bg,
                    'circle-stroke-color': cfg.color,
                    'circle-stroke-width': 1,
                    'circle-opacity': 0.85
                }
            });

            // Hover cursor
            map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
            map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = ''; });

            // Click popup
            map.on('click', layerId, e => {
                const p    = e.features[0].properties;
                const coords = e.features[0].geometry.coordinates.slice();
                poiPopup
                    .setLngLat(coords)
                    .setHTML(
                        '<div style="font-family:Nunito,sans-serif;padding:4px 2px">' +
                        '<div style="font-size:11px;font-weight:700;color:' + p.color + ';margin-bottom:2px;text-transform:uppercase;letter-spacing:0.05em">' + p.type + '</div>' +
                        '<div style="font-size:13px;font-weight:600;color:#1f2937">' + p.name + '</div>' +
                        '</div>'
                    )
                    .addTo(map);
                e.stopPropagation();
            });
        }

        function removePOILayer(type) {
            const layerId = 'poi-layer-' + type;
            if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', 'none');
        }

        // Wire up toggle buttons
        document.querySelectorAll('.poi-chip').forEach(btn => {
            btn.addEventListener('click', async () => {
                const type   = btn.dataset.poi;
                const active = btn.dataset.active === 'true';

                if (active) {
                    btn.dataset.active = 'false';
                    btn.classList.remove('active');
                    removePOILayer(type);
                } else {
                    btn.dataset.active = 'true';
                    btn.classList.add('active');

                    try {
                        const geojson = await fetchPOI(type);
                        addPOILayer(type, geojson);
                    } catch(err) {
                        console.error('POI fetch failed:', err);
                        btn.dataset.active = 'false';
                        btn.classList.remove('active');
                    }
                }
            });
        });
    });
});
// ══════════════════════════════════════════
// EXPORT MAP FEATURE
// ══════════════════════════════════════════
(function () {

    // ── State ──────────────────────────────
    let exportMode        = 'walkability'; // mirrors currentMode on open
    let exportScoreFilter = 'all';         // 'all' | 'poor' | 'average' | 'moderate' | 'good' | 'excellent'

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
        moderate: '#FAC775',
        good:     '#97C459',
        excellent:'#378ADD',
    };

    // ── DOM refs ───────────────────────────
    const openBtn   = document.getElementById('map-export-btn');
    const panel     = document.getElementById('export-panel');
    const closeBtn  = document.getElementById('export-panel-close');
    const btnPdf    = document.getElementById('export-btn-pdf');
    const btnPng    = document.getElementById('export-btn-png');

    if (!openBtn || !panel) return;

    // ── Open / close ───────────────────────
    function openPanel() {
        // Sync mode to current dashboard mode
        exportMode = currentMode;
        updateModeUI();
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

    // ── Mode pills ─────────────────────────
    function updateModeUI() {
        document.querySelectorAll('.export-mode-pill').forEach(p => {
            p.classList.toggle('export-mode-active', p.dataset.exportMode === exportMode);
        });
    }
    document.querySelectorAll('.export-mode-pill').forEach(p => {
        p.addEventListener('click', () => { exportMode = p.dataset.exportMode; updateModeUI(); });
    });

    // ── Score chips — multi-select except "All" ─
    document.querySelectorAll('.export-schip').forEach(chip => {
        chip.addEventListener('click', () => {
            const score = chip.dataset.score;
            if (score === 'all') {
                document.querySelectorAll('.export-schip').forEach(c => c.classList.remove('export-schip-on'));
                chip.classList.add('export-schip-on');
                exportScoreFilter = 'all';
            } else {
                const allChip = document.querySelector('.export-schip-all');
                allChip.classList.remove('export-schip-on');
                chip.classList.toggle('export-schip-on');
                // If nothing selected, fall back to all
                const anyOn = [...document.querySelectorAll('.export-schip:not(.export-schip-all)')].some(c => c.classList.contains('export-schip-on'));
                if (!anyOn) { allChip.classList.add('export-schip-on'); exportScoreFilter = 'all'; }
                else exportScoreFilter = score; // last toggled (used for single-tier exports)
            }
        });
    });

    // Helper: get currently selected score tiers
    function getSelectedTiers() {
        const allOn = document.querySelector('.export-schip-all.export-schip-on');
        if (allOn) return ['poor','average','moderate','good','excellent'];
        return [...document.querySelectorAll('.export-schip:not(.export-schip-all).export-schip-on')]
            .map(c => c.dataset.score);
    }

    // ── Format buttons ─────────────────────
    btnPdf.addEventListener('click', () => doExport('pdf'));
    btnPng.addEventListener('click', () => doExport('png'));

    // ══════════════════════════════════════
    // CORE EXPORT FUNCTION
    // ══════════════════════════════════════
    async function doExport(format) {
        const tiers   = getSelectedTiers();
        const isWalk  = exportMode === 'walkability';
        const mapTitle = isWalk ? 'Child Walkability — Salzburg' : 'Child Bikeability — Salzburg';
        const propKey  = isWalk ? 'index_walk_ft' : 'index_bike_ft';

        // 1. Apply temporary filter on the live map
        const layerId = isWalk ? 'walkability-layer' : 'bikeability-layer';
        const origFilter = map.getFilter(layerId);

        let tempFilter = null;
        if (tiers.length < 5) {
            const tierConditions = tiers.map(tier => {
                const r = SCORE_RANGES[tier];
                return ['all', ['>=', ['get', propKey], r.min], ['<', ['get', propKey], r.max]];
            });
            tempFilter = tierConditions.length === 1
                ? tierConditions[0]
                : ['any', ...tierConditions];
            map.setFilter(layerId, tempFilter);
        }

        // 2. Wait one frame for map to re-render
        await new Promise(r => setTimeout(r, 120));

        // 3. Grab the map canvas
        const mapCanvas = map.getCanvas();
        const W = mapCanvas.width;
        const H = mapCanvas.height;

        // Restore original filter immediately
        if (tempFilter) map.setFilter(layerId, origFilter);

        // 4. Build the output canvas with map elements
        const canvas  = document.createElement('canvas');
        const HEADER  = 72;   // px — dark blue header bar
        const FOOTER  = 48;   // px — attribution footer
        const SIDEBAR = 0;    // no sidebar — keep it clean
        canvas.width  = W;
        canvas.height = H + HEADER + FOOTER;
        const ctx = canvas.getContext('2d');

        // ── Draw map image ──────────────────
        ctx.drawImage(mapCanvas, 0, HEADER, W, H);

        // ── HEADER ──────────────────────────
        ctx.fillStyle = '#1a3a5c';
        ctx.fillRect(0, 0, W, HEADER);

        // Draw logo — load from img tag already in DOM
        const logoImg = document.querySelector('.header-logo, img[alt="NetAScore4Kids Logo"], img[src*="logo"]');
        const LOGO_SIZE = 44;
        const LOGO_X    = 18;
        const LOGO_Y    = (HEADER - LOGO_SIZE) / 2;
        const TEXT_X    = LOGO_X + LOGO_SIZE + 12;

        if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
            try {
                ctx.drawImage(logoImg, LOGO_X, LOGO_Y, LOGO_SIZE, LOGO_SIZE);
            } catch(e) { /* cross-origin fallback — skip logo */ }
        }

        // Main title — NetAScore4Teens
        ctx.fillStyle = '#ffffff';
        ctx.font      = 'bold 16px Nunito, sans-serif';
        ctx.fillText('NetAScoreTeens', TEXT_X, 20);

        // Mode subheading — Walkability / Bikeability
        const modeLabel = isWalk ? 'Walkability' : 'Bikeability';
        ctx.font      = '12px Nunito, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.70)';
        ctx.fillText(modeLabel, TEXT_X, 35);

        // Subtitle — two lines
        ctx.font      = '10px Nunito, sans-serif';
        ctx.fillStyle = '#7aaace';
        ctx.fillText('Mobility Lab · Paris Lodron University of Salzburg · Palacký University of Olomouc', TEXT_X, 52);
        ctx.fillText('Developed by Amna Azeem · Copernicus Master in Digital Earth · 2026', TEXT_X, 65);

        // ── LEGEND (top-left of map area) ───
        const LX = 18, LY = HEADER + 16;
        const LW = 155, LH = 128;
        // Frosted background
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
            { label: 'Poor (0.0 – 0.2)',     color: '#E24B4A' },
            { label: 'Average (0.2 – 0.4)',   color: '#EF9F27' },
            { label: 'Moderate (0.4 – 0.6)',  color: '#FAC775' },
            { label: 'Good (0.6 – 0.8)',      color: '#97C459' },
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

        // Source note under legend
        ctx.fillStyle = '#9ca3af';
        ctx.font      = '9px Nunito, sans-serif';
        ctx.fillText('Source: NetAScore model · OSM', LX + 10, LY + LH - 8);

        // ── SCALE BAR (bottom-left of map) ──
        const SX = 18, SY = HEADER + H - 36;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        roundRect(ctx, SX, SY, 120, 28, 6);
        ctx.fill();

        // Alternating black/white scale segments
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

        // ── NORTH ARROW (top-right of map) ──
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

        // ── FOOTER ──────────────────────────
        ctx.fillStyle = '#f5f5f3';
        ctx.fillRect(0, HEADER + H, W, FOOTER);
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(0, HEADER + H, W, 1);

        ctx.fillStyle = '#6b7280';
        ctx.font      = '10px Nunito, sans-serif';
        ctx.fillText('© 2026 Amna Azeem · Paris Lodron University of Salzburg · Palacký University of Olomouc · Copernicus Master in Digital Earth · EU Co-funded', 16, HEADER + H + 18);
        ctx.fillText('Map data © OpenFreeMap · © OpenStreetMap contributors · NetAScore model · EPSG:4326 · June 2026', 16, HEADER + H + 34);

        // Right side of footer — filter note
        const filterNote = tiers.length === 5
            ? 'All roads shown'
            : 'Showing: ' + tiers.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
        ctx.textAlign = 'right';
        ctx.fillText(filterNote, W - 16, HEADER + H + 18);
        ctx.fillText(isWalk ? 'Walking mode' : 'Cycling mode', W - 16, HEADER + H + 34);
        ctx.textAlign = 'left';

        // ── Export ──────────────────────────
        const slug = mapTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        if (format === 'png') {
            canvas.toBlob(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = slug + '.png';
                a.click();
            }, 'image/png');
        } else {
            // PDF via browser print — open canvas in new tab
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

    // ── Utility: rounded rect path ─────────
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