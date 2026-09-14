"""
AI Diagnosis & DIY Troubleshooting Engine for KaamSetu.
Combines Google Gemini Multimodal AI with an intelligent bilingual DIY knowledge base.
"""
import logging
from django.conf import settings
from .gemini_service import analyze_with_gemini

logger = logging.getLogger(__name__)

DANGEROUS_KEYWORDS = [
    'gas leak', 'gas leakage', 'gas smell', 'lpg leak', 'cylinder leak',
    'fire', 'smoke', 'burning smell', 'burn smell', 'spark', 'sparks',
    'electrocution', 'high voltage', 'exposed wire', 'live wire', 'shock',
    'electrical panel', 'main panel', 'short circuit',
    'structural crack', 'wall collapse', 'ceiling collapse', 'pillar crack',
    'chemical leak', 'acid leak', 'major flood', 'boiler explosion',
    'ગેસ', 'આગ', 'ધુમાડો', 'વિદ્યુત', 'તાર', 'શોક', 'શોર્ટ સર્કિટ', 'સ્પાર્ક', 'બળવાની ગંધ', 'દીવાલ તિરાડ',
]

# Dedicated DIY Troubleshooting Knowledge Base for minor home issues
DIY_KNOWLEDGE_BASE = {
    'tap_leak': {
        'keywords': ['tap', 'faucet', 'nal', 'nalo', 'pani tapke', 'leak', 'leaking', 'tapke', 'નળ', 'ટપકે', 'લીક', 'લીકેજ', 'વોશર'],
        'category': 'plumbing',
        'decision': 'Safe DIY',
        'issue_gu': 'નળનું લીકેજ / ટપકતો નળ (વોશર અથવા ટેફલોન ટેપની જરૂર)',
        'issue_en': 'Leaking Faucet / Tap (Worn washer or loose spindle)',
        'cost': (30, 150),
        'time': '15-30 minutes',
        'tools_gu': ['સ્ક્રુડ્રાઈવર (Screwdriver)', 'પાનું અથવા રેન્ચ (Wrench)', 'ટેફલોન ટેપ (Teflon Tape)'],
        'tools_en': ['Screwdriver', 'Adjustable Wrench', 'Teflon Tape'],
        'parts_gu': ['રબર વોશર (Rubber Washer)', 'O-Ring'],
        'parts_en': ['Rubber Washer', 'O-Ring'],
        'warning_gu': 'નળ ખોલતા પહેલાં સિંક નીચે અથવા ઘરનો મુખ્ય પાણીનો વાલ્વ બંધ કરો.',
        'warning_en': 'Always shut off the main water valve before unscrewing the faucet.',
        'steps_gu': [
            'પગલું 1: સિંક નીચે અથવા મુખ્ય પાણીનો સ્ટોપ-વાલ્વ સંપૂર્ણ બંધ કરો.',
            'પગલું 2: સ્ક્રુડ્રાઈવરથી નળનું હેન્ડલ ખોલો અને પાનાથી અંદરનો સ્પિન્ડલ ધીમેથી બહાર કાઢો.',
            'પગલું 3: અંદર રહેલી કાળી રબરની વોશર તપાસો; જો ઘસાઈ ગઈ હોય કે ફાટી હોય તો નવી વોશર લગાવો.',
            'પગલું 4: નળના આંટા (threads) પર 4-5 આંટા ટેફલોન ટેપ કસીને લપેટો.',
            'પગલું 5: સ્પિન્ડલ અને હેન્ડલ પાછું ફીટ કરો. મુખ્ય વાલ્વ ખોલીને લીકેજ બંધ થયું કે નહીં તે ચકાસો.',
        ],
        'steps_en': [
            'Step 1: Shut off the water supply valve under the sink or the main stopcock.',
            'Step 2: Pry off the decorative handle cap and loosen the screw to remove the handle.',
            'Step 3: Unscrew the valve spindle using a wrench and inspect the rubber washer.',
            'Step 4: Replace any cracked washer and wrap 4-5 layers of Teflon tape around threads.',
            'Step 5: Reassemble the faucet firmly, restore the water supply, and check for leaks.',
        ],
    },
    'clogged_drain': {
        'keywords': ['drain', 'clog', 'sink', 'basin', 'pani bhari', 'pani nathi jatu', 'nali', 'jam', 'slow drain', 'સિંક', 'બેસિન', 'જામ', 'નાળી', 'ડ્રેઇન', 'પાણી ભરાય'],
        'category': 'plumbing',
        'decision': 'Safe DIY',
        'issue_gu': 'સિંક અથવા બેસિનની ડ્રેઇન પાઈપ જામ થવી (ચરબી અથવા કચરો)',
        'issue_en': 'Clogged Sink or Basin Drain (Grease or debris buildup)',
        'cost': (40, 150),
        'time': '20-35 minutes',
        'tools_gu': ['પ્લન્જર (Plunger)', 'ગરમ પાણીની કેટલ', 'જૂનું કપડું'],
        'tools_en': ['Sink Plunger', 'Kettle for boiling water', 'Cloth'],
        'parts_gu': ['બેકિંગ સોડા અને સફેદ વિનેગર (સરકો)'],
        'parts_en': ['Baking soda & white vinegar'],
        'warning_gu': 'રાસાયણિક એસિડ સીધો પાઇપમાં ન નાખવો, તેનાથી પ્લાસ્ટિક પાઇપ પીગળી શકે છે.',
        'warning_en': 'Avoid harsh industrial acids which corrode and melt PVC pipes.',
        'steps_gu': [
            'પગલું 1: સિંકમાં જમા થયેલું વધારાનું પાણી કપ કે વાટકાથી બહાર કાઢી લો.',
            'પગલું 2: અડધો કપ બેકિંગ સોડા સીધો ડ્રેઇન હોલમાં નાખો.',
            'પગલું 3: તેની ઉપર 1 કપ સફેદ વિનેગર રેડો જેથી ફીણ વળશે; તેને 15 મિનિટ રહેવા દો.',
            'પગલું 4: ત્યારબાદ 1 કેટલ ઉકળતું ગરમ પાણી સીધું કાણામાં રેડો જેથી ગ્રીસ અને કચરો ઓગળી જાય.',
            'પગલું 5: સિંક પ્લન્જરથી 5-6 વખત જોરથી પંપિંગ કરો જેથી અટકેલો કચરો નીકળી જશે.',
        ],
        'steps_en': [
            'Step 1: Scoop out any standing water from the sink basin.',
            'Step 2: Pour 1/2 cup of baking soda directly into the drain hole.',
            'Step 3: Pour 1 cup of white vinegar on top and let the bubbling mixture sit for 15 minutes.',
            'Step 4: Pour a kettle of boiling hot water down the drain to dissolve grease and debris.',
            'Step 5: Place a rubber plunger firmly over the drain and pump 5-6 times vigorously.',
        ],
    },
    'flush_leak': {
        'keywords': ['flush', 'toilet', 'tank', 'commode', 'pani vahe', 'flapper', 'ફ્લશ', 'ટાંકી', 'ટોયલેટ', 'કમૉડ'],
        'category': 'plumbing',
        'decision': 'Safe DIY',
        'issue_gu': 'ફ્લશ ટાંકીમાંથી સતત પાણી વહેવું (ફ્લેપર અથવા ફ્લોટ સેટિંગ)',
        'issue_en': 'Running Toilet / Flush Tank Leak',
        'cost': (50, 200),
        'time': '15-30 minutes',
        'tools_gu': ['જૂનું ટૂથબ્રશ', 'સ્ક્રુડ્રાઈવર'],
        'tools_en': ['Screwdriver', 'Old toothbrush'],
        'parts_gu': ['ફ્લેપર રબર (Toilet Flapper)'],
        'parts_en': ['Toilet Flapper / Float Valve'],
        'warning_gu': 'ટાંકીનું ઢાંકણું સાવચેતીથી ઉતારવું જેથી તૂટી ન જાય.',
        'warning_en': 'Carefully lift ceramic tank lid and place on a towel.',
        'steps_gu': [
            'પગલું 1: ફ્લશ ટાંકીનું સિરામિક ઢાંકણું હટાવીને બાજુ પર મૂકો.',
            'પગલું 2: અંદરની ચેઇન જુઓ કે ફસાયેલી તો નથી ને; ચેઇનમાં સહેજ ઢીલ હોવી જોઈએ.',
            'પગલું 3: તળિયે રહેલા રબરના ફ્લેપર પર ક્ષાર કે કચરો હોય તો ટૂથબ્રશથી સાફ કરો.',
            'પગલું 4: ફ્લોટ બોલનો સ્ક્રૂ સહેજ ફેરવીને પાણીનું લેવલ ઓવરફ્લો ટ્યુબથી 1 ઇંચ નીચે સેટ કરો.',
            'પગલું 5: ફ્લશ કરીને ચેક કરો; જો પાણી બંધ ન થાય તો ₹50 નું નવું રબર ફ્લેપર બદલો.',
        ],
        'steps_en': [
            'Step 1: Remove the tank lid and place it securely on a flat surface.',
            'Step 2: Inspect the flush chain connected to the flapper; ensure it has slight slack.',
            'Step 3: Clean mineral scale and silt from the bottom rubber flapper seal.',
            'Step 4: Adjust the float screw so water level stops 1 inch below the overflow tube.',
            'Step 5: Flush and check; replace the rubber flapper if the rubber has hardened.',
        ],
    },
    'low_pressure_aerator': {
        'keywords': ['pressure', 'aerator', 'dhimo nal', 'dhimi dhar', 'slow water', 'jhaari', 'પ્રેશર', 'ધીમું પાણી', 'જાળી', 'ક્ષાર'],
        'category': 'plumbing',
        'decision': 'Safe DIY',
        'issue_gu': 'નળના એરેટર (જાળી) માં ક્ષાર જામવાથી પાણીનું ધીમું પ્રેશર',
        'issue_en': 'Low Faucet Water Pressure (Clogged Aerator Mesh)',
        'cost': (0, 50),
        'time': '10-15 minutes',
        'tools_gu': ['પાનું અથવા પ્લાયર્સ', 'જૂનું ટૂથબ્રશ'],
        'tools_en': ['Adjustable Pliers', 'Old toothbrush'],
        'parts_gu': ['વિનેગર અથવા લીંબુનો રસ'],
        'parts_en': ['White vinegar or lime juice'],
        'warning_gu': 'નળ પર સ્ક્રેચ ન પડે તે માટે પાનું લગાવતા પહેલાં કપડું લપેટો.',
        'warning_en': 'Wrap a cloth around the faucet tip to prevent wrench marks.',
        'steps_gu': [
            'પગલું 1: નળના આગળના ભાગે રહેલી નાની ગોળ જાળી (Aerator) ને હાથથી ઘડિયાળની ઊંધી દિશામાં ખોલો.',
            'પગલું 2: જો હાથથી ન ખૂલે તો પાના વચ્ચે કપડું મૂકીને ધીમેથી ફેરવો.',
            'પગલું 3: જાળીની અંદર ફસાયેલી રેતી અને કાંકરી કાઢી લો.',
            'પગલું 4: જાળીને 10 મિનિટ વિનેગર અથવા લીંબુના રસમાં પલાળી ટૂથબ્રશથી ઘસીને સાફ કરો.',
            'પગલું 5: જાળી પાછી ફિટ કરો; પાણીનું પ્રેશર તરત પહેલાં જેવું ફૂલ થઈ જશે.',
        ],
        'steps_en': [
            'Step 1: Unscrew the aerator nozzle from the tip of the faucet counter-clockwise.',
            'Step 2: Disassemble the small screens and rinse out trapped sand or sediment.',
            'Step 3: Soak the mesh parts in warm vinegar for 10 minutes to dissolve lime scale.',
            'Step 4: Scrub clean with an old toothbrush and reassemble the small gaskets.',
            'Step 5: Screw back onto the faucet hand-tight and turn on water to verify strong flow.',
        ],
    },
    'door_hinge': {
        'keywords': ['door', 'hinge', 'screw', 'darwajo', 'darwaja', 'awaj', 'chuu', 'khultu nathi', 'દરવાજો', 'મિજાગરો', 'અવાજ', 'ઢીલો', 'ચૂં ચૂં'],
        'category': 'carpentry',
        'decision': 'Safe DIY',
        'issue_gu': 'દરવાજાનો મિજાગરો ઢીલો હોવો અથવા ચૂં-ચૂં અવાજ આવવો',
        'issue_en': 'Loose or Squeaking Door Hinge',
        'cost': (20, 100),
        'time': '10-20 minutes',
        'tools_gu': ['સ્ક્રુડ્રાઈવર (Screwdriver)', 'લાકડાની દિવાસળીઓ અથવા ટૂથપિક', 'ગુંદર'],
        'tools_en': ['Screwdriver', 'Wooden toothpicks / matchsticks', 'Wood glue'],
        'parts_gu': ['WD-40 અથવા મશીન ઓઈલ'],
        'parts_en': ['Machine oil or lubricant spray'],
        'warning_gu': 'દરવાજો નીચેથી પકડીને સપોર્ટ આપો જેથી મિજાગરા પર વધારે વજન ન પડે.',
        'warning_en': 'Support the door bottom with a wedge while tightening hinges.',
        'steps_gu': [
            'પગલું 1: દરવાજો પૂરો ખોલીને મિજાગરાના બધા સ્ક્રૂ સ્ક્રુડ્રાઈવરથી ટાઈટ કરો.',
            'પગલું 2: જો સ્ક્રૂનું કાણું મોટું થઈ ગયું હોય અને સ્ક્રૂ ફ્રી ફરતો હોય, તો સ્ક્રૂ બહાર કાઢો.',
            'પગલું 3: કાણામાં ગુંદરવાળી 2-3 લાકડાની દિવાસળીઓ અથવા ટૂથપિક ભરી દો અને વધારાનો ભાગ કાપી નાખો.',
            'પગલું 4: સ્ક્રૂ ફરીથી કસો, તે એકદમ મજબૂત પકડ પકડી લેશે.',
            'પગલું 5: અવાજ બંધ કરવા મિજાગરાની પિન પર મશીન ઓઈલ અથવા તેલના 2-3 ટીપાં નાખી દરવાજો 4-5 વખત ખોલ-બંધ કરો.',
        ],
        'steps_en': [
            'Step 1: Open the door and tighten all visible hinge screws with a screwdriver.',
            'Step 2: If a screw spins freely, remove the stripped screw from the frame.',
            'Step 3: Dip 2-3 wooden matchsticks or toothpicks in glue and tap them tightly into the hole.',
            'Step 4: Trim flush and drive the screw back in; it will bite into the fresh wood solidly.',
            'Step 5: Apply a few drops of machine oil or WD-40 onto the hinge pin and swing door 5 times.',
        ],
    },
    'ac_filter': {
        'keywords': ['ac', 'filter', 'cooling', 'air conditioner', 'thandu nathi', 'hava nathi', 'ધૂળ', 'એસી', 'ઠંડક', 'ફિલ્ટર'],
        'category': 'ac',
        'decision': 'Safe DIY',
        'issue_gu': 'AC ના ડસ્ટ ફિલ્ટર ગંદા હોવાને કારણે ઓછી હવા અને ઠંડક',
        'issue_en': 'Dirty AC Dust Filters Causing Weak Cooling & Airflow',
        'cost': (0, 50),
        'time': '15-25 minutes',
        'tools_gu': ['નરમ સુતરાઉ કપડું', 'સાધારણ પાણી'],
        'tools_en': ['Soft microfiber cloth', 'Tap water'],
        'parts_gu': [],
        'parts_en': [],
        'warning_gu': 'AC નું મેઈન સ્વીચબોર્ડ કનેક્શન બંધ કર્યા વગર પેનલ ન ખોલો.',
        'warning_en': 'Turn off AC power from main wall switch before opening front panel.',
        'steps_gu': [
            'પગલું 1: AC નું રિમોટથી તેમજ દિવાલના સ્વીચબોર્ડથી પાવર સંપૂર્ણ બંધ કરો.',
            'પગલું 2: ઇન્ડોર યુનિટનું આગળનું પ્લાસ્ટિક પેનલ બંને બાજુથી પકડી હળવેથી ઉપર ઊંચકો.',
            'પગલું 3: અંદર લાગેલા બંને જાળીવાળા ફિલ્ટર્સને ધીમેથી સ્લાઇડ કરીને બહાર ખેંચી લો.',
            'પગલું 4: ફિલ્ટર્સને નળના સાદા પાણી નીચે ધોઈ નાખો (સાબુ કે બ્રશ વાપરવાની જરૂર નથી).',
            'પગલું 5: ફિલ્ટર્સને છાંયડામાં પૂરા સૂકવવા દો; સુકાઈ ગયા પછી પાછા સ્લોટમાં બેસાડી પેનલ બંધ કરો.',
        ],
        'steps_en': [
            'Step 1: Switch off the AC and turn off the dedicated wall power breaker.',
            'Step 2: Gently lift the front access panel on the indoor unit until it clicks open.',
            'Step 3: Unhook and slide out both mesh dust filters.',
            'Step 4: Rinse filters under gentle running tap water to wash off trapped dust.',
            'Step 5: Let them air dry in shade completely before sliding them back into place and latching the lid.',
        ],
    },
    'ceiling_fan': {
        'keywords': ['fan', 'pankho', 'speed', 'dhimo', 'dhimi', 'regulator', 'wobble', 'પંખો', 'ધીમો', 'સ્પીડ', 'રેગ્યુલેટર'],
        'category': 'electrical',
        'decision': 'DIY with Caution',
        'issue_gu': 'પંખાની બ્લેડ પર ધૂળનો થર અથવા ઢીલા સ્ક્રૂ',
        'issue_en': 'Ceiling Fan Dust Buildup or Loose Blade Screws',
        'cost': (0, 60),
        'time': '15-25 minutes',
        'tools_gu': ['સ્ક્રુડ્રાઈવર (Screwdriver)', 'સુકો કપડો', 'સીડી અથવા મજબૂત સ્ટૂલ'],
        'tools_en': ['Screwdriver', 'Dry cloth or pillowcase', 'Step stool'],
        'parts_gu': ['કેપેસિટર (જો સ્પીડ નબળી હોય - ₹40)'],
        'parts_en': ['2.5uF Fan Capacitor (if slow)'],
        'warning_gu': 'પંખાની સ્વીચ અને MCB બંધ રાખીને જ પંખાને અડવું.',
        'warning_en': 'Ensure fan switch is completely OFF before touching blades.',
        'steps_gu': [
            'પગલું 1: પંખાની સ્વિચ અને રેગ્યુલેટર સંપૂર્ણ બંધ કરો.',
            'પગલું 2: જૂના ઓશીકાના કવર (pillowcase) ને બ્લેડ પર ચડાવી અંદર ખેંચો જેથી ધૂળ નીચે ન ઊડે.',
            'પગલું 3: ત્રણેય પાંખિયાના સ્ક્રૂ સ્ક્રુડ્રાઈવરથી કસીને ટાઈટ કરો જેથી પંખો ડોલતો અટકે.',
            'પગલું 4: જો સાફ કર્યા પછી પણ પંખો એકદમ ધીમો ફરતો હોય તો તેનો કેપેસિટર નબળો થઈ ગયો છે જે ₹40 માં નવો લાવી શકાય.',
            'પગલું 5: પંખો ચાલુ કરીને સ્પીડ અને અવાજ ચેક કરો.',
        ],
        'steps_en': [
            'Step 1: Turn off the fan wall switch and regulator knob.',
            'Step 2: Slip an old pillowcase over each blade and wipe clean so dust stays inside the pillowcase.',
            'Step 3: Tighten all blade attachment screws with a screwdriver to eliminate wobble and noise.',
            'Step 4: If fan remains slow after cleaning, the capacitor (2.5uF) needs replacement (costs ₹40-50).',
            'Step 5: Turn switch on and test smoothly at varying speeds.',
        ],
    },
    'ro_water': {
        'keywords': ['ro', 'purifier', 'water filter', 'tds', 'filter', 'dhimo flow', 'pani nathi aavtu', 'આરઓ', 'પ્યોરિફાયર', 'ધીમું પાણી'],
        'category': 'ro',
        'decision': 'DIY with Caution',
        'issue_gu': 'RO પ્યોરિફાયરના બહારના પ્રી-ફિલ્ટર (Spun Candle) માં કચરો જામવો',
        'issue_en': 'Clogged RO Pre-Filter Sediment Candle',
        'cost': (60, 150),
        'time': '20-30 minutes',
        'tools_gu': ['RO બાઉલ ખોલવાનું પાનું (Spanner)', 'ડોલ / ટુવાલ'],
        'tools_en': ['RO Spanner wrench', 'Bucket and towel'],
        'parts_gu': ['નવું PP Spun Filter Candle (₹60-80)'],
        'parts_en': ['PP Spun Filter Cartridge (₹60-80)'],
        'warning_gu': 'કામ શરૂ કરતાં પહેલાં RO પાવર પ્લગ અને પાણીનો મુખ્ય ઇનલેટ વાલ્વ બંધ કરો.',
        'warning_en': 'Always unplug RO electric adapter and shut the small feed water valve first.',
        'steps_gu': [
            'પગલું 1: RO નો પાવર પ્લગ અનપ્લગ કરો અને દિવાલ પરનો નાનો પાણીનો વાલ્વ બંધ કરો.',
            'પગલું 2: બહાર લટકતા સફેદ બાઉલની નીચે ડોલ મૂકો અને પાનાની મદદથી બાઉલને ઘડિયાળની દિશામાં ખોલો.',
            'પગલું 3: અંદર રહેલું જૂનું સફેદ ફિલ્ટર (જે કાળું કે પીળું પડી ગયું હશે) તેને બહાર કાઢો.',
            'પગલું 4: બાઉલને પાણીથી સાફ કરી તેમાં નવું ₹60 નું Spun Candle ફિલ્ટર બેસાડો.',
            'પગલું 5: બાઉલ બરાબર કસીને ફિટ કરો, પાણીનો વાલ્વ અને પાવર ચાલુ કરી પ્રેશર ચેક કરો.',
        ],
        'steps_en': [
            'Step 1: Unplug the RO power adapter and close the small inlet diverter valve on the water tap.',
            'Step 2: Place a shallow tray below the clear/white outer pre-filter housing.',
            'Step 3: Unscrew the housing with the RO wrench and slide out the dirty sediment candle.',
            'Step 4: Rinse inside housing, drop in a fresh PP spun candle (₹60-80), and ensure rubber O-ring is seated.',
            'Step 5: Hand-tighten with wrench, open feed water valve slowly, check for leaks, and plug in.',
        ],
    },
    'washing_machine_drain': {
        'keywords': ['washing', 'machine', 'drain error', '5e', 'oe', 'pani nathi nikal', 'spin', 'વોશિંગ મશીન', 'પાણી નથી નીકળતું', 'ડ્રેઇન'],
        'category': 'appliance',
        'decision': 'Safe DIY',
        'issue_gu': 'વોશિંગ મશીનના ડ્રેઇન પમ્પ ફિલ્ટરમાં કચરો કે સિક્કો ફસાઈ જવો',
        'issue_en': 'Clogged Washing Machine Drain Pump Filter',
        'cost': (0, 50),
        'time': '15-20 minutes',
        'tools_gu': ['છીછરી ટ્રે અથવા મોટો ટુવાલ', 'જૂનું ટૂથબ્રશ'],
        'tools_en': ['Shallow tray or thick towel', 'Old toothbrush'],
        'parts_gu': [],
        'parts_en': [],
        'warning_gu': 'વોશિંગ મશીનને પાવર પ્લગમાંથી સંપૂર્ણપણે અનપ્લગ કરો.',
        'warning_en': 'Unplug the washing machine from the mains socket before servicing.',
        'steps_gu': [
            'પગલું 1: વોશિંગ મશીન અનપ્લગ કરો અને નીચે એક ટુવાલ અથવા છીછરી ટ્રે મૂકો.',
            'પગલું 2: મશીનના તળિયે જમણી કે ડાબી બાજુનું નાનું ચોરસ ઢાંકણું ખોલો.',
            'પગલું 3: ડ્રેઇન ફિલ્ટરની કેપ ઘડિયાળની ઊંધી દિશામાં ફેરવીને ધીમેથી બહાર ખેંચો (થોડું પાણી નીકળશે).',
            'પગલું 4: અંદર ફસાયેલા સિક્કા, દોરા, સેફ્ટી પિન કે કચરો સાફ કરી ફિલ્ટર પાણીથી ધોઈ નાખો.',
            'પગલું 5: ફિલ્ટર સીધું બેસાડી ટાઈટ બંધ કરો. મશીન ચાલુ કરીને ડ્રેઇન સાયકલ ચલાવી ચેક કરો.',
        ],
        'steps_en': [
            'Step 1: Unplug the machine from power and place a shallow tray and towel beneath the bottom flap.',
            'Step 2: Flip open the small access door at the bottom corner of front-load machine.',
            'Step 3: Slowly unscrew the circular drain pump filter cap counter-clockwise to let residual water drain.',
            'Step 4: Pull filter out; remove trapped coins, hairpins, or lint, and rinse the filter under tap water.',
            'Step 5: Reinsert filter squarely, tighten securely, close flap, and run a short spin/drain cycle.',
        ],
    },
}


def _detect_danger(text):
    text_lower = text.lower()
    for kw in DANGEROUS_KEYWORDS:
        if kw in text_lower:
            return True
    return False


def _match_specific_diy(text):
    text_lower = text.lower()
    best_match = None
    max_score = 0
    for key, data in DIY_KNOWLEDGE_BASE.items():
        score = sum(1 for kw in data['keywords'] if kw in text_lower)
        if score > max_score:
            max_score = score
            best_match = data
    if max_score >= 1:
        return best_match
    return None


def analyze_issue(text='', category_hint='', language='en', image_file=None):
    """
    Return diagnosis dict with step-by-step DIY instructions.
    Uses Google Gemini Multimodal AI when configured, otherwise uses our smart DIY safety engine.
    """
    combined = f'{text} {category_hint}'.strip()
    is_dangerous = _detect_danger(combined)
    has_gemini = bool(getattr(settings, 'GEMINI_API_KEY', ''))
    is_demo = not has_gemini and (not getattr(settings, 'AI_ENABLED', True) or not getattr(settings, 'OPENAI_API_KEY', ''))

    # Critical Safety Triage
    if is_dangerous:
        safety_msg = (
            'ચેતવણી: આ જીવલેણ અથવા અત્યંત જોખમી સમસ્યા હોઈ શકે છે! ઘરે જાતે હાથ ન લગાવો. મેઈન સ્વીચ/ગેસ રેગ્યુલેટર બંધ કરીને તરત સુરક્ષિત જગ્યાએ ખસી જાઓ.'
            if language == 'gu' else
            'CRITICAL SAFETY ALERT: Do NOT attempt DIY repair. Turn off main power/gas immediately and evacuate the area.'
        )
        instructions = (
            [
                'પગલું 1: તરત જ જોખમી જગ્યાથી દૂર ખસી જાઓ.',
                'પગલું 2: જો સલામત હોય તો જ મુખ્ય પાવર MCB અથવા ગેસ રેગ્યુલેટર બંધ કરો.',
                'પગલું 3: KaamSetu પરથી ઇમરજન્સી વેરીફાઇડ પ્રોફેશનલ કારીગર બુક કરો.',
                'પગલું 4: કારીગર આવે ત્યાં સુધી વિસ્તારને સુરક્ષિત રાખો.',
            ]
            if language == 'gu' else
            [
                'Step 1: Evacuate the danger area immediately.',
                'Step 2: Turn off the main electrical breaker or gas cylinder valve only if safe.',
                'Step 3: Book an emergency verified professional technician on KaamSetu.',
                'Step 4: Keep pets and children away from the hazard until help arrives.',
            ]
        )
        return {
            'category': category_hint or 'safety',
            'possible_issue': 'જીવલેણ / ખતરનાક સમસ્યા (Professional Required)' if language == 'gu' else 'High-Risk Electrical/Gas/Structural Hazard',
            'confidence_score': 98,
            'severity': 'critical',
            'decision': 'Call Professional',
            'estimated_cost_min': 500,
            'estimated_cost_max': 5000,
            'estimated_time': 'Immediate',
            'required_tools': [],
            'required_parts': [],
            'safety_warning': safety_msg,
            'instructions': instructions,
            'recommended_provider_category': category_hint or 'emergency',
            'is_dangerous': True,
            'is_demo_mode': is_demo,
        }

    # Try Google Gemini Multimodal AI if API key is provided
    if has_gemini:
        gemini_result = analyze_with_gemini(
            text=text,
            image_file=image_file,
            category_hint=category_hint,
            language=language
        )
        if gemini_result:
            gemini_result['recommended_provider_category'] = gemini_result.get('category', category_hint or 'appliance')
            return gemini_result

    # Match against our Smart DIY Knowledge Base
    diy_match = _match_specific_diy(combined)
    is_gu = language == 'gu'

    if diy_match:
        return {
            'category': diy_match['category'],
            'possible_issue': diy_match['issue_gu'] if is_gu else diy_match['issue_en'],
            'confidence_score': 92,
            'severity': 'low' if diy_match['decision'] == 'Safe DIY' else 'medium',
            'decision': diy_match['decision'],
            'estimated_cost_min': diy_match['cost'][0],
            'estimated_cost_max': diy_match['cost'][1],
            'estimated_time': diy_match['time'],
            'required_tools': diy_match['tools_gu'] if is_gu else diy_match['tools_en'],
            'required_parts': diy_match['parts_gu'] if is_gu else diy_match['parts_en'],
            'safety_warning': diy_match['warning_gu'] if is_gu else diy_match['warning_en'],
            'instructions': diy_match['steps_gu'] if is_gu else diy_match['steps_en'],
            'recommended_provider_category': diy_match['category'],
            'is_dangerous': False,
            'is_demo_mode': is_demo,
        }

    # Generic Fallback if specific DIY match not found
    cat = (category_hint or 'appliance').lower().replace(' ', '_').replace('-', '_')
    issue_title = (
        f'{cat.replace("_", " ").title()} ની સમસ્યાની તપાસ'
        if is_gu else
        f'General {cat.replace("_", " ").title()} Issue Inspection'
    )
    generic_steps = (
        [
            'પગલું 1: સમસ્યા ક્યાંથી શરૂ થઈ રહી છે તેનું ધ્યાનથી નિરીક્ષણ કરો.',
            'પગલું 2: સલામતી માટે ઉપકરણ અથવા વાલ્વનું પાવર/પાણી સપ્લાય બંધ કરો.',
            'પગલું 3: જો નાનો સ્ક્રૂ કે ફિલ્ટર ઢીલું હોય તો સાફ કરીને ટાઈટ કરો.',
            'પગલું 4: જો અવાજ કે સમસ્યા ચાલુ રહે તો KaamSetu પરથી પ્રોફેશનલ કારીગર બુક કરો.',
        ]
        if is_gu else
        [
            'Step 1: Carefully inspect the exact source of noise, leak, or blockage.',
            'Step 2: Turn off power supply or water valve before inspecting closer.',
            'Step 3: Check for loose screws, dirty filter mesh, or surface obstructions.',
            'Step 4: If issue persists, book an expert verified technician on KaamSetu.',
        ]
    )

    return {
        'category': cat,
        'possible_issue': issue_title,
        'confidence_score': 78 if combined else 45,
        'severity': 'low',
        'decision': 'Safe DIY' if cat in ('cleaning', 'carpentry') else 'DIY with Caution',
        'estimated_cost_min': 150,
        'estimated_cost_max': 600,
        'estimated_time': '20-45 minutes',
        'required_tools': ['સ્ક્રુડ્રાઈવર (Screwdriver)', 'સફાઈ કપડું'] if is_gu else ['Screwdriver', 'Cleaning Cloth'],
        'required_parts': [],
        'safety_warning': 'સાવચેતી: કોઈ પણ સમારકામ કરતાં પહેલાં પાવર/પાણી સપ્લાય બંધ રાખવો.' if is_gu else 'Safety tip: Disconnect power or water before inspecting.',
        'instructions': generic_steps,
        'recommended_provider_category': cat,
        'is_dangerous': False,
        'is_demo_mode': is_demo,
    }
