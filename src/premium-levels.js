import { ROMANCE_LEVELS } from './romance-levels.js';
// Keep the twelve IDs and storage slots: paid/unlocked access survives the redesign.
const stage=(mechanic,name,hint,tool='clean-vacuum',surface='fabric')=>({mode:'premium',mechanic,name,hint,tool,surface,seconds:25});
const pickup=()=>stage('pickup','Clear the space','Drag every piece of litter into the bin.','cotton');
const vacuum=()=>stage('vacuum','Every last crumb','Hold the vacuum and sweep its nozzle across the crumbs.','clean-vacuum','floor');
const foam=()=>stage('foam','Cover it in soft foam','Spray detergent over the entire dirty surface.','clean-spray');
const scrub=()=>stage('scrub','Lift the deep stains','Brush back and forth. Clean tracks appear wherever you scrub.','clean-brush');
const rinse=()=>stage('rinse','Extract the foam','Sweep the extractor across all the foam to reveal the clean surface.','clean-vacuum');
const glass=()=>stage('glass','A crystal-clear view','Drag the rubber blade across the streaked glass.','clean-squeegee','glass');
const groom=()=>stage('groom','Brush the pile smooth','Brush downward across the rug to restore its soft finish.','clean-brush');
const arrange=()=>stage('arrange','Ready for the next guest','Drag each amenity into its matching place in the scene.','world-sachet');
const old=['crown','locket','perfume','fan','music','tea','mirror','tiara','brooch','mask','globe','lantern'];
const clean=(slot,name,scene,steps)=>({id:'vip-'+old[slot],name,subtitle:'A complete, hands-on restoration',kind:'premium',premium:true,scene,hero:'clean-'+scene,character:'cat',steps});
const shop=(slot,name,scene)=>({id:'vip-'+old[slot],name,subtitle:'Choose, check out and pack your own haul',kind:'premium',premium:true,scene,hero:'clean-'+scene,character:'cat',steps:[stage('shop','Your personal shopping list','Drag the requested products into your basket. Stay within budget.','world-handbag'),stage('checkout','At the checkout','Drag every selected item across the scanner, then into the bag.','world-sachet'),stage('pack','A perfectly packed haul','Fit your purchases into the matching compartments.','world-handbag')]});
const facial=(slot,name,character)=>({id:'vip-'+old[slot],name,subtitle:'A full appointment, from cleansing to evening makeup',premium:true,character,hero:character,color:'#e8bfd8',steps:[
 {name:'Remove yesterday\'s makeup',hint:'Wipe the whole face clean with the cotton pad.',tool:'cotton',mode:'wipe',layer:'dirt',seconds:6,brush:50,sound:'wipe'},
 {name:'A proper double cleanse',hint:'Work the cleanser over every part of the skin.',tool:'cleanser',mode:'paint',layer:'foam',seconds:6,brush:50,sound:'foam'},
 {name:'Rinse away the foam',hint:'Sweep the spray over every foamy area.',tool:'spray',mode:'wipe',layer:'foam',seconds:5,brush:50,sound:'spray'},
 {name:'A cooling treatment mask',hint:'Brush the treatment evenly over the face.',tool:'mask-brush',mode:'paint',layer:'berry',seconds:6,brush:48,sound:'cream'},
 {name:'Peel and reveal',hint:'Take each tab and slowly peel the mask downward.',tool:'cotton',mode:'peel',layer:'berry',seconds:16,count:5,sound:'peel'},
 {name:'Serum before makeup',hint:'Add serum to every glowing skincare point.',tool:'dropper',mode:'dab',layer:'serum',seconds:6,count:6,sound:'drop'},
 {name:'A flawless base',hint:'Blend the foundation across the whole face.',tool:'sponge',mode:'paint',layer:'foundation',seconds:6,brush:48,sound:'cream'},
 {name:'Sculpt the cheeks',hint:'Blend blush gently onto both cheeks.',tool:'makeup-brush',mode:'paint',layer:'blush',seconds:5,brush:28,sound:'brush'},
 {name:'Evening eye color',hint:'Sweep shimmer onto both eyelids.',tool:'compact',mode:'paint',layer:'eyeshadow',seconds:5,brush:22,sound:'brush'},
 {name:'The final lip color',hint:'Fill the lip shape carefully for the finished look.',tool:'lipstick',mode:'paint',layer:'lips',seconds:4,brush:18,sound:'cream'},
]});
const fitting=(slot,name,theme)=>{const base=ROMANCE_LEVELS.find(l=>l.theme===theme),steps=base.steps.slice(0,5).map((s,i)=>({...s,name:i===2?'The couture fitting':i===3?'Style the complete outfit':s.name,hint:i===4?'Slide right to reveal the finished outfit, then save your look.':s.hint}));steps.splice(3,0,
 {mode:'romance',mechanic:'press',name:'Smooth every fold',hint:'Move the iron down each crease. Follow the fabric all the way to the hem.',tool:'world-iron',seconds:25},
 {mode:'romance',mechanic:'stitch',name:'A hand-finished hem',hint:'Guide the needle along each seam, from the glowing starting point.',tool:'world-needle',seconds:25});
 return {...base,id:'vip-'+old[slot],name,subtitle:'Cleanse, style, fit, press and hand-finish her outfit',premium:true,hero:`romance-${theme}-dress`,steps};};
export const PREMIUM_LEVELS=[
 clean(0,'Private Jet Reset','jet',[pickup(),vacuum(),foam(),scrub(),rinse(),glass(),arrange()]),
 clean(1,'Persian Rug Revival','rug',[vacuum(),foam(),scrub(),rinse(),groom()]),
 shop(2,'The Boutique Haul','boutique'),
 fitting(3,'Couture Appointment','pearl'),
 clean(4,'Designer Sofa Rescue','sofa',[pickup(),vacuum(),foam(),scrub(),rinse(),arrange()]),
 facial(5,'Red Carpet Makeup','cat'),
 clean(6,'Penthouse Spa Reset','bath',[pickup(),foam(),scrub(),rinse(),glass(),arrange()]),
 shop(7,'Beauty Shopping Spree','beauty'),
 clean(8,'Convertible Detail','car',[pickup(),vacuum(),foam(),scrub(),rinse(),glass(),arrange()]),
 fitting(9,'Evening Atelier','cherry'),
 facial(10,'Runway Skin & Glam','bunny'),
 clean(11,'Yacht Lounge Refresh','yacht',[pickup(),vacuum(),foam(),scrub(),rinse(),glass(),arrange()]),
];
export const PREMIUM_ASSETS=['vip-frame',...['jet','rug','sofa','sofa-mask','bath','car','yacht','boutique','beauty','vacuum','brush','squeegee','spray','cushion','blanket','towels','bag','trash-bag','litter-0','litter-1','litter-2','litter-3'].map(x=>'clean-'+x)];
